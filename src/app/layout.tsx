import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { AssistantPanel } from "@/components/assistant-panel";
import { Footer, Header } from "@/components/chrome";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "POOMAS MART — AI-powered shopping in the UAE",
    template: "%s · POOMAS MART",
  },
  description:
    "Shop electronics, home, fashion, beauty and groceries across the UAE with an AI shopping concierge. Retail, wholesale, marketplace sellers, resellers and creators on one platform.",
  openGraph: { siteName: "POOMAS MART", type: "website", locale: "en_AE" },
};

export const viewport: Viewport = {
  themeColor: "#6d28d9",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <AssistantPanel />
        </Providers>
      </body>
    </html>
  );
}
