const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const YouTubeAuthService = require('../services/youtube/auth');
const YouTubeUploader = require('../services/youtube/uploader');
const SchedulerService = require('../services/scheduler/scheduler');
const AccountManager = require('../services/account/accountManager');
const UploadManager = require('../services/upload/uploadManager');
const { google } = require('googleapis');

// Global references to prevent GC
let mainWindow;
let youtubeAuth;
let youtubeUploader;
let schedulerService;
let accountManager;
let uploadManager;

// Path to configuration
const configPath = path.join(app.getPath('userData'), 'user-preferences.json');

// Create/Check configuration file
function ensureConfig() {
  try {
    // If the file doesn't exist in user data directory, copy from config directory
    if (!fs.existsSync(configPath)) {
      const defaultConfigPath = path.join(__dirname, '../../config/user-preferences.json');
      if (fs.existsSync(defaultConfigPath)) {
        fs.copyFileSync(defaultConfigPath, configPath);
      } else {
        // Create default configuration
        const defaultConfig = {
          appearance: {
            accentColor: "#e39d4d",
            theme: "dark"
          },
          credentials: {
            youtube: {
              clientId: "",
              clientSecret: "",
              apiKey: "",
              refreshToken: "",
              accessToken: ""
            },
            tiktok: {
              enabled: false,
              accessToken: ""
            },
            instagram: {
              enabled: false,
              accessToken: ""
            }
          },
          channels: {
            youtube: [
              {
                id: "primary",
                name: "My YouTube Channel",
                icon: "",
                isDefault: true
              }
            ],
            tiktok: [],
            instagram: []
          }
        };
        
        fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2), 'utf8');
      }
    }
    return true;
  } catch (error) {
    console.error('Error creating configuration:', error);
    return false;
  }
}

// Create window
const createWindow = () => {
  // Ensure configuration exists
  ensureConfig();
  
  // Initialize AccountManager
  accountManager = new AccountManager();
  
  // Initialize YouTube Auth Service
  youtubeAuth = new YouTubeAuthService(configPath);
  
  // Initialize upload services
  const uploadServices = {};
  
  // Initialize YouTube Uploader if authenticated
  if (youtubeAuth.isAuthenticated()) {
    youtubeUploader = new YouTubeUploader(youtubeAuth.getAuthClient());
    uploadServices.youtube = youtubeUploader;
  }
  
  // Initialize upload manager
  uploadManager = new UploadManager(uploadServices);
  
  // Initialize scheduler service with upload services
  schedulerService = new SchedulerService(uploadServices);
  
  // Pass scheduler to upload manager
  uploadManager.setSchedulerService(schedulerService);
  
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#111111',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    show: false
  });

  // Load index.html
  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  
  // Show window when loaded
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open DevTools in dev mode
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  // Register event listeners for upload progress
  uploadManager.on('upload-progress', progress => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('upload:progress', progress);
    }
  });

  uploadManager.on('upload-complete', result => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('upload:complete', result);
    }
  });

  uploadManager.on('upload-error', error => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('upload:error', error);
    }
  });
};

// App is ready
app.whenReady().then(() => {
  createWindow();
  
  // macOS: Create window when dock icon is clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Prevent running in background
app.on('window-all-closed', () => {
  // Stop scheduler when closing
  if (schedulerService) {
    schedulerService.stopScheduler();
  }
  
  if (process.platform !== 'darwin') app.quit();
});


// IPC Event Handlers
ipcMain.handle('app:getApiSettings', async () => {
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    return {
      youtube: {
        clientId: config.credentials.youtube.clientId,
        clientSecret: config.credentials.youtube.clientSecret,
        apiKey: config.credentials.youtube.apiKey
      },
      tiktok: {
        enabled: config.credentials.tiktok?.enabled || false
      },
      instagram: {
        enabled: config.credentials.instagram?.enabled || false
      }
    };
  } catch (error) {
    console.error('Error loading API settings:', error);
    return { 
      youtube: { clientId: '', clientSecret: '', apiKey: '' },
      tiktok: { enabled: false },
      instagram: { enabled: false }
    };
  }
});

// IPC events for YouTube authentication
ipcMain.handle('youtube:checkAuth', async () => {
  return youtubeAuth.isAuthenticated();
});

ipcMain.handle('youtube:authenticate', async () => {
  try {
    await youtubeAuth.authenticate(mainWindow);
    // Initialize uploader after successful authentication
    youtubeUploader = new YouTubeUploader(youtubeAuth.getAuthClient());
    
    // Add to upload services
    uploadManager.addUploadService('youtube', youtubeUploader);
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// IPC events for video selection
ipcMain.handle('youtube:selectVideo', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Videos', extensions: ['mp4', 'mov', 'avi', 'mkv', 'wmv'] }
    ]
  });
  
  if (result.canceled) {
    return { canceled: true };
  }
  
  const filePath = result.filePaths[0];
  const stats = fs.statSync(filePath);
  
  return { 
    canceled: false, 
    filePath: filePath,
    fileName: path.basename(filePath),
    fileSize: stats.size
  };
});

ipcMain.handle('youtube:selectThumbnail', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Images', extensions: ['jpg', 'jpeg', 'png'] }
    ]
  });
  
  if (result.canceled) {
    return { canceled: true };
  }
  
  return { 
    canceled: false, 
    filePath: result.filePaths[0],
    fileName: path.basename(result.filePaths[0])
  };
});

// IPC events for uploading
ipcMain.handle('youtube:uploadVideo', async (event, { videoPath, metadata, accountId }) => {
  try {
    // Use accountId if provided, otherwise use default YouTube service
    const youtubeService = youtubeUploader; // In future, could have different services per account
    
    const result = await youtubeService.uploadVideo(videoPath, metadata, progress => {
      // Send progress to renderer
      mainWindow.webContents.send('youtube:uploadProgress', progress);
    });
    
    return { success: true, videoId: result.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('youtube:uploadThumbnail', async (event, { videoId, thumbnailPath }) => {
  try {
    await youtubeUploader.setThumbnail(videoId, thumbnailPath);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('youtube:getCategories', async () => {
  try {
    const categories = await youtubeUploader.getVideoCategories();
    return { success: true, categories };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('youtube:getPlaylists', async () => {
  try {
    const playlists = await youtubeUploader.getMyPlaylists();
    return { success: true, playlists };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// IPC events for scheduled uploads
ipcMain.handle('scheduler:getScheduledEvents', async () => {
  try {
    const events = schedulerService.getScheduledUploads();
    return { success: true, events };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('scheduler:scheduleUpload', async (event, uploadRequest) => {
  try {
    const result = await schedulerService.scheduleUpload(uploadRequest);
    return { success: true, scheduledUpload: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('scheduler:cancelScheduledUpload', async (event, uploadId) => {
  try {
    const result = schedulerService.deleteScheduledUpload(uploadId);
    return { success: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('scheduler:updateScheduledUpload', async (event, { id, updates }) => {
  try {
    const result = schedulerService.updateScheduledUpload(id, updates);
    return { success: !!result, updatedUpload: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('scheduler:postNow', async (event, id) => {
  try {
    const result = await schedulerService.processScheduledUploadNow(id);
    return { success: true, result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// IPC events for account management
ipcMain.handle('accounts:getAll', async () => {
  try {
    const accounts = accountManager.getAllAccounts();
    return { success: true, accounts };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('accounts:getForPlatform', async (event, platform) => {
  try {
    const accounts = accountManager.getAccountsForPlatform(platform);
    return { success: true, accounts };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('accounts:add', async (event, { platform, accountData }) => {
  try {
    const account = accountManager.addAccount(platform, accountData);
    return { success: true, account };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('accounts:update', async (event, { id, updates }) => {
  try {
    const account = accountManager.updateAccount(id, updates);
    return { success: !!account, account };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('accounts:remove', async (event, id) => {
  try {
    const result = accountManager.removeAccount(id);
    return { success: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('accounts:setDefault', async (event, id) => {
  try {
    const result = accountManager.setDefaultAccount(id);
    return { success: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// IPC events for global uploads
ipcMain.handle('upload:startGlobalUpload', async (event, uploadRequests) => {
  try {
    const results = await uploadManager.startGlobalUpload(uploadRequests);
    return { success: true, results };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('upload:cancelUpload', async (event, uploadId) => {
  try {
    const result = uploadManager.cancelUpload(uploadId);
    return { success: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// IPC events for theme and settings
ipcMain.handle('app:getTheme', () => {
  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  return config.appearance;
});

ipcMain.handle('app:setTheme', (event, theme) => {
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    config.appearance.theme = theme;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('app:setAccentColor', (event, color) => {
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    config.appearance.accentColor = color;
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('app:saveApiConfig', (event, { platform, config }) => {
  try {
    const appConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    // Handle different platforms
    if (platform === 'youtube') {
      appConfig.credentials.youtube.clientId = config.clientId;
      appConfig.credentials.youtube.clientSecret = config.clientSecret;
      appConfig.credentials.youtube.apiKey = config.apiKey;
    } else if (platform === 'tiktok') {
      appConfig.credentials.tiktok.enabled = config.enabled;
      if (config.accessToken) {
        appConfig.credentials.tiktok.accessToken = config.accessToken;
      }
    } else if (platform === 'instagram') {
      appConfig.credentials.instagram.enabled = config.enabled;
      if (config.accessToken) {
        appConfig.credentials.instagram.accessToken = config.accessToken;
      }
    }
    
    fs.writeFileSync(configPath, JSON.stringify(appConfig, null, 2), 'utf8');
    
    // Reinitialize auth service if YouTube credentials changed
    if (platform === 'youtube') {
      youtubeAuth = new YouTubeAuthService(configPath);
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});