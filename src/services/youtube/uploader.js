const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

class YouTubeUploader {
  constructor(authClient) {
    this.authClient = authClient;
    this.youtube = google.youtube({
      version: 'v3',
      auth: this.authClient
    });
  }

  async uploadVideo(videoPath, metadata, progressCallback) {
    try {
      const fileSize = fs.statSync(videoPath).size;
      
      const requestMetadata = {
        snippet: {
          title: metadata.title || 'Untitled Video',
          description: metadata.description || '',
          tags: metadata.tags || [],
          categoryId: metadata.categoryId || '22', // Default to People & Vlogs
          defaultLanguage: metadata.language || 'de',
          defaultAudioLanguage: metadata.language || 'de'
        },
        status: {
          privacyStatus: metadata.privacy || 'private',
          embeddable: metadata.embeddable !== false,
          publicStatsViewable: metadata.publicStatsViewable !== false,
          selfDeclaredMadeForKids: metadata.madeForKids || false,
          license: metadata.license || 'youtube'
        }
      };

      // Handle scheduled publishing
      if (metadata.publishAt) {
        requestMetadata.status.publishAt = new Date(metadata.publishAt).toISOString();
      }

      // Create a resumable upload session
      const fileStream = fs.createReadStream(videoPath);
      
      const res = await this.youtube.videos.insert({
        part: 'snippet,status',
        requestBody: requestMetadata,
        media: {
          body: fileStream
        }
      }, {
        onUploadProgress: evt => {
          const progress = (evt.bytesRead / fileSize) * 100;
          if (progressCallback) {
            progressCallback({
              progress: Math.round(progress),
              bytesRead: evt.bytesRead,
              bytesTotal: fileSize,
              status: progress < 100 ? 'Uploading...' : 'Processing...',
              timeRemaining: `About ${Math.floor((100 - progress) / 10)} minutes left`
            });
          }
        }
      });

      return res.data;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }

  async setThumbnail(videoId, thumbnailPath) {
    try {
      const res = await this.youtube.thumbnails.set({
        videoId: videoId,
        media: {
          body: fs.createReadStream(thumbnailPath)
        }
      });

      return res.data;
    } catch (error) {
      console.error('Thumbnail error:', error);
      throw error;
    }
  }

  async getVideoCategories(regionCode = 'US') {
    try {
      const res = await this.youtube.videoCategories.list({
        part: 'snippet',
        regionCode: regionCode
      });

      return res.data.items;
    } catch (error) {
      console.error('Categories error:', error);
      throw error;
    }
  }

  async getMyPlaylists() {
    try {
      const res = await this.youtube.playlists.list({
        part: 'snippet',
        mine: true,
        maxResults: 50
      });

      return res.data.items;
    } catch (error) {
      console.error('Playlists error:', error);
      throw error;
    }
  }
}

module.exports = YouTubeUploader;