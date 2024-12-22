import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EscortProfile } from '../models/EscortProfile';
import { ClientPreferences } from '../models/ClientPreferences';
import { Booking } from '../models/Booking';
import { Review } from '../models/Review';

interface MatchScore {
  escortId: string;
  score: number;
  matchingCriteria: string[];
}

@Injectable()
export class MatchingService {
  constructor(
    @InjectRepository(EscortProfile)
    private escortRepository: Repository<EscortProfile>,
    @InjectRepository(ClientPreferences)
    private preferencesRepository: Repository<ClientPreferences>,
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>
  ) {}

  async findMatches(clientId: string, preferences?: Partial<ClientPreferences>): Promise<MatchScore[]> {
    // Get client preferences or use provided ones
    const clientPrefs = preferences || await this.preferencesRepository.findOne({
      where: { clientId }
    });

    // Get all active escorts
    const escorts = await this.escortRepository.find({
      where: { isActive: true, isVerified: true }
    });

    // Calculate match scores
    const matchScores: MatchScore[] = await Promise.all(
      escorts.map(async escort => {
        const score = await this.calculateMatchScore(escort, clientPrefs);
        return {
          escortId: escort.id,
          score: score.total,
          matchingCriteria: score.criteria
        };
      })
    );

    // Sort by score descending
    return matchScores.sort((a, b) => b.score - a.score);
  }

  private async calculateMatchScore(
    escort: EscortProfile,
    preferences: Partial<ClientPreferences>
  ): Promise<{ total: number; criteria: string[] }> {
    const weights = {
      services: 0.3,
      location: 0.2,
      availability: 0.15,
      price: 0.15,
      rating: 0.1,
      languages: 0.1
    };

    const matchingCriteria: string[] = [];
    let totalScore = 0;

    // Services match
    if (preferences.preferredServices) {
      const serviceMatch = preferences.preferredServices.filter(
        service => escort.services.includes(service)
      ).length / preferences.preferredServices.length;
      
      if (serviceMatch > 0.7) {
        matchingCriteria.push('services');
        totalScore += serviceMatch * weights.services;
      }
    }

    // Location match
    if (preferences.preferredLocations) {
      const locationMatch = preferences.preferredLocations.some(
        loc => escort.workingLocations.includes(loc)
      );
      
      if (locationMatch) {
        matchingCriteria.push('location');
        totalScore += weights.location;
      }
    }

    // Availability match
    const availabilityMatch = await this.checkAvailabilityMatch(
      escort.id,
      preferences.preferredTimes
    );
    if (availabilityMatch > 0.5) {
      matchingCriteria.push('availability');
      totalScore += availabilityMatch * weights.availability;
    }

    // Price range match
    if (preferences.maxPrice) {
      const priceMatch = escort.hourlyRate <= preferences.maxPrice;
      if (priceMatch) {
        matchingCriteria.push('price');
        totalScore += weights.price;
      }
    }

    // Rating match
    const rating = await this.getAverageRating(escort.id);
    if (rating >= 4.5) {
      matchingCriteria.push('highly_rated');
      totalScore += weights.rating;
    }

    // Language match
    if (preferences.preferredLanguages) {
      const languageMatch = preferences.preferredLanguages.some(
        lang => escort.languages.includes(lang)
      );
      if (languageMatch) {
        matchingCriteria.push('language');
        totalScore += weights.languages;
      }
    }

    return { total: totalScore, criteria: matchingCriteria };
  }

  private async checkAvailabilityMatch(
    escortId: string,
    preferredTimes?: string[]
  ): Promise<number> {
    if (!preferredTimes || preferredTimes.length === 0) return 1;

    const bookings = await this.bookingRepository.find({
      where: { escortId },
      select: ['startTime', 'endTime']
    });

    const availableSlots = preferredTimes.filter(time => {
      const requestedTime = new Date(time);
      return !bookings.some(booking => 
        requestedTime >= booking.startTime && requestedTime <= booking.endTime
      );
    });

    return availableSlots.length / preferredTimes.length;
  }

  private async getAverageRating(escortId: string): Promise<number> {
    const reviews = await this.reviewRepository.find({
      where: { escortId }
    });

    if (reviews.length === 0) return 0;

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    return totalRating / reviews.length;
  }

  async generateRecommendations(
    clientId: string,
    limit: number = 10
  ): Promise<EscortProfile[]> {
    // Get client's booking history
    const clientBookings = await this.bookingRepository.find({
      where: { clientId },
      relations: ['escort']
    });

    // Get client's preferences
    const preferences = await this.preferencesRepository.findOne({
      where: { clientId }
    });

    // Calculate preference weights based on booking history
    const preferenceWeights = this.calculatePreferenceWeights(clientBookings);

    // Get matches using weighted preferences
    const matches = await this.findMatches(clientId, {
      ...preferences,
      ...preferenceWeights
    });

    // Get escort profiles for top matches
    const topMatches = await Promise.all(
      matches
        .slice(0, limit)
        .map(match => this.escortRepository.findOne({
          where: { id: match.escortId }
        }))
    );

    return topMatches.filter(match => match !== null) as EscortProfile[];
  }

  private calculatePreferenceWeights(bookings: Booking[]): Partial<ClientPreferences> {
    const weights: Partial<ClientPreferences> = {};

    if (bookings.length === 0) return weights;

    // Extract common preferences from successful bookings
    const services = new Map<string, number>();
    const locations = new Map<string, number>();
    const prices = [];

    bookings.forEach(booking => {
      // Services
      booking.escort.services.forEach(service => {
        services.set(service, (services.get(service) || 0) + 1);
      });

      // Locations
      booking.location && locations.set(
        booking.location,
        (locations.get(booking.location) || 0) + 1
      );

      // Prices
      booking.totalAmount && prices.push(booking.totalAmount);
    });

    // Calculate weighted preferences
    weights.preferredServices = Array.from(services.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([service]) => service);

    weights.preferredLocations = Array.from(locations.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([location]) => location);

    if (prices.length > 0) {
      weights.maxPrice = Math.max(...prices) * 1.2; // 20% buffer
    }

    return weights;
  }

  async updateClientPreferences(
    clientId: string,
    preferences: Partial<ClientPreferences>
  ): Promise<void> {
    await this.preferencesRepository.save({
      clientId,
      ...preferences,
      lastUpdated: new Date()
    });
  }
}
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EscortProfile } from '../models/EscortProfile';
import { UserPreferences } from '../models/UserPreferences';
import { redis } from './redis';

interface MatchScore {
  escortId: string;
  score: number;
  matchingAttributes: string[];
}

@Injectable()
export class MatchingService {
  constructor(
    @InjectRepository(EscortProfile)
    private escortProfileRepository: Repository<EscortProfile>,
    @InjectRepository(UserPreferences)
    private userPreferencesRepository: Repository<UserPreferences>
  ) {}

  async generateMatches(userId: string, limit: number = 10): Promise<MatchScore[]> {
    // Get user preferences
    const preferences = await this.userPreferencesRepository.findOne({
      where: { userId }
    });

    if (!preferences) {
      return [];
    }

    // Get cached matches if available
    const cachedMatches = await redis.get(`matches:${userId}`);
    if (cachedMatches) {
      return JSON.parse(cachedMatches);
    }

    // Get all active escort profiles
    const escorts = await this.escortProfileRepository.find({
      where: { isActive: true, isVerified: true }
    });

    // Calculate match scores
    const matches = await Promise.all(
      escorts.map(async escort => {
        const score = await this.calculateMatchScore(escort, preferences);
        return {
          escortId: escort.id,
          score: score.score,
          matchingAttributes: score.matchingAttributes
        };
      })
    );

    // Sort by score and limit results
    const topMatches = matches
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // Cache results for 1 hour
    await redis.setex(`matches:${userId}`, 3600, JSON.stringify(topMatches));

    return topMatches;
  }

  private async calculateMatchScore(
    escort: EscortProfile,
    preferences: UserPreferences
  ): Promise<{ score: number; matchingAttributes: string[] }> {
    let score = 0;
    const matchingAttributes: string[] = [];

    // Location matching (highest weight)
    if (preferences.preferredLocations.includes(escort.city)) {
      score += 30;
      matchingAttributes.push('location');
    }

    // Service matching
    const matchingServices = escort.services.filter(service =>
      preferences.preferredServices.includes(service)
    );
    score += matchingServices.length * 5;
    if (matchingServices.length > 0) {
      matchingAttributes.push('services');
    }

    // Age preference
    if (
      escort.age >= preferences.preferredAgeRange[0] &&
      escort.age <= preferences.preferredAgeRange[1]
    ) {
      score += 15;
      matchingAttributes.push('age');
    }

    // Price range
    if (
      escort.hourlyRate >= preferences.priceRange[0] &&
      escort.hourlyRate <= preferences.priceRange[1]
    ) {
      score += 10;
      matchingAttributes.push('price');
    }

    // Physical attributes matching
    const attributeScore = this.calculateAttributesScore(
      escort.physicalAttributes,
      preferences.preferredAttributes
    );
    score += attributeScore;
    if (attributeScore > 0) {
      matchingAttributes.push('attributes');
    }

    // Language matching
    const matchingLanguages = escort.languages.filter(lang =>
      preferences.preferredLanguages.includes(lang)
    );
    score += matchingLanguages.length * 3;
    if (matchingLanguages.length > 0) {
      matchingAttributes.push('languages');
    }

    // Verification bonus
    if (escort.isVerified) {
      score += 10;
      matchingAttributes.push('verified');
    }

    // Review score bonus
    if (escort.reviewScore >= 4.5) {
      score += 15;
      matchingAttributes.push('highly_rated');
    }

    return { score, matchingAttributes };
  }

  private calculateAttributesScore(
    escortAttributes: any,
    preferredAttributes: any
  ): number {
    let score = 0;

    // Match each attribute with a weight
    if (escortAttributes.height === preferredAttributes.height) score += 2;
    if (escortAttributes.bodyType === preferredAttributes.bodyType) score += 3;
    if (escortAttributes.hairColor === preferredAttributes.hairColor) score += 1;
    if (escortAttributes.eyeColor === preferredAttributes.eyeColor) score += 1;

    return score;
  }

  async updateUserPreferences(
    userId: string,
    preferences: Partial<UserPreferences>
  ): Promise<void> {
    await this.userPreferencesRepository.update({ userId }, preferences);
    // Invalidate cached matches
    await redis.del(`matches:${userId}`);
  }

  async getRecommendedEscorts(
    userId: string,
    limit: number = 10
  ): Promise<EscortProfile[]> {
    const matches = await this.generateMatches(userId, limit);
    const escortIds = matches.map(match => match.escortId);

    return this.escortProfileRepository.findByIds(escortIds, {
      relations: ['reviews', 'photos']
    });
  }

  async refreshMatches(userId: string): Promise<void> {
    // Invalidate cache and regenerate matches
    await redis.del(`matches:${userId}`);
    await this.generateMatches(userId);
  }
}