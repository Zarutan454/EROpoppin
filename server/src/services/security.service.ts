import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RedisService } from './redis';
import { NotificationService } from './notifications';
import * as crypto from 'crypto';
import * as geolib from 'geolib';

interface VerificationDocument {
  id: string;
  userId: string;
  type: 'id' | 'selfie' | 'certificate' | 'background_check';
  status: 'pending' | 'approved' | 'rejected';
  documentUrl: string;
  verificationDate?: Date;
  expiryDate?: Date;
  verifiedBy?: string;
  rejectionReason?: string;
}

interface EmergencyContact {
  id: string;
  userId: string;
  name: string;
  phone: string;
  email: string;
  relationship: string;
  notificationPreferences: {
    sms: boolean;
    email: boolean;
    push: boolean;
  };
}

interface SafetyCheck {
  id: string;
  userId: string;
  bookingId?: string;
  status: 'pending' | 'completed' | 'missed' | 'emergency';
  scheduledTime: Date;
  completedTime?: Date;
  location?: {
    latitude: number;
    longitude: number;
  };
}

interface IncidentReport {
  id: string;
  reporterId: string;
  reportedId: string;
  type: 'harassment' | 'fraud' | 'safety' | 'other';
  description: string;
  evidence?: string[];
  status: 'submitted' | 'under_review' | 'resolved' | 'dismissed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: Date;
  updatedAt: Date;
  resolvedBy?: string;
  resolution?: string;
}

interface SecurityAlert {
  id: string;
  userId: string;
  type: 'emergency' | 'suspicious_activity' | 'verification_needed' | 'warning';
  message: string;
  status: 'active' | 'resolved';
  createdAt: Date;
  metadata?: Record<string, any>;
}

@Injectable()
export class SecurityService {
  private readonly maxLoginAttempts = 5;
  private readonly loginLockoutDuration = 30 * 60; // 30 minutes
  private readonly verificationExpiryDays = 365; // 1 year
  private readonly safetyCheckInterval = 30 * 60 * 1000; // 30 minutes

  constructor(
    @InjectRepository('verification_documents')
    private verificationRepo: Repository<VerificationDocument>,
    @InjectRepository('emergency_contacts')
    private emergencyContactRepo: Repository<EmergencyContact>,
    @InjectRepository('safety_checks')
    private safetyCheckRepo: Repository<SafetyCheck>,
    @InjectRepository('incident_reports')
    private incidentRepo: Repository<IncidentReport>,
    @InjectRepository('security_alerts')
    private alertRepo: Repository<SecurityAlert>,
    private readonly redisService: RedisService,
    private readonly notificationService: NotificationService
  ) {}

  // Verification Management
  async submitVerification(
    userId: string,
    type: VerificationDocument['type'],
    documentUrl: string
  ): Promise<VerificationDocument> {
    const verification = await this.verificationRepo.save({
      userId,
      type,
      documentUrl,
      status: 'pending',
      createdAt: new Date()
    });

    await this.notificationService.notify({
      type: 'verification_submitted',
      userId,
      title: 'Verification Submitted',
      message: `Your ${type} verification has been submitted and is under review.`
    });

    return verification;
  }

  async approveVerification(
    verificationId: string,
    adminId: string
  ): Promise<VerificationDocument> {
    const verification = await this.verificationRepo.findOne({
      where: { id: verificationId }
    });

    if (!verification) {
      throw new Error('Verification not found');
    }

    verification.status = 'approved';
    verification.verificationDate = new Date();
    verification.expiryDate = new Date();
    verification.expiryDate.setDate(
      verification.expiryDate.getDate() + this.verificationExpiryDays
    );
    verification.verifiedBy = adminId;

    await this.verificationRepo.save(verification);

    await this.notificationService.notify({
      type: 'verification_approved',
      userId: verification.userId,
      title: 'Verification Approved',
      message: `Your ${verification.type} verification has been approved.`
    });

    return verification;
  }

  // Emergency Contact Management
  async addEmergencyContact(contact: Omit<EmergencyContact, 'id'>): Promise<EmergencyContact> {
    return await this.emergencyContactRepo.save(contact);
  }

  async updateEmergencyContact(
    id: string,
    updates: Partial<EmergencyContact>
  ): Promise<EmergencyContact> {
    await this.emergencyContactRepo.update(id, updates);
    return await this.emergencyContactRepo.findOne({ where: { id } });
  }

  // Safety Check System
  async scheduleSafetyCheck(
    userId: string,
    bookingId: string,
    scheduledTime: Date
  ): Promise<SafetyCheck> {
    const safetyCheck = await this.safetyCheckRepo.save({
      userId,
      bookingId,
      status: 'pending',
      scheduledTime
    });

    // Schedule the safety check notification
    setTimeout(
      () => this.processSafetyCheck(safetyCheck.id),
      scheduledTime.getTime() - Date.now()
    );

    return safetyCheck;
  }

  private async processSafetyCheck(safetyCheckId: string) {
    const safetyCheck = await this.safetyCheckRepo.findOne({
      where: { id: safetyCheckId }
    });

    if (!safetyCheck || safetyCheck.status !== 'pending') {
      return;
    }

    // Send notification to user
    await this.notificationService.notify({
      type: 'safety_check',
      userId: safetyCheck.userId,
      title: 'Safety Check',
      message: 'Please confirm your safety by responding to this notification.',
      priority: 'high'
    });

    // Wait for response
    setTimeout(
      () => this.handleMissedSafetyCheck(safetyCheckId),
      this.safetyCheckInterval
    );
  }

  private async handleMissedSafetyCheck(safetyCheckId: string) {
    const safetyCheck = await this.safetyCheckRepo.findOne({
      where: { id: safetyCheckId }
    });

    if (!safetyCheck || safetyCheck.status !== 'pending') {
      return;
    }

    // Update status to missed
    safetyCheck.status = 'missed';
    await this.safetyCheckRepo.save(safetyCheck);

    // Notify emergency contacts
    const emergencyContacts = await this.emergencyContactRepo.find({
      where: { userId: safetyCheck.userId }
    });

    for (const contact of emergencyContacts) {
      await this.notifyEmergencyContact(contact, safetyCheck);
    }

    // Create security alert
    await this.createSecurityAlert({
      userId: safetyCheck.userId,
      type: 'emergency',
      message: 'Missed safety check - emergency protocols activated',
      status: 'active'
    });
  }

  // Incident Reporting
  async reportIncident(
    reportData: Omit<IncidentReport, 'id' | 'status' | 'createdAt' | 'updatedAt'>
  ): Promise<IncidentReport> {
    const incident = await this.incidentRepo.save({
      ...reportData,
      status: 'submitted',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Create security alert for high-priority incidents
    if (['high', 'critical'].includes(incident.priority)) {
      await this.createSecurityAlert({
        userId: incident.reportedId,
        type: 'suspicious_activity',
        message: `High-priority incident reported: ${incident.type}`,
        status: 'active',
        metadata: { incidentId: incident.id }
      });
    }

    // Notify administrators
    await this.notificationService.notifyAdmins({
      title: 'New Incident Report',
      message: `A new ${incident.priority} priority incident has been reported.`,
      data: { incidentId: incident.id }
    });

    return incident;
  }

  // Security Alerts
  async createSecurityAlert(
    alertData: Omit<SecurityAlert, 'id' | 'createdAt'>
  ): Promise<SecurityAlert> {
    const alert = await this.alertRepo.save({
      ...alertData,
      createdAt: new Date()
    });

    // Send immediate notification for emergency alerts
    if (alert.type === 'emergency') {
      await this.notificationService.notify({
        type: 'security_alert',
        userId: alert.userId,
        title: 'Emergency Alert',
        message: alert.message,
        priority: 'high'
      });

      // Notify emergency contacts
      const contacts = await this.emergencyContactRepo.find({
        where: { userId: alert.userId }
      });

      for (const contact of contacts) {
        await this.notifyEmergencyContact(contact, alert);
      }
    }

    return alert;
  }

  // Login Security
  async trackLoginAttempt(
    userId: string,
    success: boolean
  ): Promise<{ blocked: boolean; remainingAttempts: number }> {
    const key = `login_attempts:${userId}`;
    const attempts = await this.redisService.get(key) || 0;

    if (success) {
      await this.redisService.del(key);
      return { blocked: false, remainingAttempts: this.maxLoginAttempts };
    }

    const newAttempts = attempts + 1;
    await this.redisService.setex(
      key,
      this.loginLockoutDuration,
      newAttempts
    );

    if (newAttempts >= this.maxLoginAttempts) {
      await this.createSecurityAlert({
        userId,
        type: 'suspicious_activity',
        message: 'Account locked due to multiple failed login attempts',
        status: 'active'
      });

      return { blocked: true, remainingAttempts: 0 };
    }

    return {
      blocked: false,
      remainingAttempts: this.maxLoginAttempts - newAttempts
    };
  }

  // Helper functions
  private async notifyEmergencyContact(
    contact: EmergencyContact,
    context: SafetyCheck | SecurityAlert
  ) {
    const message = 'Emergency: Your contact may need assistance.';

    if (contact.notificationPreferences.sms) {
      await this.notificationService.sendSMS(contact.phone, message);
    }

    if (contact.notificationPreferences.email) {
      await this.notificationService.sendEmail({
        to: contact.email,
        subject: 'Emergency Alert',
        template: 'emergency-contact',
        context: {
          contactName: contact.name,
          message,
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  // Geofencing Security
  async checkLocationSecurity(
    userId: string,
    latitude: number,
    longitude: number
  ): Promise<boolean> {
    const safeZones = await this.getSafeZones(userId);
    
    return safeZones.some(zone =>
      geolib.isPointWithinRadius(
        { latitude, longitude },
        { latitude: zone.latitude, longitude: zone.longitude },
        zone.radius
      )
    );
  }

  private async getSafeZones(userId: string) {
    // This would typically come from a database
    return [
      // Example safe zones
      { latitude: 52.5200, longitude: 13.4050, radius: 1000 }, // Berlin
      { latitude: 48.8566, longitude: 2.3522, radius: 1000 }, // Paris
    ];
  }
}