import type { Metadata } from "next";
import type { ReactNode } from "react";

import Providers from "@/src/components/Providers";
import Header from "@/src/components/Header";
import { themeInitScript } from "@/src/lib/theme";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "MintMovies",
  description:
    "Browse popular movies, search titles, explore details, and sign in to view your profile.",
  icons: {
    icon: "/brand/favicon.png",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-dvh antialiased`}
      >
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  );
}
