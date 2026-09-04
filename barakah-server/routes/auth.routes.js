const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser,
  makeAdmin,
} = require("../controllers/auth.controller");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.all("/make-admin", makeAdmin);

module.exports = router;