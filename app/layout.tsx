import "./theme.css";
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
  const URL = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
  const heroImage = `${URL}/hero.png`;
  
  return {
    title: "Zcast - Daily Zcash Intelligence",
    description: "Daily AI-generated podcast analyzing Zcash network metrics, privacy flows, and market activity.",
    openGraph: {
      title: "Zcast - Daily Zcash Intelligence",
      description: "Daily AI-generated podcast analyzing Zcash network metrics, privacy flows, and market activity.",
      images: [heroImage],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-background">
        {children}
      </body>
    </html>
  );
}
