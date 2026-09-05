import Link from "next/link";
import ProductCard from "@/components/products/ProductCard";
import ProductDetailsActions from "../../../components/products/ProductDetailsActions";
import Image from "next/image";
import ViewItemTracker from "@/components/tracking/ViewItemTracker";
import OfferCountdown from "@/components/products/OfferCountdown";
import Reviews from "@/components/home/Reviews";

const DEFAULT_PLACEHOLDER = "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=600&auto=format&fit=crop";

async function getProducts() {
  const baseUrl = "https://sashroyi-api.onrender.com";
  try {
    const res = await fetch(`${baseUrl}/api/products`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return [];
    }

    const result = await res.json();
    return result.data || [];
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return [];
  }
}

export default async function ProductDetails({ params }) {
  const { id } = await params;
  const products = await getProducts();

  const product = products.find((p) => p._id === id || p.slug === id);

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

  // related products
  const relatedProducts = products
    .filter((p) => p.category === product.category && p._id !== product._id)
    .slice(0, 4);

  const imageSrc = product.image && (product.image.startsWith("http") || product.image.startsWith("/"))
    ? product.image
    : DEFAULT_PLACEHOLDER;

  return (
    <main className="bg-[#faf7f0] min-h-screen pb-8">
      <ViewItemTracker product={product} />
      <div className="max-w-7xl mx-auto px-4 pt-3 sm:pt-4">
        <OfferCountdown product={product} />

        {/* Breadcrumb */}
        <div className="text-xs sm:text-sm text-[#0f2a44]/60 mb-3">
          <Link href="/" className="hover:underline">Home</Link> /{" "}
          <span className="capitalize">{product.category}</span> /{" "}
          <span className="font-medium text-[#0f2a44]">{product.name}</span>
        </div>

        {/* Main */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-8">
          {/* Image */}
          <div className="bg-white rounded-2xl overflow-hidden aspect-square relative shadow-xs border border-[#0f2a44]/5 max-w-md lg:max-w-none mx-auto w-full">
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
              <span className="inline-block mb-1.5 px-2.5 py-0.5 bg-[#d4af37] text-white rounded font-semibold text-xs shadow-xs">
                {product.badge}
              </span>
            )}

            <h1 className="text-2xl sm:text-3xl font-bold text-[#0f2a44] mt-0.5">
              {product.name}
            </h1>

            {/* Description */}
            {product.description ? (
              <p className="mt-2 text-sm sm:text-base text-[#0f2a44]/80 leading-relaxed whitespace-pre-line border-b border-[#0f2a44]/10 pb-2.5">
                {product.description}
              </p>
            ) : null}

            {/* Price, Variations, Stock, Quantity & Order Buttons */}
            <ProductDetailsActions product={product} />
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mb-8 pt-4 border-t border-[#0f2a44]/10">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 text-[#0f2a44]">
              Related Products
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {relatedProducts.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-[#0f2a44]/10">
          <Reviews className="py-6 sm:py-8" />
        </div>
      </div>
    </main>
  );
}