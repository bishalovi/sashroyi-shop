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

async function ensureUniqueSlug(productsCollection, rawSlug, excludeId = null) {
  const baseSlug = generateSlug(rawSlug) || `product-${Date.now().toString(36)}`;
  let candidate = baseSlug;
  let counter = 2;

  while (true) {
    const query = excludeId
      ? { slug: candidate, _id: { $ne: new ObjectId(excludeId) } }
      : { slug: candidate };
    const existing = await productsCollection.findOne(query, { projection: { _id: 1 } });
    if (!existing) return candidate;
    candidate = `${baseSlug}-${counter}`;
    counter += 1;
  }
}

function buildAutoSeo({
  name = "",
  category = "",
  subcategory = "",
  description = "",
  price = 0,
  badge = "",
  metaTitle = "",
  metaDescription = "",
  metaKeywords = "",
}) {
  const cleanName = String(name || "").trim();
  const cleanDesc = String(description || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const finalMetaTitle =
    String(metaTitle || "").trim() ||
    (cleanName ? `${cleanName} | Sashroyi Shop` : "Sashroyi Shop");

  let finalMetaDescription = String(metaDescription || "").trim();
  if (!finalMetaDescription) {
    if (cleanDesc) {
      finalMetaDescription =
        cleanDesc.length > 155 ? `${cleanDesc.slice(0, 152).trim()}...` : cleanDesc;
    } else {
      const priceText = Number(price) > 0 ? ` মাত্র ৳${Number(price)} টাকায়` : "";
      finalMetaDescription = `${cleanName} কিনুন Sashroyi Shop থেকে${priceText}। সেরা মানের পণ্য ও দ্রুত হোম ডেলিভারি।`;
    }
  }

  let finalMetaKeywords = String(metaKeywords || "").trim();
  if (!finalMetaKeywords) {
    const keywordParts = [
      cleanName,
      category ? String(category).trim() : "",
      subcategory ? String(subcategory).trim() : "",
      badge ? String(badge).trim() : "",
      "Sashroyi Shop",
      "online shopping Bangladesh",
    ].filter(Boolean);
    finalMetaKeywords = [...new Set(keywordParts)].join(", ");
  }

  return {
    metaTitle: finalMetaTitle,
    metaDescription: finalMetaDescription,
    metaKeywords: finalMetaKeywords,
  };
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
      const cleanCatInput = category.trim();

      // Check if the query is a category slug or ID in the categories collection
      const categoriesCollection = db.collection("categories");
      const matchedCategory = await categoriesCollection.findOne({
        $or: [
          { slug: cleanCatInput.toLowerCase() },
          { name: { $regex: new RegExp(`^${cleanCatInput.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") } },
        ],
      });

      if (matchedCategory) {
        // Match either the category's real name, its slug, or raw input
        query.$or = [
          { category: matchedCategory.name },
          { category: matchedCategory.slug },
          { category: { $regex: new RegExp(`^${cleanCatInput.replace(/[-\s]/g, "[-_\\s&]?")}$`, "i") } },
        ];
      } else {
        const cleanCat = cleanCatInput.replace(/[-\s]/g, "[-_\\s&]?");
        query.category = { $regex: new RegExp(`^${cleanCat}$`, "i") };
      }
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
      productType,
      variations,
      metaTitle,
      metaDescription,
      metaKeywords,
    } = req.body;

    const finalSlug = await ensureUniqueSlug(productsCollection, slug || name);

    // Sanitize variations if provided
    let cleanVariations = [];
    if (Array.isArray(variations) && variations.length > 0) {
      cleanVariations = variations.map((v, idx) => ({
        id: v.id ? String(v.id) : `var_${Date.now()}_${idx}`,
        name: v.name?.trim() || `প্যাকেজ ${idx + 1}`,
        price: Number(v.price) || 0,
        oldPrice: v.oldPrice ? Number(v.oldPrice) : 0,
        image: v.image ? String(v.image).trim() : "",
        color: v.color ? String(v.color).trim() : "",
        inStock: typeof v.inStock === "boolean" ? v.inStock : true,
        isDefault: Boolean(v.isDefault),
      }));

      // Ensure at least one is default
      if (!cleanVariations.some((v) => v.isDefault)) {
        cleanVariations[0].isDefault = true;
      }
    }

    const isVariable = productType === "variable" && cleanVariations.length > 0;
    const defaultVar = isVariable ? cleanVariations.find((v) => v.isDefault) || cleanVariations[0] : null;

    const finalPrice = isVariable && defaultVar ? Number(defaultVar.price) : Number(price) || 0;
    const finalOldPrice = isVariable && defaultVar ? (defaultVar.oldPrice ? Number(defaultVar.oldPrice) : 0) : Number(oldPrice) || 0;

    const seoFields = buildAutoSeo({
      name,
      category,
      subcategory,
      description,
      price: finalPrice,
      badge,
      metaTitle,
      metaDescription,
      metaKeywords,
    });

    const newProduct = {
      name: name?.trim() || "",
      slug: finalSlug,
      category: category?.trim() || "",
      subcategory: subcategory?.trim() || "",
      description: description?.trim() || "",
      price: finalPrice,
      oldPrice: finalOldPrice,
      productType: isVariable ? "variable" : "single",
      variations: cleanVariations,
      image: image?.trim() || "",
      badge: badge?.trim() || "",
      productCode: productCode?.trim() || "",
      inStock: typeof inStock === "boolean" ? inStock : true,
      isFreeShipping: Boolean(isFreeShipping),
      metaTitle: seoFields.metaTitle,
      metaDescription: seoFields.metaDescription,
      metaKeywords: seoFields.metaKeywords,
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
      productType,
      variations,
      metaTitle,
      metaDescription,
      metaKeywords,
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

    const rawSlug = slug !== undefined && slug.trim()
      ? slug.trim()
      : existingProduct.slug || name || existingProduct.name;
    const finalSlug = await ensureUniqueSlug(productsCollection, rawSlug, id);

    // Sanitize variations
    let cleanVariations = [];
    if (Array.isArray(variations)) {
      cleanVariations = variations.map((v, idx) => ({
        id: v.id ? String(v.id) : `var_${Date.now()}_${idx}`,
        name: v.name?.trim() || `প্যাকেজ ${idx + 1}`,
        price: Number(v.price) || 0,
        oldPrice: v.oldPrice ? Number(v.oldPrice) : 0,
        image: v.image ? String(v.image).trim() : "",
        color: v.color ? String(v.color).trim() : "",
        inStock: typeof v.inStock === "boolean" ? v.inStock : true,
        isDefault: Boolean(v.isDefault),
      }));

      if (cleanVariations.length > 0 && !cleanVariations.some((v) => v.isDefault)) {
        cleanVariations[0].isDefault = true;
      }
    } else if (existingProduct.variations) {
      cleanVariations = existingProduct.variations;
    }

    const targetType = productType !== undefined ? productType : existingProduct.productType || "single";
    const isVariable = targetType === "variable" && cleanVariations.length > 0;
    const defaultVar = isVariable ? cleanVariations.find((v) => v.isDefault) || cleanVariations[0] : null;

    let finalPrice = price !== undefined ? Number(price) : existingProduct.price;
    let finalOldPrice = oldPrice !== undefined ? Number(oldPrice) : existingProduct.oldPrice;

    if (isVariable && defaultVar) {
      finalPrice = Number(defaultVar.price);
      finalOldPrice = defaultVar.oldPrice ? Number(defaultVar.oldPrice) : 0;
    }

    const nextName = name?.trim() || existingProduct.name;
    const nextCategory = category?.trim() || existingProduct.category;
    const nextSubcategory = subcategory?.trim() || existingProduct.subcategory || "";
    const nextDescription = description !== undefined ? description.trim() : existingProduct.description || "";
    const nextBadge = badge !== undefined ? badge.trim() : existingProduct.badge || "";

    const seoFields = buildAutoSeo({
      name: nextName,
      category: nextCategory,
      subcategory: nextSubcategory,
      description: nextDescription,
      price: finalPrice,
      badge: nextBadge,
      metaTitle: metaTitle !== undefined ? metaTitle : existingProduct.metaTitle,
      metaDescription: metaDescription !== undefined ? metaDescription : existingProduct.metaDescription,
      metaKeywords: metaKeywords !== undefined ? metaKeywords : existingProduct.metaKeywords,
    });

    const updatedDoc = {
      name: nextName,
      slug: finalSlug,
      category: nextCategory,
      description: nextDescription,
      subcategory: nextSubcategory,
      productType: isVariable ? "variable" : "single",
      variations: cleanVariations,
      price: finalPrice,
      oldPrice: finalOldPrice,
      image: image?.trim() || existingProduct.image,
      badge: nextBadge,
      productCode: productCode !== undefined ? productCode.trim() : existingProduct.productCode || "",
      inStock: typeof inStock === "boolean" ? inStock : existingProduct.inStock,
      isFreeShipping: typeof isFreeShipping === "boolean" ? isFreeShipping : Boolean(isFreeShipping ?? existingProduct.isFreeShipping ?? false),
      metaTitle: seoFields.metaTitle,
      metaDescription: seoFields.metaDescription,
      metaKeywords: seoFields.metaKeywords,
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
    const reviewsCollection = db.collection("reviews");
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid product ID" });
    }

    const productToDelete = await productsCollection.findOne({ _id: new ObjectId(id) });
    if (!productToDelete) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const result = await productsCollection.deleteOne({
      _id: new ObjectId(id),
    });

    // Auto cleanup linked reviews and references
    try {
      await reviewsCollection.deleteMany({
        $or: [
          { productId: id },
          { productId: new ObjectId(id) },
          ...(productToDelete.slug ? [{ productId: productToDelete.slug }] : []),
        ],
      });
    } catch (cleanErr) {
      // Non-blocking cleanup
    }

    res.json({
      success: true,
      message: "Product and associated records cleaned successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// BULK DELETE products
exports.bulkDeleteProducts = async (req, res) => {
  try {
    const db = await connectDB();
    const productsCollection = db.collection("products");
    const reviewsCollection = db.collection("reviews");
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: "No product IDs provided" });
    }

    const validObjectIds = ids.filter((id) => ObjectId.isValid(id)).map((id) => new ObjectId(id));

    if (validObjectIds.length === 0) {
      return res.status(400).json({ success: false, message: "No valid product IDs provided" });
    }

    const productsToDelete = await productsCollection
      .find({ _id: { $in: validObjectIds } }, { projection: { _id: 1, slug: 1 } })
      .toArray();

    const slugsToDelete = productsToDelete.map((p) => p.slug).filter(Boolean);

    const result = await productsCollection.deleteMany({
      _id: { $in: validObjectIds },
    });

    try {
      await reviewsCollection.deleteMany({
        $or: [
          { productId: { $in: ids } },
          { productId: { $in: validObjectIds } },
          ...(slugsToDelete.length > 0 ? [{ productId: { $in: slugsToDelete } }] : []),
        ],
      });
    } catch (cleanErr) {
      // Non-blocking cleanup
    }

    res.json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} product(s)`,
      deletedCount: result.deletedCount,
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

// BULK IMPORT products from CSV
exports.bulkImportProducts = async (req, res) => {
  try {
    const db = await connectDB();
    const productsCollection = db.collection("products");

    const { products, duplicateAction = "skip" } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No products provided for import",
      });
    }

    if (products.length > 500) {
      return res.status(400).json({
        success: false,
        message: "Maximum 500 products can be imported at once",
      });
    }

    // Auto-create any missing categories from imported products
    const categoriesCollection = db.collection("categories");
    const uniqueCategories = [
      ...new Set(
        products
          .map((p) => String(p.category || "").trim())
          .filter(Boolean)
      ),
    ];

    for (const catName of uniqueCategories) {
      const existingCat = await categoriesCollection.findOne({
        $or: [
          { name: { $regex: new RegExp(`^${catName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") } },
          { slug: generateSlug(catName) },
        ],
      });

      if (!existingCat) {
        const catSlug = generateSlug(catName) || `cat-${Date.now().toString(36)}`;
        await categoriesCollection.insertOne({
          name: catName,
          slug: catSlug,
          description: `Best ${catName} products on Sashroyi Shop`,
          image: "",
          subcategories: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    let failed = 0;
    const errors = [];

    for (let i = 0; i < products.length; i += 1) {
      const row = products[i] || {};
      const rowNumber = i + 1;
      const cleanName = String(row.name || "").trim();
      const parsedPrice = Number(row.price);

      if (!cleanName) {
        failed += 1;
        errors.push({ row: rowNumber, name: "(empty)", reason: "Product name is required" });
        continue;
      }

      if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
        failed += 1;
        errors.push({ row: rowNumber, name: cleanName, reason: "Invalid price" });
        continue;
      }

      const cleanCode = String(row.productCode || "").trim();
      const rawSlug = String(row.slug || "").trim();
      const candidateSlug = generateSlug(rawSlug || cleanName);

      // Check existing product by productCode (if provided) or exact slug
      let existingProduct = null;
      if (cleanCode) {
        existingProduct = await productsCollection.findOne({ productCode: cleanCode });
      }
      if (!existingProduct && candidateSlug) {
        existingProduct = await productsCollection.findOne({ slug: candidateSlug });
      }

      const parsedOldPrice = Number(row.oldPrice);
      const finalOldPrice = !Number.isNaN(parsedOldPrice) && parsedOldPrice > 0 ? parsedOldPrice : 0;
      const category = String(row.category || "").trim();
      const subcategory = String(row.subcategory || "").trim();
      const description = String(row.description || "").trim();
      const image = String(row.image || "").trim();
      const badge = String(row.badge || "").trim();
      const inStock = typeof row.inStock === "boolean" ? row.inStock : true;
      const isFreeShipping = Boolean(row.isFreeShipping);

      const seoFields = buildAutoSeo({
        name: cleanName,
        category,
        subcategory,
        description,
        price: parsedPrice,
        badge,
        metaTitle: row.metaTitle,
        metaDescription: row.metaDescription,
        metaKeywords: row.metaKeywords,
      });

      if (existingProduct) {
        if (duplicateAction === "update") {
          const finalSlug = await ensureUniqueSlug(
            productsCollection,
            rawSlug || existingProduct.slug || cleanName,
            existingProduct._id
          );

          await productsCollection.updateOne(
            { _id: existingProduct._id },
            {
              $set: {
                name: cleanName,
                slug: finalSlug,
                category: category || existingProduct.category || "",
                subcategory: subcategory || existingProduct.subcategory || "",
                description: description || existingProduct.description || "",
                price: parsedPrice,
                oldPrice: finalOldPrice,
                image: image || existingProduct.image || "",
                badge,
                productCode: cleanCode || existingProduct.productCode || "",
                inStock,
                isFreeShipping,
                metaTitle: seoFields.metaTitle,
                metaDescription: seoFields.metaDescription,
                metaKeywords: seoFields.metaKeywords,
                updatedAt: new Date(),
              },
            }
          );
          updated += 1;
        } else {
          skipped += 1;
        }
        continue;
      }

      const finalSlug = await ensureUniqueSlug(productsCollection, rawSlug || cleanName);

      await productsCollection.insertOne({
        name: cleanName,
        slug: finalSlug,
        category,
        subcategory,
        description,
        price: parsedPrice,
        oldPrice: finalOldPrice,
        productType: "single",
        variations: [],
        image,
        badge,
        productCode: cleanCode,
        inStock,
        isFreeShipping,
        metaTitle: seoFields.metaTitle,
        metaDescription: seoFields.metaDescription,
        metaKeywords: seoFields.metaKeywords,
        createdAt: new Date(),
      });
      inserted += 1;
    }

    res.status(200).json({
      success: true,
      message: "Bulk import completed",
      summary: {
        total: products.length,
        inserted,
        updated,
        skipped,
        failed,
        errors,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

