import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import Navbar from "@/components/navbar";
import ProfileGuard from "@/components/profile-guard";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Hatocon",
  description: "Hatocon app",
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
