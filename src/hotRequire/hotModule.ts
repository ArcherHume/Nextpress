import { RequestParamHandler } from 'express-serve-static-core';

interface IHotFunction extends RequestParamHandler {
  hotValues?: {
    path: string;
    name: string;
  };
}

/**
 * Represents a module that can be hot-reloaded.
 */
export class HotModule {
  filePath: string;
  instance: RequestParamHandler[];
  cacheTime?: number;

  /**
   * Create a HotModule instance.
   * @param filePath - The path to the module file.
   */
  constructor(filePath: string) {
    this.filePath = filePath;
    this.instance = this._loadModule();
  }

  /**
   * Load and process a module.
   * @private
   * @returns The loaded module instance.
   */
  private _loadModule(): RequestParamHandler[] {
    const instance: IHotFunction[] = require(this.filePath);
    Object.entries(instance).forEach(([key, func]) => {
      // Improve typing here
      func.hotValues = { path: this.filePath, name: key };
    });
    return instance;
  }

  /**
   * Refresh the current module instance.
   */
  refreshModule(): void {
    this.cacheTime = Date.now();
    this.instance = this._loadModule();
  }
}
