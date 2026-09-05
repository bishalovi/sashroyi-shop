import ReviewsCarousel from "./ReviewsCarousel";
import Container from "../shared/Container";

async function getReviews() {
  const baseUrl = "https://sashroyi-api.onrender.com";

  try {
    const res = await fetch(`${baseUrl}/api/reviews`, {
      next: { revalidate: 300 },
    });

    if (!res.ok) return [];

    const result = await res.json();
    return result?.data || [];
  } catch (error) {
    return [];
  }
}

export default async function Reviews({ className = "py-8 sm:py-12" }) {
  const reviews = await getReviews();

  if (!reviews.length) {
    return (
      <section className={`bg-[#faf7f0] ${className} text-center`}>
        <p className="text-gray-500">No reviews available right now.</p>
      </section>
    );
  }

  return (
    <section className={`bg-[#faf7f0] ${className}`}>
      <Container>
        <div className="mx-auto max-w-7xl px-4 text-center">
          <h2 className="mb-2 text-2xl font-bold text-[#3d2f1f] sm:text-3xl md:text-4xl">
            What Our Customers Say
          </h2>
          <p className="text-gray-500 mb-6 text-sm sm:text-base">Swipe to view all reviews</p>

          <ReviewsCarousel reviews={reviews} />
        </div>
      </Container>
    </section>
  );
}