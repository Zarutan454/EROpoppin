const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Bitte E-Mail Adresse angeben'],
        unique: true,
        lowercase: true,
        validate: {
            validator: function(v) {
                return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
            },
            message: 'Bitte geben Sie eine gültige E-Mail Adresse ein'
        }
    },
    password: {
        type: String,
        required: [true, 'Bitte Passwort angeben'],
        minlength: 8,
        select: false
    },
    role: {
        type: String,
        enum: ['user', 'escort', 'admin'],
        default: 'user'
    },
    profile: {
        firstName: String,
        lastName: String,
        displayName: String,
        phoneNumber: String,
        dateOfBirth: Date,
        gender: {
            type: String,
            enum: ['männlich', 'weiblich', 'divers']
        },
        location: {
            city: String,
            country: String,
            address: String,
            coordinates: {
                type: {
                    type: String,
                    enum: ['Point'],
                    default: 'Point'
                },
                coordinates: [Number]
            }
        },
        languages: [String],
        description: String,
        services: [{
            type: String,
            enum: ['escort', 'massage', 'dinner', 'reisebegleitung', 'events']
        }],
        rates: {
            hourly: Number,
            twoHours: Number,
            overnight: Number,
            weekend: Number
        }
    },
    verification: {
        isVerified: {
            type: Boolean,
            default: false
        },
        documents: [{
            type: String,
            documentType: String,
            verificationStatus: {
                type: String,
                enum: ['pending', 'approved', 'rejected'],
                default: 'pending'
            }
        }],
        verificationDate: Date
    },
    gallery: [{
        imageUrl: String,
        isMain: Boolean,
        isPrivate: Boolean,
        uploadDate: Date
    }],
    availability: [{
        date: Date,
        timeSlots: [{
            startTime: String,
            endTime: String,
            isBooked: Boolean
        }]
    }],
    reviews: [{
        user: {
            type: mongoose.Schema.ObjectId,
            ref: 'User'
        },
        rating: {
            type: Number,
            min: 1,
            max: 5
        },
        comment: String,
        date: {
            type: Date,
            default: Date.now
        }
    }],
    membership: {
        type: {
            type: String,
            enum: ['basic', 'premium', 'vip'],
            default: 'basic'
        },
        startDate: Date,
        endDate: Date,
        autoRenew: Boolean
    },
    security: {
        twoFactorEnabled: {
            type: Boolean,
            default: false
        },
        twoFactorSecret: String,
        loginAttempts: {
            type: Number,
            default: 0
        },
        lockUntil: Date
    },
    notifications: {
        email: {
            type: Boolean,
            default: true
        },
        push: {
            type: Boolean,
            default: true
        },
        sms: {
            type: Boolean,
            default: false
        }
    },
    lastLogin: Date,
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexierung für Geo-Suche
userSchema.index({ "profile.location.coordinates": "2dsphere" });

// Virtuelle Eigenschaften
userSchema.virtual('age').get(function() {
    if (!this.profile.dateOfBirth) return null;
    return Math.floor((Date.now() - this.profile.dateOfBirth) / (365.25 * 24 * 60 * 60 * 1000));
});

// Middleware vor dem Speichern
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    // Passwort Hash
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// Password Reset Token
userSchema.methods.createPasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
    
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 Minuten
    
    return resetToken;
};

// Passwort Vergleich
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

// Passwort Änderungsprüfung
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return JWTTimestamp < changedTimestamp;
    }
    return false;
};

// Inaktive Benutzer ausfiltern
userSchema.pre(/^find/, function(next) {
    this.find({ active: { $ne: false } });
    next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;