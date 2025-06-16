import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { FavoritesProvider } from "@/app/providers/favorites-provider";
import { LanguageProvider } from "@/app/providers/language-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Costify Pro - Professional Food Costing",
  description: "Professional food costing and catering management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
      >
        <LanguageProvider>
          <FavoritesProvider>
            {children}
          </FavoritesProvider>
        </LanguageProvider>
        <Toaster 
          position="bottom-left" 
          expand={false}
          richColors 
          closeButton
        />
      </body>
    </html>
  );
}
