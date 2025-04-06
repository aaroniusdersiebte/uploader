// src/renderer/components/DebugPanel.js
class DebugPanel {
    constructor() {
      this.init();
    }
  
    init() {
      this.createDebugButton();
    }
  
    createDebugButton() {
      // Erstelle einen kleinen Debug-Button in der unteren rechten Ecke
      const debugBtn = document.createElement('div');
      debugBtn.className = 'debug-button';
      debugBtn.innerHTML = 'D';
      debugBtn.title = 'Debug Panel öffnen';
      
      debugBtn.addEventListener('click', () => this.openDebugPanel());
      
      document.body.appendChild(debugBtn);
    }
  
    openDebugPanel() {
      const panel = document.createElement('div');
      panel.className = 'debug-panel';
      panel.innerHTML = `
        <div class="debug-header">
          <h3>Debug Panel</h3>
          <button class="close-btn" id="close-debug-btn">×</button>
        </div>
        <div class="debug-content">
          <button id="reset-accounts-btn" class="debug-btn">Accounts zurücksetzen</button>
          <button id="reset-oauth-btn" class="debug-btn">OAuth zurücksetzen</button>
          <button id="log-appdata-btn" class="debug-btn">App-Daten loggen</button>
          <div class="debug-log" id="debug-log"></div>
        </div>
      `;
      
      document.body.appendChild(panel);
      
      // Event-Listener
      document.getElementById('close-debug-btn').addEventListener('click', () => panel.remove());
      
      document.getElementById('reset-accounts-btn').addEventListener('click', async () => {
        try {
          if (window.accounts && window.accounts.resetAll) {
            const result = await window.accounts.resetAll();
            this.logMessage(result.success ? 'Accounts erfolgreich zurückgesetzt' : `Fehler: ${result.error}`);
            
            // Anwendung neu laden, um Änderungen zu sehen
            setTimeout(() => location.reload(), 1000);
          } else {
            this.logMessage('accounts.resetAll ist nicht verfügbar');
          }
        } catch (error) {
          this.logMessage(`Fehler: ${error.message}`);
        }
      });
      
      document.getElementById('reset-oauth-btn').addEventListener('click', async () => {
        try {
          if (window.app && window.app.resetOAuth) {
            const result = await window.app.resetOAuth();
            this.logMessage(result.success ? 'OAuth erfolgreich zurückgesetzt' : `Fehler: ${result.error}`);
          } else {
            this.logMessage('app.resetOAuth ist nicht verfügbar');
          }
        } catch (error) {
          this.logMessage(`Fehler: ${error.message}`);
        }
      });
      
      document.getElementById('log-appdata-btn').addEventListener('click', async () => {
        try {
          console.log('App-Daten:', {
            accounts: await window.accounts?.getAll(),
            theme: await window.app?.getTheme(),
            scheduler: await window.scheduler?.getScheduledEvents()
          });
          this.logMessage('App-Daten wurden in die Konsole geloggt (F12)');
        } catch (error) {
          this.logMessage(`Fehler: ${error.message}`);
        }
      });
    }
    
    logMessage(message) {
      const logElement = document.getElementById('debug-log');
      if (logElement) {
        const timestamp = new Date().toLocaleTimeString();
        logElement.innerHTML += `<div>[${timestamp}] ${message}</div>`;
        logElement.scrollTop = logElement.scrollHeight;
      }
    }
  }
  
  // Initialisieren
  document.addEventListener('DOMContentLoaded', () => {
    window.debugPanel = new DebugPanel();
  });