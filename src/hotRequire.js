const fs = require("fs");
const path = require("path");
const { EventEmitter } = require("events");

/**
 * Represents a module that can be hot-reloaded.
 */
class HotModule {
  /**
   * Create a HotModule instance.
   * @param {string} filePath - The path to the module file.
   */
  constructor(filePath) {
    this.filePath = filePath;
    this.instance = this._loadModule();
  }

  /**
   * Load and process a module.
   * @private
   * @returns {Object} - The loaded module instance.
   */
  _loadModule() {
    const instance = require(this.filePath);
    Object.entries(instance).forEach(([key, func]) => {
      func.__name = { path: this.filePath, name: key };
    });
    return instance;
  }

  /**
   * Refresh the current module instance.
   */
  refreshModule() {
    this.cacheTime = Date.now();
    this.instance = this._loadModule();
  }
}

/**
 * Manages hot-reloading for modules.
 */
class HotRequire extends EventEmitter {
  constructor() {
    super();
    this.modulesMap = new Map();
    this.watchOptions = {}; // Configurable if future requirements arise.
  }

  /**
   * Require a module with hot-reloading capability.
   * @param {string} modulePath - The path to the module.
   * @returns {Object} - The required module instance.
   */
  requireModule(modulePath) {
    const fullPath = path.resolve(modulePath);
    if (!this.modulesMap.has(fullPath)) {
      this._setupWatcher(fullPath);
      this.modulesMap.set(fullPath, new HotModule(fullPath));
    }
    return this.modulesMap.get(fullPath).instance;
  }

  /**
   * Set up a file watcher for the module.
   * @private
   * @param {string} filePath - The path to the module file.
   */
  _setupWatcher(filePath) {
    fs.watch(filePath, this.watchOptions, (eventType, filename) => {
      if (eventType !== "change" || !filename) return;

      // Clear the require cache
      delete require.cache[require.resolve(filePath)];
      const oldModule = this.modulesMap.get(filePath).instance;
      this.modulesMap.get(filePath).refreshModule();
      const newModule = this.modulesMap.get(filePath).instance;

      this.emit("module:updated", {
        filePath,
        oldModule,
        newModule
      });
    });
  }
}

// Singleton instance for hot-reloading utility
const hotRequireInstance = new HotRequire();

module.exports = {
  require: hotRequireInstance.requireModule.bind(hotRequireInstance),
  on: hotRequireInstance.on.bind(hotRequireInstance)
};
