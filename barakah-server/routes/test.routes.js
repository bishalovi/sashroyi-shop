const express = require("express");
const router = express.Router();

const {
  getRoot,
  getTest,
} = require("../controllers/test.controller");

router.get("/", getRoot);
router.get("/test", getTest);

module.exports = router;