import { db } from '../src/lib/db';

const page = await db.livingPage.findFirst({ where: { order: 0 } });
if (!page) { console.error('no page found'); process.exit(1); }

await db.livingPage.update({
  where: { id: page.id },
  data: {
    videoUrl: null,
    videoStatus: 'pending',
    ambientAudioUrl: '/storage/butterfly/page1-ambient.wav',
    audioStatus: 'ready',
  },
});
console.log('Updated page', page.id, '→ CSS living mode (audio only, no video)');
