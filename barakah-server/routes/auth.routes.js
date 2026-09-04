const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser,
  makeAdmin,
  forceSetAdmin,
} = require("../controllers/auth.controller");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.all("/make-admin", makeAdmin);
router.post("/force-admin", forceSetAdmin);

module.exports = router;