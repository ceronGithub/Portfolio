// Root layout. Registers global styles, SessionProvider, and Navbar.
import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import "./styles/mediaQueries.css";
import Navbar from "../components/Navbar";
import SessionProviderWrapper from "../components/SessionProviderWrapper";

// Plus Jakarta Sans — premium, confident, highly readable. Not plain, not decorative.
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

// Cormorant Garamond — cinematic serif for hero greetings and editorial headings.
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: {
    default:  "Matthew Studio — Premium Business Systems",
    template: "%s | Matthew Studio",
  },
  description:
    "Matthew Studio engineers premium, bespoke business systems — built once, owned forever. Enterprise infrastructure meets cinematic design.",
  keywords: [
    "business systems", "enterprise software", "custom web app", "3D assets",
    "bespoke digital systems", "Matthew Studio", "premium web development",
    "Next.js developer Philippines",
  ],
  metadataBase: new URL("https://matthewstudio.vercel.app"),
  alternates: {
    canonical: "/",
  },
  robots: {
    index:            true,
    follow:           true,
    googleBot: {
      index:               true,
      follow:              true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet":       -1,
    },
  },
  openGraph: {
    type:        "website",
    locale:      "en_PH",
    url:         "https://matthewstudio.vercel.app",
    siteName:    "Matthew Studio",
    title:       "Matthew Studio — Premium Business Systems",
    description:
      "Bespoke enterprise systems and cinematic digital assets. Built once, owned forever.",
    images: [
      {
        url:    "/og-image.png",
        width:  1200,
        height: 630,
        alt:    "Matthew Studio — Premium Business Systems",
      },
    ],
  },
  twitter: {
    card:        "summary_large_image",
    title:       "Matthew Studio — Premium Business Systems",
    description:
      "Bespoke enterprise systems and cinematic digital assets. Built once, owned forever.",
    images:      ["/og-image.png"],
  },
  icons: {
    icon:  "/favicon.png",
    apple: "/favicon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${jakarta.variable} ${cormorant.variable}`}>
        <SessionProviderWrapper>
          <Navbar />
          {children}
        </SessionProviderWrapper>
      </body>
    </html>
  );
}