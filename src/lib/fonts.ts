import { Inter, Space_Grotesk } from "next/font/google";

/** Body copy — used across MintMovies pages. */
export const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
});

/** Headings and display text. */
export const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
  variable: "--font-display-family",
});

/** Apply on headings when not using the `font-display` utility. */
export const displayFontClass = spaceGrotesk.className;
