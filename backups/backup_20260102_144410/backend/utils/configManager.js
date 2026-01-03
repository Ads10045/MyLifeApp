const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '../config/agent-config.json');

// Ensure config directory exists
const configDir = path.dirname(CONFIG_PATH);
if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true });
}

// Default configuration
const DEFAULT_CONFIG = {
  fulfillment: {
    cleanupRange: {
      start: new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString(), // 1 year ago
      end: new Date().toISOString() // Now
    }
  }
};

class ConfigManager {
  constructor() {
    this.config = this.loadConfig();
  }

  loadConfig() {
    try {
      if (!fs.existsSync(CONFIG_PATH)) {
        this.saveConfig(DEFAULT_CONFIG);
        return DEFAULT_CONFIG;
      }
      const data = fs.readFileSync(CONFIG_PATH, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading config:', error);
      return DEFAULT_CONFIG;
    }
  }

  saveConfig(newConfig) {
    try {
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(newConfig, null, 2));
      this.config = newConfig;
    } catch (error) {
      console.error('Error saving config:', error);
    }
  }

  getFulfillmentConfig() {
    return this.config.fulfillment;
  }

  updateFulfillmentConfig(updates) {
    const current = this.config;
    current.fulfillment = { ...current.fulfillment, ...updates };
    this.saveConfig(current);
    return current.fulfillment;
  }
}

module.exports = new ConfigManager();
