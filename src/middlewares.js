const fs = require("fs");
const path = require("path");

/**
 * Load middlewares from a given directory
 *
 * @param {any} app - The Express app instance
 * @param {string} dir - The directory to load middlewares from
 * @param {string[]} middlewares - An array to store the loaded middlewares
 */
async function loadMiddlewares(app, dir, middlewares) {
  // Read all files and directories in the specified directory
  const files = fs.readdirSync(dir);

  // Iterate through the files and load middlewares using recursion for directories
  await Promise.all(
    files.map(async (file) => {
      const filePath = path.join(dir, file);
      const isDirectory = fs.statSync(filePath).isDirectory();

      if (isDirectory) {
        // If it's a directory, recurse and load middlewares from the sub-directory
        await loadMiddlewares(app, filePath, middlewares);
      } else if (file === "middlewares.js") {
        // If the file is "middlewares.js", push its path to the middlewares array
        middlewares.push(filePath);
      }
    })
  );
};

module.exports = { loadMiddlewares };