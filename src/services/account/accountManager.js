// src/services/account/accountManager.js
const fs = require('fs');
const path = require('path');
const { app } = require('electron');
const { v4: uuidv4 } = require('uuid');

class AccountManager {
  constructor() {
    this.dbPath = path.join(app.getPath('userData'), 'accounts.json');
    this.accounts = [];
    
    // Initialize database file
    this.initDb();
    
    // Load existing accounts
    this.loadAccounts();
  }

  initDb() {
    try {
      if (!fs.existsSync(this.dbPath)) {
        // Create initial structure with empty accounts
        const initialData = {
          youtube: [],
          tiktok: [],
          instagram: []
        };
        fs.writeFileSync(this.dbPath, JSON.stringify(initialData, null, 2), 'utf8');
      }
    } catch (error) {
      console.error('Error initializing account database:', error);
    }
  }
  // Füge diese Funktion zur AccountManager Klasse hinzu
  resetAccounts() {
    this.accounts = [];
    this.saveAccounts();
    return true;
  }
  loadAccounts() {
    try {
      const data = fs.readFileSync(this.dbPath, 'utf8');
      const accountsByPlatform = JSON.parse(data);
      
      // Convert to flat array with platform info
      this.accounts = [];
      
      Object.entries(accountsByPlatform).forEach(([platform, accounts]) => {
        accounts.forEach(account => {
          this.accounts.push({
            ...account,
            platform
          });
        });
      });
      
    } catch (error) {
      console.error('Error loading accounts:', error);
      this.accounts = [];
    }
  }

  saveAccounts() {
    try {
      // Convert flat array back to platform-based structure
      const accountsByPlatform = {
        youtube: [],
        tiktok: [],
        instagram: []
      };
      
      this.accounts.forEach(account => {
        const { platform, ...accountData } = account;
        if (accountsByPlatform[platform]) {
          accountsByPlatform[platform].push(accountData);
        }
      });
      
      fs.writeFileSync(this.dbPath, JSON.stringify(accountsByPlatform, null, 2), 'utf8');
    } catch (error) {
      console.error('Error saving accounts:', error);
    }
  }

  /**
   * Get all accounts
   * @returns {Array} - All accounts across all platforms
   */
  getAllAccounts() {
    return [...this.accounts];
  }

  /**
   * Get accounts for a specific platform
   * @param {string} platform - Platform identifier (e.g., 'youtube')
   * @returns {Array} - Accounts for the specified platform
   */
  getAccountsForPlatform(platform) {
    return this.accounts.filter(account => account.platform === platform);
  }

  /**
   * Get account by ID
   * @param {string} id - Account ID
   * @returns {Object|null} - Account or null if not found
   */
  getAccountById(id) {
    return this.accounts.find(account => account.id === id) || null;
  }

  /**
   * Add a new account
   * @param {string} platform - Platform identifier
   * @param {Object} accountData - Account data
   * @returns {Object} - The new account
   */
  addAccount(platform, accountData) {
    // Generate ID if not provided
    if (!accountData.id) {
      accountData.id = uuidv4();
    }
    
    // Set default values
    const newAccount = {
      ...accountData,
      platform,
      createdAt: new Date().toISOString()
    };
    
    // Add to accounts list
    this.accounts.push(newAccount);
    
    // Save to file
    this.saveAccounts();
    
    return newAccount;
  }

  /**
   * Update an existing account
   * @param {string} id - Account ID
   * @param {Object} updates - Account data updates
   * @returns {Object|null} - Updated account or null if not found
   */
  updateAccount(id, updates) {
    const index = this.accounts.findIndex(account => account.id === id);
    
    if (index === -1) {
      return null;
    }
    
    // Update account data
    this.accounts[index] = {
      ...this.accounts[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    // Save to file
    this.saveAccounts();
    
    return this.accounts[index];
  }

  /**
   * Remove an account
   * @param {string} id - Account ID
   * @returns {boolean} - True if account was removed, false if not found
   */
  removeAccount(id) {
    const index = this.accounts.findIndex(account => account.id === id);
    
    if (index === -1) {
      return false;
    }
    
    // Remove account
    this.accounts.splice(index, 1);
    
    // Save to file
    this.saveAccounts();
    
    return true;
  }

  /**
   * Set an account as default for its platform
   * @param {string} id - Account ID
   * @returns {boolean} - True if account was set as default, false if not found
   */
  setDefaultAccount(id) {
    const account = this.accounts.find(account => account.id === id);
    
    if (!account) {
      return false;
    }
    
    // Reset all accounts of same platform to non-default
    this.accounts.forEach(acc => {
      if (acc.platform === account.platform) {
        acc.isDefault = false;
      }
    });
    
    // Set this account as default
    account.isDefault = true;
    
    // Save to file
    this.saveAccounts();
    
    return true;
  }

  /**
   * Get the default account for a platform
   * @param {string} platform - Platform identifier
   * @returns {Object|null} - Default account or null if none found
   */
  getDefaultAccount(platform) {
    return this.accounts.find(account => 
      account.platform === platform && account.isDefault
    ) || null;
  }

  /**
   * Check if an account exists by external ID (e.g., channel ID)
   * @param {string} platform - Platform identifier
   * @param {string} externalId - External ID
   * @returns {boolean} - True if account exists
   */
  accountExistsByExternalId(platform, externalId) {
    return this.accounts.some(account => 
      account.platform === platform && account.externalId === externalId
    );
  }

}

module.exports = AccountManager;