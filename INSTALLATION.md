# VIP Escort Service - Installationsanleitung

## Systemvoraussetzungen

- Node.js (Version 18 oder höher)
- npm (Version 8 oder höher)
- Git
- MongoDB (Version 5 oder höher)
- Redis (optional, für Session-Management und Caching)

## Installation

### 1. Repository klonen

```bash
git clone https://github.com/your-username/vip-escort-service.git
cd vip-escort-service
```

### 2. Frontend Installation

```bash
cd src/frontend
npm install
```

### 3. Environment-Variablen einrichten

Erstellen Sie eine `.env`-Datei im Frontend-Verzeichnis:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key
VITE_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_cloudinary_upload_preset

### 4. Frontend starten

Entwicklungsmodus:
```bash
npm run dev
```

Produktions-Build:
```bash
npm run build
npm run preview
```

## Projektstruktur

```
src/
├── frontend/
│   ├── public/          # Statische Assets
│   ├── src/
│   │   ├── assets/      # Bilder, Fonts etc.
│   │   ├── components/
│   │   │   ├── shared/  # Gemeinsam genutzte Komponenten
│   │   │   ├── reviews/ # Review-System Komponenten
│   │   │   └── ...     # Weitere Komponenten
│   │   ├── contexts/    # React Context Provider
│   │   ├── features/    # Feature-spezifische Komponenten
│   │   ├── hooks/       # Custom React Hooks
│   │   ├── pages/       # Seiten-Komponenten
│   │   ├── services/    # API-Services
│   │   ├── store/       # Redux Store
│   │   ├── styles/      # Globale Styles
│   │   ├── types/       # TypeScript Typen
│   │   ├── utils/       # Hilfsfunktionen
│   │   ├── App.tsx      # Haupt-App-Komponente
│   │   └── main.tsx     # Entry Point
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts

## Konfiguration

### Frontend-Konfiguration

Die wichtigsten Konfigurationsdateien:

- `vite.config.ts`: Vite-Bundler-Konfiguration
- `tsconfig.json`: TypeScript-Konfiguration
- `package.json`: Projekt-Dependencies und Scripts
- `.env`: Umgebungsvariablen

## Entwicklungsrichtlinien

### Code-Style

- Wir verwenden ESLint und Prettier für konsistente Code-Formatierung
- TypeScript strict mode ist aktiviert
- Komponenten werden als funktionale Komponenten mit Hooks geschrieben
- Styles werden mit MUI und styled-components erstellt

### Git-Workflow

1. Feature-Branch von `develop` erstellen
2. Änderungen committen
3. Pull Request zu `develop` erstellen
4. Code Review durchführen
5. Nach Genehmigung mergen

### Commit-Konventionen

Wir folgen den Conventional Commits:

- `feat:` Neue Features
- `fix:` Bugfixes
- `docs:` Dokumentationsänderungen
- `style:` Code-Style-Änderungen
- `refactor:` Code-Refactoring
- `test:` Test-Änderungen
- `chore:` Sonstige Änderungen

## Testing

### Frontend Tests

```bash
# Unit Tests
npm run test

# E2E Tests
npm run test:e2e

# Linting
npm run lint
```

## Deployment

### Frontend Deployment

1. Produktions-Build erstellen:
```bash
npm run build
```

2. Die generierten Dateien im `dist`-Verzeichnis auf den Webserver hochladen

3. Webserver (nginx/Apache) konfigurieren für Single Page Application

## Troubleshooting

### Häufige Probleme

1. **Node Modules Installation schlägt fehl**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Vite Build Fehler**
   - TypeScript-Fehler überprüfen
   - Node.js Version überprüfen
   - Cache löschen: `npm run clean`

3. **API-Verbindungsfehler**
   - .env Konfiguration überprüfen
   - CORS-Einstellungen überprüfen
   - Netzwerk-Firewall-Regeln prüfen

## Support

Bei Fragen oder Problemen:
- GitHub Issues erstellen
- Entwickler-Team kontaktieren: dev@example.com