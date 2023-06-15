# Nextpress

Nextpress is a lightweight Node.js library that allows developers to handle [Express.js](https://expressjs.com/) routing like a [Next.js](https://nextjs.org/) app router.

It simplifies the process of setting up and managing routes and middlewares in an Express.js application, by providing a structure similar to Next.js, keeping your code organized and easy to maintain.

## Features

- Automatically loads routes based on file structure.
- Supports dynamic routes.
- Supports route grouping.
- Supports middleware templating, similar to Next.js' layout functionality.
- Supports hot reloading of routes and middlewares.

## Getting Started

### Installation

Install the Nextpress library using npm (never yarn 😡):

```bash
npm install nextpress-router
```

### Basic Usage

1. Create an `app` folder in your project's root directory. NextPress will scan this folder to find your route files. Inside the `app` folder, create files named with the desired HTTP method (e.g., `get.js`, `post.js`, etc.).

2. Import Express and Nextpress in your server file (e.g., `index.js`):

```javascript
const express = require("express");
const nextpress = require("nextpress-router");
```

3. Create an Express app:

```javascript
const app = express();
```

4. Initialize NextPress:

```javascript
// The verbose option is optional and will display loading and route information in the console if set to true
// The hotReload option is optional and will reload the routes when a file is changed if set to true
nextpress.init(app, { verbose: true, hotReload: true });
```

5. Start the server:

```javascript
app.listen(3000, () => {
  console.log("Server listening on port 3000");
});
```

### Examples

Create a basic route handler for a GET request at the root ("/"):

1. In the `app` folder, create a file named `get.js`.
2. In `get.js`, export a route handler function:

```javascript
module.exports = [
    (req, res) => {
        res.send("Hello, Nextpress!");
    }
];
```

Now, when you start the server and navigate to `http://localhost:3000`, you should see the message "Hello, Nextpress!".

To create a route handler for a POST request at a different path (e.g., "/api/data"):

1. In the `app` folder, create a new folder called `api` and inside it, create a file named `post.js`.
2. In `post.js`, export a route handler function:

```javascript
module.exports = [(req, res) => {
  res.send("Handling a POST request at /api/data");
}];
```

Now when you send a POST request to `http://localhost:3000/api/data`, you should receive the message "Handling a POST request at /api/data".

### Middlewares

NextPress makes it easy to apply middleware templates to your routes. To apply a global middleware to all routes:

1. In the `app` folder, create a file named `middlewares.js`.
2. In `middlewares.js`, export a middleware function:
```javascript
module.exports = [
  (req, res, next) => {
    console.log("This is a global middleware");
    next();
  },
];
```

To apply middleware(s) to a specific group of routes:

1. In the `app` folder, create a new folder with the desired group name surrounded by parentheses (e.g., `(auth)`). This tells NextPress that this folder represents a route group.
2. Inside the new folder, create a file called `middlewares.js` and export a middleware function:

```javascript
module.exports = [
  (req, res, next) => {
    console.log("This middleware only applies to the auth group");
    next();
  },
];
```

Any route files within this group folder (e.g., `get.js`, `post.js`, etc.) will have this middleware applied.

> 🚨 **Note:** When a route has multiple applicable middleware files, the middleware file will be chosen based on it's proximity to the route file. For example, a middleware file located in the same folder as the route file will take precedence over a middleware file located in the parent folder.

### Dynamic Routes

NextPress supports dynamic routes, similar to Next.js. To create a dynamic route:

1. In the `app` folder, create a folder such as [slug] (the name of the folder should be surrounded by brackets).
2. Inside the new folder, create a file called `get.js` and export a route handler function:

```javascript
module.exports = [
    (req, res) => {
        res.send(`This is a dynamic route. The slug is: ${req.params.slug}`);
    },
];
```

### Route Groups

NextPress supports route grouping, similar to Next.js. To create a route group:

1. In the `app` folder, create a folder with the desired group name surrounded by parentheses (e.g., `(auth)`). This tells NextPress that this folder represents a route group.
2. Inside the new folder, create a file called `get.js` and export a route handler function:

```javascript
module.exports = [
    (req, res) => {
        res.send("This route is part of the auth group");
    },
];
```

> 💡 **NOTE:** Even though the route `get.js` file is in the group subfolder, the group name is not included in the route path. The route path will be `/` (not `/auth`).

## Contributing

Contributions are always welcome! Please feel free to submit pull requests or open issues to help improve NextPress.

## License

[MIT](LICENSE)