import type { Metadata } from "next";
import type { ReactNode } from "react";

import Providers from "@/src/components/Providers";
import Header from "@/src/components/Header";
import { inter, spaceGrotesk } from "@/src/lib/fonts";
import { themeInitScript } from "@/src/lib/theme";
import "./globals.css";

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
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${spaceGrotesk.variable}`}
    >
      <body className={`${inter.className} min-h-dvh antialiased`}>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <Providers>
          <Header />
          {children}
        </Providers>
      </body>
    </html>
  );
}
