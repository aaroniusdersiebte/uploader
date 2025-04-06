// src/main/preload.js
const { contextBridge, ipcRenderer, shell } = require('electron');

// App API Access
contextBridge.exposeInMainWorld('app', {
  getApiSettings: () => ipcRenderer.invoke('app:getApiSettings'),
  saveApiConfig: (platform, config) => ipcRenderer.invoke('app:saveApiConfig', { platform, config }),
  getTheme: () => ipcRenderer.invoke('app:getTheme'),
  setTheme: (theme) => ipcRenderer.invoke('app:setTheme', theme),
  setAccentColor: (color) => ipcRenderer.invoke('app:setAccentColor', color)
});

// YouTube API Access
contextBridge.exposeInMainWorld('youtube', {
  checkAuth: () => ipcRenderer.invoke('youtube:checkAuth'),
  authenticate: () => ipcRenderer.invoke('youtube:authenticate'),
  selectVideo: () => ipcRenderer.invoke('youtube:selectVideo'),
  selectThumbnail: () => ipcRenderer.invoke('youtube:selectThumbnail'),
  uploadVideo: (data) => ipcRenderer.invoke('youtube:uploadVideo', data),
  uploadThumbnail: (data) => ipcRenderer.invoke('youtube:uploadThumbnail', data),
  getCategories: () => ipcRenderer.invoke('youtube:getCategories'),
  getPlaylists: () => ipcRenderer.invoke('youtube:getPlaylists'),
  onUploadProgress: (callback) => {
    const subscription = (event, data) => callback(data);
    ipcRenderer.on('youtube:uploadProgress', subscription);
    return () => ipcRenderer.removeListener('youtube:uploadProgress', subscription);
  }
});

// Scheduler API Access
contextBridge.exposeInMainWorld('scheduler', {
  getScheduledEvents: () => ipcRenderer.invoke('scheduler:getScheduledEvents'),
  scheduleUpload: (uploadRequest) => ipcRenderer.invoke('scheduler:scheduleUpload', uploadRequest),
  cancelScheduledUpload: (uploadId) => ipcRenderer.invoke('scheduler:cancelScheduledUpload', uploadId),
  updateScheduledUpload: (id, updates) => ipcRenderer.invoke('scheduler:updateScheduledUpload', { id, updates }),
  postNow: (id) => ipcRenderer.invoke('scheduler:postNow', id)
});

// Account Management API Access
contextBridge.exposeInMainWorld('accounts', {
  getAll: () => ipcRenderer.invoke('accounts:getAll'),
  getForPlatform: (platform) => ipcRenderer.invoke('accounts:getForPlatform', platform),
  add: (platform, accountData) => ipcRenderer.invoke('accounts:add', { platform, accountData }),
  update: (id, updates) => ipcRenderer.invoke('accounts:update', { id, updates }),
  remove: (id) => ipcRenderer.invoke('accounts:remove', id),
  setDefault: (id) => ipcRenderer.invoke('accounts:setDefault', id),
resetAll: () => ipcRenderer.invoke('accounts:resetAll')
});

// Upload Manager API Access
contextBridge.exposeInMainWorld('uploadManager', {
  startGlobalUpload: (uploadRequests) => ipcRenderer.invoke('upload:startGlobalUpload', uploadRequests),
  cancelUpload: (uploadId) => ipcRenderer.invoke('upload:cancelUpload', uploadId),
  onUploadProgress: (callback) => {
    const subscription = (event, data) => callback(data);
    ipcRenderer.on('upload:progress', subscription);
    return () => ipcRenderer.removeListener('upload:progress', subscription);
  },
  onUploadComplete: (callback) => {
    const subscription = (event, data) => callback(data);
    ipcRenderer.on('upload:complete', subscription);
    return () => ipcRenderer.removeListener('upload:complete', subscription);
  },
  onUploadError: (callback) => {
    const subscription = (event, data) => callback(data);
    ipcRenderer.on('upload:error', subscription);
    return () => ipcRenderer.removeListener('upload:error', subscription);
  }
});

// Shell access for opening URLs
contextBridge.exposeInMainWorld('shell', {
  openExternal: (url) => shell.openExternal(url)
});