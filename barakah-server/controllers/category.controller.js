const connectDB = require("../config/db");
const { ObjectId } = require("mongodb");

const DEFAULT_CATEGORIES = [
  {
    name: "Wall Clock",
    slug: "wall-clock",
    description: "Premium Islamic & Modern Wall Clocks",
    subcategories: [
      { name: "Natural", slug: "natural" },
      { name: "Islamic", slug: "islamic" },
      { name: "Special 1", slug: "special1" },
      { name: "Special 2", slug: "special2" },
      { name: "Others", slug: "others" },
    ],
    createdAt: new Date(),
  },
  {
    name: "Wall Canvas",
    slug: "wall-canvas",
    description: "Islamic Calligraphy & Art Wall Canvases",
    subcategories: [
      { name: "Natural", slug: "natural" },
      { name: "Islamic", slug: "islamic" },
      { name: "Special 1", slug: "special1" },
      { name: "Special 2", slug: "special2" },
      { name: "Others", slug: "others" },
    ],
    createdAt: new Date(),
  },
  {
    name: "Wall Art",
    slug: "wall-art",
    description: "Modern & Islamic Wall Art Designs",
    subcategories: [
      { name: "Natural", slug: "natural" },
      { name: "Islamic", slug: "islamic" },
      { name: "Others", slug: "others" },
    ],
    createdAt: new Date(),
  },
  {
    name: "Round Clock",
    slug: "round-clock",
    description: "Classic & Modern Round Wooden Clocks",
    subcategories: [
      { name: "Natural", slug: "natural" },
      { name: "Islamic", slug: "islamic" },
      { name: "Others", slug: "others" },
    ],
    createdAt: new Date(),
  },
  {
    name: "Others",
    slug: "others",
    description: "Exclusive Accessories & Decor Items",
    subcategories: [
      { name: "Natural", slug: "natural" },
      { name: "Others", slug: "others" },
    ],
    createdAt: new Date(),
  },
];

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

// 1. Get all categories (Public / Admin)
exports.getCategories = async (req, res) => {
  try {
    const db = await connectDB();
    const collection = db.collection("categories");

    let categories = await collection.find({}).sort({ createdAt: 1 }).toArray();

    if (categories.length === 0) {
      await collection.insertMany(DEFAULT_CATEGORIES);
      categories = await collection.find({}).sort({ createdAt: 1 }).toArray();
    }

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Get single category by ID or Slug
exports.getCategoryById = async (req, res) => {
  try {
    const db = await connectDB();
    const collection = db.collection("categories");
    const { idOrSlug } = req.params;

    let query = {};
    if (ObjectId.isValid(idOrSlug)) {
      query = { _id: new ObjectId(idOrSlug) };
    } else {
      query = { slug: idOrSlug };
    }

    const category = await collection.findOne(query);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    res.json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Create a new category
exports.createCategory = async (req, res) => {
  try {
    const db = await connectDB();
    const collection = db.collection("categories");
    const { name, slug, description, image, subcategories } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: "Category name is required" });
    }

    const finalSlug = (slug || generateSlug(name)).trim();

    // Check duplicate slug
    const existing = await collection.findOne({ slug: finalSlug });
    if (existing) {
      return res.status(400).json({ success: false, message: "Category with this slug already exists" });
    }

    const formattedSubcategories = Array.isArray(subcategories)
      ? subcategories.map((sub) => ({
          name: typeof sub === "string" ? sub.trim() : sub.name?.trim() || "",
          slug: (sub.slug || generateSlug(typeof sub === "string" ? sub : sub.name)).trim(),
        }))
      : [];

    const newCategory = {
      name: name.trim(),
      slug: finalSlug,
      description: (description || "").trim(),
      image: (image || "").trim(),
      subcategories: formattedSubcategories,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collection.insertOne(newCategory);
    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: { ...newCategory, _id: result.insertedId },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Update an existing category
exports.updateCategory = async (req, res) => {
  try {
    const db = await connectDB();
    const collection = db.collection("categories");
    const { id } = req.params;
    const { name, slug, description, image, subcategories } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid Category ID" });
    }

    const existing = await collection.findOne({ _id: new ObjectId(id) });
    if (!existing) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    const finalSlug = (slug || generateSlug(name || existing.name)).trim();

    // Check if another category uses this slug
    const duplicate = await collection.findOne({
      _id: { $ne: new ObjectId(id) },
      slug: finalSlug,
    });
    if (duplicate) {
      return res.status(400).json({ success: false, message: "Another category already uses this slug" });
    }

    const formattedSubcategories = Array.isArray(subcategories)
      ? subcategories.map((sub) => ({
          name: typeof sub === "string" ? sub.trim() : sub.name?.trim() || "",
          slug: (sub.slug || generateSlug(typeof sub === "string" ? sub : sub.name)).trim(),
        }))
      : existing.subcategories || [];

    const updateDoc = {
      name: (name || existing.name).trim(),
      slug: finalSlug,
      description: description !== undefined ? description.trim() : existing.description,
      image: image !== undefined ? image.trim() : existing.image,
      subcategories: formattedSubcategories,
      updatedAt: new Date(),
    };

    await collection.updateOne({ _id: new ObjectId(id) }, { $set: updateDoc });

    res.json({
      success: true,
      message: "Category updated successfully",
      data: { ...updateDoc, _id: id },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. Delete category
exports.deleteCategory = async (req, res) => {
  try {
    const db = await connectDB();
    const collection = db.collection("categories");
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid Category ID" });
    }

    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    res.json({ success: true, message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
