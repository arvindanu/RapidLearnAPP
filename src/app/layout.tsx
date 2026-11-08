import type { Metadata, Viewport } from "next";
import "./globals.css";
import PwaRegister from "@/components/pwa-register";

export const metadata: Metadata = {
  title: "RapidLearn — Learn Something New",
  description:
    "Discover something new every day. Spin, learn, explore and grow.",
  applicationName: "RapidLearn",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/rapidlearn-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/rapidlearn-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "RapidLearn",
  },
};

export const viewport: Viewport = {
  themeColor: "#090b13",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}