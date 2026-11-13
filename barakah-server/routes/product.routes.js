const express = require("express");
const router = express.Router();

const {
  getAllProducts,
  getSingleProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  reorderProducts,
  bulkImportProducts,
} = require("../controllers/product.controller");

router.get("/", getAllProducts);
router.put("/reorder", reorderProducts);
router.post("/bulk-import", bulkImportProducts);
router.get("/:id", getSingleProduct);
router.post("/", createProduct);
router.put("/:id", updateProduct);
router.patch("/:id", updateProduct);
router.delete("/:id", deleteProduct);

module.exports = router;
