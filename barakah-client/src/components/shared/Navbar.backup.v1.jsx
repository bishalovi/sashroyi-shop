"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { FiShoppingCart } from "react-icons/fi";
import { FaRegUser, FaUser } from "react-icons/fa";
import { IoMdMenu } from "react-icons/io";
import { IoClose } from "react-icons/io5";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const userMenuRef = useRef(null);

  const isActive = (path, exact = false) => {
    if (exact) return pathname === path;
    return pathname.startsWith(path);
  };

  const navLinkClass = (active) =>
    `text-sm font-medium transition-colors ${
      active ? "text-[#d4af37]" : "text-[#0c2a45af] hover:text-[#d4af37]"
    }`;

  const mobileLinkClass = (active) =>
    `py-2 text-sm font-medium transition-colors ${
      active ? "text-[#d4af37]" : "text-[#0c2a45af] hover:text-[#d4af37]"
    }`;

  const closeMobileMenu = () => setMobileOpen(false);

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    setMobileOpen(false);
    router.push("/login");
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const canAccessDashboard =
    user?.role === "barakahAdmin1234" || user?.role === "barakahModerator0102";

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-md">
      <div className="mx-auto w-full max-w-7xl px-4">
        <div className="flex h-16 items-center justify-between lg:h-20">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.svg" alt="Barakah Logo" width={25} height={25} />
            <h1 className="bg-linear-to-r from-[#937923] via-[#ac9542] to-[#9c7e23] bg-clip-text text-xl font-bold text-transparent lg:text-2xl">
              Barakah
            </h1>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <Link href="/" className={navLinkClass(isActive("/", true))}>
              Home
            </Link>

            <Link
              href="/category/wall-clock/natural"
              className={navLinkClass(isActive("/category/wall-clock"))}
            >
              Wall Clock
            </Link>

            <Link
              href="/category/wall-canvas/natural"
              className={navLinkClass(isActive("/category/wall-canvas"))}
            >
              Wall Canvas
            </Link>

            <Link
              href="/category/wall-art/natural"
              className={navLinkClass(isActive("/category/wall-art"))}
            >
              Wall Art
            </Link>

            <Link
              href="/category/round-clock/natural"
              className={navLinkClass(isActive("/category/round-clock"))}
            >
              Round Clock
            </Link>

            <Link
              href="/category/others/natural"
              className={navLinkClass(isActive("/category/others"))}
            >
              Others
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/cart"
              className="relative p-2 text-[#0c2a45af] transition-colors hover:text-[#d4af37]"
            >
              <FiShoppingCart size={20} />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#d4af37] text-[10px] font-bold text-white">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* User Icon / Dropdown */}
            <div className="relative" ref={userMenuRef}>
              {user ? (
                <>
                  <button
                    onClick={() => setUserMenuOpen((prev) => !prev)}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-[#d4af37] text-white transition hover:opacity-90"
                    aria-label="User menu"
                  >
                    <FaUser size={16} />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 rounded-xl border border-gray-100 bg-white p-2 shadow-lg">
                      <div className="border-b border-gray-100 px-3 py-2">
                        <p className="text-sm font-semibold text-gray-800">
                          {user.userName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {user.email}
                        </p>
                      </div>

                      <div className="py-2">
                        {canAccessDashboard && (
                          <Link
                            href="/admin"
                            onClick={() => setUserMenuOpen(false)}
                            className="block rounded-lg px-3 py-2 text-sm text-[#0c2a45af] hover:bg-gray-50 hover:text-[#d4af37]"
                          >
                            Dashboard
                          </Link>
                        )}

                        {/* <Link
                          href="/profile"
                          onClick={() => setUserMenuOpen(false)}
                          className="block rounded-lg px-3 py-2 text-sm text-[#0c2a45af] hover:bg-gray-50 hover:text-[#d4af37]"
                        >
                          Profile
                        </Link> */}

                        <button
                          onClick={handleLogout}
                          className="block w-full rounded-lg px-3 py-2 text-left text-sm text-red-500 hover:bg-red-50"
                        >
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <Link
                  href="/login"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 text-[#0c2a45af] transition-colors hover:border-[#d4af37] hover:text-[#d4af37]"
                  aria-label="Login"
                >
                  <FaRegUser size={16} />
                </Link>
              )}
            </div>

            <button
              onClick={() => setMobileOpen((prev) => !prev)}
              className="p-2 text-[#0c2a45af] md:hidden"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <IoClose size={24} /> : <IoMdMenu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-gray-200 bg-white md:hidden">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-4">
            <Link
              href="/"
              onClick={closeMobileMenu}
              className={mobileLinkClass(isActive("/", true))}
            >
              Home
            </Link>

            <Link
              href="/category/wall-clock/natural"
              onClick={closeMobileMenu}
              className={mobileLinkClass(isActive("/category/wall-clock"))}
            >
              Wall Clock
            </Link>

            <Link
              href="/category/wall-canvas/natural"
              onClick={closeMobileMenu}
              className={mobileLinkClass(isActive("/category/wall-canvas"))}
            >
              Wall Canvas
            </Link>

            <Link
              href="/category/wall-art/natural"
              onClick={closeMobileMenu}
              className={mobileLinkClass(isActive("/category/wall-art"))}
            >
              Wall Art
            </Link>

            <Link
              href="/category/round-clock/natural"
              onClick={closeMobileMenu}
              className={mobileLinkClass(isActive("/category/round-clock"))}
            >
              Round Clock
            </Link>

            <Link
              href="/category/others/natural"
              onClick={closeMobileMenu}
              className={mobileLinkClass(isActive("/category/others"))}
            >
              Others
            </Link>

            {user && (
              <div className="mt-2 border-t border-gray-200 pt-3 flex flex-col gap-3">
                {canAccessDashboard && (
                  <Link
                    href="/admin"
                    onClick={closeMobileMenu}
                    className="text-sm font-medium text-[#0c2a45af] hover:text-[#d4af37]"
                  >
                    Dashboard
                  </Link>
                )}

                {/* <Link
                  href="/profile"
                  onClick={closeMobileMenu}
                  className="text-sm font-medium text-[#0c2a45af] hover:text-[#d4af37]"
                >
                  Profile
                </Link> */}

                <button
                  onClick={handleLogout}
                  className="text-left text-sm font-medium text-red-500 hover:text-red-600"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
