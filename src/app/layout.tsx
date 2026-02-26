import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StreetCricket Pro - Professional Cricket Platform",
  description: "Premium local cricket match platform for serious teams. Play professional cricket in your local area & win real cash prizes.",
  keywords: ["cricket", "street cricket", "delhi cricket", "cricket tournament", "cricket teams", "cash prizes"],
  authors: [{ name: "StreetCricket Pro Team" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "StreetCricket Pro - Professional Cricket Platform",
    description: "Play professional cricket in your local area & win real cash prizes. Like a mini IPL at colony level.",
    url: "https://streetcricket.pro",
    siteName: "StreetCricket Pro",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "StreetCricket Pro - Professional Cricket Platform",
    description: "Play professional cricket in your local area & win real cash prizes.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
