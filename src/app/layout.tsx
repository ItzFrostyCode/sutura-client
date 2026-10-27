import type { Metadata } from "next";
import { Outfit, Playfair_Display } from "next/font/google";
import "./globals.css";
import AuthHydrator from "@/components/AuthHydrator";
import MobileFrame from "@/components/shared/MobileFrame";
import NetworkGuard from "@/components/shared/NetworkGuard";
import LoginModal from "@/components/auth/LoginModal";
import SignInFromQuery from "@/components/auth/SignInFromQuery";
import ShopRouteGuard from "@/components/auth/ShopRouteGuard";
import { ToastProvider } from "@/context/ToastContext";
import { BOOT_SPLASH_SCRIPT } from "@/lib/bootSplash";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

// Icons and the social preview come from the file conventions in this folder:
// favicon.ico, icon.svg, apple-icon.png and opengraph-image.png (the
// "Tailor Pin" brand assets). Set NEXT_PUBLIC_SITE_URL in production so the
// preview image gets an absolute URL.
export const metadata: Metadata = {
  metadataBase: process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL) : undefined,
  title: "Sutura | Premium Tailoring Software",
  description: "Enterprise management for modern tailoring businesses.",
  applicationName: "SUTURA",
  openGraph: { siteName: "SUTURA", type: "website" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      // The boot-splash head script may add a class before React hydrates.
      suppressHydrationWarning
      className={`${outfit.variable} ${playfair.variable} h-full antialiased bg-[#FAF6F3] text-[#2D2A26]`}
    >
      <head>
        {/* Decides before first paint whether the landing location splash shows (no flash). */}
        <script dangerouslySetInnerHTML={{ __html: BOOT_SPLASH_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <ToastProvider>
          <NetworkGuard>
            <AuthHydrator />
            <MobileFrame>
              <ShopRouteGuard>{children}</ShopRouteGuard>
            </MobileFrame>
            <LoginModal />
            <SignInFromQuery />
          </NetworkGuard>
        </ToastProvider>
      </body>
    </html>
  );
}
