// src/renderer/components/AccountsPage.js
class AccountsPage {
    constructor(containerId) {
      this.container = document.getElementById(containerId);
      this.accounts = [];
      this.platforms = [
        { id: 'youtube', name: 'YouTube', icon: '🎬' },
        { id: 'tiktok', name: 'TikTok', icon: '📱' },
        { id: 'instagram', name: 'Instagram', icon: '📷' }
      ];
      this.init();
    }
  
    init() {
      this.loadAccounts().then(() => {
        this.render();
        this.attachEventListeners();
      });
    }
  
    render() {
      if (!this.container) return;
  
      let accountsByPlatform = {};
      this.platforms.forEach(platform => {
        accountsByPlatform[platform.id] = this.accounts.filter(account => 
          account.platform === platform.id
        );
      });
  
      this.container.innerHTML = `
        <div class="accounts-page">
          <div class="accounts-header">
            <h2>Connected Accounts</h2>
            <button id="add-account-btn" class="primary-button">Add Account</button>
          </div>
          
          <div class="accounts-content">
            ${this.platforms.map(platform => `
              <div class="platform-section">
                <div class="platform-header">
                  <div class="platform-icon">${platform.icon}</div>
                  <h3>${platform.name}</h3>
                </div>
                
                <div class="accounts-list">
                  ${accountsByPlatform[platform.id].length > 0 ? 
                    accountsByPlatform[platform.id].map(account => `
                      <div class="account-card ${account.isDefault ? 'default' : ''}" data-account-id="${account.id}">
                        <div class="account-card-header">
                          <div class="account-avatar">
                            ${account.icon ? 
                              `<img src="${account.icon}" alt="${account.name}" />` : 
                              `<div class="account-initials">${this.getInitials(account.name)}</div>`
                            }
                          </div>
                          <div class="account-info">
                            <div class="account-name">${account.name}</div>
                            <div class="account-email">${account.email || ''}</div>
                            ${account.isDefault ? '<div class="default-badge">Default</div>' : ''}
                          </div>
                          <div class="account-menu-btn" data-account-id="${account.id}">⋮</div>
                        </div>
                        
                        <div class="account-stats">
                          <div class="stat-item">
                            <div class="stat-value">${account.uploadCount || 0}</div>
                            <div class="stat-label">Uploads</div>
                          </div>
                          <div class="stat-item">
                            <div class="stat-value">${account.scheduleCount || 0}</div>
                            <div class="stat-label">Scheduled</div>
                          </div>
                        </div>
                        
                        <div class="account-actions">
                          <button class="secondary-button view-account-btn" data-account-id="${account.id}">View</button>
                          ${!account.isDefault ? 
                            `<button class="secondary-button set-default-btn" data-account-id="${account.id}">Set Default</button>` : 
                            ''
                          }
                        </div>
                      </div>
                    `).join('') : 
                    `<div class="no-accounts">
                      <p>No ${platform.name} accounts connected.</p>
                      <button class="secondary-button connect-account-btn" data-platform="${platform.id}">
                        Connect ${platform.name} Account
                      </button>
                    </div>`
                  }
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        
        <!-- Account Menu Popup (initially hidden) -->
        <div id="account-menu-popup" class="account-menu-popup hidden">
          <div class="menu-item view-item">View Account</div>
          <div class="menu-item edit-item">Edit Account</div>
          <div class="menu-item set-default-item">Set as Default</div>
          <div class="menu-item remove-item">Remove Account</div>
        </div>
      `;
    }
  
    attachEventListeners() {
      // Add Account button
      const addAccountBtn = document.getElementById('add-account-btn');
      if (addAccountBtn) {
        addAccountBtn.addEventListener('click', () => this.showAddAccountModal());
      }
      
      // Connect Account buttons
      const connectBtns = document.querySelectorAll('.connect-account-btn');
      connectBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const platform = btn.dataset.platform;
          this.showConnectAccountFlow(platform);
        });
      });
      
      // View Account buttons
      const viewBtns = document.querySelectorAll('.view-account-btn');
      viewBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const accountId = btn.dataset.accountId;
          this.viewAccount(accountId);
        });
      });
      
      // Set Default buttons
      const defaultBtns = document.querySelectorAll('.set-default-btn');
      defaultBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const accountId = btn.dataset.accountId;
          this.setDefaultAccount(accountId);
        });
      });
      
      // Account menu buttons
      const menuBtns = document.querySelectorAll('.account-menu-btn');
      menuBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const accountId = btn.dataset.accountId;
          this.showAccountMenu(accountId, e);
        });
      });
      
      // Make account cards clickable
      const accountCards = document.querySelectorAll('.account-card');
      accountCards.forEach(card => {
        card.addEventListener('click', () => {
          const accountId = card.dataset.accountId;
          this.viewAccount(accountId);
        });
      });
      
      // Close menu on click outside
      document.addEventListener('click', () => {
        const menuPopup = document.getElementById('account-menu-popup');
        if (menuPopup) {
          menuPopup.classList.add('hidden');
        }
      });
    }
  
    async loadAccounts() {
      try {
        if (window.accounts && window.accounts.getAll) {
          const result = await window.accounts.getAll();
          if (result.success) {
            this.accounts = result.accounts;
          } else {
            console.error('Error loading accounts:', result.error);
            this.accounts = [];
          }
        } else {
          console.error('accounts.getAll is not available');
          // Mock data for testing UI
          this.accounts = [
            {
              id: 'youtube1',
              platform: 'youtube',
              name: 'My YouTube Channel',
              email: 'user@example.com',
              icon: null,
              isDefault: true,
              uploadCount: 12,
              scheduleCount: 3
            },
            {
              id: 'youtube2',
              platform: 'youtube',
              name: 'Second Channel',
              email: 'user@example.com',
              icon: null,
              isDefault: false,
              uploadCount: 5,
              scheduleCount: 0
            },
            {
              id: 'tiktok1',
              platform: 'tiktok',
              name: 'TikTok Account',
              icon: null,
              isDefault: true,
              uploadCount: 8,
              scheduleCount: 1
            }
          ];
        }
      } catch (error) {
        console.error('Error loading accounts:', error);
        this.accounts = [];
      }
    }
  
    showAddAccountModal() {
      const modal = document.createElement('div');
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h3>Add New Account</h3>
            <button class="close-btn" id="close-modal-btn">×</button>
          </div>
          
          <div class="modal-body">
            <p>Select a platform to add a new account:</p>
            
            <div class="platform-selection">
              ${this.platforms.map(platform => `
                <div class="platform-option" data-platform="${platform.id}">
                  <div class="platform-icon">${platform.icon}</div>
                  <div class="platform-name">${platform.name}</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      // Close button
      const closeBtn = document.getElementById('close-modal-btn');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          modal.remove();
        });
      }
      
      // Platform options
      const platformOptions = modal.querySelectorAll('.platform-option');
      platformOptions.forEach(option => {
        option.addEventListener('click', () => {
          const platform = option.dataset.platform;
          modal.remove();
          this.showConnectAccountFlow(platform);
        });
      });
    }
  
    showConnectAccountFlow(platform) {
      let flowHtml = '';
      
      switch (platform) {
        case 'youtube':
          flowHtml = `
            <div class="flow-step">
              <h4>YouTube Account Connection</h4>
              <p>To connect your YouTube account, you need to set up YouTube API credentials first.</p>
              
              <div class="form-group">
                <label for="youtube-client-id">Client ID</label>
                <input type="text" id="youtube-client-id" class="form-control" placeholder="Google API Client ID">
              </div>
              
              <div class="form-group">
                <label for="youtube-client-secret">Client Secret</label>
                <input type="password" id="youtube-client-secret" class="form-control" placeholder="Google API Client Secret">
              </div>
              
              <div class="form-group">
                <label for="youtube-api-key">API Key</label>
                <input type="text" id="youtube-api-key" class="form-control" placeholder="Google API Key">
              </div>
              
              <p class="help-text">
                <a href="#" id="open-youtube-api-help">How to set up YouTube API credentials?</a>
              </p>
              
              <div class="form-actions">
                <button id="save-youtube-creds-btn" class="primary-button">Save Credentials</button>
                <button id="cancel-flow-btn" class="secondary-button">Cancel</button>
              </div>
            </div>
          `;
          break;
          
        case 'tiktok':
          flowHtml = `
            <div class="flow-step">
              <h4>TikTok Account Connection</h4>
              <p>Connect your TikTok account to upload videos directly.</p>
              
              <div class="form-group">
                <label for="tiktok-username">TikTok Username</label>
                <input type="text" id="tiktok-username" class="form-control" placeholder="@yourusername">
              </div>
              
              <div class="form-actions">
                <button id="connect-tiktok-btn" class="primary-button">Connect TikTok</button>
                <button id="cancel-flow-btn" class="secondary-button">Cancel</button>
              </div>
              
              <p class="note-text">
                Note: This will open TikTok's authorization page in your browser.
              </p>
            </div>
          `;
          break;
          
        case 'instagram':
          flowHtml = `
            <div class="flow-step">
              <h4>Instagram Account Connection</h4>
              <p>Connect your Instagram account to upload videos directly.</p>
              
              <div class="form-group">
                <label for="instagram-username">Instagram Username</label>
                <input type="text" id="instagram-username" class="form-control" placeholder="@yourusername">
              </div>
              
              <div class="form-actions">
                <button id="connect-instagram-btn" class="primary-button">Connect Instagram</button>
                <button id="cancel-flow-btn" class="secondary-button">Cancel</button>
              </div>
              
              <p class="note-text">
                Note: This will open Instagram's authorization page in your browser.
              </p>
            </div>
          `;
          break;
      }
      
      const modal = document.createElement('div');
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h3>Connect ${this.getPlatformName(platform)} Account</h3>
            <button class="close-btn" id="close-modal-btn">×</button>
          </div>
          
          <div class="modal-body">
            ${flowHtml}
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      // Close button
      const closeBtn = document.getElementById('close-modal-btn');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          modal.remove();
        });
      }
      
      // Cancel button
      const cancelBtn = document.getElementById('cancel-flow-btn');
      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
          modal.remove();
        });
      }
      
      // Platform-specific handlers
      switch (platform) {
        case 'youtube':
          const saveYoutubeCredsBtn = document.getElementById('save-youtube-creds-btn');
          const openYoutubeApiHelpLink = document.getElementById('open-youtube-api-help');
          
          if (saveYoutubeCredsBtn) {
            saveYoutubeCredsBtn.addEventListener('click', () => {
              this.saveYoutubeCredentials(modal);
            });
          }
          
          if (openYoutubeApiHelpLink) {
            openYoutubeApiHelpLink.addEventListener('click', (e) => {
              e.preventDefault();
              if (window.shell && window.shell.openExternal) {
                window.shell.openExternal('https://developers.google.com/youtube/v3/getting-started');
              }
            });
          }
          break;
          
        case 'tiktok':
          const connectTiktokBtn = document.getElementById('connect-tiktok-btn');
          
          if (connectTiktokBtn) {
            connectTiktokBtn.addEventListener('click', () => {
              this.initiateOAuthFlow('tiktok', modal);
            });
          }
          break;
          
        case 'instagram':
          const connectInstagramBtn = document.getElementById('connect-instagram-btn');
          
          if (connectInstagramBtn) {
            connectInstagramBtn.addEventListener('click', () => {
              this.initiateOAuthFlow('instagram', modal);
            });
          }
          break;
      }
      
      // Pre-fill API credentials if available
      this.loadApiCredentials(platform);
    }
  
    async loadApiCredentials(platform) {
      try {
        if (window.app && window.app.getApiSettings) {
          const result = await window.app.getApiSettings();
          
          if (platform === 'youtube') {
            const clientIdInput = document.getElementById('youtube-client-id');
            const clientSecretInput = document.getElementById('youtube-client-secret');
            const apiKeyInput = document.getElementById('youtube-api-key');
            
            if (clientIdInput && result.youtube) {
              clientIdInput.value = result.youtube.clientId || '';
            }
            
            if (clientSecretInput && result.youtube) {
              clientSecretInput.value = result.youtube.clientSecret || '';
            }
            
            if (apiKeyInput && result.youtube) {
              apiKeyInput.value = result.youtube.apiKey || '';
            }
          }
        }
      } catch (error) {
        console.error('Error loading API credentials:', error);
      }
    }
  
    async saveYoutubeCredentials(modal) {
      const clientId = document.getElementById('youtube-client-id').value;
      const clientSecret = document.getElementById('youtube-client-secret').value;
      const apiKey = document.getElementById('youtube-api-key').value;
      
      if (!clientId || !clientSecret || !apiKey) {
        alert('Please fill in all fields');
        return;
      }
      
      try {
        // Save API credentials
        if (window.app && window.app.saveApiConfig) {
          const result = await window.app.saveApiConfig('youtube', {
            clientId,
            clientSecret,
            apiKey
          });
          
          if (!result.success) {
            throw new Error(result.error || 'Failed to save API credentials');
          }
        }
        
        // Now proceed to OAuth authentication
        this.initiateYoutubeAuth(modal);
      } catch (error) {
        console.error('Error saving YouTube credentials:', error);
        alert('Error: ' + error.message);
      }
    }
  
    async initiateYoutubeAuth(modal) {
      try {
        // Update modal content to show authentication step
        const modalBody = modal.querySelector('.modal-body');
        if (modalBody) {
          modalBody.innerHTML = `
            <div class="flow-step">
              <h4>YouTube Authentication</h4>
              <p>Please authenticate with your YouTube account.</p>
              
              <div class="auth-status">
                <div class="status-indicator loading"></div>
                <span>Initiating authentication...</span>
              </div>
              
              <div class="form-actions" style="margin-top: 20px;">
                <button id="cancel-auth-btn" class="secondary-button">Cancel</button>
              </div>
            </div>
          `;
          
          // Add cancel button handler
          const cancelAuthBtn = document.getElementById('cancel-auth-btn');
          if (cancelAuthBtn) {
            cancelAuthBtn.addEventListener('click', () => {
              modal.remove();
            });
          }
        }
        
        // Start YouTube authentication
        if (window.youtube && window.youtube.authenticate) {
          const result = await window.youtube.authenticate();
          
          if (!result.success) {
            throw new Error(result.error || 'Authentication failed');
          }
          
          // Get channel info
          if (window.youtube && window.youtube.getChannelInfo) {
            const channelInfo = await window.youtube.getChannelInfo();
            
            if (!channelInfo.success) {
              throw new Error(channelInfo.error || 'Failed to get channel info');
            }
            
            // Add account
            if (window.accounts && window.accounts.add) {
              const addResult = await window.accounts.add('youtube', {
                name: channelInfo.channel.title,
                externalId: channelInfo.channel.id,
                icon: channelInfo.channel.thumbnailUrl,
                isDefault: true
              });
              
              if (!addResult.success) {
                throw new Error(addResult.error || 'Failed to add account');
              }
              
              // Show success message
              if (modalBody) {
                modalBody.innerHTML = `
                  <div class="flow-step">
                    <div class="success-animation">
                      <div class="success-checkmark">✓</div>
                    </div>
                    
                    <h4>Account Connected Successfully!</h4>
                    <p>Your YouTube channel "${channelInfo.channel.title}" has been connected.</p>
                    
                    <div class="form-actions">
                      <button id="finish-btn" class="primary-button">Finish</button>
                    </div>
                  </div>
                `;
                
                // Add finish button handler
                const finishBtn = document.getElementById('finish-btn');
                if (finishBtn) {
                  finishBtn.addEventListener('click', () => {
                    modal.remove();
                    this.loadAccounts().then(() => this.render());
                  });
                }
              }
            } else {
              throw new Error('accounts.add is not available');
            }
          } else {
            throw new Error('youtube.getChannelInfo is not available');
          }
        } else {
          throw new Error('youtube.authenticate is not available');
        }
      } catch (error) {
        console.error('Error during YouTube authentication:', error);
        
        // Show error message
        const modalBody = modal.querySelector('.modal-body');
        if (modalBody) {
          modalBody.innerHTML = `
            <div class="flow-step">
              <div class="error-animation">
                <div class="error-icon">!</div>
              </div>
              
              <h4>Authentication Failed</h4>
              <p>An error occurred: ${error.message}</p>
              
              <div class="form-actions">
                <button id="try-again-btn" class="primary-button">Try Again</button>
                <button id="cancel-auth-btn" class="secondary-button">Cancel</button>
              </div>
            </div>
          `;
          
          // Add button handlers
          const tryAgainBtn = document.getElementById('try-again-btn');
          const cancelAuthBtn = document.getElementById('cancel-auth-btn');
          
          if (tryAgainBtn) {
            tryAgainBtn.addEventListener('click', () => {
              this.showConnectAccountFlow('youtube');
              modal.remove();
            });
          }
          
          if (cancelAuthBtn) {
            cancelAuthBtn.addEventListener('click', () => {
              modal.remove();
            });
          }
        }
      }
    }
  
    initiateOAuthFlow(platform, modal) {
      // This method would initiate the OAuth flow for TikTok or Instagram
      // For now, let's just show a placeholder for the functionality
      
      // Update modal content
      const modalBody = modal.querySelector('.modal-body');
      if (modalBody) {
        modalBody.innerHTML = `
          <div class="flow-step">
            <div class="info-icon">ℹ️</div>
            <h4>Feature Not Available</h4>
            <p>
              ${this.getPlatformName(platform)} integration is currently under development.
              This feature will be available in a future release.
            </p>
            
            <div class="form-actions">
              <button id="close-info-btn" class="primary-button">Close</button>
            </div>
          </div>
        `;
        
        // Add close button handler
        const closeInfoBtn = document.getElementById('close-info-btn');
        if (closeInfoBtn) {
          closeInfoBtn.addEventListener('click', () => {
            modal.remove();
          });
        }
      }
    }
  
    showAccountMenu(accountId, event) {
      const account = this.accounts.find(acc => acc.id === accountId);
      if (!account) return;
      
      const menuPopup = document.getElementById('account-menu-popup');
      if (!menuPopup) return;
      
      // Position the menu
      const rect = event.target.getBoundingClientRect();
      menuPopup.style.top = `${rect.bottom + 5}px`;
      menuPopup.style.left = `${rect.left}px`;
      
      // Show the menu
      menuPopup.classList.remove('hidden');
      
      // Set default item visibility
      const defaultItem = menuPopup.querySelector('.set-default-item');
      if (defaultItem) {
        if (account.isDefault) {
          defaultItem.style.display = 'none';
        } else {
          defaultItem.style.display = 'block';
        }
      }
      
      // Attach event listeners
      const viewItem = menuPopup.querySelector('.view-item');
      const editItem = menuPopup.querySelector('.edit-item');
      const setDefaultItem = menuPopup.querySelector('.set-default-item');
      const removeItem = menuPopup.querySelector('.remove-item');
      
      // Remove any existing event listeners
      const clonedMenu = menuPopup.cloneNode(true);
      menuPopup.parentNode.replaceChild(clonedMenu, menuPopup);
      
      // Requery elements
      const newMenuPopup = document.getElementById('account-menu-popup');
      const newViewItem = newMenuPopup.querySelector('.view-item');
      const newEditItem = newMenuPopup.querySelector('.edit-item');
      const newSetDefaultItem = newMenuPopup.querySelector('.set-default-item');
      const newRemoveItem = newMenuPopup.querySelector('.remove-item');
      
      // Add new event listeners
      if (newViewItem) {
        newViewItem.addEventListener('click', (e) => {
          e.stopPropagation();
          newMenuPopup.classList.add('hidden');
          this.viewAccount(accountId);
        });
      }
      
      if (newEditItem) {
        newEditItem.addEventListener('click', (e) => {
          e.stopPropagation();
          newMenuPopup.classList.add('hidden');
          this.editAccount(accountId);
        });
      }
      
      if (newSetDefaultItem) {
        newSetDefaultItem.addEventListener('click', (e) => {
          e.stopPropagation();
          newMenuPopup.classList.add('hidden');
          this.setDefaultAccount(accountId);
        });
      }
      
      if (newRemoveItem) {
        newRemoveItem.addEventListener('click', (e) => {
          e.stopPropagation();
          newMenuPopup.classList.add('hidden');
          this.removeAccount(accountId);
        });
      }
      
      // Prevent event from bubbling up to document
      event.stopPropagation();
    }
  
    viewAccount(accountId) {
      const account = this.accounts.find(acc => acc.id === accountId);
      if (!account) return;
      
      const modal = document.createElement('div');
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h3>Account Details</h3>
            <button class="close-btn" id="close-modal-btn">×</button>
          </div>
          
          <div class="modal-body">
            <div class="account-detail-header">
              <div class="account-avatar large">
                ${account.icon ? 
                  `<img src="${account.icon}" alt="${account.name}" />` : 
                  `<div class="account-initials">${this.getInitials(account.name)}</div>`
                }
              </div>
              
              <div class="account-info">
                <h4 class="account-name">${account.name}</h4>
                <div class="account-platform">
                  <span class="platform-icon">${this.getPlatformIcon(account.platform)}</span>
                  <span>${this.getPlatformName(account.platform)}</span>
                  ${account.isDefault ? '<span class="default-badge">Default</span>' : ''}
                </div>
                ${account.email ? `<div class="account-email">${account.email}</div>` : ''}
              </div>
            </div>
            
            <div class="account-statistics">
              <h4>Activity Statistics</h4>
              <div class="stats-grid">
                <div class="stat-box">
                  <div class="stat-value">${account.uploadCount || 0}</div>
                  <div class="stat-label">Uploads</div>
                </div>
                <div class="stat-box">
                  <div class="stat-value">${account.scheduleCount || 0}</div>
                  <div class="stat-label">Scheduled</div>
                </div>
                <div class="stat-box">
                  <div class="stat-value">${account.viewCount || 0}</div>
                  <div class="stat-label">Views</div>
                </div>
              </div>
            </div>
            
            <div class="account-actions">
              <button id="edit-account-btn" class="secondary-button">Edit Account</button>
              ${!account.isDefault ? 
                `<button id="set-default-account-btn" class="secondary-button">Set as Default</button>` : 
                ''
              }
              <button id="remove-account-btn" class="danger-button">Remove Account</button>
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      // Close button
      const closeBtn = document.getElementById('close-modal-btn');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          modal.remove();
        });
      }
      
      // Edit button
      const editBtn = document.getElementById('edit-account-btn');
      if (editBtn) {
        editBtn.addEventListener('click', () => {
          modal.remove();
          this.editAccount(accountId);
        });
      }
      
      // Set default button
      const setDefaultBtn = document.getElementById('set-default-account-btn');
      if (setDefaultBtn) {
        setDefaultBtn.addEventListener('click', () => {
          modal.remove();
          this.setDefaultAccount(accountId);
        });
      }
      
      // Remove button
      const removeBtn = document.getElementById('remove-account-btn');
      if (removeBtn) {
        removeBtn.addEventListener('click', () => {
          modal.remove();
          this.removeAccount(accountId);
        });
      }
    }
  
    editAccount(accountId) {
      const account = this.accounts.find(acc => acc.id === accountId);
      if (!account) return;
      
      const modal = document.createElement('div');
      modal.className = 'modal-overlay';
      modal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h3>Edit Account</h3>
            <button class="close-btn" id="close-modal-btn">×</button>
          </div>
          
          <div class="modal-body">
            <div class="form-group">
              <label for="account-name">Account Name</label>
              <input type="text" id="account-name" class="form-control" value="${account.name}">
            </div>
            
            ${account.email ? `
              <div class="form-group">
                <label for="account-email">Email</label>
                <input type="email" id="account-email" class="form-control" value="${account.email}">
              </div>
            ` : ''}
            
            <div class="form-actions">
              <button id="save-account-btn" class="primary-button">Save Changes</button>
              <button id="cancel-edit-btn" class="secondary-button">Cancel</button>
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      // Close button
      const closeBtn = document.getElementById('close-modal-btn');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          modal.remove();
        });
      }
      
      // Cancel button
      const cancelBtn = document.getElementById('cancel-edit-btn');
      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
          modal.remove();
        });
      }
      
      // Save button
      const saveBtn = document.getElementById('save-account-btn');
      if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
          const nameInput = document.getElementById('account-name');
          const emailInput = document.getElementById('account-email');
          
          if (!nameInput.value.trim()) {
            alert('Please enter an account name');
            return;
          }
          
          try {
            const updates = {
              name: nameInput.value.trim()
            };
            
            if (emailInput) {
              updates.email = emailInput.value.trim();
            }
            
            if (window.accounts && window.accounts.update) {
              const result = await window.accounts.update(accountId, updates);
              
              if (!result.success) {
                throw new Error(result.error || 'Failed to update account');
              }
              
              // Refresh data and UI
              await this.loadAccounts();
              this.render();
              
              modal.remove();
            } else {
              throw new Error('accounts.update is not available');
            }
          } catch (error) {
            console.error('Error updating account:', error);
            alert('Error: ' + error.message);
          }
        });
      }
    }
  
    async setDefaultAccount(accountId) {
      try {
        if (window.accounts && window.accounts.setDefault) {
          const result = await window.accounts.setDefault(accountId);
          
          if (!result.success) {
            throw new Error(result.error || 'Failed to set default account');
          }
          
          // Refresh data and UI
          await this.loadAccounts();
          this.render();
        } else {
          throw new Error('accounts.setDefault is not available');
        }
      } catch (error) {
        console.error('Error setting default account:', error);
        alert('Error: ' + error.message);
      }
    }
  
    removeAccount(accountId) {
      const account = this.accounts.find(acc => acc.id === accountId);
      if (!account) return;
      
      const confirmModal = document.createElement('div');
      confirmModal.className = 'modal-overlay';
      confirmModal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h3>Remove Account</h3>
            <button class="close-btn" id="close-modal-btn">×</button>
          </div>
          
          <div class="modal-body">
            <p>Are you sure you want to remove the ${this.getPlatformName(account.platform)} account "${account.name}"?</p>
            
            <div class="warning-message">
              <div class="warning-icon">⚠️</div>
              <div>This will remove all upload history and scheduled uploads for this account.</div>
            </div>
            
            <div class="form-actions">
              <button id="confirm-remove-btn" class="danger-button">Remove Account</button>
              <button id="cancel-remove-btn" class="secondary-button">Cancel</button>
            </div>
          </div>
        </div>
      `;
      
      document.body.appendChild(confirmModal);
      
      // Close button
      const closeBtn = document.getElementById('close-modal-btn');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          confirmModal.remove();
        });
      }
      
      // Cancel button
      const cancelBtn = document.getElementById('cancel-remove-btn');
      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
          confirmModal.remove();
        });
      }
      
      // Confirm button
      const confirmBtn = document.getElementById('confirm-remove-btn');
      if (confirmBtn) {
        confirmBtn.addEventListener('click', async () => {
          try {
            if (window.accounts && window.accounts.remove) {
              const result = await window.accounts.remove(accountId);
              
              if (!result.success) {
                throw new Error(result.error || 'Failed to remove account');
              }
              
              // Refresh data and UI
              await this.loadAccounts();
              this.render();
              
              confirmModal.remove();
            } else {
              throw new Error('accounts.remove is not available');
            }
          } catch (error) {
            console.error('Error removing account:', error);
            alert('Error: ' + error.message);
          }
        });
      }
    }
  
    // Helper methods
    getInitials(name) {
      if (!name) return '?';
      
      const words = name.split(' ');
      if (words.length === 1) {
        return words[0].charAt(0).toUpperCase();
      }
      
      return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
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
    module.exports = AccountsPage;
  }