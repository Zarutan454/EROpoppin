const User = require('../models/User');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { redis } = require('../config/database');
const AppError = require('../utils/appError');

class MembershipService {
    constructor() {
        this.membershipLevels = {
            basic: {
                price: 0,
                features: [
                    'Basis-Profil',
                    'Grundlegende Suche',
                    'Eingeschränkte Nachrichten'
                ]
            },
            premium: {
                price: 99.99,
                features: [
                    'Erweitertes Profil',
                    'Erweiterte Suche',
                    'Unbegrenzte Nachrichten',
                    'Prioritäts-Support',
                    'Verifiziertes Badge'
                ]
            },
            vip: {
                price: 299.99,
                features: [
                    'Elite-Profil',
                    'VIP-Badge',
                    'Exklusive Events',
                    'Persönlicher Concierge',
                    'Prioritäts-Listing',
                    'Werbefreie Erfahrung',
                    '24/7 Premium-Support'
                ]
            }
        };
    }

    // Neue Mitgliedschaft erstellen
    async createMembership(userId, level) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new AppError('Benutzer nicht gefunden', 404);
            }

            // Prüfen ob gültiges Membership Level
            if (!this.membershipLevels[level]) {
                throw new AppError('Ungültiges Membership Level', 400);
            }

            const membership = {
                type: level,
                startDate: new Date(),
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 Tage
                autoRenew: true
            };

            user.membership = membership;
            await user.save();

            // Membership Cache aktualisieren
            await redis.set(
                `membership_${userId}`,
                JSON.stringify(membership),
                'EX',
                86400 // 24 Stunden Cache
            );

            return membership;
        } catch (error) {
            throw error;
        }
    }

    // Mitgliedschaft verlängern
    async renewMembership(userId) {
        try {
            const user = await User.findById(userId);
            if (!user.membership) {
                throw new AppError('Keine aktive Mitgliedschaft gefunden', 404);
            }

            // Verlängerung um 30 Tage
            user.membership.endDate = new Date(
                user.membership.endDate.getTime() + 30 * 24 * 60 * 60 * 1000
            );
            await user.save();

            // Cache aktualisieren
            await redis.del(`membership_${userId}`);

            return user.membership;
        } catch (error) {
            throw error;
        }
    }

    // Mitgliedschaft upgraden
    async upgradeMembership(userId, newLevel) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new AppError('Benutzer nicht gefunden', 404);
            }

            // Preisdifferenz berechnen
            const currentLevel = user.membership?.type || 'basic';
            const priceDifference = 
                this.membershipLevels[newLevel].price - 
                this.membershipLevels[currentLevel].price;

            if (priceDifference <= 0) {
                throw new AppError('Downgrade nicht möglich', 400);
            }

            // Upgrade durchführen
            user.membership = {
                ...user.membership,
                type: newLevel,
                upgradedAt: new Date()
            };

            await user.save();
            await redis.del(`membership_${userId}`);

            return user.membership;
        } catch (error) {
            throw error;
        }
    }

    // Mitgliedschaft kündigen
    async cancelMembership(userId) {
        try {
            const user = await User.findById(userId);
            if (!user.membership) {
                throw new AppError('Keine aktive Mitgliedschaft gefunden', 404);
            }

            user.membership.autoRenew = false;
            await user.save();
            await redis.del(`membership_${userId}`);

            return { message: 'Mitgliedschaft wird zum Ablaufdatum gekündigt' };
        } catch (error) {
            throw error;
        }
    }

    // Mitgliedschaftsvorteile prüfen
    async checkMembershipBenefits(userId) {
        try {
            // Zuerst Cache prüfen
            const cachedMembership = await redis.get(`membership_${userId}`);
            if (cachedMembership) {
                return JSON.parse(cachedMembership);
            }

            const user = await User.findById(userId);
            if (!user.membership) {
                return this.membershipLevels.basic;
            }

            // Ablauf prüfen
            if (new Date(user.membership.endDate) < new Date()) {
                if (user.membership.autoRenew) {
                    await this.renewMembership(userId);
                } else {
                    user.membership = null;
                    await user.save();
                    return this.membershipLevels.basic;
                }
            }

            return this.membershipLevels[user.membership.type];
        } catch (error) {
            throw error;
        }
    }

    // Zahlungsabwicklung
    async processMembershipPayment(userId, level) {
        try {
            const user = await User.findById(userId);
            const amount = this.membershipLevels[level].price;

            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount * 100, // Cent zu Euro
                currency: 'eur',
                customer: user.stripeCustomerId,
                metadata: {
                    userId,
                    membershipLevel: level
                }
            });

            return paymentIntent;
        } catch (error) {
            throw error;
        }
    }

    // Automatische Verlängerung
    async processAutoRenewals() {
        try {
            const expiringMemberships = await User.find({
                'membership.endDate': {
                    $gte: new Date(),
                    $lte: new Date(Date.now() + 24 * 60 * 60 * 1000) // Nächste 24 Stunden
                },
                'membership.autoRenew': true
            });

            for (const user of expiringMemberships) {
                try {
                    await this.renewMembership(user._id);
                    // Bestätigungs-Email senden
                } catch (error) {
                    console.error(`Auto-renewal failed for user ${user._id}:`, error);
                    // Benachrichtigung über fehlgeschlagene Verlängerung
                }
            }
        } catch (error) {
            throw error;
        }
    }

    // VIP Events
    async createVIPEvent(eventData) {
        try {
            // Implementation für VIP Events
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new MembershipService();