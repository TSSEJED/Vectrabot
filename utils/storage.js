/**
 * @file utils/storage.js
 * @description Lightweight JSON-based persistent storage utility.
 * Allows modules to maintain their own data "logs" (e.g., giveaways.json, settings.json).
 *
 * © 2026 Cortex HQ & bot-hosting.net
 */

const fs = require("fs");
const path = require("path");

class Storage {
  constructor(dataDir = "data") {
    this.dataDir = path.join(process.cwd(), dataDir);
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    this.cache = {};
  }

  /**
   * Load data from a JSON file into memory.
   * @param {string} module - The name of the module/file (e.g., 'giveaways').
   * @returns {object} The loaded data or an empty object.
   */
  load(module) {
    if (this.cache[module]) return this.cache[module];

    const filePath = path.join(this.dataDir, `${module}.json`);
    if (fs.existsSync(filePath)) {
      try {
        const data = fs.readFileSync(filePath, "utf8");
        this.cache[module] = JSON.parse(data);
        return this.cache[module];
      } catch (err) {
        console.error(`[Storage] Failed to load module '${module}':`, err.message);
        this.cache[module] = {};
        return {};
      }
    }

    this.cache[module] = {};
    return {};
  }

  /**
   * Save data from memory to a JSON file.
   * @param {string} module - The name of the module/file.
   */
  save(module) {
    if (!this.cache[module]) return;

    const filePath = path.join(this.dataDir, `${module}.json`);
    try {
      fs.writeFileSync(filePath, JSON.stringify(this.cache[module], null, 2), "utf8");
    } catch (err) {
      console.error(`[Storage] Failed to save module '${module}':`, err.message);
    }
  }

  /**
   * Get a value from a module's storage.
   * @param {string} module - Module name.
   * @param {string} key - Key to retrieve.
   * @returns {any}
   */
  get(module, key) {
    const data = this.load(module);
    return data[key];
  }

  /**
   * Set a value in a module's storage and persist it.
   * @param {string} module - Module name.
   * @param {string} key - Key to set.
   * @param {any} value - Value to store.
   */
  set(module, key, value) {
    const data = this.load(module);
    data[key] = value;
    this.save(module);
  }

  /**
   * Get the entire data object for a module.
   * @param {string} module - Module name.
   * @returns {object}
   */
  getAll(module) {
    return this.load(module);
  }

  /**
   * Remove a key from a module's storage.
   * @param {string} module - Module name.
   * @param {string} key - Key to delete.
   */
  delete(module, key) {
    const data = this.load(module);
    delete data[key];
    this.save(module);
  }
}

module.exports = new Storage();
