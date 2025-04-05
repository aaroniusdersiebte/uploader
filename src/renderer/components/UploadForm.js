class UploadForm {
    constructor(containerId) {
      this.container = document.getElementById(containerId);
      this.videoFile = null;
      this.thumbnailFile = null;
      this.uploadInProgress = false;
      this.init();
    }
  
    init() {
      this.render();
      this.attachEventListeners();
    }
  
    render() {
      if (!this.container) return;
  
      this.container.innerHTML = `
        <div class="upload-form">
          <h2>Video auf YouTube hochladen</h2>
          
          <div class="form-section">
            <h3>1. Video auswählen</h3>
            <div class="file-drop-area" id="video-drop-area">
              <div class="file-message">Video hierher ziehen oder</div>
              <button id="select-video-btn" class="secondary-button">Video auswählen</button>
              <div id="selected-video-info" class="selected-file-info"></div>
            </div>
          </div>
          
          <div class="form-section">
            <h3>2. Video-Details</h3>
            <div class="form-group">
              <label for="video-title">Titel*</label>
              <input type="text" id="video-title" class="form-control" placeholder="Gib deinem Video einen Namen" required>
            </div>
            
            <div class="form-group">
              <label for="video-description">Beschreibung</label>
              <textarea id="video-description" class="form-control" rows="4" placeholder="Beschreibe dein Video (Unterstützt Links, Hashtags und Timestamps)"></textarea>
            </div>
            
            <div class="form-group">
              <label for="video-tags">Tags (mit Komma getrennt)</label>
              <input type="text" id="video-tags" class="form-control" placeholder="tag1, tag2, tag3">
            </div>
          </div>
          
          <div class="form-section">
            <h3>3. Thumbnail</h3>
            <div class="thumbnail-section">
              <div class="thumbnail-preview" id="thumbnail-preview">
                <div class="thumbnail-placeholder">Keine Vorschau</div>
              </div>
              <button id="select-thumbnail-btn" class="secondary-button">Thumbnail auswählen</button>
            </div>
          </div>
          
          <div class="form-section">
            <h3>4. Einstellungen</h3>
            
            <div class="form-group">
              <label for="privacy-setting">Sichtbarkeit</label>
              <select id="privacy-setting" class="form-control">
                <option value="private">Privat</option>
                <option value="unlisted">Nicht gelistet</option>
                <option value="public">Öffentlich</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="video-category">Kategorie</label>
              <select id="video-category" class="form-control">
                <option value="1">Film & Animation</option>
                <option value="2">Autos & Fahrzeuge</option>
                <option value="10">Musik</option>
                <option value="15">Tiere</option>
                <option value="17">Sport</option>
                <option value="20">Gaming</option>
                <option value="22" selected>Menschen & Blogs</option>
                <option value="23">Komödie</option>
                <option value="24">Unterhaltung</option>
                <option value="25">Nachrichten & Politik</option>
                <option value="26">Praktische Tipps & Styling</option>
                <option value="27">Bildung</option>
                <option value="28">Wissenschaft & Technik</option>
              </select>
            </div>
            
            <div class="form-group checkbox-group">
              <label>
                <input type="checkbox" id="made-for-kids" name="made-for-kids">
                Dieses Video ist für Kinder gemacht
              </label>
            </div>
            
            <div class="form-group checkbox-group">
              <label>
                <input type="checkbox" id="allow-comments" name="allow-comments" checked>
                Kommentare erlauben
              </label>
            </div>
          </div>
          
          <div class="form-actions">
            <button id="cancel-upload-btn" class="cancel-button">Abbrechen</button>
            <button id="start-upload-btn" class="primary-button" disabled>Hochladen starten</button>
          </div>
        </div>
      `;
    }
  
    attachEventListeners() {
      const selectVideoBtn = document.getElementById('select-video-btn');
      const selectThumbnailBtn = document.getElementById('select-thumbnail-btn');
      const startUploadBtn = document.getElementById('start-upload-btn');
      const cancelUploadBtn = document.getElementById('cancel-upload-btn');
      const videoTitle = document.getElementById('video-title');
      const videoDropArea = document.getElementById('video-drop-area');
      
      // Video auswählen über Dialog
      if (selectVideoBtn) {
       // Für den Video-Auswahl-Button
selectVideoBtn.addEventListener('click', async () => {
  try {
    if (window.youtube && window.youtube.selectVideo) {
      const result = await window.youtube.selectVideo();
      if (!result.canceled) {
        this.videoFile = {
          name: result.fileName,
          path: result.filePath,
          size: this.formatFileSize(fs.statSync(result.filePath).size)
        };
        
        // Aktualisiere die UI
        const fileInfo = document.getElementById('selected-video-info');
        if (fileInfo) {
          fileInfo.innerHTML = `
            <div class="file-icon">📹</div>
            <div class="file-details">
              <div class="file-name">${this.videoFile.name}</div>
              <div class="file-meta">${this.videoFile.size}</div>
            </div>
          `;
        }
        
        // Upload-Button aktivieren wenn ein Titel eingegeben wurde
        const videoTitle = document.getElementById('video-title');
        const startUploadBtn = document.getElementById('start-upload-btn');
        if (startUploadBtn && videoTitle) {
          startUploadBtn.disabled = !videoTitle.value.trim();
        }
      }
    } else {
      alert('Video-Auswahl-Funktion nicht verfügbar');
    }
  } catch (error) {
    console.error('Fehler bei der Video-Auswahl:', error);
    alert('Fehler bei der Video-Auswahl: ' + error.message);
  }
});

// Für den Start-Upload-Button
startUploadBtn.addEventListener('click', async () => {
  if (!this.videoFile) {
    alert('Bitte wähle zuerst ein Video aus');
    return;
  }
  
  try {
    // Sammle die Metadaten aus dem Formular
    const metadata = {
      title: document.getElementById('video-title').value,
      description: document.getElementById('video-description').value,
      tags: document.getElementById('video-tags').value.split(',').map(tag => tag.trim()).filter(tag => tag),
      privacy: document.getElementById('privacy-setting').value,
      categoryId: document.getElementById('video-category').value,
      madeForKids: document.getElementById('made-for-kids').checked
      // Weitere Metadaten hier
    };
    
    // Zeige Lade-Overlay
    this.showUploadOverlay();
    
    if (window.youtube && window.youtube.uploadVideo) {
      // Registriere Fortschritts-Callback
      if (window.youtube.onUploadProgress) {
        window.youtube.onUploadProgress(progress => {
          this.updateUploadProgress(progress);
        });
      }
      
      // Führe den Upload durch
      const result = await window.youtube.uploadVideo({
        videoPath: this.videoFile.path,
        metadata: metadata
      });
      
      if (result.success) {
        // Erfolg - Wenn Thumbnail vorhanden, lade es auch hoch
        if (this.thumbnailFile && window.youtube.uploadThumbnail) {
          await window.youtube.uploadThumbnail({
            videoId: result.videoId,
            thumbnailPath: this.thumbnailFile.path
          });
        }
        
        this.handleUploadSuccess(result.videoId);
      } else {
        throw new Error(result.error || 'Unbekannter Fehler beim Upload');
      }
    } else {
      alert('Upload-Funktion nicht verfügbar');
    }
  } catch (error) {
    console.error('Fehler beim Upload:', error);
    this.handleUploadError(error.message);
  }
});
      }
      
      // Video per Drag & Drop
      if (videoDropArea) {
        videoDropArea.addEventListener('dragover', (e) => {
          e.preventDefault();
          e.stopPropagation();
          videoDropArea.classList.add('drag-over');
        });
        
        videoDropArea.addEventListener('dragleave', (e) => {
          e.preventDefault();
          e.stopPropagation();
          videoDropArea.classList.remove('drag-over');
        });
        
        videoDropArea.addEventListener('drop', (e) => {
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
      
      // Thumbnail auswählen
      if (selectThumbnailBtn) {
        selectThumbnailBtn.addEventListener('click', () => this.selectThumbnailFile());
      }
      
      // Upload starten-Knopf aktivieren, wenn ein Titel eingegeben wurde
      if (videoTitle && startUploadBtn) {
        videoTitle.addEventListener('input', () => {
          startUploadBtn.disabled = !videoTitle.value.trim() || !this.videoFile;
        });
      }
      
      // Upload starten
      if (startUploadBtn) {
        startUploadBtn.addEventListener('click', () => this.startUpload());
      }
      
      // Upload abbrechen
      if (cancelUploadBtn) {
        cancelUploadBtn.addEventListener('click', () => this.cancelUpload());
      }
    }
  
    async selectVideoFile() {
      try {

        console.log("YouTube API verfügbar?", window.youtube ? "Ja" : "Nein");
    console.log("YouTube selectVideo verfügbar?", window.youtube && window.youtube.selectVideo ? "Ja" : "Nein");
    if (window.youtube && window.youtube.selectVideo) {
          const result = await window.youtube.selectVideo();
          
          if (!result.canceled) {
            this.handleSelectedVideo({
              name: result.fileName,
              path: result.filePath,
              size: '...',  // Die Größe würde vom Backend kommen
              type: this.getFileTypeFromName(result.fileName)
            });
          }
        } else {
          alert('Die YouTube API ist nicht richtig verbunden. Bitte starten Sie die App neu oder überprüfen Sie die Konsole auf Fehler.');
          return;
        }
        
        
      } catch (error) {
        console.error('Fehler beim Auswählen des Videos:', error);
        this.showErrorMessage('Das Video konnte nicht ausgewählt werden.');
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
            <div class="file-meta">${videoInfo.size || 'Unbekannte Größe'} ${videoInfo.duration ? '• ' + videoInfo.duration : ''}</div>
          </div>
        `;
        
        // Upload-Button aktivieren, wenn ein Titel eingegeben wurde
        const videoTitle = document.getElementById('video-title');
        const startUploadBtn = document.getElementById('start-upload-btn');
        if (startUploadBtn && videoTitle) {
          startUploadBtn.disabled = !videoTitle.value.trim();
        }
      }
    }
  
    async selectThumbnailFile() {
      try {
        if (window.youtube && window.youtube.selectThumbnail) {
          const result = await window.youtube.selectThumbnail();
          
          if (!result.canceled) {
            this.handleSelectedThumbnail({
              name: result.fileName,
              path: result.filePath
            });
          }
        } else {
          // Fallback für Test-Modus
          this.handleSelectedThumbnail({
            name: 'beispiel_thumbnail.jpg',
            path: '/pfad/zu/beispiel_thumbnail.jpg'
          });
        }
      } catch (error) {
        console.error('Fehler beim Auswählen des Thumbnails:', error);
        this.showErrorMessage('Das Thumbnail konnte nicht ausgewählt werden.');
      }
    }
  
    handleSelectedThumbnail(thumbnailInfo) {
      this.thumbnailFile = thumbnailInfo;
      
      const thumbnailPreview = document.getElementById('thumbnail-preview');
      if (thumbnailPreview) {
        if (window.electron && this.thumbnailFile.path) {
          // Echte Vorschau aus der Datei laden, falls Electron vorhanden
          thumbnailPreview.innerHTML = `
            <img src="${this.thumbnailFile.path}" alt="Thumbnail" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;" />
          `;
        } else {
          // Fallback-Anzeige
          thumbnailPreview.innerHTML = `
            <div class="thumbnail-img">
              <div class="placeholder-thumbnail" style="background-color: var(--accent-color);">
                <span>Thumbnail: ${this.thumbnailFile.name}</span>
              </div>
            </div>
          `;
        }
      }
    }
  
    async startUpload() {
      if (!this.videoFile || this.uploadInProgress) return;
      
      this.uploadInProgress = true;
      const startUploadBtn = document.getElementById('start-upload-btn');
      if (startUploadBtn) {
        startUploadBtn.disabled = true;
        startUploadBtn.textContent = 'Wird hochgeladen...';
      }
      
      try {
        // Sammle die Metadaten
        const metadata = this.collectMetadata();
        
        // Zeige das Upload-Overlay
        this.showUploadOverlay();
        
        // Starte den Upload mit der YouTube API
        if (window.youtube && window.youtube.uploadVideo) {
          // Registriere den Fortschritts-Callback
          if (window.youtube.onUploadProgress) {
            window.youtube.onUploadProgress(this.updateUploadProgress.bind(this));
          }
          
          // Führe den Upload durch
          const result = await window.youtube.uploadVideo({
            videoPath: this.videoFile.path,
            metadata: metadata
          });
          
          if (result.success) {
            // Wenn ein Thumbnail ausgewählt wurde, lade dieses auch hoch
            if (this.thumbnailFile && window.youtube.uploadThumbnail) {
              await window.youtube.uploadThumbnail({
                videoId: result.videoId,
                thumbnailPath: this.thumbnailFile.path
              });
            }
            
            // Upload abgeschlossen
            this.handleUploadSuccess(result.videoId);
          } else {
            throw new Error(result.error || 'Unbekannter Fehler beim Upload');
          }
        } else {
          console.error('YouTube API not available');
          this.handleUploadError('Die YouTube API ist nicht verfügbar. Bitte überprüfen Sie Ihre Einstellungen und Verbindung.');
        }
      } catch (error) {
        console.error('Fehler beim Hochladen:', error);
        this.handleUploadError(error.message);
      }
    }
  
    collectMetadata() {
      return {
        title: document.getElementById('video-title').value,
        description: document.getElementById('video-description').value,
        tags: document.getElementById('video-tags').value.split(',').map(tag => tag.trim()).filter(tag => tag),
        privacy: document.getElementById('privacy-setting').value,
        categoryId: document.getElementById('video-category').value,
        madeForKids: document.getElementById('made-for-kids').checked,
        allowComments: document.getElementById('allow-comments').checked
      };
    }
  
    showUploadOverlay() {
      // Erstelle Upload-Overlay dynamisch
      const overlay = document.createElement('div');
      overlay.className = 'upload-overlay';
      overlay.id = 'upload-overlay';
      overlay.innerHTML = `
        <div class="overlay-container">
          <div class="overlay-close" id="overlay-close">×</div>
          <h2>Uploading to YouTube</h2>
          
          <div class="progress-section">
            <div class="progress-circle">
              <svg class="progress-svg" viewBox="0 0 100 100">
                <circle class="progress-circle-bg" cx="50" cy="50" r="48"></circle>
                <circle class="progress-circle-fill" cx="50" cy="50" r="48"></circle>
              </svg>
              <div class="progress-percentage">0%</div>
            </div>
            
            <div class="progress-details">
              <div class="upload-file">${this.videoFile.name}</div>
              <div class="upload-status">Uploading...</div>
              <div class="upload-time">Initialisiere...</div>
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(overlay);
      
      // Füge CSS für das Overlay hinzu, falls es noch nicht in der Haupt-CSS ist
      if (!document.querySelector('style#upload-overlay-style')) {
        const style = document.createElement('style');
        style.id = 'upload-overlay-style';
        style.textContent = `
          .upload-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.75);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            backdrop-filter: blur(5px);
          }
          
          .overlay-container {
            width: 400px;
            background-color: #1A1A1A;
            border-radius: 16px;
            padding: 24px;
            position: relative;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          }
          
          .overlay-close {
            position: absolute;
            top: 16px;
            right: 16px;
            width: 24px;
            height: 24px;
            border-radius: 12px;
            background-color: #333;
            color: #999;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 18px;
          }
          
          .progress-section {
            display: flex;
            align-items: center;
            margin: 24px 0;
          }
          
          .progress-circle {
            width: 64px;
            height: 64px;
            position: relative;
            margin-right: 20px;
          }
          
          svg.progress-svg {
            transform: rotate(-90deg);
            width: 100%;
            height: 100%;
          }
          
          circle.progress-circle-bg {
            stroke: #333;
            fill: none;
            stroke-width: 4;
          }
          
          circle.progress-circle-fill {
            stroke: var(--accent-color);
            fill: none;
            stroke-width: 4;
            stroke-dasharray: 301;
            stroke-dashoffset: 301;
            stroke-linecap: round;
            transition: stroke-dashoffset 0.5s ease;
          }
          
          .progress-details {
            flex-grow: 1;
          }
          
          .progress-percentage {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-size: 14px;
            font-weight: 500;
          }
          
          .upload-file {
            font-weight: 500;
            margin-bottom: 8px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 250px;
          }
          
          .upload-status {
            margin-bottom: 4px;
          }
          
          .upload-time {
            font-size: 12px;
            color: #999;
          }
        `;
        
        document.head.appendChild(style);
      }
      
      // "X" zum Schließen
      const closeBtn = document.getElementById('overlay-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          // Frage, ob der Upload wirklich abgebrochen werden soll
          if (confirm('Möchtest du den Upload wirklich abbrechen?')) {
            this.cancelUpload();
          }
        });
      }
    }
  
    updateUploadProgress(progress) {
      const progressCircle = document.querySelector('.progress-circle-fill');
      const progressText = document.querySelector('.progress-percentage');
      const uploadStatus = document.querySelector('.upload-status');
      const uploadTime = document.querySelector('.upload-time');
      
      if (progressCircle && progressText) {
        const dashOffset = 301 - (301 * progress.progress / 100);
        progressCircle.style.strokeDashoffset = dashOffset;
        progressText.textContent = `${progress.progress}%`;
        
        if (uploadStatus && progress.status) {
          uploadStatus.textContent = progress.status;
        }
        
        if (uploadTime && progress.timeRemaining) {
          uploadTime.textContent = progress.timeRemaining;
        }
        
        // Bei 100% zeige "Verarbeitung..." an
        if (progress.progress >= 100 && uploadStatus) {
          uploadStatus.textContent = 'Verarbeitung...';
          if (uploadTime) {
            uploadTime.textContent = 'Das Video wird von YouTube verarbeitet';
          }
        }
      }
    }
  
    simulateUpload() {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 1;
        
        this.updateUploadProgress({
          progress: progress,
          status: progress < 100 ? 'Uploading...' : 'Verarbeitung...',
          timeRemaining: progress < 100 ? `Etwa ${Math.floor((100 - progress) / 5)} Sekunden verbleibend` : 'Das Video wird von YouTube verarbeitet'
        });
        
        if (progress >= 100) {
          clearInterval(interval);
          
          // Simuliere Verarbeitungszeit
          setTimeout(() => {
            this.handleUploadSuccess('dQw4w9WgXcQ'); // Platzhalter-Video-ID
          }, 2000);
        }
      }, 50);
    }
  
    handleUploadSuccess(videoId) {
      const overlay = document.getElementById('upload-overlay');
      if (overlay) {
        const overlayContainer = overlay.querySelector('.overlay-container');
        if (overlayContainer) {
          overlayContainer.innerHTML = `
            <h2>Upload erfolgreich!</h2>
            <div class="success-animation">
              <div class="success-checkmark">✓</div>
            </div>
            <p>Dein Video wurde erfolgreich hochgeladen und ist jetzt auf YouTube verfügbar.</p>
            <div class="success-actions">
              <a href="https://www.youtube.com/watch?v=${videoId}" target="_blank" class="primary-button">Video ansehen</a>
              <button id="success-close" class="secondary-button">Schließen</button>
            </div>
          `;
          
          // Zusätzliches CSS für den Erfolgsbildschirm
          const style = document.createElement('style');
          style.textContent = `
            .success-animation {
              display: flex;
              justify-content: center;
              margin: 32px 0;
            }
            
            .success-checkmark {
              width: 64px;
              height: 64px;
              background-color: var(--accent-color);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 32px;
              color: white;
              animation: scaleIn 0.5s ease;
            }
            
            @keyframes scaleIn {
              0% { transform: scale(0); }
              70% { transform: scale(1.1); }
              100% { transform: scale(1); }
            }
            
            .success-actions {
              display: flex;
              justify-content: center;
              gap: 16px;
              margin-top: 24px;
            }
          `;
          
          document.head.appendChild(style);
          
          // Event-Listener für den Schließen-Button
          const successCloseBtn = document.getElementById('success-close');
          if (successCloseBtn) {
            successCloseBtn.addEventListener('click', () => {
              if (overlay) {
                overlay.remove();
              }
              this.resetForm();
            });
          }
        }
      }
      
      this.uploadInProgress = false;
      
      // Reset the upload button
      const startUploadBtn = document.getElementById('start-upload-btn');
      if (startUploadBtn) {
        startUploadBtn.disabled = false;
        startUploadBtn.textContent = 'Hochladen starten';
      }
    }
  
    handleUploadError(errorMessage) {
      const overlay = document.getElementById('upload-overlay');
      if (overlay) {
        const overlayContainer = overlay.querySelector('.overlay-container');
        if (overlayContainer) {
          overlayContainer.innerHTML = `
            <h2>Upload fehlgeschlagen</h2>
            <div class="error-animation">
              <div class="error-icon">!</div>
            </div>
            <p>Beim Hochladen deines Videos ist ein Fehler aufgetreten:</p>
            <div class="error-message">${errorMessage}</div>
            <div class="error-actions">
              <button id="try-again" class="primary-button">Erneut versuchen</button>
              <button id="error-close" class="secondary-button">Abbrechen</button>
            </div>
          `;
          
          // Zusätzliches CSS für den Fehlerbildschirm
          const style = document.createElement('style');
          style.textContent = `
            .error-animation {
              display: flex;
              justify-content: center;
              margin: 32px 0;
            }
            
            .error-icon {
              width: 64px;
              height: 64px;
              background-color: #ff453a;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 32px;
              font-weight: bold;
              color: white;
            }
            
            .error-message {
              background-color: #2a2a2a;
              border-radius: 8px;
              padding: 12px;
              margin: 16px 0;
              color: #ff453a;
            }
            
            .error-actions {
              display: flex;
              justify-content: center;
              gap: 16px;
              margin-top: 24px;
            }
          `;
          
          document.head.appendChild(style);
          
          // Event-Listener für den Erneut-versuchen-Button
          const tryAgainBtn = document.getElementById('try-again');
          if (tryAgainBtn) {
            tryAgainBtn.addEventListener('click', () => {
              if (overlay) {
                overlay.remove();
              }
              this.startUpload();
            });
          }
          
          // Event-Listener für den Schließen-Button
          const errorCloseBtn = document.getElementById('error-close');
          if (errorCloseBtn) {
            errorCloseBtn.addEventListener('click', () => {
              if (overlay) {
                overlay.remove();
              }
            });
          }
        }
      }
      
      this.uploadInProgress = false;
      
      // Reset the upload button
      const startUploadBtn = document.getElementById('start-upload-btn');
      if (startUploadBtn) {
        startUploadBtn.disabled = false;
        startUploadBtn.textContent = 'Hochladen starten';
      }
    }
  
    cancelUpload() {
      // Entferne das Overlay
      const overlay = document.getElementById('upload-overlay');
      if (overlay) {
        overlay.remove();
      }
      
      this.uploadInProgress = false;
      
      // Reset the upload button
      const startUploadBtn = document.getElementById('start-upload-btn');
      if (startUploadBtn) {
        startUploadBtn.disabled = false;
        startUploadBtn.textContent = 'Hochladen starten';
      }
      
      // Hier würde in einer echten Implementierung der Upload abgebrochen werden
    }
  
    resetForm() {
      // Gehe zurück zum Dashboard
      const dashboardNav = document.querySelector('.sidebar-nav-item[data-page="Dashboard"]');
      if (dashboardNav) {
        dashboardNav.click();
      }
      
      // Formularfelder zurücksetzen für den nächsten Upload
      document.getElementById('video-title').value = '';
      document.getElementById('video-description').value = '';
      document.getElementById('video-tags').value = '';
      document.getElementById('privacy-setting').value = 'private';
      document.getElementById('video-category').value = '22';
      document.getElementById('made-for-kids').checked = false;
      document.getElementById('allow-comments').checked = true;
      
      // Datei-Auswahl zurücksetzen
      this.videoFile = null;
      this.thumbnailFile = null;
      
      const fileInfo = document.getElementById('selected-video-info');
      if (fileInfo) {
        fileInfo.innerHTML = '';
      }
      
      const thumbnailPreview = document.getElementById('thumbnail-preview');
      if (thumbnailPreview) {
        thumbnailPreview.innerHTML = `<div class="thumbnail-placeholder">Keine Vorschau</div>`;
      }
      
      // Upload-Button deaktivieren
      const startUploadBtn = document.getElementById('start-upload-btn');
      if (startUploadBtn) {
        startUploadBtn.disabled = true;
      }
    }
  
    showErrorMessage(message) {
      alert(message);
    }
  
    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
  
    getFileTypeFromName(fileName) {
      const extension = fileName.split('.').pop().toLowerCase();
      const videoTypes = {
        'mp4': 'video/mp4',
        'mov': 'video/quicktime',
        'avi': 'video/x-msvideo',
        'wmv': 'video/x-ms-wmv',
        'flv': 'video/x-flv',
        'mkv': 'video/x-matroska',
        'webm': 'video/webm'
      };
      
      return videoTypes[extension] || 'video/mp4';
    }
  }
  
  // Exportieren für die Verwendung in anderen Dateien
  if (typeof module !== 'undefined') {
    module.exports = UploadForm;
  }