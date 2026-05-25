import type { Metadata } from "next";
import type { ReactNode } from 'react';

import Providers from '@/src/components/Providers';
import Header from '@/src/components/Header';
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
  title: "Group 3 — Movies & TV",
  description:
    "Browse popular movies, search titles, explore details, and sign in to view your profile.",
};


export default function RootLayout({ children }: { children: ReactNode }) {
  return (
      <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <Providers>
        <Header />
        {children}
      </Providers>
      </body>
      </html>
  );
}