"use client";

import Link from "next/link";
import { FaFacebookF, FaInstagram, FaEnvelope } from "react-icons/fa";

export default function Footer() {
  const quickLinks = [
    { label: "Home", href: "/" },
    { label: "Wall Clocks", href: "/category/wall-clock/natural" },
    { label: "Wall Canvas", href: "/category/wall-canvas/natural" },
    {
      label: "Facebook Group",
      href: "https://facebook.com/groups/893573157040880/",
    },
  ];

  const socialLinks = [
    {
      label: "Facebook",
      href: "https://www.facebook.com/profile.php?id=61575470920192",
      icon: <FaFacebookF size={14} />,
    },
    {
      label: "Instagram",
      href: "https://www.instagram.com/saheen_shuvo/?hl=en",
      icon: <FaInstagram size={16} />,
    },
    {
      label: "Email",
      href: "mailto:barakahislamicclock@gmail.com",
      icon: <FaEnvelope size={14} />,
    },
  ];

  return (
    <footer className="bg-[#0f2a44] text-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-12">
        <div className="grid grid-cols-1 items-start gap-10 md:grid-cols-3">
          <div>
            <h3 className="mb-3 text-xl font-bold text-[#d4af37]">Barakah</h3>
            <p className="text-sm leading-relaxed text-white/70">
              Premium Islamic Wall Clocks & Canvas Art. Crafted with elegance
              for your home.
            </p>

            <div className="mt-4 flex gap-3">
              {socialLinks.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  aria-label={item.label}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-[#d4af37] hover:text-[#0f2a44]"
                >
                  {item.icon}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#d4af37]">
              Quick Links
            </h4>

            <div className="flex flex-col gap-2">
              {quickLinks.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-sm text-white/60 transition-colors hover:text-[#d4af37]"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#d4af37]">
              Contact
            </h4>

            <div className="flex flex-col gap-2 text-sm text-white/60">
              <p>barakahislamicclock@gmail.com</p>
              <p>+8801346496814</p>
              <p>Uttara, Dhaka, Bangladesh</p>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center">
          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} Barakah – Islamic Clock and Canvas. All
            rights reserved.
          </p>
          <br />
          <p className="text-xs text-white/40">
            Developed by{" "}
            <a
              href="https://saheenalamshuvo.me"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#d4af37] hover:underline animate-pulse font-semibold"
            >
              Saheen Alam Shuvo
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
