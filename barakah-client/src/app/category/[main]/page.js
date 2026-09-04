import CategoryPage from "./[sub]/page";

export default async function MainCategoryPage({ params }) {
  const { main } = await params;
  return <CategoryPage params={Promise.resolve({ main, sub: "all" })} />;
}
