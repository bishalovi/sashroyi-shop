import Link from "next/link";

export default function SectionTitle({
  title,
  link,
  linkText = "View All",
}) {
  return (
    <div className="mb-10 flex items-center justify-between gap-4">
      {/* Left */}
      <div>
        <h2 className="text-2xl font-bold text-[#0f2a44] lg:text-3xl">
          {title}
        </h2>
      </div>

      {/* Right */}
      {link && (
        <Link
          href={link}
          className="hidden text-sm border px-3 py-2 rounded-lg font-medium text-[#0f2a44] transition-all duration-200 hover:text-[#d4af37] md:inline-block"
        >
          {linkText} →
        </Link>
      )}
    </div>
  );
}