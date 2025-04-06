// src/renderer/components/GlobalUploadForm.js
class GlobalUploadForm {
    constructor(containerId) {
      this.container = document.getElementById(containerId);
      this.videoFile = null;
      this.thumbnailFile = null;
      this.accounts = []; // Will store available accounts across platforms
      this.selectedAccounts = []; // Will track which accounts are selected for upload
      this.isScheduling = false;
      this.scheduledDateTime = null;
      this.uploadInProgress = false;
      this.init();
    }
  
    init() {
      this.loadAccounts().then(() => {
        this.render();
        this.attachEventListeners();
        this.applyUrlParams();
      });
    }
  
    render() {
      if (!this.container) return;
  
      this.container.innerHTML = `
        <div class="global-upload-form">
          <h2>Global Video Upload</h2>
          
          <div class="form-section">
            <h3>1. Video Selection</h3>
            <div class="file-drop-area" id="video-drop-area">
              <div class="file-message">Drag video here or</div>
              <button id="select-video-btn" class="secondary-button">Select Video</button>
              <div id="selected-video-info" class="selected-file-info"></div>
            </div>
          </div>
          
          <div class="form-section">
            <h3>2. Video Details</h3>
            <div class="form-group">
              <label for="global-video-title">Title*</label>
              <input type="text" id="global-video-title" class="form-control" placeholder="Enter a title for your video" required>
            </div>
            
            <div class="form-group">
              <label for="global-video-description">Description</label>
              <textarea id="global-video-description" class="form-control" rows="4" placeholder="Describe your video"></textarea>
            </div>
            
            <div class="form-group">
              <label for="global-video-tags">Tags (comma separated)</label>
              <input type="text" id="global-video-tags" class="form-control" placeholder="tag1, tag2, tag3">
            </div>
          </div>
          
          <div class="form-section">
            <h3>3. Thumbnail</h3>
            <div class="thumbnail-section">
              <div class="thumbnail-preview" id="thumbnail-preview">
                <div class="thumbnail-placeholder">No preview</div>
              </div>
              <button id="select-thumbnail-btn" class="secondary-button">Select Thumbnail</button>
            </div>
          </div>
          
          <div class="form-section">
            <h3>4. Platform Selection</h3>
            <div class="platform-selection">
              ${this.renderPlatformAccounts()}
            </div>
          </div>
          
          <div class="form-section schedule-section">
            <h3>5. Upload Schedule</h3>
            <div class="form-group schedule-options">
              <label class="radio-label">
                <input type="radio" name="upload-timing" value="now" checked> 
                Upload now
              </label>
              <label class="radio-label">
                <input type="radio" name="upload-timing" value="scheduled"> 
                Schedule for later
              </label>
            </div>
            
            <div class="schedule-datetime hidden" id="schedule-datetime-container">
              <div class="form-group">
                <label for="schedule-date">Date</label>
                <input type="date" id="schedule-date" class="form-control" min="${this.getMinDate()}">
              </div>
              <div class="form-group">
                <label for="schedule-time">Time</label>
                <input type="time" id="schedule-time" class="form-control">
              </div>
            </div>
          </div>
          
          <div id="platform-details-container" class="form-section hidden">
            <h3>Platform-Specific Details</h3>
            <div class="platform-tabs" id="platform-tabs">
              <!-- Tabs will be added dynamically -->
            </div>
            
            <div class="platform-tab-content" id="platform-tab-content">
              <!-- Tab content will be added dynamically -->
            </div>
          </div>
          
          <div class="form-actions">
            <button id="cancel-upload-btn" class="cancel-button">Cancel</button>
            <button id="start-global-upload-btn" class="primary-button" disabled>Start Upload</button>
          </div>
        </div>
      `;
    }
  
    renderPlatformAccounts() {
      const platforms = {
        youtube: { name: 'YouTube', icon: '🎬' },
        tiktok: { name: 'TikTok', icon: '📱' },
        instagram: { name: 'Instagram', icon: '📷' }
      };
      
      // Group accounts by platform
      const accountsByPlatform = this.accounts.reduce((acc, account) => {
        if (!acc[account.platform]) {
          acc[account.platform] = [];
        }
        acc[account.platform].push(account);
        return acc;
      }, {});
      
      let html = '<div class="platform-accounts">';
      
      Object.keys(platforms).forEach(platform => {
        const platformAccounts = accountsByPlatform[platform] || [];
        
        html += `
          <div class="platform-section">
            <div class="platform-header">
              <div class="platform-icon">${platforms[platform].icon}</div>
              <h4>${platforms[platform].name}</h4>
            </div>
            
            <div class="account-list">
              ${platformAccounts.length > 0 ? 
                platformAccounts.map(account => `
                  <div class="account-item">
                    <label class="account-checkbox">
                      <input type="checkbox" class="account-select" data-account-id="${account.id}" data-platform="${platform}">
                      <span class="account-name">${account.name}</span>
                    </label>
                  </div>
                `).join('') : 
                `<div class="no-accounts">No ${platforms[platform].name} accounts connected. <a href="#settings">Connect account</a></div>`
              }
            </div>
          </div>
        `;
      });
      
      html += '</div>';
      return html;
    }
  
    renderPlatformTabs() {
      const tabsContainer = document.getElementById('platform-tabs');
      const contentContainer = document.getElementById('platform-tab-content');
      
      if (!tabsContainer || !contentContainer) return;
      
      tabsContainer.innerHTML = '';
      contentContainer.innerHTML = '';
      
      // Only show tabs for selected accounts
      const selectedPlatforms = [...new Set(this.selectedAccounts.map(account => account.platform))];
      
      if (selectedPlatforms.length === 0) {
        document.getElementById('platform-details-container').classList.add('hidden');
        return;
      }
      
      document.getElementById('platform-details-container').classList.remove('hidden');
      
      // Create tabs
      selectedPlatforms.forEach((platform, index) => {
        const isActive = index === 0;
        const tab = document.createElement('div');
        tab.className = `platform-tab ${isActive ? 'active' : ''}`;
        tab.dataset.platform = platform;
        tab.innerHTML = `
          <div class="platform-icon">${this.getPlatformIcon(platform)}</div>
          <span>${this.getPlatformName(platform)}</span>
        `;
        tabsContainer.appendChild(tab);
        
        // Create tab content
        const content = document.createElement('div');
        content.className = `platform-content ${isActive ? 'active' : ''}`;
        content.dataset.platform = platform;
        content.innerHTML = this.getPlatformSpecificContent(platform);
        contentContainer.appendChild(content);
        
        // Add event listener
        tab.addEventListener('click', () => {
          // Deactivate all tabs and content
          document.querySelectorAll('.platform-tab').forEach(t => t.classList.remove('active'));
          document.querySelectorAll('.platform-content').forEach(c => c.classList.remove('active'));
          
          // Activate this tab and content
          tab.classList.add('active');
          content.classList.add('active');
        });
      });
    }
  
    getPlatformSpecificContent(platform) {
      // Get selected accounts for this platform
      const platformAccounts = this.selectedAccounts.filter(account => account.platform === platform);
      
      // Create account tabs if multiple accounts are selected for this platform
      let accountTabsHtml = '';
      if (platformAccounts.length > 1) {
        accountTabsHtml = `
          <div class="account-tabs">
            ${platformAccounts.map((account, index) => `
              <div class="account-tab ${index === 0 ? 'active' : ''}" data-account-id="${account.id}">
                ${account.name}
              </div>
            `).join('')}
          </div>
        `;
      }
      
      // Platform-specific fields
      let fieldsHtml = '';
      
      switch (platform) {
        case 'youtube':
          fieldsHtml = `
            <div class="form-group">
              <label for="youtube-category">Category</label>
              <select id="youtube-category" class="form-control">
                <option value="1">Film & Animation</option>
                <option value="2">Autos & Vehicles</option>
                <option value="10">Music</option>
                <option value="15">Pets & Animals</option>
                <option value="17">Sports</option>
                <option value="20">Gaming</option>
                <option value="22" selected>People & Blogs</option>
                <option value="23">Comedy</option>
                <option value="24">Entertainment</option>
                <option value="25">News & Politics</option>
                <option value="26">Howto & Style</option>
                <option value="27">Education</option>
                <option value="28">Science & Technology</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="youtube-privacy">Privacy</label>
              <select id="youtube-privacy" class="form-control">
                <option value="private">Private</option>
                <option value="unlisted">Unlisted</option>
                <option value="public">Public</option>
              </select>
            </div>
            
            <div class="form-group checkbox-group">
              <label>
                <input type="checkbox" id="youtube-made-for-kids" name="youtube-made-for-kids">
                This video is made for kids
              </label>
            </div>
            
            <div class="form-group checkbox-group">
              <label>
                <input type="checkbox" id="youtube-allow-comments" name="youtube-allow-comments" checked>
                Allow comments
              </label>
            </div>
          `;
          break;
          
        case 'tiktok':
          fieldsHtml = `
            <div class="form-group">
              <label for="tiktok-privacy">Privacy</label>
              <select id="tiktok-privacy" class="form-control">
                <option value="private">Private</option>
                <option value="friends">Friends</option>
                <option value="public" selected>Public</option>
              </select>
            </div>
            
            <div class="form-group checkbox-group">
              <label>
                <input type="checkbox" id="tiktok-comments-allowed" name="tiktok-comments-allowed" checked>
                Allow comments
              </label>
            </div>
            
            <div class="form-group checkbox-group">
              <label>
                <input type="checkbox" id="tiktok-duet-allowed" name="tiktok-duet-allowed" checked>
                Allow duets
              </label>
            </div>
            
            <div class="form-group checkbox-group">
              <label>
                <input type="checkbox" id="tiktok-stitch-allowed" name="tiktok-stitch-allowed" checked>
                Allow stitches
              </label>
            </div>
          `;
          break;
          
        case 'instagram':
          fieldsHtml = `
            <div class="form-group">
              <label for="instagram-content-type">Content Type</label>
              <select id="instagram-content-type" class="form-control">
                <option value="reel" selected>Reel</option>
                <option value="post">Post</option>
                <option value="story">Story</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="instagram-location">Location</label>
              <input type="text" id="instagram-location" class="form-control" placeholder="Add location (optional)">
            </div>
            
            <div class="form-group checkbox-group">
              <label>
                <input type="checkbox" id="instagram-share-to-feed" name="instagram-share-to-feed" checked>
                Share to feed (for Reels)
              </label>
            </div>
          `;
          break;
      }
      
      return `
        ${accountTabsHtml}
        <div class="platform-fields">
          <div class="form-group">
            <label for="${platform}-title">Title</label>
            <div class="input-with-action">
              <input type="text" id="${platform}-title" class="form-control platform-title" placeholder="Use global title">
              <button class="use-global-btn" data-target="${platform}-title">Use Global</button>
            </div>
          </div>
          
          <div class="form-group">
            <label for="${platform}-description">Description</label>
            <div class="input-with-action">
              <textarea id="${platform}-description" class="form-control platform-description" rows="3" placeholder="Use global description"></textarea>
              <button class="use-global-btn" data-target="${platform}-description">Use Global</button>
            </div>
          </div>
          
          <div class="form-group">
            <label for="${platform}-tags">Tags</label>
            <div class="input-with-action">
              <input type="text" id="${platform}-tags" class="form-control platform-tags" placeholder="Use global tags">
              <button class="use-global-btn" data-target="${platform}-tags">Use Global</button>
            </div>
          </div>
          
          ${fieldsHtml}
        </div>
      `;
    }
  
    attachEventListeners() {
      // Video selection
      const selectVideoBtn = document.getElementById('select-video-btn');
      if (selectVideoBtn) {
        selectVideoBtn.addEventListener('click', () => this.selectVideo());
      }
      
      // Video drop area
      const videoDropArea = document.getElementById('video-drop-area');
      if (videoDropArea) {
        videoDropArea.addEventListener('dragover', e => {
          e.preventDefault();
          e.stopPropagation();
          videoDropArea.classList.add('drag-over');
        });
        
        videoDropArea.addEventListener('dragleave', e => {
          e.preventDefault();
          e.stopPropagation();
          videoDropArea.classList.remove('drag-over');
        });
        
        videoDropArea.addEventListener('drop', e => {
          e.preventDefault();
          e.stopPropagation();
          videoDropArea.classList.remove('drag-over');
          
          if (e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            if (file.type.startsWith('video/')) {
              this.handleSelectedVideo({
                name: file.name,
                path: file.path,
                size: this.formatFileSize(file.size),
                type: file.type
              });
            }
          }
        });
      }
      
      // Thumbnail selection
      const selectThumbnailBtn = document.getElementById('select-thumbnail-btn');
      if (selectThumbnailBtn) {
        selectThumbnailBtn.addEventListener('click', () => this.selectThumbnail());
      }
      
      // Account selection
      const accountCheckboxes = document.querySelectorAll('.account-select');
      if (accountCheckboxes.length) {
        accountCheckboxes.forEach(checkbox => {
          checkbox.addEventListener('change', () => this.handleAccountSelection());
        });
      }
      
      // Schedule options
      const uploadTimingRadios = document.querySelectorAll('input[name="upload-timing"]');
      if (uploadTimingRadios.length) {
        uploadTimingRadios.forEach(radio => {
          radio.addEventListener('change', () => {
            const scheduleDateTimeContainer = document.getElementById('schedule-datetime-container');
            if (scheduleDateTimeContainer) {
              if (radio.value === 'scheduled') {
                scheduleDateTimeContainer.classList.remove('hidden');
                this.isScheduling = true;
              } else {
                scheduleDateTimeContainer.classList.add('hidden');
                this.isScheduling = false;
              }
            }
          });
        });
      }
      
      // Global buttons for platform specific fields
      const useGlobalBtns = document.querySelectorAll('.use-global-btn');
      if (useGlobalBtns.length) {
        useGlobalBtns.forEach(btn => {
          btn.addEventListener('click', () => {
            const targetId = btn.dataset.target;
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
              if (targetId.includes('title')) {
                targetElement.value = document.getElementById('global-video-title').value;
              } else if (targetId.includes('description')) {
                targetElement.value = document.getElementById('global-video-description').value;
              } else if (targetId.includes('tags')) {
                targetElement.value = document.getElementById('global-video-tags').value;
              }
            }
          });
        });
      }
      
      // Upload button
      const startUploadBtn = document.getElementById('start-global-upload-btn');
      if (startUploadBtn) {
        startUploadBtn.addEventListener('click', () => this.startGlobalUpload());
      }
      
      // Cancel button
      const cancelUploadBtn = document.getElementById('cancel-upload-btn');
      if (cancelUploadBtn) {
        cancelUploadBtn.addEventListener('click', () => {
          // Navigate back to dashboard
          window.location.hash = '#dashboard';
        });
      }
      
      // Title input to enable/disable upload button
      const titleInput = document.getElementById('global-video-title');
      if (titleInput && startUploadBtn) {
        titleInput.addEventListener('input', () => {
          this.updateUploadButtonState();
        });
      }
    }
  
    applyUrlParams() {
      // Check if we're opening the form for scheduling
      const urlParams = new URLSearchParams(window.location.hash.split('?')[1]);
      
      if (urlParams.has('schedule') && urlParams.get('schedule') === 'true') {
        // Set scheduling mode
        const scheduledRadio = document.querySelector('input[name="upload-timing"][value="scheduled"]');
        if (scheduledRadio) {
          scheduledRadio.checked = true;
          
          const scheduleDateTimeContainer = document.getElementById('schedule-datetime-container');
          if (scheduleDateTimeContainer) {
            scheduleDateTimeContainer.classList.remove('hidden');
            this.isScheduling = true;
          }
        }
        
        // Set date/time if provided
        if (urlParams.has('date')) {
          try {
            const date = new Date(urlParams.get('date'));
            
            const dateInput = document.getElementById('schedule-date');
            if (dateInput) {
              dateInput.value = date.toISOString().split('T')[0];
            }
            
            const timeInput = document.getElementById('schedule-time');
            if (timeInput) {
              timeInput.value = date.toTimeString().slice(0, 5);
            }
            
            this.scheduledDateTime = date;
          } catch (error) {
            console.error('Error parsing date from URL:', error);
          }
        }
      }
    }
  
    async selectVideo() {
      try {
        if (window.youtube && window.youtube.selectVideo) {
          const result = await window.youtube.selectVideo();
          
          if (!result.canceled) {
            this.handleSelectedVideo({
              name: result.fileName,
              path: result.filePath,
              size: result.fileSize || 'Unknown size',
              type: result.fileType || 'video/*'
            });
          }
        } else {
          alert('Video selection not available');
        }
      } catch (error) {
        console.error('Error selecting video:', error);
        alert('Error selecting video: ' + error.message);
      }
    }
  
    handleSelectedVideo(videoInfo) {
      this.videoFile = videoInfo;
      
      const fileInfo = document.getElementById('selected-video-info');
      if (fileInfo) {
        fileInfo.innerHTML = `
          <div class="file-icon">📹</div>
          <div class="file-details">
            <div class="file-name">${videoInfo.name}</div>
            <div class="file-meta">
              ${videoInfo.size || ''} 
              ${videoInfo.duration ? '• ' + videoInfo.duration : ''}
            </div>
          </div>
        `;
      }
      
      this.updateUploadButtonState();
    }
  
    async selectThumbnail() {
      try {
        if (window.youtube && window.youtube.selectThumbnail) {
          const result = await window.youtube.selectThumbnail();
          
          if (!result.canceled) {
            this.thumbnailFile = {
              name: result.fileName,
              path: result.filePath
            };
            
            const thumbnailPreview = document.getElementById('thumbnail-preview');
            if (thumbnailPreview) {
              thumbnailPreview.innerHTML = `
                <div class="thumbnail-img">
                  <div class="placeholder-thumbnail" style="background-color: var(--accent-color);">
                    <span>Thumbnail: ${this.thumbnailFile.name}</span>
                  </div>
                </div>
              `;
            }
          }
        } else {
          alert('Thumbnail selection not available');
        }
      } catch (error) {
        console.error('Error selecting thumbnail:', error);
        alert('Error selecting thumbnail: ' + error.message);
      }
    }
  
    handleAccountSelection() {
      this.selectedAccounts = [];
      
      document.querySelectorAll('.account-select:checked').forEach(checkbox => {
        const accountId = checkbox.dataset.accountId;
        const platform = checkbox.dataset.platform;
        
        const account = this.accounts.find(a => a.id === accountId);
        if (account) {
          this.selectedAccounts.push(account);
        }
      });
      
      this.renderPlatformTabs();
      this.updateUploadButtonState();
    }
  
    updateUploadButtonState() {
      const startUploadBtn = document.getElementById('start-global-upload-btn');
      if (startUploadBtn) {
        const hasVideo = this.videoFile !== null;
        const hasTitle = document.getElementById('global-video-title')?.value.trim() !== '';
        const hasAccounts = this.selectedAccounts.length > 0;
        
        startUploadBtn.disabled = !(hasVideo && hasTitle && hasAccounts);
      }
    }
  
    async startGlobalUpload() {
      if (!this.videoFile) {
        alert('Please select a video to upload');
        return;
      }
      
      if (!document.getElementById('global-video-title')?.value.trim()) {
        alert('Please enter a title for your video');
        return;
      }
      
      if (this.selectedAccounts.length === 0) {
        alert('Please select at least one account to upload to');
        return;
      }
      
      if (this.isScheduling) {
        // Validate schedule date/time
        const dateInput = document.getElementById('schedule-date');
        const timeInput = document.getElementById('schedule-time');
        
        if (!dateInput?.value || !timeInput?.value) {
          alert('Please select a date and time for scheduling');
          return;
        }
        
        const scheduledDateTime = new Date(`${dateInput.value}T${timeInput.value}`);
        if (isNaN(scheduledDateTime) || scheduledDateTime <= new Date()) {
          alert('Please select a future date and time');
          return;
        }
        
        this.scheduledDateTime = scheduledDateTime;
      }
      
      // Collect global metadata
      const globalMetadata = {
        title: document.getElementById('global-video-title').value,
        description: document.getElementById('global-video-description').value,
        tags: document.getElementById('global-video-tags').value.split(',').map(tag => tag.trim()).filter(Boolean),
        scheduledFor: this.isScheduling ? this.scheduledDateTime.toISOString() : null
      };
      
      // Collect platform-specific metadata for each selected account
      const uploadRequests = this.selectedAccounts.map(account => {
        const platform = account.platform;
        
        const platformMetadata = {
          title: document.getElementById(`${platform}-title`)?.value || globalMetadata.title,
          description: document.getElementById(`${platform}-description`)?.value || globalMetadata.description,
          tags: (document.getElementById(`${platform}-tags`)?.value || globalMetadata.tags.join(', ')).split(',').map(tag => tag.trim()).filter(Boolean)
        };
        
        // Add platform-specific fields
        switch (platform) {
          case 'youtube':
            platformMetadata.categoryId = document.getElementById('youtube-category')?.value || '22';
            platformMetadata.privacy = document.getElementById('youtube-privacy')?.value || 'private';
            platformMetadata.madeForKids = document.getElementById('youtube-made-for-kids')?.checked || false;
            platformMetadata.allowComments = document.getElementById('youtube-allow-comments')?.checked || true;
            break;
            
          case 'tiktok':
            platformMetadata.privacy = document.getElementById('tiktok-privacy')?.value || 'public';
            platformMetadata.commentsAllowed = document.getElementById('tiktok-comments-allowed')?.checked || true;
            platformMetadata.duetAllowed = document.getElementById('tiktok-duet-allowed')?.checked || true;
            platformMetadata.stitchAllowed = document.getElementById('tiktok-stitch-allowed')?.checked || true;
            break;
            
          case 'instagram':
            platformMetadata.contentType = document.getElementById('instagram-content-type')?.value || 'reel';
            platformMetadata.location = document.getElementById('instagram-location')?.value || '';
            platformMetadata.shareToFeed = document.getElementById('instagram-share-to-feed')?.checked || true;
            break;
        }
        
        return {
          accountId: account.id,
          platform: account.platform,
          videoPath: this.videoFile.path,
          thumbnailPath: this.thumbnailFile?.path,
          metadata: platformMetadata
        };
      });
      
      // Start the upload process
      this.uploadInProgress = true;
      this.showUploadOverlay(uploadRequests);
      
      try {
        // In a real app, this would be a call to a multi-platform upload service
        if (window.uploadManager && window.uploadManager.startGlobalUpload) {
          await window.uploadManager.startGlobalUpload(uploadRequests);
        } else {
          // Mock implementation for testing UI
          for (let i = 0; i < uploadRequests.length; i++) {
            const request = uploadRequests[i];
            
            // Update progress in the overlay
            this.updateUploadProgress({
              accountId: request.accountId,
              progress: 0,
              status: 'Starting upload...'
            });
            
            // Simulate upload process
            for (let progress = 0; progress <= 100; progress += 5) {
              await new Promise(resolve => setTimeout(resolve, 200));
              
              this.updateUploadProgress({
                accountId: request.accountId,
                progress: progress,
                status: progress < 100 ? 'Uploading...' : 'Processing...',
                timeRemaining: progress < 100 ? `Approx. ${Math.round((100 - progress) / 10)} seconds left` : ''
              });
            }
            
            // Simulate processing time
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            this.updateUploadProgress({
              accountId: request.accountId,
              progress: 100,
              status: 'Completed',
              videoId: 'mock-video-id-' + Date.now()
            });
          }
        }
        
        // When all uploads are complete
        setTimeout(() => {
          this.handleUploadSuccess(uploadRequests);
        }, 1000);
      } catch (error) {
        console.error('Error during global upload:', error);
        this.handleUploadError(error.message);
      }
    }
  
    showUploadOverlay(uploadRequests) {
      // Create overlay element
      const overlay = document.createElement('div');
      overlay.className = 'upload-overlay';
      overlay.id = 'upload-overlay';
      
      let uploadItemsHtml = '';
      uploadRequests.forEach(request => {
        const account = this.accounts.find(a => a.id === request.accountId);
        
        uploadItemsHtml += `
          <div class="upload-status-item" data-account-id="${request.accountId}">
            <div class="upload-status-platform">
              <div class="platform-icon">${this.getPlatformIcon(request.platform)}</div>
              <div class="platform-account">${account ? account.name : 'Unknown Account'}</div>
            </div>
            
            <div class="upload-status-progress">
              <div class="progress-bar">
                <div class="progress-fill" style="width: 0%"></div>
              </div>
              <div class="progress-text">Starting...</div>
            </div>
            
            <div class="upload-status-info">
              <div class="status-message">Preparing upload...</div>
              <div class="status-time"></div>
            </div>
          </div>
        `;
      });
      
      overlay.innerHTML = `
        <div class="overlay-container">
          <div class="overlay-close" id="overlay-close">×</div>
          <h2>${this.isScheduling ? 'Scheduling Uploads' : 'Uploading to Platforms'}</h2>
          
          <div class="upload-status-list">
            ${uploadItemsHtml}
          </div>
        </div>
      `;
      
      document.body.appendChild(overlay);
      
      // "X" to close
      const closeBtn = document.getElementById('overlay-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          if (confirm('Are you sure you want to cancel the uploads?')) {
            this.cancelUpload();
          }
        });
      }
    }
  
    updateUploadProgress(progress) {
      const { accountId, progress: percent, status, timeRemaining, videoId } = progress;
      
      const statusItem = document.querySelector(`.upload-status-item[data-account-id="${accountId}"]`);
      if (!statusItem) return;
      
      const progressFill = statusItem.querySelector('.progress-fill');
      const progressText = statusItem.querySelector('.progress-text');
      const statusMessage = statusItem.querySelector('.status-message');
      const statusTime = statusItem.querySelector('.status-time');
      
      if (progressFill) {
        progressFill.style.width = `${percent}%`;
      }
      
      if (progressText) {
        progressText.textContent = `${percent}%`;
      }
      
      if (statusMessage && status) {
        statusMessage.textContent = status;
        
        if (videoId && status === 'Completed') {
          statusMessage.innerHTML = `Completed. <a href="#" class="view-video-link" data-video-id="${videoId}">View video</a>`;
          
          // Add click event to the view link
          const viewLink = statusMessage.querySelector('.view-video-link');
          if (viewLink) {
            viewLink.addEventListener('click', (e) => {
              e.preventDefault();
              const platform = this.accounts.find(a => a.id === accountId)?.platform;
              this.openVideoInBrowser(videoId, platform);
            });
          }
        }
      }
      
      if (statusTime) {
        statusTime.textContent = timeRemaining || '';
      }
    }
  
    handleUploadSuccess(uploadRequests) {
      const overlay = document.getElementById('upload-overlay');
      if (!overlay) return;
      
      const overlayContainer = overlay.querySelector('.overlay-container');
      if (!overlayContainer) return;
      
      const allCompleted = document.querySelectorAll('.upload-status-item').length === uploadRequests.length;
      
      overlayContainer.innerHTML = `
        <h2>Upload ${this.isScheduling ? 'Scheduling' : 'Process'} Complete</h2>
        <div class="success-animation">
          <div class="success-checkmark">✓</div>
        </div>
        <p>
          ${this.isScheduling ? 
            `Your videos have been scheduled for upload at the specified time.` : 
            `Your videos have been successfully uploaded to all selected platforms.`
          }
        </p>
        <div class="success-actions">
          <button id="view-schedule-btn" class="secondary-button">View Schedule</button>
          <button id="success-close" class="primary-button">Done</button>
        </div>
      `;
      
      // Add event listeners
      const viewScheduleBtn = document.getElementById('view-schedule-btn');
      const successCloseBtn = document.getElementById('success-close');
      
      if (viewScheduleBtn) {
        viewScheduleBtn.addEventListener('click', () => {
          // Navigate to schedule page
          window.location.hash = '#schedule';
          overlay.remove();
        });
      }
      
      if (successCloseBtn) {
        successCloseBtn.addEventListener('click', () => {
          // Navigate back to dashboard
          window.location.hash = '#dashboard';
          overlay.remove();
        });
      }
      
      this.uploadInProgress = false;
    }
  
    handleUploadError(errorMessage) {
      const overlay = document.getElementById('upload-overlay');
      if (!overlay) return;
      
      const overlayContainer = overlay.querySelector('.overlay-container');
      if (!overlayContainer) return;
      
      overlayContainer.innerHTML = `
        <h2>Upload Failed</h2>
        <div class="error-animation">
          <div class="error-icon">!</div>
        </div>
        <p>An error occurred during the upload process:</p>
        <div class="error-message">${errorMessage}</div>
        <div class="error-actions">
          <button id="try-again-btn" class="primary-button">Try Again</button>
          <button id="error-close" class="secondary-button">Cancel</button>
        </div>
      `;
      
      // Add event listeners
      const tryAgainBtn = document.getElementById('try-again-btn');
      const errorCloseBtn = document.getElementById('error-close');
      
      if (tryAgainBtn) {
        tryAgainBtn.addEventListener('click', () => {
          overlay.remove();
          this.startGlobalUpload();
        });
      }
      
      if (errorCloseBtn) {
        errorCloseBtn.addEventListener('click', () => {
          overlay.remove();
        });
      }
      
      this.uploadInProgress = false;
    }
  
    cancelUpload() {
      const overlay = document.getElementById('upload-overlay');
      if (overlay) {
        overlay.remove();
      }
      
      // In a real app, you would also need to cancel the actual upload process
      // through the backend service
      
      this.uploadInProgress = false;
    }
  
    openVideoInBrowser(videoId, platform) {
      let url;
      
      switch (platform) {
        case 'youtube':
          url = `https://www.youtube.com/watch?v=${videoId}`;
          break;
        case 'tiktok':
          url = `https://www.tiktok.com/@username/video/${videoId}`;
          break;
        case 'instagram':
          url = `https://www.instagram.com/p/${videoId}/`;
          break;
        default:
          return;
      }
      
      // In a real app, you would open the URL in the default browser
      if (window.shell && window.shell.openExternal) {
        window.shell.openExternal(url);
      } else {
        // Fallback for browser-based testing
        window.open(url, '_blank');
      }
    }
  
    async loadAccounts() {
      try {
        // In a real app, this would be an API call to get the user's accounts
        if (window.accountManager && window.accountManager.getAccounts) {
          this.accounts = await window.accountManager.getAccounts();
        } else {
          // Mock data for testing
          this.accounts = [
            {
              id: 'youtube1',
              platform: 'youtube',
              name: 'My YouTube Channel',
              icon: null,
              isDefault: true
            },
            {
              id: 'youtube2',
              platform: 'youtube',
              name: 'Second YouTube Channel',
              icon: null,
              isDefault: false
            },
            {
              id: 'tiktok1',
              platform: 'tiktok',
              name: 'TikTok Account',
              icon: null,
              isDefault: true
            },
            {
              id: 'instagram1',
              platform: 'instagram',
              name: 'Instagram Account',
              icon: null,
              isDefault: true
            }
          ];
        }
      } catch (error) {
        console.error('Error loading accounts:', error);
        this.accounts = [];
      }
    }
  
    // Helper methods
    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
  
    getMinDate() {
      const today = new Date();
      return today.toISOString().split('T')[0];
    }
  
    getPlatformIcon(platform) {
      const icons = {
        youtube: '🎬',
        tiktok: '📱',
        instagram: '📷'
      };
      
      return icons[platform] || '📺';
    }
  
    getPlatformName(platform) {
      const names = {
        youtube: 'YouTube',
        tiktok: 'TikTok',
        instagram: 'Instagram'
      };
      
      return names[platform] || platform;
    }
  }
  
  // Export for use in other files
  if (typeof module !== 'undefined') {
    module.exports = GlobalUploadForm;
  }