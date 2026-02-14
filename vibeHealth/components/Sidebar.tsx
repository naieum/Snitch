"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "\u{1F4CA}" },
  { href: "/appointments", label: "Appointments", icon: "\u{1F4C5}" },
  { href: "/chat", label: "Messages", icon: "\u{1F4AC}" },
  { href: "/prescriptions", label: "Prescriptions", icon: "\u{1F48A}" },
  { href: "/symptom-checker", label: "Symptom Checker", icon: "\u{1F50D}" },
  { href: "/billing", label: "Billing", icon: "\u{1F4B3}" },
  { href: "/settings", label: "Settings", icon: "\u2699\uFE0F" },
  { href: "/admin", label: "Admin", icon: "\u{1F511}" },
];

export function Sidebar() {
  const pathname = usePathname();

  if (pathname === "/" || pathname === "/login" || pathname === "/signup") {
    return null;
  }

  return (
    <aside className="fixed left-0 top-16 w-64 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 overflow-y-auto">
      <nav className="p-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
              pathname === item.href
                ? "bg-blue-50 text-blue-700 font-medium"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
