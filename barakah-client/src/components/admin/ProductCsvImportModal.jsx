"use client";

import { useState, useRef, useEffect } from "react";
import Swal from "sweetalert2";
import {
  FaFileCsv,
  FaDownload,
  FaRobot,
  FaCheck,
  FaUpload,
  FaTimes,
  FaExclamationTriangle,
  FaCheckCircle,
} from "react-icons/fa";

const SAMPLE_CSV_CONTENT = [
  [
    "name",
    "category",
    "subcategory",
    "price",
    "oldPrice",
    "description",
    "image",
    "productCode",
    "badge",
    "inStock",
    "isFreeShipping",
  ].join(","),
  [
    '"Premium Organic Honey 500g"',
    '"Honey"',
    '"Sundarban Honey"',
    "650",
    "800",
    '"100% pure natural honey sourced directly from Sundarban."',
    '"https://example.com/images/honey.jpg"',
    '"SKU-HNY-01"',
    '"Best Seller"',
    "true",
    "false",
  ].join(","),
  [
    '"Black Seed Oil 200ml"',
    '"Oil"',
    '""',
    "450",
    "550",
    '"Cold pressed black seed oil for daily wellness."',
    '"https://example.com/images/blackseed.jpg"',
    '"SKU-OIL-02"',
    '"New"',
    "true",
    "true",
  ].join(","),
].join("\r\n");

const CHATGPT_PROMPT = `Act as an E-commerce SEO Expert. Convert the following product data into a fully SEO-optimized, valid UTF-8 CSV with these EXACT headers:
name,category,subcategory,price,oldPrice,description,image,productCode,badge,inStock,isFreeShipping,metaTitle,metaDescription,metaKeywords

SEO & Quality Rules:
1. "name": Catchy, natural, high-intent product title (English or Bangla as provided), 40-70 characters.
2. "category": Must be one of the standard store categories (e.g. "Health & Beauty", "Kitchen & Dining", "Home & Living", "Baby Care", "Essential Gadgets", "Tool & Accessories").
3. "price" and "oldPrice": Plain numbers only (NO currency symbols like BDT or ৳). If no discount, set oldPrice to 0.
4. "description": Rich, customer-engaging description in clean text (benefits, key features, usage instructions). Avoid raw HTML tags.
5. "metaTitle": SEO Title formatted like: "[Product Name] - Best Price in Bangladesh | Sashroyi Shop" (max 60 chars).
6. "metaDescription": Compelling meta description with primary search keywords and clear call-to-action (120-155 characters).
7. "metaKeywords": 5 to 8 comma-separated search terms (e.g., "[Product name] price in bd, buy [product name] online, original [product name], sashroyi shop").
8. "inStock" & "isFreeShipping": Must be boolean: true or false.
9. "image": Direct high-resolution image URL.
10. Escape rules: Wrap text fields containing commas or quotes in double quotes (internal quotes escaped as ""). Output ONLY the raw CSV inside a single code block.

Here is the product data:
[PASTE PRODUCT TEXT / HTML / DETAILS / LINKS HERE]`;

const HEADER_ALIASES = {
  name: "name",
  title: "name",
  productname: "name",
  category: "category",
  googleproductcategory: "category",
  fbproductcategory: "category",
  productcategory: "category",
  subcategory: "subcategory",
  price: "price",
  saleprice: "price",
  sellingprice: "price",
  oldprice: "oldPrice",
  regularprice: "oldPrice",
  compareatprice: "oldPrice",
  description: "description",
  desc: "description",
  details: "description",
  shortdescription: "description",
  image: "image",
  imagelink: "image",
  imageurl: "image",
  img: "image",
  thumbnail: "image",
  productcode: "productCode",
  sku: "productCode",
  code: "productCode",
  badge: "badge",
  tag: "badge",
  label: "badge",
  instock: "inStock",
  availability: "inStock",
  stock: "inStock",
  stockstatus: "inStock",
  isfreeshipping: "isFreeShipping",
  freeshipping: "isFreeShipping",
  slug: "slug",
  metatitle: "metaTitle",
  metadescription: "metaDescription",
  metakeywords: "metaKeywords",
};

function normalizeHeader(header) {
  return String(header || "")
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

// RFC 4180 CSV parser supporting quoted fields, escaped quotes, and multiline values
function parseCsvText(text) {
  const cleanText = String(text || "").replace(/^\uFEFF/, "");
  const rows = [];
  let currentRow = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < cleanText.length; i += 1) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      currentRow.push(currentField);
      currentField = "";
    } else if (char === "\r" && nextChar === "\n") {
      currentRow.push(currentField);
      rows.push(currentRow);
      currentRow = [];
      currentField = "";
      i += 1;
    } else if (char === "\n" || char === "\r") {
      currentRow.push(currentField);
      rows.push(currentRow);
      currentRow = [];
      currentField = "";
    } else {
      currentField += char;
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  return rows.filter((row) => row.some((cell) => String(cell).trim() !== ""));
}

function parseNumericPrice(rawValue) {
  if (rawValue === undefined || rawValue === null || String(rawValue).trim() === "") {
    return NaN;
  }
  const cleaned = String(rawValue).replace(/[^0-9.-]/g, "");
  if (!cleaned) return NaN;
  return Number(cleaned);
}

function parseBooleanValue(rawValue, defaultValue = true) {
  const val = String(rawValue ?? "").trim().toLowerCase();
  if (!val) return defaultValue;
  if (["true", "1", "yes", "in stock", "instock", "available"].includes(val)) return true;
  if (["false", "0", "no", "out of stock", "outofstock", "unavailable"].includes(val)) return false;
  return defaultValue;
}

function findMatchingCategory(rawCat, availableCategories = []) {
  if (!rawCat || !availableCategories.length) return "";
  const clean = String(rawCat).trim().toLowerCase().replace(/[^\w]/g, "");
  if (!clean) return "";

  const direct = availableCategories.find(
    (c) =>
      c.name.trim().toLowerCase() === rawCat.trim().toLowerCase() ||
      c.slug.trim().toLowerCase() === rawCat.trim().toLowerCase()
  );
  if (direct) return direct.name;

  const fuzzy = availableCategories.find((c) => {
    const cNameClean = c.name.toLowerCase().replace(/[^\w]/g, "");
    const cSlugClean = c.slug.toLowerCase().replace(/[^\w]/g, "");
    return (
      cNameClean === clean ||
      cSlugClean === clean ||
      cNameClean.includes(clean) ||
      clean.includes(cNameClean)
    );
  });

  return fuzzy ? fuzzy.name : "";
}

function mapCsvRowsToProducts(rawRows, availableCategories = []) {
  if (!rawRows || rawRows.length < 2) {
    return { items: [], error: "CSV file must contain a header row and at least one product row." };
  }

  const headers = rawRows[0];
  const mappedFields = headers.map((h) => HEADER_ALIASES[normalizeHeader(h)] || null);

  if (!mappedFields.includes("name") && !mappedFields.includes("price")) {
    return {
      items: [],
      error: "Could not detect 'name'/'title' or 'price' columns. Download the sample CSV to check headers.",
    };
  }

  const items = rawRows.slice(1).map((row, idx) => {
    const product = {
      name: "",
      category: "",
      subcategory: "",
      price: NaN,
      oldPrice: 0,
      description: "",
      image: "",
      productCode: "",
      badge: "",
      inStock: true,
      isFreeShipping: false,
      slug: "",
    };

    mappedFields.forEach((field, colIdx) => {
      if (!field) return;
      const cell = String(row[colIdx] ?? "").trim();
      if (field === "price") {
        product.price = parseNumericPrice(cell);
      } else if (field === "oldPrice") {
        const parsed = parseNumericPrice(cell);
        product.oldPrice = !Number.isNaN(parsed) && parsed > 0 ? parsed : 0;
      } else if (field === "inStock") {
        product.inStock = parseBooleanValue(cell, true);
      } else if (field === "isFreeShipping") {
        product.isFreeShipping = parseBooleanValue(cell, false);
      } else {
        product[field] = cell;
      }
    });

    const autoMatchedCategory = findMatchingCategory(product.category, availableCategories);
    if (autoMatchedCategory) {
      product.category = autoMatchedCategory;
    }

    const validationErrors = [];
    if (!product.name) validationErrors.push("Name required");
    if (Number.isNaN(product.price) || product.price < 0) validationErrors.push("Invalid price");

    return {
      ...product,
      _rowNumber: idx + 2,
      _isValid: validationErrors.length === 0,
      _error: validationErrors.join(", "),
    };
  });

  return { items, error: null };
}

export default function ProductCsvImportModal({ isOpen, onClose, baseUrl, onSuccess }) {
  const [parsedItems, setParsedItems] = useState([]);
  const [parseError, setParseError] = useState("");
  const [fileName, setFileName] = useState("");
  const [duplicateAction, setDuplicateAction] = useState("skip");
  const [targetCategory, setTargetCategory] = useState("");
  const [targetBadge, setTargetBadge] = useState("__none__");
  const [priceAdjustmentType, setPriceAdjustmentType] = useState("fixed"); // "fixed" | "percent"
  const [priceAdjustmentValue, setPriceAdjustmentValue] = useState("");
  const [availableCategories, setAvailableCategories] = useState([]);
  const [importing, setImporting] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Fetch store categories on modal open
  useEffect(() => {
    if (!isOpen) return;
    const fetchCats = async () => {
      try {
        const res = await fetch(`${baseUrl}/api/categories`);
        if (res.ok) {
          const json = await res.json();
          setAvailableCategories(json.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    };
    fetchCats();
  }, [isOpen, baseUrl]);

  if (!isOpen) return null;

  const validItems = parsedItems.filter((item) => item._isValid);
  const invalidCount = parsedItems.length - validItems.length;

  const handleReset = () => {
    setParsedItems([]);
    setParseError("");
    setFileName("");
    setTargetCategory("");
    setTargetBadge("__none__");
    setPriceAdjustmentType("fixed");
    setPriceAdjustmentValue("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDownloadSample = () => {
    const blob = new Blob(["\uFEFF" + SAMPLE_CSV_CONTENT], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "sashroyi_products_sample.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(CHATGPT_PROMPT);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    } catch {
      Swal.fire("Error", "Could not copy prompt to clipboard.", "error");
    }
  };

  const processFile = (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setParseError("Please select a valid .csv file.");
      setParsedItems([]);
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      const rawRows = parseCsvText(text);
      const { items, error } = mapCsvRowsToProducts(rawRows, availableCategories);
      if (error) {
        setParseError(error);
        setParsedItems([]);
      } else {
        setParseError("");
        setParsedItems(items);
      }
    };
    reader.onerror = () => {
      setParseError("Failed to read the CSV file.");
      setParsedItems([]);
    };
    reader.readAsText(file, "UTF-8");
  };

  const calculateFinalPrice = (originalPrice) => {
    if (Number.isNaN(originalPrice) || originalPrice < 0) return originalPrice;
    const numAdj = Number(priceAdjustmentValue);
    if (!numAdj || Number.isNaN(numAdj)) return originalPrice;

    if (priceAdjustmentType === "fixed") {
      return Math.max(0, Math.round(originalPrice + numAdj));
    }
    if (priceAdjustmentType === "percent") {
      return Math.max(0, Math.round(originalPrice * (1 + numAdj / 100)));
    }
    return originalPrice;
  };

  const handleCellChange = (rowNumber, field, value) => {
    setParsedItems((prev) =>
      prev.map((item) => {
        if (item._rowNumber !== rowNumber) return item;
        const updated = { ...item, [field]: value };
        if (field === "price") {
          updated.price = Number(value);
        }
        const validationErrors = [];
        if (!updated.name || !String(updated.name).trim()) validationErrors.push("Name required");
        if (Number.isNaN(updated.price) || updated.price < 0) validationErrors.push("Invalid price");
        updated._isValid = validationErrors.length === 0;
        updated._error = validationErrors.join(", ");
        return updated;
      })
    );
  };

  const handleImport = async () => {
    if (validItems.length === 0) return;

    try {
      setImporting(true);
      const payloadProducts = validItems.map(({ _rowNumber, _isValid, _error, ...rest }) => ({
        ...rest,
        category: targetCategory ? targetCategory : rest.category,
        badge: targetBadge === "__none__" ? "" : targetBadge ? targetBadge : rest.badge,
        price: calculateFinalPrice(rest.price),
      }));

      const res = await fetch(`${baseUrl}/api/products/bulk-import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          products: payloadProducts,
          duplicateAction,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        Swal.fire("Import Failed", data.message || "Something went wrong.", "error");
        return;
      }

      const { inserted = 0, updated = 0, skipped = 0, failed = 0 } = data.summary || {};

      await Swal.fire({
        icon: "success",
        title: "CSV Import Complete!",
        html: `
          <div class="text-sm text-left space-y-1">
            <p><strong>Inserted:</strong> ${inserted}</p>
            <p><strong>Updated:</strong> ${updated}</p>
            <p><strong>Skipped:</strong> ${skipped}</p>
            <p><strong>Failed:</strong> ${failed}</p>
          </div>
        `,
        confirmButtonColor: "#0f2a44",
      });

      handleReset();
      onSuccess?.();
      onClose();
    } catch (error) {
      Swal.fire("Error", "Network error while importing products.", "error");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-[#faf7f0]">
          <div className="flex items-center gap-2.5">
            <FaFileCsv className="text-2xl text-[#0f2a44]" />
            <div>
              <h3 className="text-lg font-bold text-[#0f2a44]">Import Products from CSV</h3>
              <p className="text-xs text-gray-500">
                Supports Standard CSV, Meta Catalog CSV, or ChatGPT-generated CSV
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              handleReset();
              onClose();
            }}
            className="btn btn-sm btn-ghost btn-circle"
            aria-label="Close modal"
          >
            <FaTimes />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Quick Helper Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadSample}
                className="btn btn-sm bg-white border-gray-300 text-gray-700 hover:bg-gray-100 gap-2"
              >
                <FaDownload className="text-xs" />
                Download Sample CSV
              </button>

              <button
                type="button"
                onClick={handleCopyPrompt}
                className="btn btn-sm bg-[#0f2a44] text-white hover:bg-[#1a3d5f] border-none gap-2"
              >
                {copiedPrompt ? <FaCheck className="text-xs text-green-300" /> : <FaRobot className="text-xs" />}
                {copiedPrompt ? "ChatGPT Prompt Copied!" : "Copy ChatGPT Prompt"}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs">
              {availableCategories.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-gray-600">Category:</span>
                  <select
                    value={targetCategory}
                    onChange={(e) => setTargetCategory(e.target.value)}
                    className="select select-bordered select-xs bg-white font-medium text-[#0f2a44]"
                  >
                    <option value="">Keep CSV Category</option>
                    {availableCategories.map((c) => (
                      <option key={c._id || c.slug} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Badge Selection */}
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-gray-600">Badge:</span>
                <select
                  value={targetBadge}
                  onChange={(e) => setTargetBadge(e.target.value)}
                  className="select select-bordered select-xs bg-white font-medium"
                >
                  <option value="">Keep CSV Badge</option>
                  <option value="__none__">🚫 No Badge (খালি)</option>
                  <option value="Hot">🔥 Hot</option>
                  <option value="Sale">🏷️ Sale</option>
                  <option value="New">✨ New Arrival</option>
                  <option value="Best Seller">⭐ Best Seller</option>
                  <option value="Trending">📈 Trending</option>
                </select>
              </div>

              {/* Price Modifier */}
              <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-gray-200">
                <span className="font-medium text-gray-600">Price Adjust:</span>
                <select
                  value={priceAdjustmentType}
                  onChange={(e) => setPriceAdjustmentType(e.target.value)}
                  className="select select-ghost select-xs font-semibold text-[#0f2a44]"
                >
                  <option value="fixed">৳ Tk (+ / -)</option>
                  <option value="percent">% Percent (+ / -)</option>
                </select>
                <input
                  type="number"
                  placeholder={priceAdjustmentType === "fixed" ? "+10 or -10" : "+10% or -10%"}
                  value={priceAdjustmentValue}
                  onChange={(e) => setPriceAdjustmentValue(e.target.value)}
                  className="input input-xs input-bordered w-24 bg-white font-medium"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="font-medium text-gray-600">Duplicate:</span>
                <select
                  value={duplicateAction}
                  onChange={(e) => setDuplicateAction(e.target.value)}
                  className="select select-bordered select-xs bg-white"
                >
                  <option value="skip">Skip existing</option>
                  <option value="update">Update existing</option>
                </select>
              </div>
            </div>
          </div>

          {/* Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer.files?.[0];
              processFile(file);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
              isDragging
                ? "border-[#0f2a44] bg-blue-50/50"
                : "border-gray-300 hover:border-[#0f2a44] hover:bg-gray-50"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => processFile(e.target.files?.[0])}
            />
            <FaUpload className="mx-auto text-2xl text-gray-400 mb-2" />
            <p className="text-sm font-medium text-gray-700">
              {fileName ? `Selected: ${fileName}` : "Click to choose a .csv file or drag & drop here"}
            </p>
            <p className="text-xs text-gray-400 mt-1">Max 500 products per import</p>
          </div>

          {/* Parse Error */}
          {parseError && (
            <div className="alert alert-error text-sm py-2.5">
              <FaExclamationTriangle />
              <span>{parseError}</span>
            </div>
          )}

          {/* Preview Table */}
          {parsedItems.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3 text-sm">
                  <span className="badge badge-success text-white gap-1">
                    <FaCheckCircle className="text-xs" /> {validItems.length} Valid
                  </span>
                  {invalidCount > 0 && (
                    <span className="badge badge-error text-white gap-1">
                      <FaExclamationTriangle className="text-xs" /> {invalidCount} Invalid (will be ignored)
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleReset}
                  className="btn btn-xs btn-ghost text-gray-500"
                >
                  Clear File
                </button>
              </div>

              <div className="overflow-x-auto border rounded-xl max-h-64">
                <table className="table table-xs">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th>Row</th>
                      <th>Product Name</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Badge</th>
                      <th>Stock</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedItems.slice(0, 100).map((item) => (
                      <tr key={item._rowNumber} className={!item._isValid ? "bg-red-50" : ""}>
                        <td>{item._rowNumber}</td>
                        <td className="max-w-[240px]">
                          <div className="flex items-center gap-2">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name || "Preview"}
                                className="w-8 h-8 rounded object-cover border shrink-0"
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
                              />
                            ) : null}
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => handleCellChange(item._rowNumber, "name", e.target.value)}
                              className="input input-xs input-bordered w-full font-medium bg-white"
                              title="Click to edit name directly"
                            />
                          </div>
                        </td>
                        <td className="max-w-[150px]">
                          {availableCategories.length > 0 ? (
                            <select
                              value={targetCategory || item.category || ""}
                              onChange={(e) => handleCellChange(item._rowNumber, "category", e.target.value)}
                              disabled={Boolean(targetCategory)}
                              className="select select-bordered select-xs w-full bg-white font-medium disabled:bg-gray-100"
                              title={targetCategory ? "Assigned by top dropdown" : "Select category for this product"}
                            >
                              <option value="">(Select Category)</option>
                              {availableCategories.map((c) => (
                                <option key={c._id || c.slug} value={c.name}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={targetCategory || item.category || ""}
                              onChange={(e) => handleCellChange(item._rowNumber, "category", e.target.value)}
                              disabled={Boolean(targetCategory)}
                              placeholder="Category"
                              className="input input-xs input-bordered w-full bg-white disabled:bg-gray-100"
                              title={targetCategory ? "Assigned by top dropdown" : "Click to edit category"}
                            />
                          )}
                        </td>
                        <td className="w-24">
                          <input
                            type="number"
                            value={Number.isNaN(item.price) ? "" : item.price}
                            onChange={(e) => handleCellChange(item._rowNumber, "price", e.target.value)}
                            className="input input-xs input-bordered w-20 font-semibold bg-white"
                            title="Click to edit original price"
                          />
                          {priceAdjustmentType !== "none" && priceAdjustmentValue && (
                            <span className="block text-[10px] font-semibold text-blue-700">
                              → ৳{calculateFinalPrice(item.price)}
                            </span>
                          )}
                        </td>
                        <td className="w-24">
                          <span className="badge badge-sm badge-ghost font-medium">
                            {targetBadge === "__none__" ? "(None)" : targetBadge || item.badge || "-"}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => handleCellChange(item._rowNumber, "inStock", !item.inStock)}
                            className={`badge badge-sm cursor-pointer ${item.inStock ? "badge-success text-white" : "badge-ghost"}`}
                            title="Click to toggle stock"
                          >
                            {item.inStock ? "In Stock" : "Out"}
                          </button>
                        </td>
                        <td>
                          {item._isValid ? (
                            <span className="text-green-600 font-medium text-xs">Ready</span>
                          ) : (
                            <span className="text-red-600 font-medium text-xs">{item._error}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedItems.length > 100 && (
                  <p className="text-xs text-center text-gray-500 py-2">
                    Showing first 100 of {parsedItems.length} rows.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t bg-gray-50">
          <button
            type="button"
            onClick={() => {
              handleReset();
              onClose();
            }}
            className="btn btn-sm btn-ghost"
            disabled={importing}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={validItems.length === 0 || importing}
            className="btn btn-sm bg-[#0f2a44] text-white hover:bg-[#1a3d5f] border-none"
          >
            {importing ? "Importing..." : `Import ${validItems.length} Product(s)`}
          </button>
        </div>
      </div>
    </div>
  );
}
