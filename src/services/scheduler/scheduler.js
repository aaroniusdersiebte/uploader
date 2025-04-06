// src/services/scheduler/scheduler.js
const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const { v4: uuidv4 } = require('uuid');

class SchedulerService {
  constructor(uploadServices = {}) {
    this.dbPath = path.join(app.getPath('userData'), 'scheduled-uploads.json');
    this.scheduledUploads = [];
    this.uploadServices = uploadServices; // Map of platform to upload service instance
    
    // Initialize database file
    this.initDb();
    
    // Load existing scheduled uploads
    this.loadScheduledUploads();
    
    // Start scheduling timer
    this.startScheduler();
  }

  initDb() {
    try {
      if (!fs.existsSync(this.dbPath)) {
        fs.writeFileSync(this.dbPath, JSON.stringify([], null, 2), 'utf8');
      }
    } catch (error) {
      console.error('Error initializing scheduler database:', error);
    }
  }

  loadScheduledUploads() {
    try {
      const data = fs.readFileSync(this.dbPath, 'utf8');
      this.scheduledUploads = JSON.parse(data);
    } catch (error) {
      console.error('Error loading scheduled uploads:', error);
      this.scheduledUploads = [];
    }
    
    // Sort by scheduled date (ascending)
    this.scheduledUploads.sort((a, b) => 
      new Date(a.scheduledFor) - new Date(b.scheduledFor)
    );
  }

  saveScheduledUploads() {
    try {
      fs.writeFileSync(this.dbPath, JSON.stringify(this.scheduledUploads, null, 2), 'utf8');
    } catch (error) {
      console.error('Error saving scheduled uploads:', error);
    }
  }

  startScheduler() {
    // Check for uploads that should be processed every minute
    this.schedulerInterval = setInterval(() => {
      this.processScheduledUploads();
    }, 60000); // 1 minute
    
    // Also check immediately on startup
    this.processScheduledUploads();
  }

  stopScheduler() {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
    }
  }

  async processScheduledUploads() {
    const now = new Date();
    
    // Find uploads that should be processed
    const uploadsToProcess = this.scheduledUploads.filter(upload => 
      upload.status === 'scheduled' && new Date(upload.scheduledFor) <= now
    );
    
    // Process each upload
    for (const upload of uploadsToProcess) {
      try {
        // Update status to processing
        this.updateUploadStatus(upload.id, 'processing');
        
        // Get the appropriate upload service for this platform
        const uploadService = this.uploadServices[upload.platform];
        
        if (!uploadService) {
          throw new Error(`No upload service found for platform: ${upload.platform}`);
        }
        
        // Start the upload process
        const result = await uploadService.uploadVideo(upload.videoPath, upload.metadata);
        
        // If there's a thumbnail, upload it as well
        if (upload.thumbnailPath && uploadService.setThumbnail) {
          await uploadService.setThumbnail(result.id, upload.thumbnailPath);
        }
        
        // Update with success status and video ID
        this.updateUploadStatus(upload.id, 'completed', result.id);
      } catch (error) {
        console.error(`Error processing scheduled upload ${upload.id}:`, error);
        this.updateUploadStatus(upload.id, 'failed', null, error.message);
      }
    }
  }

  updateUploadStatus(id, status, videoId = null, errorMessage = null) {
    const upload = this.scheduledUploads.find(u => u.id === id);
    
    if (upload) {
      upload.status = status;
      upload.processedAt = new Date().toISOString();
      
      if (videoId) {
        upload.videoId = videoId;
      }
      
      if (errorMessage) {
        upload.errorMessage = errorMessage;
      }
      
      this.saveScheduledUploads();
    }
  }

  // Add a new scheduled upload
  async scheduleUpload(uploadRequest) {
    const { 
      platform, 
      accountId, 
      videoPath, 
      thumbnailPath, 
      metadata, 
      scheduledFor 
    } = uploadRequest;
    
    // Generate a unique ID for this upload
    const id = uuidv4();
    
    // Create the scheduled upload object
    const scheduledUpload = {
      id,
      platform,
      accountId,
      videoPath,
      thumbnailPath,
      metadata,
      scheduledFor: scheduledFor || new Date().toISOString(),
      status: 'scheduled',
      createdAt: new Date().toISOString()
    };
    
    // Add to the list of scheduled uploads
    this.scheduledUploads.push(scheduledUpload);
    
    // Sort the list by scheduled date
    this.scheduledUploads.sort((a, b) => 
      new Date(a.scheduledFor) - new Date(b.scheduledFor)
    );
    
    // Save to database
    this.saveScheduledUploads();
    
    return scheduledUpload;
  }

  // Schedule multiple uploads (e.g., for global upload)
  async scheduleMultipleUploads(uploadRequests) {
    const results = [];
    
    for (const request of uploadRequests) {
      const result = await this.scheduleUpload(request);
      results.push(result);
    }
    
    return results;
  }

  // Delete a scheduled upload
  deleteScheduledUpload(id) {
    const index = this.scheduledUploads.findIndex(upload => upload.id === id);
    
    if (index !== -1) {
      // Remove from the list
      this.scheduledUploads.splice(index, 1);
      
      // Save to database
      this.saveScheduledUploads();
      
      return true;
    }
    
    return false;
  }

  // Update a scheduled upload
  updateScheduledUpload(id, updates) {
    const upload = this.scheduledUploads.find(u => u.id === id);
    
    if (upload) {
      // Apply updates
      Object.assign(upload, {
        ...updates,
        updatedAt: new Date().toISOString()
      });
      
      // Re-sort if the scheduled time changed
      if (updates.scheduledFor) {
        this.scheduledUploads.sort((a, b) => 
          new Date(a.scheduledFor) - new Date(b.scheduledFor)
        );
      }
      
      // Save to database
      this.saveScheduledUploads();
      
      return upload;
    }
    
    return null;
  }

  // Get all scheduled uploads
  getScheduledUploads() {
    return [...this.scheduledUploads];
  }

  // Get scheduled uploads for a specific platform
  getScheduledUploadsForPlatform(platform) {
    return this.scheduledUploads.filter(upload => upload.platform === platform);
  }

  // Get scheduled uploads for a specific account
  getScheduledUploadsForAccount(accountId) {
    return this.scheduledUploads.filter(upload => upload.accountId === accountId);
  }

  // Get a specific scheduled upload by ID
  getScheduledUpload(id) {
    return this.scheduledUploads.find(upload => upload.id === id);
  }

  // Process a scheduled upload immediately
  async processScheduledUploadNow(id) {
    const upload = this.scheduledUploads.find(u => u.id === id);
    
    if (!upload) {
      throw new Error(`Scheduled upload with ID ${id} not found`);
    }
    
    try {
      // Update status to processing
      this.updateUploadStatus(id, 'processing');
      
      // Get the appropriate upload service
      const uploadService = this.uploadServices[upload.platform];
      
      if (!uploadService) {
        throw new Error(`No upload service found for platform: ${upload.platform}`);
      }
      
      // Start the upload process
      const result = await uploadService.uploadVideo(upload.videoPath, upload.metadata);
      
      // If there's a thumbnail, upload it as well
      if (upload.thumbnailPath && uploadService.setThumbnail) {
        await uploadService.setThumbnail(result.id, upload.thumbnailPath);
      }
      
      // Update with success status and video ID
      this.updateUploadStatus(id, 'completed', result.id);
      
      return { success: true, videoId: result.id };
    } catch (error) {
      console.error(`Error processing scheduled upload ${id}:`, error);
      this.updateUploadStatus(id, 'failed', null, error.message);
      throw error;
    }
  }
}

module.exports = SchedulerService;