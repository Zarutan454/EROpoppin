import { S3 } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import sharp from 'sharp';
import { logger } from '../utils/logger';
import { ApiError } from '../utils/ApiError';

// Initialize S3 client
const s3 = new S3({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const bucket = process.env.AWS_S3_BUCKET!;

// Upload file to S3
export const uploadFile = async (
  filepath: string,
  buffer: Buffer,
  options: {
    contentType?: string;
    isPublic?: boolean;
    resize?: {
      width?: number;
      height?: number;
      fit?: keyof sharp.FitEnum;
    };
  } = {}
): Promise<string> => {
  try {
    let processedBuffer = buffer;

    // Process image if needed
    if (
      options.resize &&
      options.contentType?.startsWith('image/') &&
      options.contentType !== 'image/gif'
    ) {
      processedBuffer = await sharp(buffer)
        .resize({
          width: options.resize.width,
          height: options.resize.height,
          fit: options.resize.fit || 'cover',
          withoutEnlargement: true,
        })
        .toBuffer();
    }

    // Upload to S3
    const upload = new Upload({
      client: s3,
      params: {
        Bucket: bucket,
        Key: filepath,
        Body: processedBuffer,
        ContentType: options.contentType,
        ACL: options.isPublic ? 'public-read' : 'private',
      },
    });

    await upload.done();

    // Return file URL
    if (options.isPublic) {
      return `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${filepath}`;
    }

    // Return signed URL for private files
    const url = await getSignedUrl(
      s3,
      {
        Bucket: bucket,
        Key: filepath,
      },
      { expiresIn: 3600 } // 1 hour
    );

    return url;
  } catch (error) {
    logger.error('File upload error:', error);
    throw new ApiError(500, 'Failed to upload file');
  }
};

// Delete file from S3
export const deleteFile = async (filepath: string): Promise<void> => {
  try {
    await s3.deleteObject({
      Bucket: bucket,
      Key: filepath,
    });
  } catch (error) {
    logger.error('File deletion error:', error);
    throw new ApiError(500, 'Failed to delete file');
  }
};

// Get signed URL for file download
export const getFileUrl = async (
  filepath: string,
  expiresIn: number = 3600
): Promise<string> => {
  try {
    const url = await getSignedUrl(
      s3,
      {
        Bucket: bucket,
        Key: filepath,
      },
      { expiresIn }
    );

    return url;
  } catch (error) {
    logger.error('Get file URL error:', error);
    throw new ApiError(500, 'Failed to generate file URL');
  }
};

// Copy file within S3
export const copyFile = async (
  sourceFilepath: string,
  destinationFilepath: string
): Promise<void> => {
  try {
    await s3.copyObject({
      Bucket: bucket,
      CopySource: `${bucket}/${sourceFilepath}`,
      Key: destinationFilepath,
    });
  } catch (error) {
    logger.error('File copy error:', error);
    throw new ApiError(500, 'Failed to copy file');
  }
};

// Move file within S3
export const moveFile = async (
  sourceFilepath: string,
  destinationFilepath: string
): Promise<void> => {
  try {
    await copyFile(sourceFilepath, destinationFilepath);
    await deleteFile(sourceFilepath);
  } catch (error) {
    logger.error('File move error:', error);
    throw new ApiError(500, 'Failed to move file');
  }
};

// Check if file exists
export const fileExists = async (filepath: string): Promise<boolean> => {
  try {
    await s3.headObject({
      Bucket: bucket,
      Key: filepath,
    });
    return true;
  } catch (error: any) {
    if (error.name === 'NotFound') {
      return false;
    }
    logger.error('File check error:', error);
    throw new ApiError(500, 'Failed to check file existence');
  }
};

// Generate thumbnail
export const generateThumbnail = async (
  buffer: Buffer,
  options: {
    width?: number;
    height?: number;
    fit?: keyof sharp.FitEnum;
    format?: 'jpeg' | 'png' | 'webp';
    quality?: number;
  } = {}
): Promise<Buffer> => {
  try {
    const {
      width = 200,
      height = 200,
      fit = 'cover',
      format = 'jpeg',
      quality = 80,
    } = options;

    return await sharp(buffer)
      .resize({
        width,
        height,
        fit,
        withoutEnlargement: true,
      })
      [format]({ quality })
      .toBuffer();
  } catch (error) {
    logger.error('Thumbnail generation error:', error);
    throw new ApiError(500, 'Failed to generate thumbnail');
  }
};

// Upload multiple files
export const uploadFiles = async (
  files: Array<{
    filepath: string;
    buffer: Buffer;
    contentType?: string;
    isPublic?: boolean;
  }>
): Promise<string[]> => {
  try {
    return await Promise.all(
      files.map((file) =>
        uploadFile(file.filepath, file.buffer, {
          contentType: file.contentType,
          isPublic: file.isPublic,
        })
      )
    );
  } catch (error) {
    logger.error('Multiple files upload error:', error);
    throw new ApiError(500, 'Failed to upload files');
  }
};

export default {
  uploadFile,
  deleteFile,
  getFileUrl,
  copyFile,
  moveFile,
  fileExists,
  generateThumbnail,
  uploadFiles,
};