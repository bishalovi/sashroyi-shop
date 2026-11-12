import Container from "../shared/Container";
import SectionTitle from "../shared/SectionTitle";
import ProductCard from "../products/ProductCard";

const ProductSection = ({
  title,
  subtitle,
  link,
  products,
  bgClass = "bg-[#faf7f0]",
  isFirst = false,
}) => {
  return (
    <section className={`${bgClass} py-4 lg:py-6`}>
      <Container>
        <SectionTitle
          title={title}
          subtitle={subtitle}
          link={link}
          linkText="View All"
        />

        {products.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
            {products.map((product, idx) => (
              <ProductCard
                key={product._id}
                product={product}
                priority={isFirst && idx === 0}
                eager={isFirst && idx < 2}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl p-8 text-center text-[#0f2a44]/80">
            No items found.
          </div>
        )}
      </Container>
    </section>
  );
};

export default ProductSection;
