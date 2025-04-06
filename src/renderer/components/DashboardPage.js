// src/renderer/components/DashboardPage.js
class DashboardPage {
    constructor(containerId) {
      this.container = document.getElementById(containerId);
      this.recentUploads = [];
      this.upcomingUploads = [];
      this.accounts = [];
      this.init();
    }
  
    init() {
      this.loadData().then(() => {
        this.render();
      });
    }
  
    async loadData() {
      try {
        // Load recent uploads
        await this.loadRecentUploads();
        
        // Load upcoming (scheduled) uploads
        await this.loadUpcomingUploads();
        
        // Load connected accounts
        await this.loadAccounts();
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }
    }
  
    async loadRecentUploads() {
      try {
        // In a real app, this would be an API call
        if (window.youtube && window.youtube.getRecentUploads) {
          const result = await window.youtube.getRecentUploads();
          if (result.success) {
            this.recentUploads = result.uploads;
          }
        } else {
          // Mock data for testing UI
          this.recentUploads = [
            {
              id: 'video1',
              title: 'Getting Started with JavaScript',
              platform: 'youtube',
              channelName: 'My YouTube Channel',
              uploadDate: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
              views: 1248,
              thumbnailUrl: null
            },
            {
              id: 'video2',
              title: 'Quick TikTok Tutorial',
              platform: 'tiktok',
              channelName: 'My TikTok',
              uploadDate: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
              views: 3542,
              thumbnailUrl: null
            }
          ];
        }
      } catch (error) {
        console.error('Error loading recent uploads:', error);
        this.recentUploads = [];
      }
    }
  
    async loadUpcomingUploads() {
      try {
        // In a real app, this would be an API call
        if (window.scheduler && window.scheduler.getScheduledEvents) {
          const result = await window.scheduler.getScheduledEvents();
          if (result.success) {
            this.upcomingUploads = result.events;
          }
        } else {
          // Mock data for testing UI
          this.upcomingUploads = [
            {
              id: 'schedule1',
              title: 'Weekly Tech Review',
              platform: 'youtube',
              channelName: 'My YouTube Channel',
              scheduledFor: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
              status: 'scheduled'
            },
            {
              id: 'schedule2',
              title: 'Social Media Tips',
              platform: 'instagram',
              channelName: 'My Instagram',
              scheduledFor: new Date(Date.now() + 86400000 * 3).toISOString(), // 3 days from now
              status: 'scheduled'
            }
          ];
        }
      } catch (error) {
        console.error('Error loading upcoming uploads:', error);
        this.upcomingUploads = [];
      }
    }
  
    async loadAccounts() {
      try {
        // In a real app, this would be an API call
        if (window.accounts && window.accounts.getAll) {
          const result = await window.accounts.getAll();
          if (result.success) {
            this.accounts = result.accounts;
          }
        } else {
          // Mock data for testing UI
          this.accounts = [
            {
              id: 'youtube1',
              platform: 'youtube',
              name: 'My YouTube Channel',
              isDefault: true,
              uploadCount: 24
            },
            {
              id: 'tiktok1',
              platform: 'tiktok',
              name: 'My TikTok Account',
              isDefault: true,
              uploadCount: 12
            }
          ];
        }
      } catch (error) {
        console.error('Error loading accounts:', error);
        this.accounts = [];
      }
    }
  
    render() {
      this.renderRecentUploads();
      this.renderUpcomingUploads();
      this.renderAccountsSummary();
    }
  
    renderRecentUploads() {
      const recentUploadsContainer = document.getElementById('recent-uploads');
      if (!recentUploadsContainer) return;
      
      if (this.recentUploads.length === 0) {
        recentUploadsContainer.innerHTML = `
          <div class="placeholder-message">No recent uploads</div>
        `;
        return;
      }
      
      recentUploadsContainer.innerHTML = `
        <div class="upload-list">
          ${this.recentUploads.map(upload => `
            <div class="upload-item" data-id="${upload.id}">
              <div class="upload-thumbnail">
                ${upload.thumbnailUrl ? 
                  `<img src="${upload.thumbnailUrl}" alt="${upload.title}" />` : 
                  `<div class="thumbnail-placeholder ${upload.platform}"></div>`
                }
              </div>
              <div class="upload-details">
                <div class="upload-title">${upload.title}</div>
                <div class="upload-meta">
                  <span class="upload-channel">${upload.channelName}</span>
                  <span class="upload-date">${this.formatDate(upload.uploadDate)}</span>
                </div>
                <div class="upload-stats">
                  <span class="upload-views">${this.formatNumber(upload.views)} views</span>
                </div>
              </div>
              <div class="upload-platform-icon ${upload.platform}"></div>
            </div>
          `).join('')}
        </div>
      `;
      
      // Add click event to view upload details
      const uploadItems = recentUploadsContainer.querySelectorAll('.upload-item');
      uploadItems.forEach(item => {
        item.addEventListener('click', () => {
          const id = item.dataset.id;
          this.viewUploadDetails(id);
        });
      });
    }
  
    renderUpcomingUploads() {
      const upcomingUploadsContainer = document.getElementById('upcoming-uploads');
      if (!upcomingUploadsContainer) return;
      
      if (this.upcomingUploads.length === 0) {
        upcomingUploadsContainer.innerHTML = `
          <div class="placeholder-message">No upcoming uploads</div>
        `;
        return;
      }
      
      upcomingUploadsContainer.innerHTML = `
        <div class="schedule-list">
          ${this.upcomingUploads.map(upload => `
            <div class="schedule-item" data-id="${upload.id}">
              <div class="schedule-details">
                <div class="schedule-title">${upload.title}</div>
                <div class="schedule-meta">
                  <span class="schedule-channel">${upload.channelName}</span>
                  <span class="schedule-date">${this.formatDate(upload.scheduledFor)}</span>
                </div>
                <div class="schedule-status ${upload.status}">${upload.status}</div>
              </div>
              <div class="upload-platform-icon ${upload.platform}"></div>
            </div>
          `).join('')}
        </div>
      `;
      
      // Add click event to view schedule details
      const scheduleItems = upcomingUploadsContainer.querySelectorAll('.schedule-item');
      scheduleItems.forEach(item => {
        item.addEventListener('click', () => {
          const id = item.dataset.id;
          this.viewScheduleDetails(id);
        });
      });
    }
  
    renderAccountsSummary() {
      const accountsContainer = document.getElementById('accounts-summary');
      if (!accountsContainer) return;
      
      if (this.accounts.length === 0) {
        accountsContainer.innerHTML = `
          <div class="placeholder-message">No accounts connected</div>
        `;
        return;
      }
      
      accountsContainer.innerHTML = `
        <div class="accounts-summary">
          ${this.accounts.map(account => `
            <div class="account-chip" data-id="${account.id}">
              <div class="account-platform-icon ${account.platform}"></div>
              <div class="account-name">${account.name}</div>
              <div class="account-upload-count">${account.uploadCount || 0} uploads</div>
            </div>
          `).join('')}
        </div>
      `;
      
      // Add click event to view account details
      const accountChips = accountsContainer.querySelectorAll('.account-chip');
      accountChips.forEach(chip => {
        chip.addEventListener('click', () => {
          const id = chip.dataset.id;
          this.viewAccountDetails(id);
        });
      });
    }
  
    viewUploadDetails(id) {
      // In a real app, this would navigate to the upload details page
      console.log(`View upload details: ${id}`);
      
      // For demonstration, navigate to the upload page
      if (window.app && window.app.navigateTo) {
        window.app.navigateTo('upload', { view: id });
      }
    }
  
    viewScheduleDetails(id) {
      // In a real app, this would navigate to the schedule details page
      console.log(`View schedule details: ${id}`);
      
      // For demonstration, navigate to the schedule page
      if (window.app && window.app.navigateTo) {
        window.app.navigateTo('schedule', { view: id });
      }
    }
  
    viewAccountDetails(id) {
      // In a real app, this would navigate to the account details page
      console.log(`View account details: ${id}`);
      
      // For demonstration, navigate to the accounts page
      if (window.app && window.app.navigateTo) {
        window.app.navigateTo('accounts', { view: id });
      }
    }
  
    // Helper methods
    formatDate(dateString) {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        return 'Today';
      } else if (diffDays === 1) {
        return 'Yesterday';
      } else if (diffDays < 0) {
        return `In ${Math.abs(diffDays)} days`;
      } else if (diffDays < 7) {
        return `${diffDays} days ago`;
      } else {
        return date.toLocaleDateString();
      }
    }
  
    formatNumber(number) {
      if (number >= 1000000) {
        return (number / 1000000).toFixed(1) + 'M';
      } else if (number >= 1000) {
        return (number / 1000).toFixed(1) + 'K';
      } else {
        return number.toString();
      }
    }
  }
  
  // Export for use in other files
  if (typeof module !== 'undefined') {
    module.exports = DashboardPage;
  }