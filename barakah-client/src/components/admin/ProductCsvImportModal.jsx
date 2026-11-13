"use client";

import { useState, useRef } from "react";
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

const CHATGPT_PROMPT = `Convert the following product information into a valid UTF-8 CSV file with these exact headers:
name,category,subcategory,price,oldPrice,description,image,productCode,badge,inStock,isFreeShipping

Rules:
1. Wrap text fields containing commas or quotes in double quotes (escape internal quotes as "").
2. "price" and "oldPrice" must be plain numbers only (no currency symbol like BDT or ৳). Leave oldPrice empty or 0 if there is no discount.
3. "inStock" and "isFreeShipping" must be true or false.
4. "image" must be a direct image URL (leave empty if unavailable).
5. Output ONLY the raw CSV inside a single code block so I can save it directly as a .csv file.

Here is the product data:
[PASTE PRODUCT TEXT / HTML / DETAILS HERE]`;

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

function mapCsvRowsToProducts(rawRows) {
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
  const [importing, setImporting] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const validItems = parsedItems.filter((item) => item._isValid);
  const invalidCount = parsedItems.length - validItems.length;

  const handleReset = () => {
    setParsedItems([]);
    setParseError("");
    setFileName("");
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
      const { items, error } = mapCsvRowsToProducts(rawRows);
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

  const handleImport = async () => {
    if (validItems.length === 0) return;

    try {
      setImporting(true);
      const payloadProducts = validItems.map(({ _rowNumber, _isValid, _error, ...rest }) => rest);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
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

            <div className="flex items-center gap-2 text-xs">
              <span className="font-medium text-gray-600">If duplicate (SKU/Slug):</span>
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
                      <th>Product</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedItems.slice(0, 100).map((item) => (
                      <tr key={item._rowNumber} className={!item._isValid ? "bg-red-50" : ""}>
                        <td>{item._rowNumber}</td>
                        <td className="max-w-[220px]">
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
                            <span className="truncate font-medium">{item.name || "(missing)"}</span>
                          </div>
                        </td>
                        <td>{item.category || "-"}</td>
                        <td>{Number.isNaN(item.price) ? "-" : `৳${item.price}`}</td>
                        <td>{item.inStock ? "In Stock" : "Out"}</td>
                        <td>
                          {item._isValid ? (
                            <span className="text-green-600 font-medium">Ready</span>
                          ) : (
                            <span className="text-red-600 font-medium">{item._error}</span>
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
