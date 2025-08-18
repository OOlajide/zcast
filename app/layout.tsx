import "./theme.css";
import "@coinbase/onchainkit/styles.css";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export async function generateMetadata(): Promise<Metadata> {
  const URL = process.env.NEXT_PUBLIC_URL;
  const projectName = process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || 'InstaPod';
  const heroImage = process.env.NEXT_PUBLIC_APP_HERO_IMAGE || `${URL}/hero.png`;
  const splashImage = process.env.NEXT_PUBLIC_APP_SPLASH_IMAGE || `${URL}/splash.png`;
  const splashBgColor = process.env.NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR || '#000000';
  
  return {
    title: process.env.NEXT_PUBLIC_APP_OG_TITLE || "InstaPod - AI Podcast Generator",
    description: process.env.NEXT_PUBLIC_APP_OG_DESCRIPTION || 
      "Generate unique podcast episodes from a single prompt using AI. Create engaging audio content with Neo and Trinity as your hosts.",
    openGraph: {
      title: process.env.NEXT_PUBLIC_APP_OG_TITLE || "InstaPod - AI Podcast Generator",
      description: process.env.NEXT_PUBLIC_APP_OG_DESCRIPTION || 
        "Generate unique podcast episodes from a single prompt using AI",
      images: [process.env.NEXT_PUBLIC_APP_OG_IMAGE || heroImage],
    },
    other: {
      "fc:frame": JSON.stringify({
        version: "next",
        imageUrl: heroImage,
        button: {
          title: `Launch ${projectName}`,
          action: {
            type: "launch_frame",
            name: projectName,
            url: URL,
            splashImageUrl: splashImage,
            splashBackgroundColor: splashBgColor,
          },
        },
      }),
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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
