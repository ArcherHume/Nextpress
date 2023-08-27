// Import express and nextpress
const express = require("express");
const nextpress = require("nextpress-router");

// Create an Express app
const app = express();

// Initialize NextPress
// The directory option is required and should always be set to __dirname (or the directory where your app folder lives.)
// The verbose option is optional and will display loading and route information in the console if set to true
nextpress.init(app, { verbose: true, hotReload: true });

// Start the server
app.listen(3000, () => {
  console.log("Server listening on port 3000");
});
