import { Geist, Geist_Mono } from "next/font/google";
import AuthGate from "../components/auth-gate";
import { CartProvider } from "../components/cart-provider";
import { AuthProvider } from "../components/auth-provider";
import MobileBottomNav from "../components/mobile-bottom-nav";
import "./globals.css";

import "leaflet/dist/leaflet.css";
import PWARegister from "@/components/pwa-register";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL("https://dailycart.in"),
  title: {
    default: "DailyCart - Groceries & Essentials",
    template: "%s | DailyCart",
  },
  description:
    "Shop groceries and everyday essentials with DailyCart in Chabua Town.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://dailycart.in",
    siteName: "DailyCart",
    title: "DailyCart - Groceries & Everyday Essentials",
    description:
      "Groceries and everyday essentials delivered within the Chabua Town service area.",
    images: [
      {
        url: "/dailycart-logo.png",
        width: 1200,
        height: 630,
        alt: "DailyCart",
      },
    ],
  },
  icons: {
    icon: "/dailycart_icon.png",
    shortcut: "/dailycart_icon.png",
    apple: "/dailycart_icon.png",
  },
};
export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#16a34a",
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <PWARegister />

        <AuthProvider>
          <AuthGate>
            <CartProvider>
              <div className="app-content">{children}</div>
              <MobileBottomNav />
            </CartProvider>
          </AuthGate>
        </AuthProvider>
      </body>
    </html>
  );
}