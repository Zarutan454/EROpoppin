const { SitemapStream, streamToPromise } = require('sitemap');
const { Readable } = require('stream');
const { createGzip } = require('zlib');
const fs = require('fs').promises;
const path = require('path');
const User = require('../models/User');
const { redis } = require('../config/database');

class SEOService {
    constructor() {
        this.baseUrl = process.env.SITE_URL || 'https://example.com';
        this.sitemapPath = path.join(__dirname, '../../public/sitemap.xml');
        this.robotsTxtPath = path.join(__dirname, '../../public/robots.txt');
    }

    // Sitemap generieren
    async generateSitemap() {
        try {
            // Statische Routen
            const staticRoutes = [
                { url: '/', changefreq: 'daily', priority: 1.0 },
                { url: '/about', changefreq: 'monthly', priority: 0.8 },
                { url: '/services', changefreq: 'weekly', priority: 0.9 },
                { url: '/contact', changefreq: 'monthly', priority: 0.7 },
                { url: '/faq', changefreq: 'monthly', priority: 0.6 }
            ];

            // Dynamische Routen von Escorts
            const escorts = await User.find(
                { 
                    role: 'escort',
                    'verification.isVerified': true,
                    active: true
                },
                'profile.displayName profile.location updatedAt'
            );

            const escortRoutes = escorts.map(escort => ({
                url: `/escorts/${escort._id}`,
                changefreq: 'daily',
                priority: 0.9,
                lastmod: escort.updatedAt.toISOString()
            }));

            // Locationbasierte Routen
            const locations = await User.distinct('profile.location.city', {
                role: 'escort',
                'verification.isVerified': true
            });

            const locationRoutes = locations.map(location => ({
                url: `/location/${encodeURIComponent(location.toLowerCase())}`,
                changefreq: 'daily',
                priority: 0.8
            }));

            // Sitemap erstellen
            const stream = new SitemapStream({
                hostname: this.baseUrl,
                cacheTime: 600000
            });

            // Alle Routen hinzufügen
            return streamToPromise(
                Readable.from([...staticRoutes, ...escortRoutes, ...locationRoutes])
                    .pipe(stream)
            ).then(data => data.toString());
        } catch (error) {
            console.error('Sitemap generation error:', error);
            throw error;
        }
    }

    // Robots.txt generieren
    async generateRobotsTxt() {
        const robotsTxt = `
User-agent: *
Allow: /
Allow: /escorts/
Allow: /locations/
Allow: /services/
Disallow: /admin/
Disallow: /api/
Disallow: /private/
Disallow: /checkout/
Disallow: /messages/
Disallow: /bookings/

# Sitemaps
Sitemap: ${this.baseUrl}/sitemap.xml

# Crawl-delay
Crawl-delay: 10
        `.trim();

        return robotsTxt;
    }

    // Meta-Tags generieren
    generateMetaTags(page) {
        const metaTags = {
            home: {
                title: 'VIP Escort Service | Hochwertige Begleitung',
                description: 'Exklusiver VIP Escort Service. Diskrete und stilvolle Begleitung für besondere Anlässe. Jetzt durchstöbern ✓ 100% Diskret ✓ Verifizierte Profile',
                keywords: 'escort service, vip escort, begleitung, dinner date'
            },
            escort: {
                title: '${name} | VIP Escort Begleitung',
                description: '${name} - Exklusive Escort Begleitung in ${location}. ✓ Verifiziertes Profil ✓ Diskrete Buchung ✓ Premium Service',
                keywords: '${name}, escort, ${location}, begleitung, vip service'
            },
            location: {
                title: 'Escort Service ${location} | VIP Begleitung',
                description: 'Escort Service in ${location}. Finden Sie die perfekte Begleitung für Ihren Anlass. ✓ Große Auswahl ✓ Diskret ✓ Sicher',
                keywords: 'escort ${location}, begleitung ${location}, vip service ${location}'
            }
        };

        return metaTags[page] || metaTags.home;
    }

    // Schema.org Markup generieren
    generateSchemaMarkup(data) {
        const schemas = {
            escort: {
                '@context': 'https://schema.org',
                '@type': 'Person',
                name: data.name,
                description: data.description,
                image: data.images[0],
                address: {
                    '@type': 'PostalAddress',
                    addressLocality: data.location.city,
                    addressCountry: data.location.country
                }
            },
            service: {
                '@context': 'https://schema.org',
                '@type': 'Service',
                name: 'VIP Escort Service',
                description: 'Exklusiver Begleitservice für besondere Anlässe',
                provider: {
                    '@type': 'Organization',
                    name: 'VIP Escort Service',
                    url: this.baseUrl
                }
            }
        };

        return schemas[data.type] || schemas.service;
    }

    // URL-Optimierung
    generateSEOUrl(text) {
        return text
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    // Sitemap aktualisieren
    async updateSitemap() {
        try {
            const sitemap = await this.generateSitemap();
            const gzippedSitemap = await this.gzipContent(sitemap);

            // Sitemap speichern
            await fs.writeFile(this.sitemapPath, sitemap);
            await fs.writeFile(`${this.sitemapPath}.gz`, gzippedSitemap);

            // Robots.txt aktualisieren
            const robotsTxt = await this.generateRobotsTxt();
            await fs.writeFile(this.robotsTxtPath, robotsTxt);

            // Cache invalidieren
            await redis.del('sitemap');
            await redis.del('robotstxt');

            return true;
        } catch (error) {
            console.error('Sitemap update error:', error);
            throw error;
        }
    }

    // Content komprimieren
    async gzipContent(content) {
        return new Promise((resolve, reject) => {
            const gzip = createGzip();
            const chunks = [];

            gzip.on('data', chunk => chunks.push(chunk));
            gzip.on('end', () => resolve(Buffer.concat(chunks)));
            gzip.on('error', reject);

            gzip.write(content);
            gzip.end();
        });
    }

    // SEO Performance Monitor
    async monitorSEOMetrics() {
        // Implementation für SEO Monitoring
        // - Seitengeschwindigkeit
        // - Mobile Freundlichkeit
        // - Broken Links
        // - 404 Fehler
        // - etc.
    }

    // Automatische Keyword-Optimierung
    async optimizeKeywords(content, targetKeywords) {
        // Implementation für Keyword-Optimierung
        // - Keyword-Dichte prüfen
        // - Vorschläge für Optimierung
        // - LSI Keywords
        // - etc.
    }
}

module.exports = new SEOService();