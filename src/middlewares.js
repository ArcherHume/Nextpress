const fs = require("fs");
const path = require("path");

/**
 * Load middlewares from a given directory
 *
 * @param {any} app - The Express app instance
 * @param {string} dir - The directory to load middlewares from
 * @param {string[]} middlewares - An array to store the loaded middlewares
 */
const loadMiddlewares = async (app, dir, middlewares) => {
  const files = fs.readdirSync(dir);
  await Promise.all(
    files.map(async (file) => {
      const filePath = path.join(dir, file);
      const isDirectory = fs.statSync(filePath).isDirectory();
      if (isDirectory) {
        await loadMiddlewares(app, filePath, middlewares);
      } else if (file === "middlewares.js") {
        middlewares.push(filePath);
      }
    })
  );
};

module.exports = { loadMiddlewares };
