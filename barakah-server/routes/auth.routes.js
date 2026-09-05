const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser,
  getAllUsers,
  createStaffUser,
  updateUserRole,
  deleteUser,
} = require("../controllers/auth.controller");

router.post("/register", registerUser);
router.post("/login", loginUser);

router.get("/users", getAllUsers);
router.post("/staff", createStaffUser);
router.put("/role", updateUserRole);
router.delete("/users/:id", deleteUser);

module.exports = router;