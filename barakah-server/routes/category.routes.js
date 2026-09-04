const express = require("express");
const router = express.Router();

const {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/category.controller");

router.get("/", getCategories);
router.get("/:idOrSlug", getCategoryById);
router.post("/", createCategory);
router.put("/:id", updateCategory);
router.delete("/:id", deleteCategory);

module.exports = router;
