const fs = require("fs");
const path = require("path");
const { EventEmitter } = require("events");

const modulesMap = new Map();
const events = new EventEmitter();
let watchOptions = {}; //Add options if needed

/**
 * Require a module with hot reloading support.
 *
 * @param {string} modulePath - The path to the module to be required.
 * @returns {Object} The required module instance with hot reloading capability.
 */
function hotRequire(modulePath) {
  const fullPath = path.join(modulePath);
  if (!modulesMap.has(fullPath)) {
    setupWatcher(fullPath);

    const instance = require(fullPath);
    Object.entries(instance).forEach(
      ([key, func]) => (func.__name = { path: fullPath, name: key })
    );

    modulesMap.set(fullPath, {
      instance,
      cacheTime: Date.now(),
    });
  }

  return modulesMap.get(fullPath).instance;
}

/**
 * Sets up a file watcher for the specified file path.
 *
 * @private
 * @param {string} filePath - The path to the file to be watched.
 */
function setupWatcher(filePath) {
  fs.watch(filePath, watchOptions, (eventType, filename) => {
    if (eventType !== "change" || !filename) {
      return;
    }

    delete require.cache[require.resolve(filePath)]; // Delete the require cache

    // Load modules with the updated code
    let newModule = require(filePath);
    let oldModule = modulesMap.get(filePath).instance;

    // Add the __name property to the unnamed functions
    for (let key in newModule) {
      newModule[key].__name = { path: filePath, name: key };
    }

    for (let key in oldModule) {
      oldModule[key].__name = { path: filePath, name: key };
    }

    modulesMap.set(filePath, {
      // Update the modulesMap
      instance: newModule,
      cacheTime: Date.now(),
    });

    events.emit(`module:updated`, { filePath, oldModule, newModule });
  });
}

/**
 * Attach a listener to a specified event on hotRequire
 *
 * @function
 * @param {string} eventName - The name of the event to be listened on.
 * @param {function} listener - The callback function to be executed when the event is fired.
 */
hotRequire.on = events.on.bind(events);

module.exports = hotRequire;
