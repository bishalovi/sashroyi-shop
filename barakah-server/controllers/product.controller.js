const connectDB = require("../config/db");
const { ObjectId } = require("mongodb");

exports.getAllProducts = async (req, res) => {
  try {
    const db = await connectDB();
    const productsCollection = db.collection("products");

    const { category, subcategory, page, limit } = req.query;

    const query = {};

    if (category) {
      query.category = category;
    }

    if (subcategory && subcategory !== "none") {
      query.subcategory = subcategory;
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
        .sort({ createdAt: -1 })
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
        .sort({ createdAt: -1 })
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

    const product = await productsCollection.findOne({
      _id: new ObjectId(id),
    });

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

    const newProduct = {
      name: name?.trim() || "",
      category: category?.trim() || "",
      subcategory: subcategory?.trim() || "",
      description: description?.trim() || "",
      price: Number(price) || 0,
      oldPrice: Number(oldPrice) || 0,
      image: image?.trim() || "",
      badge: badge?.trim() || "",
      productCode: productCode?.trim() || "",
      inStock: typeof inStock === "boolean" ? inStock : true,
      createdAt: new Date(),
    };

    const result = await productsCollection.insertOne(newProduct);

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      insertedId: result.insertedId,
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
    console.log(id);

    const {
      name,
      category,
      subcategory,
      description,
      price,
      oldPrice,
      image,
      badge,
      productCode,
      inStock,
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

    const updatedDoc = {
      name: name?.trim() || existingProduct.name,
      category: category?.trim() || existingProduct.category,
      description: description?.trim() || existingProduct.description || "",
      subcategory: subcategory?.trim() || existingProduct.subcategory || "",
      price: price !== undefined ? Number(price) : existingProduct.price,
      oldPrice:
        oldPrice !== undefined ? Number(oldPrice) : existingProduct.oldPrice,
      image: image?.trim() || existingProduct.image,
      badge: badge?.trim() || "",
      productCode: productCode?.trim() || "",
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
