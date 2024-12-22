const Booking = require('../models/Booking');
const User = require('../models/User');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { redis } = require('../config/database');
const AppError = require('../utils/appError');
const emailService = require('./emailService');

class BookingService {
    constructor() {
        this.durations = {
            '1hour': { minutes: 60, multiplier: 1 },
            '2hours': { minutes: 120, multiplier: 1.8 },
            'overnight': { minutes: 720, multiplier: 4 },
            'weekend': { minutes: 2880, multiplier: 12 }
        };
    }

    // Verfügbarkeit prüfen
    async checkAvailability(escortId, startDate, duration) {
        try {
            // Cache-Key erstellen
            const cacheKey = `availability_${escortId}_${startDate.toISOString()}`;
            
            // Cache prüfen
            const cachedResult = await redis.get(cacheKey);
            if (cachedResult) {
                return JSON.parse(cachedResult);
            }

            const escort = await User.findById(escortId);
            if (!escort || escort.role !== 'escort') {
                throw new AppError('Escort nicht gefunden', 404);
            }

            const endDate = new Date(startDate.getTime() + 
                this.durations[duration].minutes * 60000);

            // Überschneidende Buchungen prüfen
            const conflictingBookings = await Booking.find({
                escort: escortId,
                status: { $in: ['pending', 'confirmed'] },
                $or: [
                    {
                        startDate: { $lt: endDate },
                        endDate: { $gt: startDate }
                    }
                ]
            });

            const isAvailable = conflictingBookings.length === 0;

            // Ergebnis cachen (10 Minuten)
            await redis.set(cacheKey, JSON.stringify({ isAvailable }), 'EX', 600);

            return { isAvailable };
        } catch (error) {
            throw error;
        }
    }

    // Preis berechnen
    async calculatePrice(escortId, duration) {
        try {
            const escort = await User.findById(escortId);
            if (!escort) {
                throw new AppError('Escort nicht gefunden', 404);
            }

            const baseRate = escort.profile.rates.hourly;
            const multiplier = this.durations[duration].multiplier;
            let price = baseRate * multiplier;

            // Zusatzkosten (z.B. für Wochenenden oder Feiertage)
            const isWeekend = new Date().getDay() % 6 === 0;
            if (isWeekend) {
                price *= 1.2; // 20% Wochenend-Zuschlag
            }

            // Auf 2 Dezimalstellen runden
            return Math.round(price * 100) / 100;
        } catch (error) {
            throw error;
        }
    }

    // Neue Buchung erstellen
    async createBooking(clientId, escortId, bookingData) {
        try {
            // Verfügbarkeit prüfen
            const { isAvailable } = await this.checkAvailability(
                escortId,
                new Date(bookingData.startDate),
                bookingData.duration
            );

            if (!isAvailable) {
                throw new AppError('Zeitraum nicht verfügbar', 400);
            }

            // Preis berechnen
            const price = await this.calculatePrice(escortId, bookingData.duration);

            // Buchung erstellen
            const booking = await Booking.create({
                client: clientId,
                escort: escortId,
                service: bookingData.service,
                startDate: bookingData.startDate,
                endDate: new Date(new Date(bookingData.startDate).getTime() + 
                    this.durations[bookingData.duration].minutes * 60000),
                duration: bookingData.duration,
                location: bookingData.location,
                price: {
                    amount: price,
                    currency: 'EUR'
                },
                specialRequests: bookingData.specialRequests
            });

            // Zahlungs-Intent erstellen
            const paymentIntent = await stripe.paymentIntents.create({
                amount: price * 100, // In Cent umrechnen
                currency: 'eur',
                metadata: {
                    bookingId: booking._id.toString()
                }
            });

            booking.payment = {
                status: 'pending',
                method: 'credit_card',
                transactionId: paymentIntent.id
            };

            await booking.save();

            // Bestätigungen senden
            await emailService.sendBookingConfirmation(booking);

            return {
                booking,
                clientSecret: paymentIntent.client_secret
            };
        } catch (error) {
            throw error;
        }
    }

    // Buchung bestätigen
    async confirmBooking(bookingId) {
        try {
            const booking = await Booking.findById(bookingId);
            if (!booking) {
                throw new AppError('Buchung nicht gefunden', 404);
            }

            booking.status = 'confirmed';
            booking.payment.status = 'paid';
            booking.payment.paidAt = new Date();

            await booking.save();

            // Cache invalidieren
            const cacheKey = `availability_${booking.escort}_${booking.startDate.toISOString()}`;
            await redis.del(cacheKey);

            // Bestätigungs-Emails senden
            await emailService.sendBookingConfirmation(booking);

            return booking;
        } catch (error) {
            throw error;
        }
    }

    // Buchung stornieren
    async cancelBooking(bookingId, cancelledBy) {
        try {
            const booking = await Booking.findById(bookingId);
            if (!booking) {
                throw new AppError('Buchung nicht gefunden', 404);
            }

            // Stornierungsbedingungen prüfen
            const hoursUntilStart = (booking.startDate - new Date()) / (1000 * 60 * 60);
            let refundAmount = 0;

            if (hoursUntilStart > 48) {
                refundAmount = booking.price.amount * 0.9; // 90% Rückerstattung
            } else if (hoursUntilStart > 24) {
                refundAmount = booking.price.amount * 0.5; // 50% Rückerstattung
            }

            // Stornierung durchführen
            booking.status = 'cancelled';
            booking.cancellation = {
                cancelledBy,
                reason: 'Stornierung durch Benutzer',
                cancelledAt: new Date(),
                refundAmount
            };

            // Rückerstattung über Stripe
            if (refundAmount > 0 && booking.payment.transactionId) {
                await stripe.refunds.create({
                    payment_intent: booking.payment.transactionId,
                    amount: Math.round(refundAmount * 100) // In Cent umrechnen
                });
            }

            await booking.save();

            // Cache invalidieren
            const cacheKey = `availability_${booking.escort}_${booking.startDate.toISOString()}`;
            await redis.del(cacheKey);

            // Stornierungsbestätigung senden
            await emailService.sendBookingCancellation(booking);

            return booking;
        } catch (error) {
            throw error;
        }
    }

    // Buchung abschließen
    async completeBooking(bookingId) {
        try {
            const booking = await Booking.findById(bookingId);
            if (!booking) {
                throw new AppError('Buchung nicht gefunden', 404);
            }

            booking.status = 'completed';
            await booking.save();

            // Statistiken aktualisieren
            await Booking.calculateEscortStats(booking.escort);

            return booking;
        } catch (error) {
            throw error;
        }
    }

    // Buchungshistorie abrufen
    async getBookingHistory(userId, role) {
        try {
            const query = role === 'escort' 
                ? { escort: userId }
                : { client: userId };

            const bookings = await Booking.find(query)
                .sort('-startDate')
                .populate('escort', 'profile.displayName')
                .populate('client', 'profile.displayName');

            return bookings;
        } catch (error) {
            throw error;
        }
    }

    // Buchungsstatistiken
    async getBookingStats(escortId) {
        try {
            return await Booking.calculateEscortStats(escortId);
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new BookingService();