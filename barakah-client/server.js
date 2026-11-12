const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const dev = process.env.NODE_ENV !== "production";

const port = process.env.PORT || 3000;

// Create the Express-Next App
const app = next({ dev });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    createServer((req, res) => {
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    }).listen(port, (err) => {
      if (err) throw err;
      console.log(`> Ready on http://localhost:${port}`);
    });
  })
  .catch((ex) => {
    console.error(ex.stack);
    process.exit(1);
  });
