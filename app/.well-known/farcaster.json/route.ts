function withValidProperties(properties: Record<string, undefined | string | string[] | boolean>) {
  return Object.fromEntries(
    Object.entries(properties).filter(([_, value]) => (Array.isArray(value) ? value.length > 0 : !!value))
  );
}

export async function GET() {
  const URL = process.env.NEXT_PUBLIC_URL as string;
  return Response.json({
    accountAssociation: {
      header: process.env.FARCASTER_HEADER,
      payload: process.env.FARCASTER_PAYLOAD,
      signature: process.env.FARCASTER_SIGNATURE,
    },
    frame: withValidProperties({
      version: '1',
      name: process.env.NEXT_PUBLIC_ONCHAINKIT_PROJECT_NAME || 'InstaPod',
      subtitle: process.env.NEXT_PUBLIC_APP_SUBTITLE || 'AI Podcast Generator',
      description: process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'Generate unique podcast episodes from a single prompt using AI.',
      screenshotUrls: [],
      iconUrl: process.env.NEXT_PUBLIC_APP_ICON || `https://raw.githubusercontent.com/OOlajide/instapod/refs/heads/main/logo.png`,
      splashImageUrl: process.env.NEXT_PUBLIC_APP_SPLASH_IMAGE || `https://raw.githubusercontent.com/OOlajide/instapod/refs/heads/main/logo_small.jpeg`,
      splashBackgroundColor: process.env.NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR || '#000000',
      homeUrl: URL,
      webhookUrl: `${URL}/api/webhook`,
      primaryCategory: process.env.NEXT_PUBLIC_APP_PRIMARY_CATEGORY || 'entertainment',
      tags: ['podcast', 'ai', 'audio', 'entertainment'],
      heroImageUrl: process.env.NEXT_PUBLIC_APP_HERO_IMAGE || `https://raw.githubusercontent.com/OOlajide/instapod/refs/heads/main/instapod.png`,
      tagline: process.env.NEXT_PUBLIC_APP_TAGLINE || 'Create podcasts instantly',
      ogTitle: process.env.NEXT_PUBLIC_APP_OG_TITLE || 'InstaPod - AI Podcast Generator',
      ogDescription: process.env.NEXT_PUBLIC_APP_OG_DESCRIPTION || 'Generate unique podcast episodes from a single prompt using AI',
      ogImageUrl: process.env.NEXT_PUBLIC_APP_OG_IMAGE || `https://raw.githubusercontent.com/OOlajide/instapod/refs/heads/main/instapod.png`,
    }),
  });
}