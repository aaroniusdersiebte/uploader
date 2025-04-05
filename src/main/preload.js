// src/main/preload.js
const { contextBridge, ipcRenderer } = require('electron');

// YouTube API Zugriff
contextBridge.exposeInMainWorld('app', {
    getApiSettings: () => ipcRenderer.invoke('app:getApiSettings'),
    saveApiConfig: (config) => ipcRenderer.invoke('app:saveApiConfig', config)
});


contextBridge.exposeInMainWorld('youtube', {
  selectVideo: () => ipcRenderer.invoke('youtube:selectVideo'),
  selectThumbnail: () => ipcRenderer.invoke('youtube:selectThumbnail'),
  uploadVideo: (data) => ipcRenderer.invoke('youtube:uploadVideo', data),
  uploadThumbnail: (data) => ipcRenderer.invoke('youtube:uploadThumbnail', data),
  onUploadProgress: (callback) => {
    const subscription = (event, data) => callback(data);
    ipcRenderer.on('youtube:uploadProgress', subscription);
    return () => ipcRenderer.removeListener('youtube:uploadProgress', subscription);
  }
});