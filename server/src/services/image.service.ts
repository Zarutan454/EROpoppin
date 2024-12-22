import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sharp from 'sharp';
import * as AWS from 'aws-sdk';
import { v4 as uuid } from 'uuid';

interface ImageDimensions {
  width: number;
  height: number;
}

interface ProcessedImage {
  buffer: Buffer;
  format: string;
  dimensions: ImageDimensions;
}

@Injectable()
export class ImageService {
  private s3: AWS.S3;
  private readonly bucketName: string;
  private readonly cdnDomain: string;

  constructor(private configService: ConfigService) {
    this.bucketName = this.configService.get<string>('AWS_S3_BUCKET');
    this.cdnDomain = this.configService.get<string>('CDN_DOMAIN');

    this.s3 = new AWS.S3({
      accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
      secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
      region: this.configService.get<string>('AWS_REGION')
    });
  }

  async upload(file: Express.Multer.File): Promise<string> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file type
    if (!this.isValidImageType(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Only images are allowed.');
    }

    // Process image (resize, compress, etc.)
    const processed = await this.processImage(file.buffer);

    // Generate unique filename
    const filename = `${uuid()}.${processed.format}`;

    // Upload to S3
    await this.uploadToS3(filename, processed.buffer, processed.format);

    // Return CDN URL
    return `${this.cdnDomain}/${filename}`;
  }

  async delete(url: string): Promise<void> {
    // Extract filename from URL
    const filename = url.split('/').pop();

    if (!filename) {
      throw new BadRequestException('Invalid URL');
    }

    await this.s3.deleteObject({
      Bucket: this.bucketName,
      Key: filename
    }).promise();
  }

  private async processImage(buffer: Buffer): Promise<ProcessedImage> {
    try {
      const image = sharp(buffer);
      const metadata = await image.metadata();

      // Resize if too large
      if (metadata.width > 2000 || metadata.height > 2000) {
        image.resize(2000, 2000, {
          fit: 'inside',
          withoutEnlargement: true
        });
      }

      // Convert to JPEG for better compression
      image.jpeg({
        quality: 80,
        progressive: true
      });

      // Get final dimensions
      const { width, height } = await image.metadata();

      return {
        buffer: await image.toBuffer(),
        format: 'jpeg',
        dimensions: { width, height }
      };
    } catch (error) {
      throw new BadRequestException('Failed to process image');
    }
  }

  private async uploadToS3(filename: string, buffer: Buffer, format: string): Promise<void> {
    await this.s3.upload({
      Bucket: this.bucketName,
      Key: filename,
      Body: buffer,
      ContentType: `image/${format}`,
      ACL: 'public-read',
      CacheControl: 'public, max-age=31536000'
    }).promise();
  }

  private isValidImageType(mimetype: string): boolean {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    return validTypes.includes(mimetype);
  }

  async generateThumbnail(buffer: Buffer, width: number = 200): Promise<Buffer> {
    return sharp(buffer)
      .resize(width, width, {
        fit: 'cover',
        position: 'centre'
      })
      .jpeg({
        quality: 70,
        progressive: true
      })
      .toBuffer();
  }

  async watermark(buffer: Buffer, text: string): Promise<Buffer> {
    const image = sharp(buffer);
    const metadata = await image.metadata();

    const svgBuffer = Buffer.from(`
      <svg width="${metadata.width}" height="${metadata.height}">
        <style>
          .text {
            fill: rgba(255, 255, 255, 0.5);
            font-size: 24px;
            font-family: Arial;
            transform: rotate(-45deg);
          }
        </style>
        <text
          x="50%"
          y="50%"
          text-anchor="middle"
          class="text"
        >${text}</text>
      </svg>
    `);

    return image
      .composite([
        {
          input: svgBuffer,
          top: 0,
          left: 0,
        },
      ])
      .toBuffer();
  }

  async optimize(buffer: Buffer): Promise<Buffer> {
    const image = sharp(buffer);
    const metadata = await image.metadata();

    // Convert to WebP for better compression
    if (metadata.size > 500 * 1024) { // If larger than 500KB
      return image
        .webp({
          quality: 75,
          effort: 6 // Higher effort = better compression but slower
        })
        .toBuffer();
    }

    // Otherwise keep original format but optimize
    return image
      .jpeg({
        quality: 85,
        progressive: true
      })
      .toBuffer();
  }

  async metadata(buffer: Buffer): Promise<sharp.Metadata> {
    return sharp(buffer).metadata();
  }
}