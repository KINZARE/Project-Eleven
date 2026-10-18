import type { Metadata, Viewport } from "next";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/600.css";
import "@fontsource/dm-sans/700.css";
import "@fontsource/barlow-condensed/600.css";
import "./globals.css";
export const metadata: Metadata = {
  title: "Project Eleven — Jouw club. Jouw koers.",
  description:
    "Een mobiele voetbalmanager. Bouw je selectie, bepaal je tactiek en schrijf clubgeschiedenis.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Eleven",
  },
  icons: { icon: "/icon-192.png", apple: "/icon-192.png" },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#101713",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl">
      <body>
        <a href="#main-content" className="skip-link">
          Naar de inhoud
        </a>
        {children}
      </body>
    </html>
  );
}
