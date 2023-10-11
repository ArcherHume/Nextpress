import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';
import { HotModule } from './hotModule';
import { RequestParamHandler } from 'express-serve-static-core';

/**
 * Manages hot-reloading for modules.
 */
class HotRequire extends EventEmitter {
  modulesMap: Map<string, HotModule>;

  constructor() {
    super();
    this.modulesMap = new Map<string, HotModule>();
  }

  /**
   * Require a module with hot-reloading capability.
   * @param modulePath - The path to the module.
   * @returns The required module instance.
   */
  requireModule(modulePath: string): RequestParamHandler[] {
    const fullPath = path.resolve(modulePath);
    if (!this.modulesMap.has(fullPath)) {
      this._setupWatcher(fullPath);
      this.modulesMap.set(fullPath, new HotModule(fullPath));
    }
    // Since NodeModule has exports as { [key: string]: any },
    // we're assuming the default export is an array of functions.
    return this.modulesMap.get(fullPath)?.instance || [];
  }

  /**
   * Set up a file watcher for the module.
   * @private
   * @param filePath - The path to the module file.
   */
  private _setupWatcher(filePath: string): void {
    fs.watch(filePath, {}, (eventType: string, filename: string | Buffer | null) => {
      if (eventType !== 'change' || typeof filename !== 'string') return;

      // Clear the require cache
      delete require.cache[require.resolve(filePath)];
      const oldModule = this.modulesMap.get(filePath)?.instance;
      this.modulesMap.get(filePath)?.refreshModule();
      const newModule = this.modulesMap.get(filePath)?.instance;

      this.emit('module:updated', {
        filePath,
        oldModule,
        newModule,
      });
    });
  }
}

// Singleton instance for hot-reloading utility
const hotRequireInstance = new HotRequire();

export default {
  require: hotRequireInstance.requireModule.bind(hotRequireInstance),
  on: hotRequireInstance.on.bind(hotRequireInstance),
};
