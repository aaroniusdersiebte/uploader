// src/services/upload/uploadManager.js
const { EventEmitter } = require('events');

class UploadManager extends EventEmitter {
  constructor(uploadServices = {}, schedulerService = null) {
    super();
    this.uploadServices = uploadServices; // Map of platform to upload service
    this.schedulerService = schedulerService; // Optional scheduler service
    this.activeUploads = new Map(); // Map of upload ID to upload info
  }

  /**
   * Add an upload service for a specific platform
   * @param {string} platform - Platform identifier (e.g., 'youtube', 'tiktok')
   * @param {Object} service - Upload service instance for this platform
   */
  addUploadService(platform, service) {
    this.uploadServices[platform] = service;
  }

  /**
   * Set the scheduler service
   * @param {Object} schedulerService - Scheduler service instance
   */
  setSchedulerService(schedulerService) {
    this.schedulerService = schedulerService;
  }

  /**
   * Start a global upload across multiple platforms
   * @param {Array} uploadRequests - Array of upload request objects
   * @returns {Promise<Array>} - Array of upload results
   */
  async startGlobalUpload(uploadRequests) {
    // Check if any request is scheduled for later
    const isScheduled = uploadRequests.some(request => 
      request.metadata && request.metadata.scheduledFor
    );
    
    if (isScheduled && this.schedulerService) {
      // Use scheduler service for scheduled uploads
      return this.schedulerService.scheduleMultipleUploads(uploadRequests);
    } else {
      // Process uploads now
      const results = [];
      
      for (const request of uploadRequests) {
        try {
          const result = await this.uploadToSinglePlatform(request);
          results.push(result);
        } catch (error) {
          console.error(`Error uploading to ${request.platform}:`, error);
          
          // Add failed result
          results.push({
            accountId: request.accountId,
            platform: request.platform,
            success: false,
            error: error.message
          });
          
          // Emit error event
          this.emit('upload-error', {
            accountId: request.accountId,
            platform: request.platform,
            error: error.message
          });
        }
      }
      
      return results;
    }
  }

  /**
   * Upload to a single platform
   * @param {Object} uploadRequest - Upload request object
   * @returns {Promise<Object>} - Upload result
   */
  async uploadToSinglePlatform(uploadRequest) {
    const { platform, accountId, videoPath, thumbnailPath, metadata } = uploadRequest;
    
    // Generate a unique upload ID
    const uploadId = `${platform}-${accountId}-${Date.now()}`;
    
    // Check if we have a service for this platform
    const uploadService = this.uploadServices[platform];
    if (!uploadService) {
      throw new Error(`No upload service found for platform: ${platform}`);
    }
    
    // Initialize upload tracking
    this.activeUploads.set(uploadId, {
      accountId,
      platform,
      videoPath,
      thumbnailPath,
      metadata,
      startTime: Date.now(),
      progress: 0,
      status: 'starting'
    });
    
    // Emit start event
    this.emit('upload-start', {
      uploadId,
      accountId,
      platform
    });
    
    try {
      // Start the upload process with progress tracking
      const result = await uploadService.uploadVideo(
        videoPath, 
        metadata,
        (progress) => {
          // Track progress
          const uploadInfo = this.activeUploads.get(uploadId);
          if (uploadInfo) {
            uploadInfo.progress = progress.progress || 0;
            uploadInfo.status = progress.status || 'uploading';
            this.activeUploads.set(uploadId, uploadInfo);
          }
          
          // Emit progress event
          this.emit('upload-progress', {
            uploadId,
            accountId,
            platform,
            ...progress
          });
        }
      );
      
      // Upload thumbnail if provided
      if (thumbnailPath && uploadService.setThumbnail) {
        await uploadService.setThumbnail(result.id, thumbnailPath);
      }
      
      // Mark as completed
      this.activeUploads.set(uploadId, {
        ...this.activeUploads.get(uploadId),
        progress: 100,
        status: 'completed',
        endTime: Date.now(),
        videoId: result.id
      });
      
      // Emit completion event
      this.emit('upload-complete', {
        uploadId,
        accountId,
        platform,
        videoId: result.id
      });
      
      return {
        uploadId,
        accountId,
        platform,
        success: true,
        videoId: result.id,
        url: this.getVideoUrl(platform, result.id)
      };
    } catch (error) {
      // Mark as failed
      this.activeUploads.set(uploadId, {
        ...this.activeUploads.get(uploadId),
        status: 'failed',
        endTime: Date.now(),
        error: error.message
      });
      
      // Emit error event
      this.emit('upload-error', {
        uploadId,
        accountId,
        platform,
        error: error.message
      });
      
      throw error;
    } finally {
      // Remove from active uploads after some time
      setTimeout(() => {
        this.activeUploads.delete(uploadId);
      }, 300000); // 5 minutes
    }
  }

  /**
   * Get the URL for a uploaded video
   * @param {string} platform - Platform identifier
   * @param {string} videoId - Video ID
   * @returns {string|null} - Video URL or null if platform is unknown
   */
  getVideoUrl(platform, videoId) {
    switch (platform) {
      case 'youtube':
        return `https://www.youtube.com/watch?v=${videoId}`;
      case 'tiktok':
        return `https://www.tiktok.com/@username/video/${videoId}`;
      case 'instagram':
        return `https://www.instagram.com/p/${videoId}/`;
      default:
        return null;
    }
  }

  /**
   * Get all active uploads
   * @returns {Array} - Array of active upload info objects
   */
  getActiveUploads() {
    return Array.from(this.activeUploads.values());
  }

  /**
   * Get info for a specific upload
   * @param {string} uploadId - Upload ID
   * @returns {Object|null} - Upload info or null if not found
   */
  getUploadInfo(uploadId) {
    return this.activeUploads.get(uploadId) || null;
  }

  /**
   * Cancel an active upload
   * @param {string} uploadId - Upload ID
   * @returns {boolean} - True if cancelled, false if not found or not cancellable
   */
  cancelUpload(uploadId) {
    const uploadInfo = this.activeUploads.get(uploadId);
    
    if (!uploadInfo) {
      return false; // Not found
    }
    
    if (uploadInfo.status === 'completed' || uploadInfo.status === 'failed') {
      return false; // Already finished
    }
    
    // Get the upload service
    const uploadService = this.uploadServices[uploadInfo.platform];
    
    if (!uploadService || !uploadService.cancelUpload) {
      return false; // No cancel method available
    }
    
    try {
      // Try to cancel the upload
      uploadService.cancelUpload(uploadId);
      
      // Mark as cancelled
      this.activeUploads.set(uploadId, {
        ...uploadInfo,
        status: 'cancelled',
        endTime: Date.now()
      });
      
      // Emit cancel event
      this.emit('upload-cancel', {
        uploadId,
        accountId: uploadInfo.accountId,
        platform: uploadInfo.platform
      });
      
      return true;
    } catch (error) {
      console.error(`Error cancelling upload ${uploadId}:`, error);
      return false;
    }
  }
}

module.exports = UploadManager;