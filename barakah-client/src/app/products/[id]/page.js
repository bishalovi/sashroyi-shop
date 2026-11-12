import Link from "next/link";
import ProductCard from "@/components/products/ProductCard";
import ProductDetailsClient from "@/components/products/ProductDetailsClient";
import ViewItemTracker from "@/components/tracking/ViewItemTracker";
import OfferCountdown from "@/components/products/OfferCountdown";
import Reviews from "@/components/home/Reviews";

const DEFAULT_PLACEHOLDER = "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=600&auto=format&fit=crop";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://sashroyi.shop";

export const revalidate = 10;

function stripHtmlAndTruncate(text, maxLength = 155) {
  const clean = String(text || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!clean) return "";
  return clean.length > maxLength ? `${clean.slice(0, maxLength - 3).trim()}...` : clean;
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const product = await getSingleProduct(id);

  if (!product) {
    return {
      title: "Product Not Found | Sashroyi Shop",
      robots: { index: false, follow: false },
    };
  }

  const productSlugOrId = product.slug || product._id;
  const canonicalUrl = `${SITE_URL}/products/${productSlugOrId}`;
  const productImage = product.image || DEFAULT_PLACEHOLDER;

  const title = product.metaTitle?.trim() || `${product.name} | Sashroyi Shop`;
  const description =
    product.metaDescription?.trim() ||
    stripHtmlAndTruncate(product.description, 155) ||
    `${product.name} কিনুন Sashroyi Shop থেকে${product.price ? ` মাত্র ৳${product.price} টাকায়` : ""}। সেরা মানের পণ্য ও দ্রুত হোম ডেলিভারি।`;

  const keywords = product.metaKeywords?.trim()
    ? product.metaKeywords.split(",").map((k) => k.trim()).filter(Boolean)
    : [product.name, product.category, product.subcategory, "Sashroyi Shop"].filter(Boolean);

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: "website",
      url: canonicalUrl,
      title,
      description,
      siteName: "Sashroyi Shop",
      images: [
        {
          url: productImage,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [productImage],
    },
  };
}

async function getSingleProduct(id) {
  const baseUrl = "https://sashroyi-api.onrender.com";
  try {
    const res = await fetch(`${baseUrl}/api/products/${id}`, {
      next: { revalidate: 10 },
    });

    if (!res.ok) {
      return null;
    }

    const result = await res.json();
    return result.data || null;
  } catch (error) {
    console.error("Failed to fetch product:", error);
    return null;
  }
}

async function getRelatedProducts(category, excludeId) {
  const baseUrl = "https://sashroyi-api.onrender.com";
  try {
    const res = await fetch(`${baseUrl}/api/products?category=${category}&limit=6`, {
      next: { revalidate: 10 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return (json.data || []).filter((p) => p._id !== excludeId).slice(0, 4);
  } catch {
    return [];
  }
}

export default async function ProductDetails({ params }) {
  const { id } = await params;
  const product = await getSingleProduct(id);

  if (!product) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <Link href="/" className="text-blue-500">
            Go Home
          </Link>
        </div>
      </main>
    );
  }

  const relatedProducts = await getRelatedProducts(product.category, product._id);

  const productSlugOrId = product.slug || product._id;
  const productUrl = `${SITE_URL}/products/${productSlugOrId}`;
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.image ? [product.image] : [DEFAULT_PLACEHOLDER],
    description:
      product.metaDescription?.trim() ||
      stripHtmlAndTruncate(product.description, 300) ||
      product.name,
    sku: product.productCode || String(product._id),
    brand: {
      "@type": "Brand",
      name: "Sashroyi Shop",
    },
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: "BDT",
      price: Number(product.price || 0),
      availability:
        product.inStock !== false
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  return (
    <main className="bg-[#faf7f0] min-h-screen pb-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <OfferCountdown product={product} />
      <ViewItemTracker product={product} />
      <div className="max-w-7xl mx-auto px-4">
        {/* Breadcrumb */}
        <div className="text-sm text-[#0f2a44]/60 mb-6">
          <Link href="/" className="hover:underline">Home</Link> /{" "}
          <span className="capitalize">{product.category}</span> /{" "}
          <span>{product.name}</span>
        </div>

        {/* Main Product View (Dynamic Image Switcher + Variations) */}
        <ProductDetailsClient product={product} />

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6 text-[#0f2a44]">
              Related Products
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {relatedProducts.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          </div>
        )}

        <Reviews />
      </div>
    </main>
  );
}