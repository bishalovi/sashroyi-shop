import ReviewsCarousel from "./ReviewsCarousel";
import Container from "../shared/Container";

async function getReviews() {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;

  try {
    const res = await fetch(`${baseUrl}/api/reviews`, {
      // next: { revalidate: 60 },
      cache: "no-store",
    });

    if (!res.ok) return [];

    const result = await res.json();
    return result?.data || [];
  } catch (error) {
    return [];
  }
}

export default async function Reviews() {
  const reviews = await getReviews();

  if (!reviews.length) {
    return (
      <section className="bg-[#faf7f0] py-16 text-center">
        <p className="text-gray-500">No reviews available right now.</p>
      </section>
    );
  }

  return (
    <section className="bg-[#faf7f0] py-16">
      <Container>
        <div className="mx-auto max-w-7xl px-4 text-center">
          <h2 className="mb-2 text-3xl font-bold text-[#3d2f1f] md:text-4xl">
            What Our Customers Say
          </h2>
          <p className="text-gray-500 mb-10">Swipe to view all reviews</p>

          <ReviewsCarousel reviews={reviews} />
        </div>
      </Container>
    </section>
  );
}