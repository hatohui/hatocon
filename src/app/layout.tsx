import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import Navbar from "@/components/navbar";
import ProfileGuard from "@/components/profile-guard";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: {
    default: "Hatocon",
    template: "%s | Hatocon",
  },
  description:
    "Plan trips, coordinate leave, and stay in sync with your crew. Hatocon is your travel and leave management hub.",
  keywords: [
    "travel planning",
    "leave management",
    "trip planning",
    "schedule",
    "coordination",
  ],
  authors: [{ name: "Hatocon" }],
  metadataBase: new URL("https://hatocon.app"),
  openGraph: {
    type: "website",
    siteName: "Hatocon",
    title: "Hatocon — Plan trips & manage leave",
    description:
      "Plan trips, coordinate leave, and stay in sync with your crew.",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "Hatocon — Plan trips & manage leave",
    description:
      "Plan trips, coordinate leave, and stay in sync with your crew.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("font-sans", inter.variable)}>
      <body>
        <Providers>
          <Navbar />
          <ProfileGuard>{children}</ProfileGuard>
        </Providers>
      </body>
    </html>
  );
}
