import { db } from '../src/lib/db';

const ART_URL = '/storage/butterfly/page1-static.png';
const VIDEO_URL = '/storage/butterfly/page1-living.mp4';

// Check if already seeded
const existing = await db.livingBook.findFirst({ where: { title: 'The Willow Pond' } });
if (existing) { console.log('Already seeded:', existing.id); process.exit(0); }

const book = await db.livingBook.create({
  data: {
    title: 'The Willow Pond',
    author: 'Inkvine Originals',
    coverPrompt: 'A girl beneath a weeping willow by a moonlit pond, fireflies, ethereal painterly',
    coverUrl: ART_URL,
    pages: {
      create: [
        {
          order: 0,
          title: 'The Firefly Circle',
          text: 'Beneath the willow, the fireflies gathered in slow circles — as if they, too, were reading the night. Lira held her breath and listened. The pond, she discovered, could whisper.',
          artPrompt: 'girl beneath weeping willow, moonlit pond, fireflies, ethereal',
          artUrl: ART_URL,
          artStatus: 'ready',
          videoUrl: VIDEO_URL,
          videoStatus: 'ready',
          ambientAudioUrl: null,
          audioStatus: 'ready',
        },
        {
          order: 1,
          title: 'The First Spell',
          text: 'She cupped her hands around a single firefly. It pulsed once — warm, then cool — and the water below answered with a ring of light that spread to the shore.',
          artPrompt: 'girl cupping firefly in hands, glowing light, pond reflection, magical',
          artUrl: null,
          artStatus: 'pending',
          videoUrl: null,
          videoStatus: 'pending',
          ambientAudioUrl: null,
          audioStatus: 'pending',
        },
      ],
    },
  },
  include: { pages: true },
});
console.log('Seeded book:', book.id, 'with', book.pages.length, 'pages');
