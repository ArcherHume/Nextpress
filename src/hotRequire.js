const fs = require("fs");
const path = require("path");
const { EventEmitter } = require("events");

class HotModule {
  constructor(filePath) {
    this.filePath = filePath;
    this.cacheTime = Date.now();
    this.instance = this._loadModule();
  }

  _loadModule() {
    const instance = require(this.filePath);
    Object.entries(instance).forEach(
        ([key, func]) => (func.__name = { path: this.filePath, name: key })
    );
    return instance;
  }

  refreshModule() {
    this.cacheTime = Date.now();
    this.instance = this._loadModule();
  }
}

class HotRequire extends EventEmitter {
  constructor() {
    super();
    this.modulesMap = new Map();
    this.watchOptions = {};
  }

  requireModule(modulePath) {
    const fullPath = path.join(modulePath);
    if (!this.modulesMap.has(fullPath)) {
      this._setupWatcher(fullPath);
      this.modulesMap.set(fullPath, new HotModule(fullPath));
    }
    return this.modulesMap.get(fullPath).instance;
  }

  _setupWatcher(filePath) {
    fs.watch(filePath, this.watchOptions, (eventType, filename) => {
      if (eventType !== "change" || !filename) {
        return;
      }

      delete require.cache[require.resolve(filePath)]; // Clear the require cache
      this.modulesMap.get(filePath).refreshModule();
      this.emit("module:updated", {
        filePath,
        oldModule: this.modulesMap.get(filePath).instance,
        newModule: this.modulesMap.get(filePath).instance
      });
    });
  }
}

const hotRequireInstance = new HotRequire();

module.exports = {
  require: hotRequireInstance.requireModule.bind(hotRequireInstance),
  on: hotRequireInstance.on.bind(hotRequireInstance)
};
