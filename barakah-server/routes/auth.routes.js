const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser,
  makeAdmin,
  forceSetAdmin,
  getAllUsers,
  createStaffUser,
  updateUserRole,
  deleteUser,
} = require("../controllers/auth.controller");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.all("/make-admin", makeAdmin);
router.post("/force-admin", forceSetAdmin);

router.get("/users", getAllUsers);
router.post("/staff", createStaffUser);
router.put("/role", updateUserRole);
router.delete("/users/:id", deleteUser);

module.exports = router;