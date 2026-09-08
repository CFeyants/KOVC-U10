import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata = {
  title: "KOVC Sterrebeek U10",
  description:
    "Teamapp voor de U10 van KOVC Sterrebeek: kalender, selectie, afwezigheden, doelpunten en clubsfeer.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "U10 Sterrebeek",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
};

export const viewport = {
  themeColor: "#0d0e20",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="nl-BE" className={inter.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
