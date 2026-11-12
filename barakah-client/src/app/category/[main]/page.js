import CategoryPage, { generateMetadata as generateSubCategoryMetadata } from "./[sub]/page";

export async function generateMetadata({ params }) {
  const { main } = await params;
  return generateSubCategoryMetadata({ params: Promise.resolve({ main, sub: "all" }) });
}

export default async function MainCategoryPage({ params }) {
  const { main } = await params;
  return <CategoryPage params={Promise.resolve({ main, sub: "all" })} />;
}
