import fs from 'fs';
import path from 'path';
import { Application } from 'express';

/**
 * This class is responsible for loading middleware files from a given directory.
 * It reads through the directory structure and looks for files named "middlewares.js",
 * and then keeps track of their paths for use in setting up middleware in Express routes.
 */
class MiddlewareLoader {
  private app: any;
  private dir: string;
  private middlewares: string[] = [];

  /**
   * Creates an instance of MiddlewareLoader.
   *
   * @param app - The Express app instance.
   * @param dir - The directory to load middlewares from.
   */
  constructor(app: Application, dir: string) {
    this.app = app;
    this.dir = dir;
  }

  /**
   * Load middlewares from the directory and subdirectories.
   * Iteratively reads through directories looking for "middlewares.js" files.
   *
   * @returns A promise that resolves to an array of middleware file paths.
   */
  load(): string[] {
    const directories: string[] = [this.dir];

    while (directories.length) {
      const currentDir = directories.pop();
      const files = fs.readdirSync(currentDir!);

      for (const file of files) {
        const filePath = path.join(currentDir!, file);
        const isDirectory = fs.statSync(filePath).isDirectory();

        if (isDirectory) {
          directories.push(filePath);
        } else if (file === 'middlewares.js') {
          // If a middleware file is found, add its path to the middlewares list.
          this.middlewares.push(filePath);
        }
      }
    }

    return this.middlewares;
  }
}

/**
 * A convenience function that initializes a MiddlewareLoader and starts the middleware loading process.
 *
 * @param app - The Express app instance.
 * @param dir - The directory to load middlewares from.
 * @returns A promise that resolves to an array of middleware file paths.
 */
function loadMiddlewares(app: Application, dir: string): string[] {
  const loader = new MiddlewareLoader(app, dir);
  return loader.load();
}

export { loadMiddlewares };
