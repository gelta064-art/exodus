import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';
import https from 'https';

const STATIC_IMG = '/home/z/my-project/public/storage/butterfly/page1-static.png';
const OUT_VIDEO = '/home/z/my-project/public/storage/butterfly/page1-living.mp4';

const imgBuffer = fs.readFileSync(STATIC_IMG);
const base64 = `data:image/png;base64,${imgBuffer.toString('base64')}`;
console.log(`Image base64 length: ${base64.length}`);

const zai = await ZAI.create();
console.log('Creating video task (speed mode, no audio)...');
const task = await zai.video.generations.create({
  image_url: base64,
  prompt: "Subtle living motion: fireflies drifting and blinking, willow leaves swaying gently, soft ripples on the moonlit pond. Dreamy, atmospheric, seamless loop.",
  quality: 'speed',
  duration: 5,
  fps: 30,
});
console.log('Task ID:', task.id, 'status:', task.task_status);

let result = await zai.async.result.query(task.id);
let polls = 0;
const maxPolls = 45;
while (result.task_status === 'PROCESSING' && polls < maxPolls) {
  polls++;
  console.log(`Poll ${polls}/${maxPolls}: ${result.task_status}...`);
  await new Promise(r => setTimeout(r, 7000));
  result = await zai.async.result.query(task.id);
}

console.log('Final status:', result.task_status);
const videoUrl = result.video_result?.[0]?.url || result.video_url || result.url || result.video;
console.log('Video URL:', videoUrl);

if (!videoUrl) {
  console.error('No video URL. Result:', JSON.stringify(result, null, 2));
  process.exit(1);
}

console.log('Downloading video...');
await new Promise<void>((resolve, reject) => {
  const get = (url: string, redirects = 0) => {
    if (redirects > 5) return reject(new Error('Too many redirects'));
    https.get(url, (res) => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode || 0)) {
        get(res.headers.location!, redirects + 1);
        return;
      }
      const chunks: Buffer[] = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        fs.writeFileSync(OUT_VIDEO, Buffer.concat(chunks));
        console.log(`Saved ${Buffer.concat(chunks).length} bytes to ${OUT_VIDEO}`);
        resolve();
      });
    }).on('error', reject);
  };
  get(videoUrl);
});
console.log('DONE');
