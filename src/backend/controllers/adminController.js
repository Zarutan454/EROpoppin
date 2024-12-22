const User = require('../models/User');
const Booking = require('../models/Booking');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { redis } = require('../config/database');

// Dashboard Übersicht
exports.getDashboardStats = catchAsync(async (req, res, next) => {
    // Cache-Key
    const cacheKey = 'admin_dashboard_stats';
    
    // Cache prüfen
    const cachedStats = await redis.get(cacheKey);
    if (cachedStats) {
        return res.json(JSON.parse(cachedStats));
    }

    // Statistiken sammeln
    const stats = {
        users: {
            total: await User.countDocuments(),
            escorts: await User.countDocuments({ role: 'escort' }),
            clients: await User.countDocuments({ role: 'client' }),
            newLast24h: await User.countDocuments({
                createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
            })
        },
        bookings: {
            total: await Booking.countDocuments(),
            pending: await Booking.countDocuments({ status: 'pending' }),
            confirmed: await Booking.countDocuments({ status: 'confirmed' }),
            completed: await Booking.countDocuments({ status: 'completed' }),
            cancelled: await Booking.countDocuments({ status: 'cancelled' })
        },
        revenue: {
            total: await calculateTotalRevenue(),
            monthly: await calculateMonthlyRevenue(),
            daily: await calculateDailyRevenue()
        },
        verifications: {
            pending: await User.countDocuments({
                'verification.documents': { 
                    $elemMatch: { verificationStatus: 'pending' } 
                }
            })
        }
    };

    // Cache für 5 Minuten setzen
    await redis.set(cacheKey, JSON.stringify(stats), 'EX', 300);

    res.json(stats);
});

// Benutzer verwalten
exports.getUsers = catchAsync(async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find()
        .select('email profile role membership verification lastLogin')
        .skip(skip)
        .limit(limit)
        .sort('-createdAt');

    const total = await User.countDocuments();

    res.json({
        users,
        pagination: {
            page,
            pages: Math.ceil(total / limit),
            total
        }
    });
});

// Benutzer sperren/entsperren
exports.toggleUserStatus = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if (!user) {
        return next(new AppError('Benutzer nicht gefunden', 404));
    }

    user.active = !user.active;
    await user.save();

    // Alle aktiven Sessions des Benutzers invalidieren
    if (!user.active) {
        await redis.del(`user_sessions_${user._id}`);
    }

    res.json({
        status: 'success',
        data: {
            active: user.active
        }
    });
});

// Verifikationen verwalten
exports.handleVerification = catchAsync(async (req, res, next) => {
    const { userId, documentId, status, note } = req.body;

    const user = await User.findById(userId);
    if (!user) {
        return next(new AppError('Benutzer nicht gefunden', 404));
    }

    const document = user.verification.documents.id(documentId);
    if (!document) {
        return next(new AppError('Dokument nicht gefunden', 404));
    }

    document.verificationStatus = status;
    document.note = note;

    if (status === 'approved') {
        user.verification.isVerified = true;
        user.verification.verificationDate = new Date();
    }

    await user.save();

    // Benachrichtigung an Benutzer senden
    // await emailService.sendVerificationStatus(user, status);

    res.json({
        status: 'success',
        data: {
            verification: user.verification
        }
    });
});

// Finanzen und Abrechnungen
exports.getFinancialReports = catchAsync(async (req, res, next) => {
    const { startDate, endDate } = req.query;

    const reports = await Booking.aggregate([
        {
            $match: {
                createdAt: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                },
                'payment.status': 'paid'
            }
        },
        {
            $group: {
                _id: {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' }
                },
                totalRevenue: { $sum: '$price.amount' },
                bookingsCount: { $sum: 1 },
                commissionsEarned: { 
                    $sum: { $multiply: ['$price.amount', 0.20] } // 20% Provision
                }
            }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
        status: 'success',
        data: {
            reports
        }
    });
});

// System-Logs
exports.getSystemLogs = catchAsync(async (req, res, next) => {
    const logs = await redis.lrange('system_logs', 0, -1);
    
    res.json({
        status: 'success',
        data: {
            logs: logs.map(log => JSON.parse(log))
        }
    });
});

// Content Management
exports.manageContent = catchAsync(async (req, res, next) => {
    // Implementation für Content-Management
});

// Support-Tickets
exports.getSupportTickets = catchAsync(async (req, res, next) => {
    // Implementation für Support-Ticket-Management
});

// System-Einstellungen
exports.updateSystemSettings = catchAsync(async (req, res, next) => {
    const { settings } = req.body;
    
    // Einstellungen in Redis speichern
    await redis.set('system_settings', JSON.stringify(settings));
    
    // Cache invalidieren
    await redis.del('admin_dashboard_stats');
    
    res.json({
        status: 'success',
        message: 'Einstellungen aktualisiert'
    });
});

// Hilfsfunktionen für Umsatzberechnungen
async function calculateTotalRevenue() {
    const result = await Booking.aggregate([
        {
            $match: {
                'payment.status': 'paid'
            }
        },
        {
            $group: {
                _id: null,
                total: { $sum: '$price.amount' }
            }
        }
    ]);
    return result[0]?.total || 0;
}

async function calculateMonthlyRevenue() {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const result = await Booking.aggregate([
        {
            $match: {
                'payment.status': 'paid',
                createdAt: { $gte: startOfMonth }
            }
        },
        {
            $group: {
                _id: null,
                total: { $sum: '$price.amount' }
            }
        }
    ]);
    return result[0]?.total || 0;
}

async function calculateDailyRevenue() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const result = await Booking.aggregate([
        {
            $match: {
                'payment.status': 'paid',
                createdAt: { $gte: startOfDay }
            }
        },
        {
            $group: {
                _id: null,
                total: { $sum: '$price.amount' }
            }
        }
    ]);
    return result[0]?.total || 0;
}