// src/renderer/app.js
class MainApp {
  constructor() {
    this.currentPage = 'dashboard';
    this.pages = {
      dashboard: null,
      upload: null,
      globalUpload: null,
      schedule: null,
      accounts: null,
      settings: null
    };
    this.components = {};
    
    this.init();
  }

  init() {
    // Initialize navigation
    this.setupNavigation();
    
    // Parse URL hash for initial page
    this.handleHashChange();
    
    // Listen for hash changes
    window.addEventListener('hashchange', () => this.handleHashChange());
    
    // Initialize theme
    this.loadTheme();
  }

  setupNavigation() {
    const sidebarItems = document.querySelectorAll('.sidebar-nav-item');
    sidebarItems.forEach(item => {
      item.addEventListener('click', () => {
        const page = item.getAttribute('data-page').toLowerCase();
        window.location.hash = `#${page}`;
      });
    });

    // Upload button in header
    const uploadBtn = document.getElementById('new-upload-btn');
    if (uploadBtn) {
      uploadBtn.addEventListener('click', () => {
        window.location.hash = '#upload';
      });
    }
  }

  handleHashChange() {
    // Get page from hash
    let hash = window.location.hash.substring(1); // Remove #
    
    // Parse query parameters if any
    let queryParams = {};
    if (hash.includes('?')) {
      const [pageName, queryString] = hash.split('?');
      hash = pageName;
      
      // Parse query parameters
      const params = new URLSearchParams(queryString);
      params.forEach((value, key) => {
        queryParams[key] = value;
      });
    }
    
    // Default to dashboard if hash is empty
    if (!hash) {
      hash = 'dashboard';
    }
    
    // Update navigation UI
    this.updateNavigation(hash);
    
    // Load the page content
    this.loadPage(hash, queryParams);
  }

  updateNavigation(page) {
    // Remove active class from all nav items
    const sidebarItems = document.querySelectorAll('.sidebar-nav-item');
    sidebarItems.forEach(item => {
      item.classList.remove('active');
    });
    
    // Add active class to current page nav item
    const currentNavItem = document.querySelector(`.sidebar-nav-item[data-page="${page}"]`);
    if (currentNavItem) {
      currentNavItem.classList.add('active');
    }
    
    // Special case for settings and global-upload (no direct nav item)
    if (page === 'settings') {
      const settingsNav = document.getElementById('settings-nav');
      if (settingsNav) {
        settingsNav.classList.add('active');
      }
    } else if (page === 'global-upload') {
      const uploadNav = document.querySelector('.sidebar-nav-item[data-page="upload"]');
      if (uploadNav) {
        uploadNav.classList.add('active');
      }
    }
    
    // Update page title
    this.updatePageTitle(page);
  }

  updatePageTitle(page) {
    const pageTitleElement = document.querySelector('.page-title');
    if (!pageTitleElement) return;
    
    // Map page to display title
    const titleMap = {
      'dashboard': 'Dashboard',
      'upload': 'Upload Video',
      'global-upload': 'Multi-Platform Upload',
      'schedule': 'Upload Schedule',
      'accounts': 'Connected Accounts',
      'settings': 'Settings'
    };
    
    pageTitleElement.textContent = titleMap[page] || page.charAt(0).toUpperCase() + page.slice(1);
  }

  loadPage(page, queryParams = {}) {
    this.currentPage = page;
    
    // Hide all content containers
    const contentContainers = document.querySelectorAll('.content-container');
    contentContainers.forEach(container => {
      container.style.display = 'none';
    });
    
    // Show the current page container
    const pageContainer = document.getElementById(`${page}-content`);
    if (pageContainer) {
      pageContainer.style.display = 'block';
      
      // Initialize page component if not already initialized
      this.initPageComponent(page, pageContainer.id, queryParams);
    } else {
      console.error(`Container for page ${page} not found`);
    }
  }

  initPageComponent(page, containerId, queryParams) {
    // Only initialize components once unless specified to refresh
    if (this.pages[page] && !queryParams.refresh) {
      return;
    }
    
    switch (page) {
      case 'dashboard':
        // Dashboard page would be initialized here
        this.pages.dashboard = true;
        break;
        
      case 'upload':
        // Initialize UploadForm component
        if (!this.components.uploadForm) {
          this.components.uploadForm = new UploadForm(containerId);
        }
        this.pages.upload = true;
        break;
        
      case 'global-upload':
        // Initialize GlobalUploadForm component
        if (!this.components.globalUploadForm) {
          this.components.globalUploadForm = new GlobalUploadForm(containerId);
        }
        this.pages.globalUpload = true;
        break;
        
      case 'schedule':
        // Initialize SchedulePage component
        if (!this.components.schedulePage) {
          this.components.schedulePage = new SchedulePage(containerId);
        } else if (queryParams.refresh) {
          // If refresh is requested, reload events
          this.components.schedulePage.loadScheduledEvents();
        }
        this.pages.schedule = true;
        break;
        
      case 'accounts':
        // Initialize AccountsPage component
        if (!this.components.accountsPage) {
          this.components.accountsPage = new AccountsPage(containerId);
        } else if (queryParams.refresh) {
          // If refresh is requested, reload accounts
          this.components.accountsPage.loadAccounts().then(() => {
            this.components.accountsPage.render();
          });
        }
        this.pages.accounts = true;
        break;
        
      case 'settings':
        // Initialize SettingsPage component
        if (!this.components.settingsPage) {
          this.components.settingsPage = new SettingsPage(containerId);
        }
        this.pages.settings = true;
        break;
        
      default:
        console.error(`Unknown page: ${page}`);
    }
  }

  async loadTheme() {
    try {
      if (window.app && window.app.getTheme) {
        const theme = await window.app.getTheme();
        
        // Apply theme colors
        document.documentElement.style.setProperty('--accent-color', theme.accentColor);
        
        // Calculate RGB values for accent color
        const hexToRgb = (hex) => {
          const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
          return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
          } : null;
        };
        
        const rgb = hexToRgb(theme.accentColor);
        if (rgb) {
          document.documentElement.style.setProperty('--accent-color-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
        }
        
        // Apply dark/light theme
        document.body.className = theme.theme || 'dark';
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  }

  // Public method to navigate to a page
  navigateTo(page, params = {}) {
    let url = `#${page}`;
    
    // Add query parameters if any
    if (Object.keys(params).length > 0) {
      const queryParams = new URLSearchParams();
      for (const key in params) {
        queryParams.append(key, params[key]);
      }
      url += `?${queryParams.toString()}`;
    }
    
    window.location.hash = url;
  }
}

// Wait for DOM to be loaded before initializing app
document.addEventListener('DOMContentLoaded', () => {
  window.app = new MainApp();
});