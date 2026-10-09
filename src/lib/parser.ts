import fs from "fs";
import path from "path";

/**
 * Parse an uploaded document file into plain text.
 * Supports: .txt, .md, .epub, .pdf
 */
export async function parseDocument(
  filePath: string,
  fileType: string
): Promise<string> {
  const ext = fileType.toLowerCase();

  if (ext === "txt" || ext === "md") {
    return fs.readFileSync(filePath, "utf-8");
  }

  if (ext === "epub") {
    return parseEpub(filePath);
  }

  if (ext === "pdf") {
    return parsePdf(filePath);
  }

  throw new Error(`Unsupported file type: ${ext}`);
}

async function parseEpub(filePath: string): Promise<string> {
  // epub2 is CommonJS — dynamic require
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const EPub = require("epub2");
  const epub = await new Promise<any>((resolve, reject) => {
    const e = new EPub(filePath);
    e.on("end", () => resolve(e));
    e.on("error", reject);
    e.parse();
  });

  // Collect all chapter HTML in spine order
  const flows: any[] = epub.flow || [];
  const parts: string[] = [];
  for (const flow of flows) {
    const id = flow.id;
    const html = await new Promise<string>((resolve, reject) => {
      epub.getChapter(id, (err: any, data: string) => {
        if (err) reject(err);
        else resolve(data || "");
      });
    });
    parts.push(htmlToText(html));
  }
  return parts.join("\n\n").trim();
}

async function parsePdf(filePath: string): Promise<string> {
  // pdf-parse is CommonJS — dynamic require
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require("pdf-parse");
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(dataBuffer);
  return (data.text || "").trim();
}

/** Strip HTML tags, decode entities, normalize whitespace. */
export function htmlToText(html: string): string {
  let t = html;
  // Remove scripts/styles
  t = t.replace(/<script[\s\S]*?<\/script>/gi, "");
  t = t.replace(/<style[\s\S]*?<\/style>/gi, "");
  // Convert block tags to paragraph breaks
  t = t.replace(/<\/(p|div|br|h[1-6]|li|tr)>/gi, "\n");
  t = t.replace(/<br\s*\/?>/gi, "\n");
  // Strip remaining tags
  t = t.replace(/<[^>]+>/g, "");
  // Decode common HTML entities
  const entities: Record<string, string> = {
    "&nbsp;": " ",
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
    "&apos;": "'",
    "&mdash;": "—",
    "&ndash;": "–",
    "&hellip;": "…",
    "&ldquo;": "\u201C",
    "&rdquo;": "\u201D",
    "&lsquo;": "\u2018",
    "&rsquo;": "\u2019",
  };
  t = t.replace(/&[a-zA-Z#0-9]+;/g, (m) => entities[m] ?? m);
  // Normalize whitespace (keep paragraph breaks)
  t = t.replace(/\r\n/g, "\n");
  t = t.replace(/[ \t]+/g, " ");
  t = t.replace(/\n{3,}/g, "\n\n");
  return t.trim();
}

/** Clean raw text: strip excessive whitespace, fix line endings. */
export function cleanText(raw: string): string {
  let t = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  t = t.replace(/\u00a0/g, " ");
  t = t.replace(/[ \t]+/g, " ");
  t = t.replace(/\n{3,}/g, "\n\n");
  return t.trim();
}

export interface TextChunk {
  text: string;
  order: number;
}

/**
 * Split cleaned text into TTS-friendly chunks.
 * Strategy: split by paragraph, then merge short paragraphs to ~700-950 chars
 * (TTS limit is 1024), and split overly long paragraphs at sentence boundaries.
 */
export function chunkText(
  text: string,
  maxLen = 950,
  targetLen = 700
): TextChunk[] {
  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const chunks: string[] = [];
  let current = "";

  for (const para of paragraphs) {
    if (para.length > maxLen) {
      // Flush current buffer first
      if (current.trim()) {
        chunks.push(current.trim());
        current = "";
      }
      // Split long paragraph by sentences
      const sentences = para.match(/[^.!?]+[.!?]+["')\]]*\s*|\S+$/g) || [para];
      let sentBuf = "";
      for (const s of sentences) {
        if ((sentBuf + s).length > maxLen) {
          if (sentBuf.trim()) chunks.push(sentBuf.trim());
          // If a single sentence is too long, hard-split it
          if (s.length > maxLen) {
            for (let i = 0; i < s.length; i += maxLen) {
              chunks.push(s.slice(i, i + maxLen).trim());
            }
            sentBuf = "";
          } else {
            sentBuf = s;
          }
        } else {
          sentBuf += s;
        }
      }
      if (sentBuf.trim()) {
        if ((current + sentBuf).length <= maxLen) {
          current += sentBuf;
        } else {
          if (current.trim()) chunks.push(current.trim());
          current = sentBuf;
        }
      }
    } else if ((current + "\n\n" + para).length <= targetLen) {
      current = current ? current + "\n\n" + para : para;
    } else {
      if (current.trim()) chunks.push(current.trim());
      current = para;
    }
  }
  if (current.trim()) chunks.push(current.trim());

  return chunks.map((text, order) => ({ text, order }));
}
