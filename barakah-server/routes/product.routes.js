const express = require("express");
const router = express.Router();

const {
  getAllProducts,
  getSingleProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  reorderProducts,
} = require("../controllers/product.controller");

router.get("/", getAllProducts);
router.put("/reorder", reorderProducts);
router.get("/:id", getSingleProduct);
router.post("/", createProduct);
router.patch("/:id", updateProduct);
router.delete("/:id", deleteProduct);

module.exports = router;
