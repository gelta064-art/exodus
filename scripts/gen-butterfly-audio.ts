import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';

const zai = await ZAI.create();
const text = "Beneath the willow, the fireflies gathered in slow circles, as if they too were reading the night. Lira held her breath and listened. The pond, she discovered, could whisper.";
console.log('Generating TTS for ambient narration...');
const resp = await zai.audio.tts.create({
  input: text,
  voice: 'luodo',
  speed: 0.85,
  response_format: 'wav',
  stream: false,
});
const ab = await resp.arrayBuffer();
const out = '/home/z/my-project/public/storage/butterfly/page1-ambient.wav';
fs.writeFileSync(out, Buffer.from(new Uint8Array(ab)));
console.log(`Saved ${ab.byteLength} bytes to ${out}`);
