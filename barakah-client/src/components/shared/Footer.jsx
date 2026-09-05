"use client";

import Link from "next/link";
import { FaFacebookF, FaInstagram, FaEnvelope, FaWhatsapp, FaPhoneAlt } from "react-icons/fa";
import { useSettings } from "@/contexts/SettingsContext";

export default function Footer() {
  const { contact, header, footer, general, getWhatsAppUrl } = useSettings();

  const shopName = header?.shopName || general?.shopName || "Sashroyi";
  const phone = contact?.phone || "01910037935";
  const whatsapp = contact?.whatsapp || "01910037935";
  const email = contact?.email || "sashroyi@gmail.com";
  const address = contact?.address || "Dhaka, Bangladesh";
  const fbPage = contact?.facebookPage || "https://www.facebook.com/";
  const fbGroup = contact?.facebookGroup || "https://facebook.com/groups/";
  const insta = contact?.instagram || "https://instagram.com/";

  const aboutText =
    footer?.aboutText ||
    "Premium Islamic Wall Clocks & Canvas Art. Crafted with elegance for your home.";

  const copyrightText =
    footer?.copyrightText ||
    `© ${new Date().getFullYear()} ${shopName}. All rights reserved.`;

  const defaultQuickLinks = [
    { label: "Home", url: "/" },
    { label: "KITCHEN & DINING", url: "/category/kitchen-dining" },
    { label: "HOME & LIVING", url: "/category/home-living" },
    { label: "সকল পণ্য (All Products)", url: "/search?q=" },
    { label: "Facebook Group", url: fbGroup },
  ];

  const quickLinks =
    footer?.quickLinks && footer.quickLinks.length > 0
      ? footer.quickLinks
      : defaultQuickLinks;

  const socialLinks = [
    {
      label: "Facebook",
      href: fbPage,
      icon: <FaFacebookF size={14} />,
    },
    {
      label: "Instagram",
      href: insta,
      icon: <FaInstagram size={16} />,
    },
    {
      label: "WhatsApp",
      href: getWhatsAppUrl("হ্যালো! আমি sashroyi.shop থেকে জানতে চাচ্ছি।"),
      icon: <FaWhatsapp size={16} />,
    },
    {
      label: "Email",
      href: `mailto:${email}`,
      icon: <FaEnvelope size={14} />,
    },
  ];

  return (
    <footer className="bg-[#0f2a44] text-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:py-8">
        <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-3">
          <div>
            <h3 className="mb-2 text-lg md:text-xl font-bold text-[#d4af37]">{shopName}</h3>
            <p className="text-xs md:text-sm leading-relaxed text-white/70 whitespace-pre-line">
              {aboutText}
            </p>

            <div className="mt-3 flex gap-2.5">
              {socialLinks.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={item.label}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-[#d4af37] hover:text-[#0f2a44]"
                >
                  {item.icon}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-2 text-xs md:text-sm font-semibold uppercase tracking-wider text-[#d4af37]">
              Quick Links
            </h4>

            <div className="flex flex-col gap-1.5">
              {quickLinks.map((link, idx) => {
                const targetUrl = link.url || link.href || "#";
                const isExternal = targetUrl.startsWith("http://") || targetUrl.startsWith("https://");
                
                return isExternal ? (
                  <a
                    key={idx}
                    href={targetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs md:text-sm text-white/60 transition-colors hover:text-[#d4af37]"
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    key={idx}
                    href={targetUrl}
                    className="text-xs md:text-sm text-white/60 transition-colors hover:text-[#d4af37]"
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div>
            <h4 className="mb-2 text-xs md:text-sm font-semibold uppercase tracking-wider text-[#d4af37]">
              Contact
            </h4>

            <div className="flex flex-col gap-1.5 text-xs md:text-sm text-white/70">
              <p className="flex items-center gap-2">
                <FaEnvelope className="text-[#d4af37]" />
                <a href={`mailto:${email}`} className="hover:text-[#d4af37] transition">
                  {email}
                </a>
              </p>
              <p className="flex items-center gap-2">
                <FaPhoneAlt className="text-[#d4af37]" />
                <a href={`tel:${phone}`} className="hover:text-[#d4af37] transition">
                  {phone}
                </a>
              </p>
              <p className="flex items-center gap-2">
                <FaWhatsapp className="text-[#25D366]" />
                <a
                  href={getWhatsAppUrl("হ্যালো! আমি sashroyi.shop থেকে তথ্য জানতে চাচ্ছি।")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#d4af37] transition text-green-400 font-medium"
                >
                  WhatsApp: {whatsapp}
                </a>
              </p>
              <p className="text-white/60 text-xs mt-0.5">{address}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-white/10 pt-4 text-center flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/50">
          <p>
            {copyrightText}
          </p>
          <p>
            Maintained by{" "}
            <a
              href="https://wa.me/8801629733036"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#d4af37] hover:underline font-semibold"
            >
              Rayhan
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
