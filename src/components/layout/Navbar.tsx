"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { User } from "@/lib/supabase";
import TextButton from "@/components/ui/TextButton";
import TextBadge from "@/components/ui/TextBadge";

interface NavbarProps {
  user: User | null;
  onSignOut: () => void;
}

export default function Navbar({ user, onSignOut }: NavbarProps) {
  const pathname = usePathname();
  const [isOwner, setIsOwner] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (user) {
      setIsOwner(user.is_owner);
    }
  }, [user]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const navItems = [
    { href: "/events", label: "EVENTS", show: !!user && user.master_email },
    { href: "/worklog", label: "WORKLOG", show: !!user },
    {
      href: "/checklist",
      label: "CHECKLIST",
      show: !!user && user.master_email,
    },
    { href: "/tickets", label: "TICKETS", show: !!user && user.master_email },
    { href: "/settings", label: "SETTINGS", show: !!user && user.master_email },
    { href: "/owner", label: "DASHBOARD", show: isOwner },
  ];

  return (
    <nav className="border-b border-black p-4 mb-8">
      {/* Desktop Layout */}
      <div className="hidden lg:flex items-center justify-between">
        {/* Logo/Brand */}
        <div className="flex items-center space-x-4">
          <div className="emphasis text-lg">MASTERFABRIC</div>
          <TextBadge variant="muted">WELCOME</TextBadge>
        </div>

        {/* Navigation Links */}
        <div className="flex items-center space-x-4">
          {navItems
            .filter((item) => item.show)
            .map((item) => (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                className={`
                    text-sm tracking-wide transition-opacity duration-200
                    ${
                      pathname === item.href
                        ? "emphasis opacity-100"
                        : "opacity-70 hover:opacity-100"
                    }
                  `}
              >
                {item.label}
              </Link>
            ))}

          {/* User Info & Actions */}
          {user && (
            <div className="flex items-center space-x-4 border-l border-black pl-4">
              <div className="text-xs muted">{user.github_username}</div>
              {isOwner && <TextBadge variant="success">OWNER</TextBadge>}
              <TextButton
                onClick={onSignOut}
                variant="error"
                className="text-xs py-1 px-2"
              >
                LOGOUT
              </TextButton>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden">
        {/* Mobile Header */}
        <div className="flex items-center justify-between">
          {/* Logo/Brand */}
          <div className="flex items-center space-x-2">
            <div className="emphasis text-base">MASTERFABRIC</div>
            <TextBadge variant="muted" className="text-xs">
              WELCOME
            </TextBadge>
          </div>

          {/* Mobile Menu Button (only when user is authenticated) */}
          {user && (
            <button
              onClick={toggleMobileMenu}
              className="p-2 border border-black hover:bg-gray-50 transition-colors"
              aria-label="Toggle mobile menu"
            >
              <div className="w-5 h-5 flex flex-col justify-center space-y-1">
                <div
                  className={`w-full h-0.5 bg-black transition-transform duration-200 ${
                    isMobileMenuOpen ? "rotate-45 translate-y-1.5" : ""
                  }`}
                ></div>
                <div
                  className={`w-full h-0.5 bg-black transition-opacity duration-200 ${
                    isMobileMenuOpen ? "opacity-0" : ""
                  }`}
                ></div>
                <div
                  className={`w-full h-0.5 bg-black transition-transform duration-200 ${
                    isMobileMenuOpen ? "-rotate-45 -translate-y-1.5" : ""
                  }`}
                ></div>
              </div>
            </button>
          )}
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="mt-4 border-t border-black pt-4">
            {/* Navigation Links */}
            <div className="space-y-3 mb-4">
              {navItems
                .filter((item) => item.show)
                .map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={false}
                    onClick={closeMobileMenu}
                    className={`
                        block text-sm tracking-wide transition-opacity duration-200 py-2
                        ${
                          pathname === item.href
                            ? "emphasis opacity-100"
                            : "opacity-70 hover:opacity-100"
                        }
                      `}
                  >
                    {item.label}
                  </Link>
                ))}
            </div>

            {/* User Info & Actions */}
            {user && (
              <div className="border-t border-black pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs muted">{user.github_username}</div>
                  {isOwner && (
                    <TextBadge variant="success" className="text-xs">
                      OWNER
                    </TextBadge>
                  )}
                </div>
                <TextButton
                  onClick={() => {
                    onSignOut();
                    closeMobileMenu();
                  }}
                  variant="error"
                  className="text-xs py-2 px-3 w-full"
                >
                  LOGOUT
                </TextButton>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
