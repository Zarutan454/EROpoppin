const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    escort: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Booking must belong to an Escort!']
    },
    client: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Booking must belong to a Client!']
    },
    service: {
        type: String,
        required: [true, 'Booking must include a service type'],
        enum: ['escort', 'massage', 'dinner', 'reisebegleitung', 'events']
    },
    startDate: {
        type: Date,
        required: [true, 'Booking must have a start date']
    },
    endDate: {
        type: Date,
        required: [true, 'Booking must have an end date']
    },
    duration: {
        type: String,
        required: [true, 'Booking must specify duration'],
        enum: ['1hour', '2hours', 'overnight', 'weekend']
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: [Number],
        address: String,
        city: String,
        country: String
    },
    price: {
        amount: {
            type: Number,
            required: [true, 'Booking must have a price']
        },
        currency: {
            type: String,
            default: 'EUR'
        }
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'completed', 'cancelled'],
        default: 'pending'
    },
    payment: {
        status: {
            type: String,
            enum: ['pending', 'paid', 'refunded'],
            default: 'pending'
        },
        method: {
            type: String,
            enum: ['credit_card', 'bank_transfer', 'cash'],
            required: true
        },
        transactionId: String,
        paidAt: Date
    },
    specialRequests: String,
    additionalServices: [{
        service: String,
        price: Number
    }],
    cancellation: {
        cancelledBy: {
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        },
        reason: String,
        cancelledAt: Date,
        refundAmount: Number
    },
    review: {
        rating: {
            type: Number,
            min: 1,
            max: 5
        },
        comment: String,
        createdAt: Date
    },
    communication: [{
        sender: {
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        },
        message: String,
        timestamp: {
            type: Date,
            default: Date.now
        },
        read: {
            type: Boolean,
            default: false
        }
    }],
    security: {
        verificationCode: String,
        codeExpires: Date,
        isVerified: {
            type: Boolean,
            default: false
        }
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexierung
bookingSchema.index({ escort: 1, startDate: 1 });
bookingSchema.index({ client: 1, startDate: 1 });
bookingSchema.index({ location: '2dsphere' });

// Virtuelle Eigenschaften
bookingSchema.virtual('durationInHours').get(function() {
    return Math.abs(this.endDate - this.startDate) / 36e5;
});

// Middleware vor dem Speichern
bookingSchema.pre('save', async function(next) {
    if (this.isNew) {
        // Generiere Verifikationscode
        this.security.verificationCode = Math.random().toString(36).slice(-8).toUpperCase();
        this.security.codeExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 Stunden
    }
    next();
});

// Middleware für Populate
bookingSchema.pre(/^find/, function(next) {
    this.populate({
        path: 'escort',
        select: 'profile.displayName profile.phoneNumber'
    }).populate({
        path: 'client',
        select: 'profile.displayName profile.phoneNumber'
    });
    next();
});

// Statische Methoden
bookingSchema.statics.calculateEscortStats = async function(escortId) {
    const stats = await this.aggregate([
        {
            $match: { escort: escortId, status: 'completed' }
        },
        {
            $group: {
                _id: null,
                numBookings: { $sum: 1 },
                avgRating: { $avg: '$review.rating' },
                totalEarnings: { $sum: '$price.amount' }
            }
        }
    ]);
    return stats.length > 0 ? stats[0] : null;
};

// Instanz Methoden
bookingSchema.methods.generateInvoice = async function() {
    // Implementierung der Rechnungsgenerierung
};

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;