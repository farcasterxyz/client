import { ApiDomainFrameConfig } from 'farcaster-client-data';

import { PropertySchemaUi } from '~/utils/schemaValidationUtils';

interface TagSchema {
  key: string;
  placeholder: string;
  title: string;
  tooltip: string;
  ui?: PropertySchemaUi;
}

interface SectionSchema {
  section: string;
  tags: TagSchema[];
}

interface ManifestSection {
  id: string;
  title: string;
  fieldKeys: (keyof ApiDomainFrameConfig)[];
}

export const UI_SCHEMA: SectionSchema[] = [
  {
    section: 'Mini App Store Listing',
    tags: [
      {
        key: 'version',
        placeholder: '1.0.0',
        title: 'Schema Version',
        tooltip: 'The version of the Manifest Schema',
      },
      {
        key: 'iconUrl',
        placeholder: 'https://example.com/icon.png',
        title: 'App Icon',
        tooltip:
          'Main icon displayed in the store. Must be 1024x1024 PNG without transparency. Use a bold, recognizable logo without text.',
      },
      {
        key: 'name',
        placeholder: 'My Cool App',
        title: 'App Name',
        tooltip:
          'Display name of the app (30 chars max). Use a brandable, unique name. No emojis or trademark symbols.',
      },
      {
        key: 'subtitle',
        placeholder: 'Connect and share instantly',
        title: 'Subtitle',
        tooltip:
          'Short description under the app name (30 chars max). Should clarify what your app does in a catchy way.',
      },
    ],
  },
  {
    section: 'Mini App Store Page',
    tags: [
      {
        key: 'description',
        placeholder:
          'Experience the future of social networking. Connect with friends, share moments, and discover communities that matter to you.',
        title: 'Description',
        tooltip:
          'Promotional message displayed on Mini App Page (170 chars max). Focus on value, not features. Include social proof if possible.',
      },
      {
        key: 'screenshotUrls',
        placeholder: 'https://example.com/screenshot1.png',
        title: 'Screenshots',
        tooltip:
          'Visual previews of the app (max 3). Portrait 1284x2778px. Show the core value or magic moment of your app.',
      },
      {
        key: 'imageUrl',
        placeholder: 'https://example.com/preview.png',
        title: 'Preview Image',
        tooltip: 'Additional preview image for your app store page',
      },
    ],
  },
  {
    section: 'Search & Discovery',
    tags: [
      {
        key: 'primaryCategory',
        ui: {
          type: 'dropdown',
          options: [
            'games',
            'social',
            'finance',
            'utility',
            'productivity',
            'health-fitness',
            'news-media',
            'music',
            'shopping',
            'education',
            'developer-tools',
            'entertainment',
            'art-creativity',
          ],
        },
        placeholder: 'social',
        title: 'Primary Category',
        tooltip:
          'Main category of your app. Choose from: games, social, finance, utility, productivity, health-fitness, news-media, music, shopping, education, developer-tools, entertainment, art-creativity',
      },
      {
        key: 'tags',
        placeholder: 'social, messaging, community',
        title: 'Search Tags',
        tooltip:
          'Descriptive tags for filtering/search (up to 5). Use high-volume terms with no spaces, no repeats, no brand names. Use singular form.',
        ui: {
          type: 'multi-select',
          maxSelections: 5,
        },
      },
    ],
  },
  {
    section: 'Promotional Assets',
    tags: [
      {
        key: 'heroImageUrl',
        placeholder: 'https://example.com/hero.png',
        title: 'Hero Image',
        tooltip:
          'Promotional display image on top of the mini app store. 1200x630px (1.91:1). Show your brand clearly with minimal text.',
      },
      {
        key: 'tagline',
        placeholder: 'Grow, Raid & Rise in Stoke Fire',
        title: 'Marketing Tagline',
        tooltip:
          'Punchy and descriptive tagline (30 chars max). Use for time-sensitive promos or CTAs. Keep copy active.',
      },
      {
        key: 'buttonTitle',
        placeholder: 'Open mini app',
        title: 'Button Title',
        tooltip: 'The call to action users will see to open your app',
      },
    ],
  },
  {
    section: 'Sharing Experience',
    tags: [
      {
        key: 'ogTitle',
        placeholder: 'AppName – Local News Fast',
        title: 'Social Share Title',
        tooltip:
          'Open Graph title for social sharing (30 chars max). Use app name + short tag. Title case, no emojis.',
      },
      {
        key: 'ogDescription',
        placeholder:
          'Get breaking news and updates from your community in real-time',
        title: 'Social Share Description',
        tooltip:
          'Open Graph description for social sharing (100 chars max). Summarize core benefit in 1-2 lines.',
      },
      {
        key: 'ogImageUrl',
        placeholder: 'https://example.com/og-image.png',
        title: 'Social Share Image',
        tooltip:
          'Promotional image for social sharing (typically same as hero image)',
      },
      {
        key: 'castShareUrl',
        placeholder: 'https://warpcast.com/~/compose?text=Check+out+this+app',
        title: 'Cast Share URL',
        tooltip: 'Custom Farcaster sharing URL for your app',
      },
    ],
  },
  {
    section: 'Launch Experience',
    tags: [
      {
        key: 'splashBackgroundColor',
        placeholder: '#6200EA',
        title: 'Splash Background Color',
        tooltip:
          'Background color displayed while your app is loading. Use hex color format.',
      },
      {
        key: 'splashImageUrl',
        placeholder: 'https://example.com/splash.png',
        title: 'Splash Screen Image',
        tooltip:
          'Image displayed while your app is loading. Should match your brand identity.',
      },
    ],
  },
  {
    section: 'Technical Configuration',
    tags: [
      {
        key: 'homeUrl',
        placeholder: 'https://app.example.com',
        title: 'Home URL',
        tooltip: 'The main URL where your mini app is hosted',
      },
      {
        key: 'webhookUrl',
        placeholder: 'https://api.example.com/webhook',
        title: 'Webhook URL',
        tooltip: 'Endpoint for receiving app events and notifications',
      },
    ],
  },
];

export const MANIFEST_SECTIONS: ManifestSection[] = [
  {
    id: 'identity',
    title: 'App Identity & Store Presence',
    fieldKeys: [
      'name',
      'iconUrl',
      'subtitle',
      'description',
      'primaryCategory',
    ],
  },
  {
    id: 'visuals',
    title: 'Visuals & Branding',
    fieldKeys: [
      'screenshotUrls',
      'imageUrl',
      'heroImageUrl',
      'splashImageUrl',
      'splashBackgroundColor',
    ],
  },
  {
    id: 'engagement',
    title: 'Engagement & Discovery',
    fieldKeys: [
      'tags',
      'tagline',
      'buttonTitle',
      'ogTitle',
      'ogDescription',
      'ogImageUrl',
      'castShareUrl',
    ],
  },
  {
    id: 'technical',
    title: 'Technical Configuration',
    fieldKeys: ['homeUrl', 'webhookUrl'],
  },
];

export const REVERSE_MAPPING: Map<
  string,
  TagSchema & { section: string; category: { index: number; title: string } }
> = new Map();

UI_SCHEMA.forEach((section, index) => {
  section.tags.forEach((tag) => {
    REVERSE_MAPPING.set(tag.key, {
      key: tag.key,
      section: section.section,
      placeholder: tag.placeholder,
      tooltip: tag.tooltip,
      title: tag.title,
      ui: tag.ui ?? { type: 'text' },
      category: {
        index,
        title: section.section,
      },
    });
  });
});

export type { ManifestSection, SectionSchema, TagSchema };
