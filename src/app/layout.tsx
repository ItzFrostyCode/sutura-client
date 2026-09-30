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

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sutura | Premium Tailoring Software",
  description: "Enterprise management for modern tailoring businesses.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${playfair.variable} h-full antialiased bg-[#FAF6F3] text-[#2D2A26]`}
    >
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
