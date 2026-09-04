import LoadingAnimation from "@/components/shared/LoadingAnimation";

export default function Loading() {
  return (
    <main className="bg-[#faf7f0] min-h-screen flex items-center justify-center">
      <LoadingAnimation width={300} height={300} message="Loading..." />
    </main>
  );
}