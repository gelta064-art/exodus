/**
 * Document parsing — buffer-based (no filesystem), Cloudflare Workers compatible.
 * Supports: .txt, .md, .epub, .pdf
 */
import { unzipSync } from "fflate";

/**
 * Parse an uploaded document from its raw bytes.
 */
export async function parseDocumentBuffer(
  bytes: Buffer,
  fileType: string
): Promise<string> {
  const ext = fileType.toLowerCase();

  if (ext === "txt" || ext === "md") {
    return bytes.toString("utf-8");
  }

  if (ext === "epub") {
    return parseEpubBuffer(new Uint8Array(bytes));
  }

  if (ext === "pdf") {
    return parsePdfBuffer(bytes);
  }

  throw new Error(`Unsupported file type: ${ext}`);
}

async function parsePdfBuffer(pdfBuffer: Buffer): Promise<string> {
  // pdf2json v4 supports parsing from a buffer (no fs, Workers compatible)
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const PDFParser = require("pdf2json");
  const parser = new PDFParser();

  return new Promise<string>((resolve, reject) => {
    parser.on("pdfParser_dataReady", (data: any) => {
      const pages = data.Pages || data.data?.Pages || [];
      const parts: string[] = pages.map((page: any) => {
        const texts = page.Texts || [];
        return texts
          .map((t: any) =>
            (t.R || [])
              .map((r: any) => {
                try {
                  return decodeURIComponent(r.T || "");
                } catch {
                  return r.T || "";
                }
              })
              .join("")
          )
          .join(" ");
      });
      resolve(parts.join("\n\n").trim());
    });
    parser.on("pdfParser_dataError", (err: any) => {
      reject(new Error(err?.message || "PDF parse error"));
    });
    parser.parseBuffer(pdfBuffer);
  });
}

async function parseEpubBuffer(bytes: Uint8Array): Promise<string> {
  // Minimal EPUB parser: unzip → container.xml → OPF spine → XHTML → text
  const files = unzipSync(bytes);

  // 1. Find the OPF path from META-INF/container.xml
  const containerFile = files["META-INF/container.xml"];
  if (!containerFile) throw new Error("Invalid EPUB: missing container.xml");
  const containerXml = new TextDecoder().decode(containerFile);
  const rootfileMatch = containerXml.match(/full-path="([^"]+)"/);
  if (!rootfileMatch) throw new Error("Invalid EPUB: no rootfile in container.xml");
  const opfPath = rootfileMatch[1];

  // 2. Parse the OPF: manifest (id → href) + spine (reading order)
  const opfFile = files[opfPath];
  if (!opfFile) throw new Error(`Invalid EPUB: missing OPF at ${opfPath}`);
  const opfXml = new TextDecoder().decode(opfFile);

  const manifest = new Map<string, string>();
  const itemRe = /<item\s[^>]*?>/g;
  let m: RegExpExecArray | null;
  while ((m = itemRe.exec(opfXml))) {
    const tag = m[0];
    const id = tag.match(/id="([^"]+)"/)?.[1];
    const href = tag.match(/href="([^"]+)"/)?.[1];
    const mediaType = tag.match(/media-type="([^"]+)"/)?.[1] || "";
    if (id && href && mediaType.includes("html")) manifest.set(id, href);
  }

  const spine: string[] = [];
  const spineMatch = opfXml.match(/<spine[^>]*>([\s\S]*?)<\/spine>/i);
  if (spineMatch) {
    const refRe = /idref="([^"]+)"/g;
    let r: RegExpExecArray | null;
    while ((r = refRe.exec(spineMatch[1]))) spine.push(r[1]);
  }

  // 3. Resolve hrefs relative to the OPF location
  const opfDir = opfPath.includes("/") ? opfPath.slice(0, opfPath.lastIndexOf("/") + 1) : "";
  const parts: string[] = [];
  for (const idref of spine) {
    const href = manifest.get(idref);
    if (!href) continue;
    const clean = decodeURIComponent(href).replace(/^\.\//, "");
    // Resolve ../ segments against the OPF directory
    const segments: string[] = [];
    for (const seg of (opfDir + clean).split("/")) {
      if (seg === "..") segments.pop();
      else if (seg && seg !== ".") segments.push(seg);
    }
    const filePath = segments.join("/");
    const entry =
      files[filePath] ||
      files[opfDir + clean] ||
      files[clean];
    if (!entry) continue;
    const html = new TextDecoder().decode(entry);
    parts.push(htmlToText(html));
  }

  if (parts.length === 0) throw new Error("EPUB contained no readable chapters");
  return parts.join("\n\n").trim();
}

/** Strip HTML tags, decode entities, normalize whitespace. */
export function htmlToText(html: string): string {
  let t = html;
  t = t.replace(/<script[\s\S]*?<\/script>/gi, "");
  t = t.replace(/<style[\s\S]*?<\/style>/gi, "");
  t = t.replace(/<\/(p|div|br|h[1-6]|li|tr)>/gi, "\n");
  t = t.replace(/<br\s*\/?>/gi, "\n");
  t = t.replace(/<[^>]+>/g, "");
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
  t = t.replace(/&[a-zA-Z#0-9]+;/g, (mch) => entities[mch] ?? mch);
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
      if (current.trim()) {
        chunks.push(current.trim());
        current = "";
      }
      const sentences = para.match(/[^.!?]+[.!?]+["')\]]*\s*|\S+$/g) || [para];
      let sentBuf = "";
      for (const s of sentences) {
        if ((sentBuf + s).length > maxLen) {
          if (sentBuf.trim()) chunks.push(sentBuf.trim());
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
