import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

export interface UploadedFile {
  originalname: string;
  buffer: Buffer;
  mimetype: string;
}

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private supabase: any;
  private bucket: string;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    this.bucket = process.env.SUPABASE_BUCKET || 'restaurant-menu-images';

    if (!supabaseUrl || !supabaseKey) {
      this.logger.warn('Supabase credentials not configured. Image upload will be disabled.');
      return;
    }

    try {
      this.supabase = createClient(supabaseUrl, supabaseKey);
      this.logger.log('Supabase client initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Supabase client', error);
    }
  }

  async uploadImage(file: UploadedFile, folder: string = 'menu-items'): Promise<string> {
    if (!this.supabase) {
      throw new BadRequestException('Supabase is not configured');
    }

    // Sanitize filename
    const sanitizedFileName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${folder}/${Date.now()}-${sanitizedFileName}`;

    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucket)
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (error) {
        this.logger.error(`Image upload failed: ${error.message}`);
        throw new BadRequestException(`Image upload failed: ${error.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = this.supabase.storage
        .from(this.bucket)
        .getPublicUrl(fileName);

      this.logger.log(`Image uploaded successfully: ${fileName}`);
      return publicUrl;
    } catch (error) {
      this.logger.error('Image upload error', error);
      throw new BadRequestException('Image upload failed');
    }
  }

  async deleteImage(imageUrl: string): Promise<void> {
    if (!this.supabase) {
      this.logger.warn('Supabase is not configured. Cannot delete image.');
      return;
    }

    try {
      // Extract path from URL
      const url = new URL(imageUrl);
      const pathParts = url.pathname.split('/');
      const bucketIndex = pathParts.indexOf(this.bucket);

      if (bucketIndex === -1) {
        this.logger.warn(`Bucket name not found in URL: ${imageUrl}`);
        return;
      }

      const fileName = pathParts.slice(bucketIndex + 1).join('/');

      const { error } = await this.supabase.storage
        .from(this.bucket)
        .remove([fileName]);

      if (error) {
        this.logger.error(`Image deletion failed: ${error.message}`);
        throw new BadRequestException(`Image deletion failed: ${error.message}`);
      }

      this.logger.log(`Image deleted successfully: ${fileName}`);
    } catch (error) {
      this.logger.error('Image deletion error', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Image deletion failed');
    }
  }

  async listImages(folder: string = 'menu-items', limit: number = 100, offset: number = 0): Promise<{ files: Array<{ name: string; url: string; size: number }>, total: number }> {
    if (!this.supabase) {
      throw new BadRequestException('Supabase is not configured');
    }

    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucket)
        .list(folder, {
          limit,
          offset,
          sortBy: { column: 'created_at', order: 'desc' },
        });

      if (error) {
        this.logger.error(`Image list failed: ${error.message}`);
        throw new BadRequestException(`Image list failed: ${error.message}`);
      }

      // Get public URLs for each file, filtering out placeholder files
      const files = (data || [])
        .filter((file: any) => file.name !== '.emptyFolderPlaceholder' && !file.name.startsWith('.'))
        .map((file: any) => {
          const path = folder ? `${folder}/${file.name}` : file.name;
          const { data: { publicUrl } } = this.supabase.storage
            .from(this.bucket)
            .getPublicUrl(path);
          return {
            name: file.name,
            url: publicUrl,
            size: file.metadata?.size || 0,
          };
        });

      return {
        files,
        total: files.length,
      };
    } catch (error) {
      this.logger.error('Image list error', error);
      throw new BadRequestException('Failed to list images');
    }
  }

  isConfigured(): boolean {
    return !!this.supabase;
  }
}
