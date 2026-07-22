import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { TRPCProvider } from "@/components/providers/TRPCProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { SosButton } from "@/components/sos/SosButton";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { QuickActions } from "@/components/layout/QuickActions";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import { WelcomeModal } from "@/components/onboarding/WelcomeModal";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "NeighborLink — Your Neighborhood, Connected",
  description:
    "Enter your location once → get a living map of everything and everyone that serves your neighborhood — hospitals, entertainment, local vendors — with verified contact details, in-app booking, and a safe two-sided marketplace.",
  keywords: [
    "neighborhood",
    "local services",
    "vendors",
    "hospitals",
    "plumber",
    "electrician",
    "milk delivery",
    "newspaper vendor",
    "hyperlocal",
    "community",
  ],
  authors: [{ name: "NeighborLink" }],
  openGraph: {
    title: "NeighborLink — Your Neighborhood, Connected",
    description: "Find trusted local services, vendors, and everything your community needs.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${outfit.variable}`}
    >
      <body
        className="min-h-screen antialiased"
        style={{ fontFamily: "var(--font-body)" }}
      >
        <AuthProvider>
          <ThemeProvider>
            <TRPCProvider>
              <ToastProvider>
                <div className="flex min-h-screen flex-col">
                  {/* Top navigation — glassmorphism */}
                  <Navbar />

                  {/* Main content area with sidebar */}
                  <div className="flex flex-1">
                    <Suspense fallback={<div className="w-[var(--app-sidebar-width)] hidden lg:block shrink-0 bg-[var(--app-sidebar-bg)] border-r border-white/10" />}>
                      <Sidebar />
                    </Suspense>
                    <main id="main-content" className="flex-1 overflow-y-auto pb-20 lg:pb-0" role="main">
                      {children}
                    </main>
                  </div>

                  {/* Footer */}
                  <Footer />

                  {/* Mobile bottom nav */}
                  <MobileBottomNav />

                  {/* Global floating emergency SOS Alert button */}
                  <SosButton />

                  {/* Mobile Quick Actions FAB Menu */}
                  <QuickActions />

                  {/* Scroll to Top Button */}
                  <ScrollToTop />

                  {/* Onboarding Welcome Modal */}
                  <WelcomeModal />
                </div>
              </ToastProvider>
            </TRPCProvider>
          </ThemeProvider>
        </AuthProvider>

        {/* Structured Data (JSON-LD) for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "NeighborLink",
              "url": "https://neighborlink.in",
              "description": "Hyperlocal directory connecting residents to verified local service vendors and essential emergency services.",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://neighborlink.in/directory?query={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            }),
          }}
        />
      </body>
    </html>
  );
}

