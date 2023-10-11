import path from 'path';
import { loadingAnimation, printRoutes, processFilePath } from './utils';
import hotRequire from './hotRequire';
import { loadMiddlewares } from './middlewares';
import { loadRoutes, RouteGroup } from './routes';
import { Application } from 'express';

interface NextPressConfig {
  directory?: string;
  verbose?: boolean;
  hotReload?: boolean;
  logger?: (message: string) => void;
}

/**
 * Class representing the NextPress application handler.
 * This class handles the loading of middlewares, routes, and manages hot reloads.
 */
class NextPress {
  private app: Application;
  private config: NextPressConfig;
  private middlewares: string[];
  private routes: RouteGroup;
  private readonly appPath: string;
  private loader?: NodeJS.Timeout;

  /**
   * Create a NextPress instance.
   * @param app - The Express app instance.
   * @param config - Configuration options for NextPress.
   */
  constructor(app: Application, config: NextPressConfig = {}) {
    this.app = app;
    this.config = {
      directory: config.directory || '',
      verbose: config.verbose || false,
      hotReload: config.hotReload || false,
      logger: config.logger || console.log,
    };
    this.middlewares = [];
    this.routes = {};
    this.appPath = path.join(this.config.directory || process.cwd(), 'app');
  }

  /**
   * Initializes the NextPress instance.
   * Loads middlewares, routes and if configured, sets up hot reloading.
   * @returns Promise<void>
   */
  initialize(): void {
    if (this.config.verbose) {
      this.loader = loadingAnimation('Loading app routes…');
    }

    this._loadMiddlewares();
    this._loadRoutes();

    if (this.config.verbose && this.loader) {
      clearInterval(this.loader);
      printRoutes(this.routes, this.appPath, this.config.logger!);
    } else {
      this.config.logger!('\n\x1b[34mNEXTPRESS APP ROUTES LOADED ✨\x1b[0m');
    }

    if (this.config.hotReload) {
      this._handleHotReload();
    }
  }

  /**
   * Loads the middlewares for the NextPress instance.
   * @returns Promise<void>
   * @private
   */
  private _loadMiddlewares(): void {
    this.middlewares = loadMiddlewares(this.app, this.appPath);
  }

  /**
   * Loads the routes for the NextPress instance.
   * @returns Promise<void>
   * @private
   */
  private _loadRoutes(): void {
    this.routes = loadRoutes(this.app, this.appPath, this.middlewares, this.config.directory || process.cwd());
  }

  /**
   * Handles hot reloading of modules.
   * Listens for module update events and performs necessary reloads.
   * @private
   */
  private _handleHotReload(): void {
    hotRequire.on('module:updated', this._updateModule.bind(this));
  }

  /**
   * Updates the modules in response to the hot reload event.
   * @param payload - Payload containing the details of the updated module.
   * @private
   */
  private _updateModule({ filePath, newModule }: { filePath: string; newModule: NodeModule }): void {
    this.app._router.stack.forEach((layer: any) => {
      if (layer.route) {
        layer.route.stack.forEach((layerHandler: any) => {
          if (layerHandler.handle.hotValues.path === filePath) {
            Object.entries(newModule).forEach(([key, func]) => {
              if (layerHandler.handle.hotValues.name === key) {
                if (layerHandler.handle.toString() !== func.toString()) {
                  layerHandler.handle = func;
                  this.config.logger!(
                    `\n\x1b[34mNEXTPRESS HOT RELOAD: ${processFilePath(
                      filePath,
                      this.config.directory || process.cwd(),
                    )} UPDATED ✨\x1b[0m`,
                  );
                }
              }
            });
          }
        });
      }
    });
  }
}

/**
 * Initializes the NextPress framework with given configurations.
 * @param app - The Express app instance.
 * @param config - Configuration options for NextPress.
 * @returns Promise<void>
 */
function init(app: Application, config: NextPressConfig = {}): void {
  const nextPressInstance = new NextPress(app, config);
  nextPressInstance.initialize();
}

export { init };
