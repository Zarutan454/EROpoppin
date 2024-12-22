import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { redis } from './redis';
import * as fs from 'fs/promises';
import * as path from 'path';

interface TranslationEntry {
  key: string;
  translations: Record<string, string>;
  namespace: string;
  lastUpdated: Date;
}

@Injectable()
export class TranslationService {
  private readonly supportedLanguages = ['de', 'en', 'it', 'fr', 'ro', 'ru', 'es'];
  private readonly cachePrefix = 'translations:';
  private readonly cacheTTL = 3600; // 1 hour

  constructor(
    @InjectRepository('translations')
    private translationRepository: Repository<TranslationEntry>
  ) {}

  async getTranslations(
    language: string,
    namespace: string = 'common'
  ): Promise<Record<string, string>> {
    if (!this.supportedLanguages.includes(language)) {
      throw new Error(`Unsupported language: ${language}`);
    }

    // Try to get from cache
    const cacheKey = `${this.cachePrefix}${language}:${namespace}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Get from database
    const translations = await this.translationRepository.find({
      where: { namespace }
    });

    // Transform to key-value pairs
    const result: Record<string, string> = {};
    for (const entry of translations) {
      if (entry.translations[language]) {
        result[entry.key] = entry.translations[language];
      }
    }

    // Cache the result
    await redis.setex(cacheKey, this.cacheTTL, JSON.stringify(result));

    return result;
  }

  async updateTranslation(
    key: string,
    translations: Record<string, string>,
    namespace: string = 'common'
  ): Promise<void> {
    // Validate languages
    const invalidLanguages = Object.keys(translations).filter(
      lang => !this.supportedLanguages.includes(lang)
    );
    if (invalidLanguages.length > 0) {
      throw new Error(`Unsupported languages: ${invalidLanguages.join(', ')}`);
    }

    // Update or create translation entry
    await this.translationRepository.save({
      key,
      translations,
      namespace,
      lastUpdated: new Date()
    });

    // Invalidate cache for all affected languages
    await Promise.all(
      Object.keys(translations).map(lang =>
        redis.del(`${this.cachePrefix}${lang}:${namespace}`)
      )
    );
  }

  async importTranslations(
    filePath: string,
    language: string
  ): Promise<void> {
    if (!this.supportedLanguages.includes(language)) {
      throw new Error(`Unsupported language: ${language}`);
    }

    const content = await fs.readFile(filePath, 'utf8');
    const translations = JSON.parse(content);

    // Flatten nested structure
    const flatTranslations = this.flattenTranslations(translations);

    // Update each translation
    for (const [key, value] of Object.entries(flatTranslations)) {
      await this.updateTranslation(key, { [language]: value as string });
    }
  }

  async exportTranslations(
    language: string,
    outputPath: string
  ): Promise<void> {
    if (!this.supportedLanguages.includes(language)) {
      throw new Error(`Unsupported language: ${language}`);
    }

    const translations = await this.translationRepository.find();
    const result: Record<string, any> = {};

    for (const entry of translations) {
      if (entry.translations[language]) {
        this.setNestedValue(result, entry.key, entry.translations[language]);
      }
    }

    await fs.writeFile(
      outputPath,
      JSON.stringify(result, null, 2),
      'utf8'
    );
  }

  private flattenTranslations(
    obj: Record<string, any>,
    prefix: string = ''
  ): Record<string, string> {
    const result: Record<string, string> = {};

    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (typeof value === 'object' && value !== null) {
        Object.assign(result, this.flattenTranslations(value, newKey));
      } else {
        result[newKey] = value;
      }
    }

    return result;
  }

  private setNestedValue(
    obj: Record<string, any>,
    path: string,
    value: string
  ): void {
    const parts = path.split('.');
    let current = obj;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in current)) {
        current[part] = {};
      }
      current = current[part];
    }

    current[parts[parts.length - 1]] = value;
  }

  async validateTranslations(): Promise<{
    missingTranslations: Record<string, string[]>;
    suggestions: Record<string, string[]>;
  }> {
    const translations = await this.translationRepository.find();
    const missingTranslations: Record<string, string[]> = {};
    const suggestions: Record<string, string[]> = {};

    for (const entry of translations) {
      const missing = this.supportedLanguages.filter(
        lang => !entry.translations[lang]
      );

      if (missing.length > 0) {
        missingTranslations[entry.key] = missing;

        // Generate suggestions based on similar keys
        const similarKeys = translations
          .filter(t => t.key !== entry.key)
          .map(t => ({
            key: t.key,
            similarity: this.calculateSimilarity(entry.key, t.key)
          }))
          .filter(s => s.similarity > 0.7)
          .map(s => s.key);

        if (similarKeys.length > 0) {
          suggestions[entry.key] = similarKeys;
        }
      }
    }

    return { missingTranslations, suggestions };
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    return (longer.length - this.editDistance(longer, shorter)) / longer.length;
  }

  private editDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str1.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str2.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str1.length; i++) {
      for (let j = 1; j <= str2.length; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }

    return matrix[str1.length][str2.length];
  }
}