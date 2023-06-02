const express = require('express');
const nextpress = require('../src/index');

const app = express();

// Initialize NextPress
nextpress.init(app, {directory: __dirname});

// Start the server
app.listen(3000, () => {
    console.log('Server listening on port 3000');
    }
);