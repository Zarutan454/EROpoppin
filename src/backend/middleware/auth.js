const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const crypto = require('crypto');
const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const { redis } = require('../config/database');

// JWT Token Generierung
const signToken = id => {
    return jwt.sign(
        { id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );
};

// Token Response erstellen
const createSendToken = (user, statusCode, req, res) => {
    const token = signToken(user._id);
    
    // Cookie Optionen
    const cookieOptions = {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
        secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
        sameSite: 'strict'
    };

    // Cookie setzen
    res.cookie('jwt', token, cookieOptions);

    // User Passwort aus Output entfernen
    user.password = undefined;

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    });
};

// Geschützte Route Middleware
exports.protect = catchAsync(async (req, res, next) => {
    let token;
    
    // Token aus Header oder Cookie extrahieren
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
        token = req.cookies.jwt;
    }

    if (!token) {
        return next(new AppError('Sie sind nicht eingeloggt. Bitte melden Sie sich an.', 401));
    }

    // Token Verifikation
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // Prüfen ob User noch existiert
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
        return next(new AppError('Der Benutzer existiert nicht mehr.', 401));
    }

    // Prüfen ob User Passwort nach Token-Erstellung geändert wurde
    if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next(new AppError('Passwort wurde kürzlich geändert. Bitte erneut einloggen.', 401));
    }

    // Blacklist-Check (für ausgeloggte Token)
    const isBlacklisted = await redis.get(`bl_${token}`);
    if (isBlacklisted) {
        return next(new AppError('Bitte erneut einloggen.', 401));
    }

    // User zu Request hinzufügen
    req.user = currentUser;
    next();
});

// Rollen-basierte Autorisierung
exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(new AppError('Sie haben keine Berechtigung für diese Aktion.', 403));
        }
        next();
    };
};

// Two-Factor Authentication
exports.verifyTwoFactor = catchAsync(async (req, res, next) => {
    const { token } = req.body;
    const user = await User.findById(req.user.id);

    if (!user.security.twoFactorEnabled) {
        return next();
    }

    const isValid = speakeasy.totp.verify({
        secret: user.security.twoFactorSecret,
        encoding: 'base32',
        token: token
    });

    if (!isValid) {
        return next(new AppError('Ungültiger 2FA Code.', 401));
    }

    next();
});

// Rate Limiting pro IP
exports.rateLimit = async (req, res, next) => {
    const key = `rate_limit_${req.ip}`;
    const limit = 100; // Anfragen
    const window = 3600; // Zeitfenster in Sekunden (1 Stunde)

    try {
        const current = await redis.incr(key);
        if (current === 1) {
            await redis.expire(key, window);
        }

        if (current > limit) {
            return next(new AppError('Zu viele Anfragen. Bitte später erneut versuchen.', 429));
        }

        next();
    } catch (error) {
        next(error);
    }
};

// IP Blocking System
exports.checkIPBlock = async (req, res, next) => {
    const key = `blocked_ip_${req.ip}`;
    
    try {
        const isBlocked = await redis.get(key);
        if (isBlocked) {
            return next(new AppError('Ihre IP-Adresse wurde temporär gesperrt.', 403));
        }

        next();
    } catch (error) {
        next(error);
    }
};

// Fraud Detection
exports.fraudCheck = catchAsync(async (req, res, next) => {
    const suspiciousPatterns = [
        // Beispiel für verdächtige Muster
        req.headers['user-agent']?.includes('suspicious-bot'),
        req.ip.match(/^(known-vpn-ip-pattern)/),
        req.body?.amount > 10000 // Hohe Beträge
    ];

    if (suspiciousPatterns.some(pattern => pattern)) {
        // Log verdächtiger Aktivität
        await redis.lpush('suspicious_activities', JSON.stringify({
            ip: req.ip,
            timestamp: Date.now(),
            pattern: suspiciousPatterns.findIndex(p => p),
            user: req.user?.id
        }));

        return next(new AppError('Verdächtige Aktivität erkannt.', 403));
    }

    next();
});

// Login
exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new AppError('Bitte E-Mail und Passwort angeben.', 400));
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
        // Fehlgeschlagene Login-Versuche tracken
        const key = `login_attempts_${req.ip}`;
        const attempts = await redis.incr(key);
        await redis.expire(key, 3600); // Reset nach 1 Stunde

        if (attempts > 5) {
            // IP temporär blocken
            await redis.setex(`blocked_ip_${req.ip}`, 3600, 'blocked');
            return next(new AppError('Zu viele Fehlversuche. Bitte später erneut versuchen.', 429));
        }

        return next(new AppError('Falsche E-Mail oder Passwort.', 401));
    }

    // Login erfolgreich - Reset Login-Versuche
    await redis.del(`login_attempts_${req.ip}`);

    // Update letzten Login
    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });

    createSendToken(user, 200, req, res);
});

// Logout
exports.logout = catchAsync(async (req, res, next) => {
    // Token zur Blacklist hinzufügen
    const token = req.cookies.jwt || req.headers.authorization?.split(' ')[1];
    if (token) {
        await redis.setex(`bl_${token}`, 
            process.env.JWT_EXPIRES_IN * 24 * 60 * 60, 
            'blacklisted'
        );
    }

    res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });

    res.status(200).json({ status: 'success' });
});

// Passwort Update
exports.updatePassword = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user.id).select('+password');

    if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
        return next(new AppError('Ihr aktuelles Passwort ist falsch.', 401));
    }

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();

    createSendToken(user, 200, req, res);
});