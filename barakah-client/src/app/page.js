import Hero from "@/components/home/Hero";
import ProductSection from "@/components/home/ProductSection";
import Reviews from "@/components/home/Reviews";

async function getProductsByCategory(category) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!baseUrl) return [];

  try {
    const res = await fetch(
      `${baseUrl}/api/products?category=${category}&limit=8`,
      {
        next: { revalidate: 300 },
      },
    );

    if (!res.ok) {
      return [];
    }

    const result = await res.json();
    return result.data || [];
  } catch (error) {
    console.error(`Failed to fetch ${category} products:`, error);
    return [];
  }
}

export default async function HomePage() {
  const [
    wallClockProducts,
    wallCanvasProducts,
    wallArtProducts,
    roundClockProducts,
    otherProducts,
  ] = await Promise.all([
    getProductsByCategory("wall-clock"),
    getProductsByCategory("wall-canvas"),
    getProductsByCategory("wall-art"),
    getProductsByCategory("round-clock"),
    getProductsByCategory("others"),
  ]);

  return (
    <main className="min-h-screen bg-[#faf7f0] text-[#3d2f1f]">
      <Hero />

      <ProductSection
        title="Premium Wall Clocks"
        link="/category/wall-clock/natural"
        products={wallClockProducts}
        bgClass="bg-[#faf7f0]"
      />

      <ProductSection
        title="Elegant Wall Canvas"
        link="/category/wall-canvas/natural"
        products={wallCanvasProducts}
        bgClass="bg-[#faf7f0]"
      />

      <ProductSection
        title="Timeless Wall Art"
        link="/category/wall-art/none"
        products={wallArtProducts}
        bgClass="bg-[#faf7f0]"
      />

      <ProductSection
        title="Classic Round Clocks"
        link="/category/round-clock/natural"
        products={roundClockProducts}
        bgClass="bg-[#faf7f0]"
      />

      <ProductSection
        title="Special Picks"
        link="/category/others/none"
        products={otherProducts}
        bgClass="bg-[#faf7f0]"
      />

      <Reviews />
    </main>
  );
}