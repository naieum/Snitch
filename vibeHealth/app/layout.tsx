import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "VibeHealth - Telehealth Platform",
  description: "Modern telehealth platform for virtual healthcare",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* VULN [Cat 23 - GDPR]: Analytics loaded without user consent */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                window._analytics = [];
                window._analytics.push(['trackPageView', location.pathname]);
                window._analytics.push(['setUser', document.cookie]);
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-6 ml-64 mt-16">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
