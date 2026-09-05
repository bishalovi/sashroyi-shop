import Link from "next/link";
import ProductCard from "@/components/products/ProductCard";
import ProductDetailsActions from "../../../components/products/ProductDetailsActions";
import Image from "next/image";
import ViewItemTracker from "@/components/tracking/ViewItemTracker";
import OfferCountdown from "@/components/products/OfferCountdown";
import Reviews from "@/components/home/Reviews";

const DEFAULT_PLACEHOLDER = "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=600&auto=format&fit=crop";

export const revalidate = 10;

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

  const imageSrc = product.image && (product.image.startsWith("http") || product.image.startsWith("/"))
    ? product.image
    : DEFAULT_PLACEHOLDER;

  return (
    <main className="bg-[#faf7f0] min-h-screen pb-10">
      <OfferCountdown product={product} />
      <ViewItemTracker product={product} />
      <div className="max-w-7xl mx-auto px-4">
        {/* Breadcrumb */}
        <div className="text-sm text-[#0f2a44]/60 mb-6">
          <Link href="/">Home</Link> /{" "}
          <span className="capitalize">{product.category}</span> /{" "}
          <span>{product.name}</span>
        </div>

        {/* Main */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-16">
          {/* Image */}
          <div className="bg-white rounded-2xl overflow-hidden aspect-square relative shadow-sm border border-[#0f2a44]/5">
            <Image
              src={imageSrc}
              alt={product.name}
              fill
              className="object-cover"
              priority
              unoptimized={imageSrc.startsWith("http")}
            />
          </div>

          {/* Info */}
          <div>
            {product.badge && (
              <span className="inline-block mb-3 px-3 py-1 bg-[#d4af37] text-white rounded font-medium text-sm">
                {product.badge}
              </span>
            )}

            <p className="text-3xl font-bold text-[#0f2a44] mt-2">
              {product.name}
            </p>

            {/* Description */}
            {product.description ? (
              <p className="mt-4 text-base text-[#0f2a44]/80 leading-relaxed whitespace-pre-line border-b border-[#0f2a44]/10 pb-4">
                {product.description}
              </p>
            ) : null}

            {/* Price, Variations, Stock, Quantity & Order Buttons */}
            <ProductDetailsActions product={product} />
          </div>
        </div>

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