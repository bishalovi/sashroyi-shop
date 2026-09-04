const connectDB = require("../config/db");
const { ObjectId } = require("mongodb");

function generateSlug(text) {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

exports.getAllProducts = async (req, res) => {
  try {
    const db = await connectDB();
    const productsCollection = db.collection("products");

    const { category, subcategory, page, limit, search } = req.query;

    const query = {};

    if (search && search.trim()) {
      const cleanSearch = search.trim();
      query.$or = [
        { name: { $regex: cleanSearch, $options: "i" } },
        { description: { $regex: cleanSearch, $options: "i" } },
        { category: { $regex: cleanSearch, $options: "i" } },
        { subcategory: { $regex: cleanSearch, $options: "i" } },
      ];
    }

    if (category && category !== "all") {
      const cleanCat = category.trim().replace(/[-\s]/g, "[-_\\s]?");
      query.category = { $regex: new RegExp(`^${cleanCat}$`, "i") };
    }

    if (subcategory && subcategory !== "none" && subcategory !== "all") {
      const cleanSub = subcategory.trim().replace(/[-\s]/g, "[-_\\s]?");
      query.subcategory = { $regex: new RegExp(`^${cleanSub}$`, "i") };
    }

    const total = await productsCollection.countDocuments(query);

    let products;
    let pagination = null;

    if (page || limit) {
      const pageNumber = Number(page) || 1;
      const limitNumber = Number(limit) || 20;
      const skip = (pageNumber - 1) * limitNumber;

      products = await productsCollection
        .find(query)
        .sort({ order: 1, createdAt: -1 })
        .skip(skip)
        .limit(limitNumber)
        .toArray();

      pagination = {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      };
    } else {
      products = await productsCollection
        .find(query)
        .sort({ order: 1, createdAt: -1 })
        .toArray();
    }

    res.json({
      success: true,
      data: products,
      pagination,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getSingleProduct = async (req, res) => {
  try {
    const db = await connectDB();
    const productsCollection = db.collection("products");
    const { id } = req.params;

    let query = {};
    if (ObjectId.isValid(id)) {
      query = { $or: [{ _id: new ObjectId(id) }, { slug: id }] };
    } else {
      query = { slug: id };
    }

    const product = await productsCollection.findOne(query);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// CREATE product
exports.createProduct = async (req, res) => {
  try {
    const db = await connectDB();
    const productsCollection = db.collection("products");

    const {
      name,
      slug,
      category,
      subcategory,
      description,
      price,
      oldPrice,
      image,
      badge,
      productCode,
      inStock,
      isFreeShipping,
    } = req.body;

    const finalSlug = (slug || generateSlug(name) || `product-${Date.now()}`).trim();

    const newProduct = {
      name: name?.trim() || "",
      slug: finalSlug,
      category: category?.trim() || "",
      subcategory: subcategory?.trim() || "",
      description: description?.trim() || "",
      price: Number(price) || 0,
      oldPrice: Number(oldPrice) || 0,
      image: image?.trim() || "",
      badge: badge?.trim() || "",
      productCode: productCode?.trim() || "",
      inStock: typeof inStock === "boolean" ? inStock : true,
      isFreeShipping: Boolean(isFreeShipping),
      createdAt: new Date(),
    };

    const result = await productsCollection.insertOne(newProduct);

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      insertedId: result.insertedId,
      slug: finalSlug,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// UPDATE product
exports.updateProduct = async (req, res) => {
  try {
    const db = await connectDB();
    const productsCollection = db.collection("products");
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    const {
      name,
      slug,
      category,
      subcategory,
      description,
      price,
      oldPrice,
      image,
      badge,
      productCode,
      inStock,
      isFreeShipping,
    } = req.body;

    const existingProduct = await productsCollection.findOne({
      _id: new ObjectId(id),
    });

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const finalSlug = slug !== undefined && slug.trim()
      ? slug.trim()
      : existingProduct.slug || generateSlug(name || existingProduct.name);

    const updatedDoc = {
      name: name?.trim() || existingProduct.name,
      slug: finalSlug,
      category: category?.trim() || existingProduct.category,
      description: description?.trim() || existingProduct.description || "",
      subcategory: subcategory?.trim() || existingProduct.subcategory || "",
      price: price !== undefined ? Number(price) : existingProduct.price,
      oldPrice: oldPrice !== undefined ? Number(oldPrice) : existingProduct.oldPrice,
      image: image?.trim() || existingProduct.image,
      badge: badge !== undefined ? badge.trim() : existingProduct.badge || "",
      productCode: productCode !== undefined ? productCode.trim() : existingProduct.productCode || "",
      inStock: typeof inStock === "boolean" ? inStock : existingProduct.inStock,
      isFreeShipping: typeof isFreeShipping === "boolean" ? isFreeShipping : Boolean(isFreeShipping ?? existingProduct.isFreeShipping ?? false),
      updatedAt: new Date(),
    };

    const result = await productsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedDoc },
    );

    res.json({
      success: true,
      message: "Product updated successfully",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// DELETE product
exports.deleteProduct = async (req, res) => {
  try {
    const db = await connectDB();
    const productsCollection = db.collection("products");
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    const result = await productsCollection.deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// REORDER products (Move Up / Move Down)
exports.reorderProducts = async (req, res) => {
  try {
    const db = await connectDB();
    const productsCollection = db.collection("products");
    const { orderedIds } = req.body;

    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({ success: false, message: "Invalid orderedIds format" });
    }

    const bulkOps = orderedIds
      .filter((id) => ObjectId.isValid(id))
      .map((id, index) => ({
        updateOne: {
          filter: { _id: new ObjectId(id) },
          update: { $set: { order: index, updatedAt: new Date() } },
        },
      }));

    if (bulkOps.length > 0) {
      await productsCollection.bulkWrite(bulkOps);
    }

    res.json({
      success: true,
      message: "Products reordered successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

