// src/renderer/components/Calendar.js
class CalendarView {
    constructor(containerId, options = {}) {
      this.container = document.getElementById(containerId);
      this.events = [];
      this.options = {
        startHour: 8,
        endHour: 22,
        viewMode: 'month', // 'month', 'week', 'day'
        firstDayOfWeek: 1, // 0 = Sunday, 1 = Monday
        platforms: ['youtube', 'tiktok', 'instagram'],
        platformColors: {
          youtube: '#FF0000', // YouTube red
          tiktok: '#00F2EA',  // TikTok teal
          instagram: '#E1306C' // Instagram pink/purple
        },
        ...options
      };
      
      this.currentDate = new Date();
      this.selectedDate = new Date();
      this.init();
    }
  
    init() {
      this.render();
      this.attachEventListeners();
    }
  
    render() {
      if (!this.container) return;
      
      const viewMode = this.options.viewMode;
      
      this.container.innerHTML = `
        <div class="calendar-container">
          <div class="calendar-header">
            <div class="calendar-nav">
              <button class="calendar-nav-btn" id="prev-btn">&lt;</button>
              <h2 class="calendar-title" id="calendar-title">
                ${this.formatMonthYear(this.currentDate)}
              </h2>
              <button class="calendar-nav-btn" id="next-btn">&gt;</button>
            </div>
            <div class="calendar-view-options">
              <button class="view-btn ${viewMode === 'month' ? 'active' : ''}" data-view="month">Month</button>
              <button class="view-btn ${viewMode === 'week' ? 'active' : ''}" data-view="week">Week</button>
              <button class="view-btn ${viewMode === 'day' ? 'active' : ''}" data-view="day">Day</button>
            </div>
          </div>
          
          <div class="calendar-body">
            ${this.renderCalendarView()}
          </div>
          
          <div class="calendar-legend">
            ${this.renderPlatformLegend()}
          </div>
        </div>
      `;
    }
  
    renderCalendarView() {
      switch (this.options.viewMode) {
        case 'month':
          return this.renderMonthView();
        case 'week':
          return this.renderWeekView();
        case 'day':
          return this.renderDayView();
        default:
          return this.renderMonthView();
      }
    }
  
    renderMonthView() {
      const today = new Date();
      const year = this.currentDate.getFullYear();
      const month = this.currentDate.getMonth();
      
      // Get first day of month
      const firstDay = new Date(year, month, 1);
      
      // Get last day of month
      const lastDay = new Date(year, month + 1, 0);
      
      // Get the day of the week of the first day (0 = Sunday, 1 = Monday, etc.)
      let firstDayOfWeek = firstDay.getDay();
      
      // Adjust for starting the week on Monday if needed
      if (this.options.firstDayOfWeek === 1) {
        firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
      }
      
      // Create array for all the days in the month view
      const daysArray = [];
      
      // Add empty cells for days before the first day of the month
      for (let i = 0; i < firstDayOfWeek; i++) {
        daysArray.push({
          date: new Date(year, month, -firstDayOfWeek + i + 1),
          isCurrentMonth: false,
          events: []
        });
      }
      
      // Add cells for all days of the current month
      for (let i = 1; i <= lastDay.getDate(); i++) {
        const date = new Date(year, month, i);
        daysArray.push({
          date: date,
          isCurrentMonth: true,
          isToday: this.isSameDay(date, today),
          isSelected: this.isSameDay(date, this.selectedDate),
          events: this.getEventsForDate(date)
        });
      }
      
      // Add empty cells for days after the last day of the month to complete the grid
      const cellsToAdd = 42 - daysArray.length; // 6 rows × 7 days = 42 cells
      for (let i = 1; i <= cellsToAdd; i++) {
        daysArray.push({
          date: new Date(year, month + 1, i),
          isCurrentMonth: false,
          events: []
        });
      }
      
      // Generate weekday headers
      const weekdays = this.getWeekdayHeaders();
      
      // Generate the HTML for the month view
      let html = `
        <div class="calendar-month-view">
          <div class="calendar-weekdays">
            ${weekdays.map(day => `<div class="weekday">${day}</div>`).join('')}
          </div>
          <div class="calendar-days">
      `;
      
      // Add day cells
      daysArray.forEach(day => {
        const classes = [
          'calendar-day',
          day.isCurrentMonth ? 'current-month' : 'other-month',
          day.isToday ? 'today' : '',
          day.isSelected ? 'selected' : ''
        ].filter(Boolean).join(' ');
        
        html += `
          <div class="${classes}" data-date="${this.formatDateAttribute(day.date)}">
            <div class="day-number">${day.date.getDate()}</div>
            <div class="day-events">
              ${this.renderDayEvents(day.events)}
            </div>
          </div>
        `;
      });
      
      html += `
          </div>
        </div>
      `;
      
      return html;
    }
  
    renderWeekView() {
      const today = new Date();
      const currentDay = this.currentDate.getDay();
      const diff = this.currentDate.getDate() - currentDay + (currentDay === 0 ? -6 : 1); // Adjust for starting week on Monday
      
      const startDate = new Date(this.currentDate);
      startDate.setDate(diff);
      
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      
      const weekDays = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        weekDays.push({
          date: date,
          isToday: this.isSameDay(date, today),
          events: this.getEventsForDate(date)
        });
      }
      
      // Generate the times for the left column
      const times = [];
      for (let hour = this.options.startHour; hour <= this.options.endHour; hour++) {
        times.push(`${hour}:00`);
      }
      
      // Generate HTML for the week view
      let html = `
        <div class="calendar-week-view">
          <div class="week-header">
            <div class="time-column-header"></div>
            ${weekDays.map(day => `
              <div class="day-column-header ${day.isToday ? 'today' : ''}">
                <div class="day-name">${this.formatDayName(day.date)}</div>
                <div class="day-number">${day.date.getDate()}</div>
              </div>
            `).join('')}
          </div>
          <div class="week-body">
            <div class="time-column">
              ${times.map(time => `<div class="time-slot">${time}</div>`).join('')}
            </div>
            ${weekDays.map(day => `
              <div class="day-column ${day.isToday ? 'today' : ''}" data-date="${this.formatDateAttribute(day.date)}">
                ${times.map((_, index) => `
                  <div class="time-block" data-hour="${this.options.startHour + index}" data-date="${this.formatDateAttribute(day.date)}">
                    ${this.renderTimeBlockEvents(day.events, this.options.startHour + index)}
                  </div>
                `).join('')}
              </div>
            `).join('')}
          </div>
        </div>
      `;
      
      return html;
    }
  
    renderDayView() {
      const today = new Date();
      const times = [];
      for (let hour = this.options.startHour; hour <= this.options.endHour; hour++) {
        times.push(`${hour}:00`);
      }
      
      const events = this.getEventsForDate(this.currentDate);
      
      let html = `
        <div class="calendar-day-view">
          <div class="day-header">
            <div class="day-title ${this.isSameDay(this.currentDate, today) ? 'today' : ''}">
              ${this.formatDayName(this.currentDate)}, ${this.formatDate(this.currentDate)}
            </div>
          </div>
          <div class="day-body">
            <div class="time-column">
              ${times.map(time => `<div class="time-slot">${time}</div>`).join('')}
            </div>
            <div class="events-column">
              ${times.map((_, index) => `
                <div class="time-block" data-hour="${this.options.startHour + index}">
                  ${this.renderTimeBlockEvents(events, this.options.startHour + index)}
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;
      
      return html;
    }
  
    renderDayEvents(events) {
      if (!events || events.length === 0) return '';
      
      // Limit to 3 visible events
      const visibleEvents = events.slice(0, 3);
      const hiddenCount = events.length - visibleEvents.length;
      
      let html = visibleEvents.map(event => `
        <div class="day-event" 
             style="background-color: ${this.options.platformColors[event.platform] || '#666'}"
             data-event-id="${event.id}">
          <div class="event-time">${this.formatEventTime(event)}</div>
          <div class="event-title">${event.title}</div>
        </div>
      `).join('');
      
      if (hiddenCount > 0) {
        html += `<div class="more-events">+${hiddenCount} more</div>`;
      }
      
      return html;
    }
  
    renderTimeBlockEvents(events, hour) {
      if (!events || events.length === 0) return '';
      
      // Filter events for this hour
      const hourEvents = events.filter(event => {
        const eventHour = new Date(event.scheduledFor).getHours();
        return eventHour === hour;
      });
      
      if (hourEvents.length === 0) return '';
      
      return hourEvents.map(event => `
        <div class="hour-event" 
             style="background-color: ${this.options.platformColors[event.platform] || '#666'}"
             data-event-id="${event.id}">
          <div class="event-time">${this.formatEventTime(event)}</div>
          <div class="event-title">${event.title}</div>
        </div>
      `).join('');
    }
  
    renderPlatformLegend() {
      return Object.entries(this.options.platformColors).map(([platform, color]) => `
        <div class="legend-item">
          <div class="legend-color" style="background-color: ${color}"></div>
          <div class="legend-label">${platform.charAt(0).toUpperCase() + platform.slice(1)}</div>
        </div>
      `).join('');
    }
  
    attachEventListeners() {
      // Navigation buttons
      const prevBtn = document.getElementById('prev-btn');
      const nextBtn = document.getElementById('next-btn');
      
      if (prevBtn) {
        prevBtn.addEventListener('click', () => this.navigatePrev());
      }
      
      if (nextBtn) {
        nextBtn.addEventListener('click', () => this.navigateNext());
      }
      
      // View mode buttons
      const viewBtns = document.querySelectorAll('.view-btn');
      if (viewBtns.length) {
        viewBtns.forEach(btn => {
          btn.addEventListener('click', () => {
            this.options.viewMode = btn.dataset.view;
            this.render();
          });
        });
      }
      
      // Day selection in month view
      const dayElements = document.querySelectorAll('.calendar-day');
      if (dayElements.length) {
        dayElements.forEach(day => {
          day.addEventListener('click', () => {
            const dateStr = day.dataset.date;
            if (dateStr) {
              this.selectedDate = new Date(dateStr);
              this.render();
            }
          });
        });
      }
      
      // Event click handling
      const eventElements = document.querySelectorAll('.day-event, .hour-event');
      if (eventElements.length) {
        eventElements.forEach(event => {
          event.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent triggering day click
            const eventId = event.dataset.eventId;
            if (eventId && this.options.onEventClick) {
              const eventData = this.events.find(e => e.id === eventId);
              if (eventData) {
                this.options.onEventClick(eventData);
              }
            }
          });
        });
      }
      
      // Time block click (for adding new events)
      const timeBlocks = document.querySelectorAll('.time-block');
      if (timeBlocks.length) {
        timeBlocks.forEach(block => {
          block.addEventListener('click', () => {
            const hour = block.dataset.hour;
            const dateStr = block.dataset.date;
            
            if (hour && dateStr && this.options.onTimeBlockClick) {
              const date = new Date(dateStr);
              date.setHours(parseInt(hour), 0, 0, 0);
              this.options.onTimeBlockClick(date);
            }
          });
        });
      }
    }
  
    // Navigation methods
    navigateNext() {
      const viewMode = this.options.viewMode;
      
      if (viewMode === 'month') {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
      } else if (viewMode === 'week') {
        this.currentDate.setDate(this.currentDate.getDate() + 7);
      } else if (viewMode === 'day') {
        this.currentDate.setDate(this.currentDate.getDate() + 1);
      }
      
      this.render();
    }
  
    navigatePrev() {
      const viewMode = this.options.viewMode;
      
      if (viewMode === 'month') {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
      } else if (viewMode === 'week') {
        this.currentDate.setDate(this.currentDate.getDate() - 7);
      } else if (viewMode === 'day') {
        this.currentDate.setDate(this.currentDate.getDate() - 1);
      }
      
      this.render();
    }
  
    // Helper methods
    getWeekdayHeaders() {
      const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      
      if (this.options.firstDayOfWeek === 1) {
        // Start with Monday
        return [...weekdays.slice(1), weekdays[0]];
      }
      
      return weekdays;
    }
  
    formatMonthYear(date) {
      const options = { month: 'long', year: 'numeric' };
      return date.toLocaleDateString(undefined, options);
    }
  
    formatDate(date) {
      const options = { day: 'numeric', month: 'long', year: 'numeric' };
      return date.toLocaleDateString(undefined, options);
    }
  
    formatDayName(date) {
      const options = { weekday: 'long' };
      return date.toLocaleDateString(undefined, options);
    }
  
    formatEventTime(event) {
      const date = new Date(event.scheduledFor);
      return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    }
  
    formatDateAttribute(date) {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }
  
    isSameDay(date1, date2) {
      return date1.getFullYear() === date2.getFullYear() &&
             date1.getMonth() === date2.getMonth() &&
             date1.getDate() === date2.getDate();
    }
  
    getEventsForDate(date) {
      return this.events.filter(event => this.isSameDay(new Date(event.scheduledFor), date));
    }
  
    // Public API
    setEvents(events) {
      this.events = events;
      this.render();
    }
  
    addEvent(event) {
      this.events.push(event);
      this.render();
    }
  
    removeEvent(eventId) {
      this.events = this.events.filter(event => event.id !== eventId);
      this.render();
    }
  
    updateEvent(updatedEvent) {
      const index = this.events.findIndex(event => event.id === updatedEvent.id);
      if (index !== -1) {
        this.events[index] = updatedEvent;
        this.render();
      }
    }
  
    setViewMode(mode) {
      if (['month', 'week', 'day'].includes(mode)) {
        this.options.viewMode = mode;
        this.render();
      }
    }
  
    goToDate(date) {
      this.currentDate = new Date(date);
      this.render();
    }
  
    goToToday() {
      this.currentDate = new Date();
      this.render();
    }
  }
  
  // Export for use in other files
  if (typeof module !== 'undefined') {
    module.exports = CalendarView;
  }