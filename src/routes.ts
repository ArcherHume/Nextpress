import fs from 'fs';
import path from 'path';
import { getRouteMiddleware, processFilePath } from './utils';
import hotRequire from './hotRequire';
import { Application } from 'express';

export interface RouteGroup {
  [key: string]: { method: string; route: string; middleware: string | null }[];
}

enum ALLOWED_METHODS {
  GET = 'get',
  POST = 'post',
  PUT = 'put',
  DELETE = 'delete',
}

/**
 * The RoutesLoader class is responsible for loading route handlers
 * from the given directory and registering them with the Express app.
 */
class RoutesLoader {
  private app: Application;
  private dir: string;
  private middlewares: string[];
  private root: string;
  private routes: RouteGroup = {};

  /**
   * Create a RoutesLoader.
   * @param app - The Express app instance.
   * @param dir - Directory from which routes should be loaded.
   * @param middlewares - Array of loaded middlewares.
   * @param root - The root directory of the app.
   */
  constructor(app: Application, dir: string, middlewares: string[], root: string) {
    this.app = app;
    this.dir = dir;
    this.middlewares = middlewares;
    this.root = root;
  }

  /**
   * Load routes from the directory.
   * @returns Returns an object containing loaded routes.
   */
  load(): RouteGroup {
    const dirsToProcess: string[] = [this.dir];

    // This loop allows for recursive scanning of directories for route files.
    // By using a loop rather than recursion, we avoid potential call stack limits.
    while (dirsToProcess.length) {
      const currentDir = dirsToProcess.pop();
      const files = fs.readdirSync(currentDir!);

      // Determine the current route group, groups are represented by directory names enclosed in brackets.
      // This allows for organizing related routes together in the same directory.
      const dirName = path.basename(currentDir!);
      const currentGroup = /^\(.*\)$/.test(dirName) ? dirName.replace(/^\(|\)$/g, '') : 'root';

      for (const file of files) {
        const filePath = path.join(currentDir!, file);
        const isDirectory = fs.statSync(filePath).isDirectory();

        // Directories are added to the list for further processing, ensuring all levels are scanned.
        if (isDirectory) {
          dirsToProcess.push(filePath);
          continue;
        }

        // Before processing a file, check if it matches one of the allowed HTTP methods.
        // This prevents non-route files (e.g., utilities or READMEs) from being processed as routes.
        const [method] = file.split('.');
        if (Object.values(ALLOWED_METHODS).includes(method as ALLOWED_METHODS)) {
          const routePath = processFilePath(filePath, this.root);
          const routeHandler = hotRequire.require(filePath);

          // Middlewares can be associated with routes based on their path.
          // This utility helps to load any such middleware for the current route.
          const middlewarePath = getRouteMiddleware(this.middlewares, filePath, this.root);

          // Attach middleware(s) if they exist, followed by the route handler.
          // By dynamically spreading handlers, we avoid conditionals and keep the code DRY.
          const handlers = middlewarePath ? [...hotRequire.require(middlewarePath), routeHandler] : [routeHandler];
          this.app[method as keyof Application](routePath, ...handlers);

          this.routes[currentGroup] = this.routes[currentGroup] || [];
          this.routes[currentGroup].push({ method, route: routePath, middleware: middlewarePath });
        }
      }
    }

    return this.routes;
  }
}

/**
 * Load routes from a specified directory.
 * @param app - The Express app instance.
 * @param dir - Directory from which routes should be loaded.
 * @param middlewares - Array of loaded middlewares.
 * @param root - The root directory of the app.
 * @returns Returns an object containing loaded routes.
 */
function loadRoutes(app: Application, dir: string, middlewares: string[], root: string): RouteGroup {
  const loader = new RoutesLoader(app, dir, middlewares, root);
  return loader.load();
}

export { loadRoutes };
