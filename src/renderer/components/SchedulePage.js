// src/renderer/components/SchedulePage.js
class SchedulePage {
    constructor(containerId) {
      this.container = document.getElementById(containerId);
      this.calendar = null;
      this.scheduledEvents = [];
      this.selectedEvent = null;
      this.init();
    }
  
    init() {
      this.render();
      this.attachEventListeners();
      this.loadScheduledEvents();
    }
  
    render() {
      if (!this.container) return;
  
      this.container.innerHTML = `
        <div class="schedule-page">
          <div class="schedule-header">
            <h2>Video Upload Schedule</h2>
            <button id="schedule-new-btn" class="primary-button">Schedule New Upload</button>
          </div>
          
          <div class="schedule-content">
            <div class="schedule-sidebar">
              <div class="schedule-filters">
                <h3>Filters</h3>
                <div class="filter-group">
                  <label for="platform-filter">Platform</label>
                  <select id="platform-filter" class="form-control">
                    <option value="all">All Platforms</option>
                    <option value="youtube">YouTube</option>
                    <option value="tiktok">TikTok</option>
                    <option value="instagram">Instagram</option>
                  </select>
                </div>
                
                <div class="filter-group">
                  <label for="channel-filter">Channel</label>
                  <select id="channel-filter" class="form-control">
                    <option value="all">All Channels</option>
                    <!-- Will be populated dynamically -->
                  </select>
                </div>
                
                <div class="filter-group">
                  <label for="status-filter">Status</label>
                  <select id="status-filter" class="form-control">
                    <option value="all">All Statuses</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="processing">Processing</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
              </div>
              
              <div class="upcoming-uploads">
                <h3>Upcoming Uploads</h3>
                <div id="upcoming-list" class="upload-list"></div>
              </div>
            </div>
            
            <div class="schedule-calendar" id="schedule-calendar"></div>
          </div>
          
          <div id="event-details" class="event-details hidden">
            <!-- Event details will appear here when an event is selected -->
          </div>
        </div>
      `;
      
      // Initialize the calendar component
      this.initCalendar();
      
      // Populate upcoming uploads
      this.renderUpcomingUploads();
    }
  
    initCalendar() {
      const calendarContainer = document.getElementById('schedule-calendar');
      if (!calendarContainer) return;
      
      // Depending on how you're organizing your code, you might need to
      // import or require the CalendarView class here
      
      this.calendar = new CalendarView('schedule-calendar', {
        onEventClick: (event) => this.showEventDetails(event),
        onTimeBlockClick: (date) => this.openScheduleForm(date),
        platforms: ['youtube', 'tiktok', 'instagram']
      });
      
      // Load events into the calendar
      this.calendar.setEvents(this.scheduledEvents);
    }
  
    renderUpcomingUploads() {
      const upcomingList = document.getElementById('upcoming-list');
      if (!upcomingList) return;
      
      const now = new Date();
      
      // Sort events by date (ascending)
      const sortedEvents = [...this.scheduledEvents].sort((a, b) => 
        new Date(a.scheduledFor) - new Date(b.scheduledFor)
      );
      
      // Get only future events
      const futureEvents = sortedEvents.filter(event => 
        new Date(event.scheduledFor) > now
      );
      
      // Limit to the next 5 events
      const upcomingEvents = futureEvents.slice(0, 5);
      
      if (upcomingEvents.length === 0) {
        upcomingList.innerHTML = `<div class="no-events">No upcoming uploads</div>`;
        return;
      }
      
      upcomingList.innerHTML = upcomingEvents.map(event => `
        <div class="upload-item" data-event-id="${event.id}">
          <div class="upload-platform-icon ${event.platform}"></div>
          <div class="upload-details">
            <div class="upload-title">${event.title}</div>
            <div class="upload-time">${this.formatEventDateTime(event.scheduledFor)}</div>
            <div class="upload-status ${event.status}">${event.status}</div>
          </div>
        </div>
      `).join('');
    }
  
    showEventDetails(event) {
      this.selectedEvent = event;
      const detailsContainer = document.getElementById('event-details');
      if (!detailsContainer) return;
      
      detailsContainer.classList.remove('hidden');
      detailsContainer.innerHTML = `
        <div class="event-details-header">
          <h3>Upload Details</h3>
          <button class="close-btn" id="close-details-btn">×</button>
        </div>
        
        <div class="event-details-content">
          <div class="event-platform-badge ${event.platform}">
            ${event.platform.charAt(0).toUpperCase() + event.platform.slice(1)}
          </div>
          
          <div class="event-title-section">
            <h4>${event.title}</h4>
            <div class="event-channel">${event.channelName}</div>
          </div>
          
          <div class="event-metadata">
            <div class="event-schedule">
              <strong>Scheduled for:</strong> ${this.formatEventDateTime(event.scheduledFor)}
            </div>
            <div class="event-status ${event.status}">
              <strong>Status:</strong> ${event.status.charAt(0).toUpperCase() + event.status.slice(1)}
            </div>
          </div>
          
          <div class="event-description">
            ${event.description || 'No description provided'}
          </div>
          
          <div class="event-thumbnail">
            ${event.thumbnailUrl ? 
              `<img src="${event.thumbnailUrl}" alt="${event.title}" />` : 
              '<div class="no-thumbnail">No thumbnail</div>'
            }
          </div>
          
          <div class="event-actions">
            <button class="edit-btn" id="edit-event-btn">Edit</button>
            <button class="delete-btn" id="delete-event-btn">Delete</button>
            ${event.status === 'scheduled' ? 
              `<button class="post-now-btn" id="post-now-btn">Post Now</button>` : 
              ''
            }
          </div>
        </div>
      `;
      
      // Attach event listeners
      const closeBtn = document.getElementById('close-details-btn');
      const editBtn = document.getElementById('edit-event-btn');
      const deleteBtn = document.getElementById('delete-event-btn');
      const postNowBtn = document.getElementById('post-now-btn');
      
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          detailsContainer.classList.add('hidden');
          this.selectedEvent = null;
        });
      }
      
      if (editBtn) {
        editBtn.addEventListener('click', () => this.editEvent(event));
      }
      
      if (deleteBtn) {
        deleteBtn.addEventListener('click', () => this.deleteEvent(event));
      }
      
      if (postNowBtn) {
        postNowBtn.addEventListener('click', () => this.postNow(event));
      }
    }
  
    openScheduleForm(date = null) {
      // This method would open the scheduling form
      // You could either create a new modal here or navigate to the upload page
      // with query parameters to indicate scheduling
      
      const modal = document.createElement('div');
      modal.className = 'schedule-modal';
      modal.innerHTML = `
        <div class="schedule-modal-content">
          <div class="modal-header">
            <h3>Schedule New Upload</h3>
            <button class="close-btn" id="close-modal-btn">×</button>
          </div>
          
          <div class="modal-body">
            <p>Please select a video to upload or use the global upload feature.</p>
            
            <div class="modal-actions">
              <button id="select-video-btn" class="primary-button">Select Video</button>
              <button id="global-upload-btn" class="secondary-button">Global Upload</button>
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      const closeBtn = document.getElementById('close-modal-btn');
      const selectVideoBtn = document.getElementById('select-video-btn');
      const globalUploadBtn = document.getElementById('global-upload-btn');
      
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          modal.remove();
        });
      }
      
      if (selectVideoBtn) {
        selectVideoBtn.addEventListener('click', () => {
          // Navigate to upload page with scheduling info
          window.location.hash = date ? 
            `#upload?schedule=true&date=${date.toISOString()}` : 
            '#upload?schedule=true';
          modal.remove();
        });
      }
      
      if (globalUploadBtn) {
        globalUploadBtn.addEventListener('click', () => {
          // Navigate to global upload page with scheduling info
          window.location.hash = date ? 
            `#global-upload?schedule=true&date=${date.toISOString()}` : 
            '#global-upload?schedule=true';
          modal.remove();
        });
      }
    }
  
    editEvent(event) {
      // Navigate to upload form with event data
      window.location.hash = `#upload?edit=${event.id}`;
    }
  
    deleteEvent(event) {
      if (confirm(`Are you sure you want to delete the scheduled upload "${event.title}"?`)) {
        // Call API to delete the event
        this.deleteScheduledEvent(event.id)
          .then(() => {
            this.loadScheduledEvents();
            const detailsContainer = document.getElementById('event-details');
            if (detailsContainer) {
              detailsContainer.classList.add('hidden');
            }
          })
          .catch(error => {
            console.error('Error deleting event:', error);
            alert('Failed to delete the scheduled upload. Please try again.');
          });
      }
    }
  
    postNow(event) {
      if (confirm(`Are you sure you want to upload "${event.title}" now?`)) {
        // Call API to post the video now
        this.postScheduledEventNow(event.id)
          .then(() => {
            this.loadScheduledEvents();
          })
          .catch(error => {
            console.error('Error posting event now:', error);
            alert('Failed to start the upload. Please try again.');
          });
      }
    }
  
    attachEventListeners() {
      const scheduleNewBtn = document.getElementById('schedule-new-btn');
      const platformFilter = document.getElementById('platform-filter');
      const channelFilter = document.getElementById('channel-filter');
      const statusFilter = document.getElementById('status-filter');
      
      if (scheduleNewBtn) {
        scheduleNewBtn.addEventListener('click', () => this.openScheduleForm());
      }
      
      if (platformFilter) {
        platformFilter.addEventListener('change', () => this.applyFilters());
      }
      
      if (channelFilter) {
        channelFilter.addEventListener('change', () => this.applyFilters());
      }
      
      if (statusFilter) {
        statusFilter.addEventListener('change', () => this.applyFilters());
      }
      
      // Attach click events to upcoming upload items
      const uploadItems = document.querySelectorAll('.upload-item');
      if (uploadItems.length) {
        uploadItems.forEach(item => {
          item.addEventListener('click', () => {
            const eventId = item.dataset.eventId;
            if (eventId) {
              const event = this.scheduledEvents.find(e => e.id === eventId);
              if (event) {
                this.showEventDetails(event);
              }
            }
          });
        });
      }
    }
  
    applyFilters() {
      const platformFilter = document.getElementById('platform-filter');
      const channelFilter = document.getElementById('channel-filter');
      const statusFilter = document.getElementById('status-filter');
      
      const platform = platformFilter ? platformFilter.value : 'all';
      const channel = channelFilter ? channelFilter.value : 'all';
      const status = statusFilter ? statusFilter.value : 'all';
      
      let filteredEvents = [...this.scheduledEvents];
      
      if (platform !== 'all') {
        filteredEvents = filteredEvents.filter(event => event.platform === platform);
      }
      
      if (channel !== 'all') {
        filteredEvents = filteredEvents.filter(event => event.channelId === channel);
      }
      
      if (status !== 'all') {
        filteredEvents = filteredEvents.filter(event => event.status === status);
      }
      
      // Update calendar with filtered events
      if (this.calendar) {
        this.calendar.setEvents(filteredEvents);
      }
      
      // Also update the upcoming list
      this.scheduledEvents = filteredEvents;
      this.renderUpcomingUploads();
    }
  
    async loadScheduledEvents() {
      try {
        // In a real app, this would be an API call
        // For now, let's use a mock implementation
        
        if (window.scheduler && window.scheduler.getScheduledEvents) {
          const events = await window.scheduler.getScheduledEvents();
          this.scheduledEvents = events;
        } else {
          // Mock data for testing
          this.scheduledEvents = [
            {
              id: '1',
              title: 'Weekly Tutorial',
              description: 'Tutorial video on JavaScript',
              platform: 'youtube',
              channelId: 'primary',
              channelName: 'My YouTube Channel',
              scheduledFor: new Date(Date.now() + 86400000).toISOString(), // tomorrow
              status: 'scheduled',
              thumbnailUrl: null,
              videoPath: '/path/to/video.mp4'
            },
            {
              id: '2',
              title: 'Short Travel Clip',
              description: 'Short clip from my trip',
              platform: 'tiktok',
              channelId: 'tiktok1',
              channelName: 'My TikTok Account',
              scheduledFor: new Date(Date.now() + 172800000).toISOString(), // day after tomorrow
              status: 'scheduled',
              thumbnailUrl: null,
              videoPath: '/path/to/clip.mp4'
            }
          ];
        }
        
        // Update the calendar and upcoming list
        if (this.calendar) {
          this.calendar.setEvents(this.scheduledEvents);
        }
        
        this.renderUpcomingUploads();
        this.populateChannelFilter();
      } catch (error) {
        console.error('Error loading scheduled events:', error);
      }
    }
  
    populateChannelFilter() {
      const channelFilter = document.getElementById('channel-filter');
      if (!channelFilter) return;
      
      // Get unique channels from events
      const channels = new Map();
      this.scheduledEvents.forEach(event => {
        if (!channels.has(event.channelId)) {
          channels.set(event.channelId, {
            id: event.channelId,
            name: event.channelName,
            platform: event.platform
          });
        }
      });
      
      // Create options
      const options = Array.from(channels.values()).map(channel => 
        `<option value="${channel.id}">${channel.name} (${channel.platform})</option>`
      );
      
      // Update the select element
      channelFilter.innerHTML = `
        <option value="all">All Channels</option>
        ${options.join('')}
      `;
    }
  
    async deleteScheduledEvent(eventId) {
      // In a real app, this would be an API call
      if (window.scheduler && window.scheduler.deleteScheduledEvent) {
        await window.scheduler.deleteScheduledEvent(eventId);
      } else {
        // Mock implementation
        this.scheduledEvents = this.scheduledEvents.filter(event => event.id !== eventId);
      }
    }
  
    async postScheduledEventNow(eventId) {
      // In a real app, this would be an API call
      if (window.scheduler && window.scheduler.postScheduledEventNow) {
        await window.scheduler.postScheduledEventNow(eventId);
      } else {
        // Mock implementation
        const event = this.scheduledEvents.find(e => e.id === eventId);
        if (event) {
          event.status = 'processing';
          event.scheduledFor = new Date().toISOString();
        }
      }
    }
  
    formatEventDateTime(dateTimeStr) {
      const date = new Date(dateTimeStr);
      return date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }
  
  // Export for use in other files
  if (typeof module !== 'undefined') {
    module.exports = SchedulePage;
  }