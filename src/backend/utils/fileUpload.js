const AWS = require('aws-sdk');
const multer = require('multer');
const sharp = require('sharp');
const AppError = require('./appError');
const catchAsync = require('./catchAsync');

// AWS S3 Konfiguration
const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
});

// Multer Konfiguration für temporäre Speicherung
const multerStorage = multer.memoryStorage();

// Multer Filter für Bildtypen
const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(new AppError('Bitte nur Bilder hochladen.', 400), false);
    }
};

// Multer Upload Konfiguration
const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Middleware für verschiedene Upload-Typen
exports.uploadUserPhoto = upload.single('photo');
exports.uploadGalleryImages = upload.array('images', 10);
exports.uploadVerificationDocs = upload.fields([
    { name: 'idCard', maxCount: 1 },
    { name: 'selfie', maxCount: 1 }
]);

// Bildoptimierung und Upload zu S3
exports.processAndUploadImage = catchAsync(async (req, file, options = {}) => {
    if (!file.buffer) return null;

    // Standard-Optionen
    const defaultOptions = {
        width: 800,
        height: 800,
        quality: 80,
        format: 'jpeg',
        folder: 'images'
    };

    const settings = { ...defaultOptions, ...options };

    // Bild verarbeiten
    let processedImage = sharp(file.buffer)
        .resize(settings.width, settings.height, {
            fit: 'cover',
            position: 'center'
        })
        .toFormat(settings.format)
        .jpeg({ quality: settings.quality });

    // Wasserzeichen hinzufügen wenn gewünscht
    if (settings.watermark) {
        processedImage = processedImage.composite([
            {
                input: settings.watermark,
                gravity: 'southeast',
                blend: 'over'
            }
        ]);
    }

    // Bild zu Buffer konvertieren
    const buffer = await processedImage.toBuffer();

    // Eindeutiger Dateiname generieren
    const filename = `${settings.folder}/${Date.now()}-${Math.round(Math.random() * 1E9)}.${settings.format}`;

    // Upload Parameter
    const uploadParams = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: filename,
        Body: buffer,
        ContentType: `image/${settings.format}`,
        ACL: 'public-read', // Öffentlich zugänglich
        CacheControl: 'max-age=31536000' // 1 Jahr Cache
    };

    // Zu S3 hochladen
    const result = await s3.upload(uploadParams).promise();

    // Optimierte URL zurückgeben
    return {
        url: result.Location,
        key: result.Key
    };
});

// Bild von S3 löschen
exports.deleteImage = catchAsync(async (key) => {
    const deleteParams = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: key
    };

    await s3.deleteObject(deleteParams).promise();
});

// Bilder verarbeiten und hochladen
exports.processImages = catchAsync(async (req, res, next) => {
    if (!req.files && !req.file) return next();

    // Einzelnes Bild
    if (req.file) {
        const result = await exports.processAndUploadImage(req, req.file, {
            folder: 'profile-photos'
        });
        req.body.photo = result.url;
        req.body.photoKey = result.key;
    }

    // Multiple Bilder (Gallery)
    if (req.files?.images) {
        req.body.gallery = [];
        for (const file of req.files.images) {
            const result = await exports.processAndUploadImage(req, file, {
                folder: 'gallery',
                watermark: './assets/watermark.png'
            });
            req.body.gallery.push({
                url: result.url,
                key: result.key
            });
        }
    }

    // Verifikationsdokumente
    if (req.files?.idCard && req.files?.selfie) {
        const idCard = await exports.processAndUploadImage(req, req.files.idCard[0], {
            folder: 'verification',
            quality: 90
        });
        const selfie = await exports.processAndUploadImage(req, req.files.selfie[0], {
            folder: 'verification',
            quality: 90
        });

        req.body.verification = {
            idCard: {
                url: idCard.url,
                key: idCard.key
            },
            selfie: {
                url: selfie.url,
                key: selfie.key
            }
        };
    }

    next();
});

// Bildgrößen-Varianten erstellen
exports.createImageVariants = catchAsync(async (req, file, options = {}) => {
    const variants = {
        thumbnail: { width: 150, height: 150 },
        medium: { width: 500, height: 500 },
        large: { width: 1200, height: 1200 }
    };

    const results = {};

    for (const [size, dimensions] of Object.entries(variants)) {
        const result = await exports.processAndUploadImage(req, file, {
            ...options,
            ...dimensions,
            folder: `${options.folder}/${size}`
        });
        results[size] = {
            url: result.url,
            key: result.key
        };
    }

    return results;
});

// CDN Konfiguration (falls verwendet)
exports.getCDNUrl = (url) => {
    if (!process.env.CDN_DOMAIN) return url;
    return url.replace(
        `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com`,
        process.env.CDN_DOMAIN
    );
};