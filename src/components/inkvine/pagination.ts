/** Split cleaned document text into reading "pages" for the e-reader. */

export interface ReadingPage {
  index: number;
  text: string;
  /** optional chapter title if this page starts a new chapter */
  chapterTitle?: string;
}

export interface Chapter {
  title: string;
  startIndex: number; // page index where chapter begins
}

export interface PaginatedText {
  pages: ReadingPage[];
  chapters: Chapter[];
}

/** Target characters per page — tuned for a phone screen at comfortable font size. */
const CHARS_PER_PAGE = 1400;

const CHAPTER_RE = /^\s*(chapter\s+\w+|CHAPTER\s+\w+|Chapter\s+\d+[^\n]*|CHAPTER\s+\d+[^\n]*)/m;

/**
 * Split raw text into reading pages. Paragraphs are kept intact (never split
 * mid-paragraph). Pages are ~CHARS_PER_PAGE, +/- a paragraph.
 * Detects "Chapter X" headings for chapter navigation.
 */
export function paginateText(raw: string): PaginatedText {
  const clean = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/\u00a0/g, " ");
  // Split into paragraphs
  const paragraphs = clean.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  const pages: ReadingPage[] = [];
  const chapters: Chapter[] = [];
  let current = "";
  let currentPageIndex = 0;

  for (const para of paragraphs) {
    // Check if this paragraph is a chapter heading
    const chapterMatch = para.match(CHAPTER_RE);
    if (chapterMatch) {
      // Flush current page
      if (current.trim()) {
        pages.push({ index: currentPageIndex, text: current.trim() });
        currentPageIndex++;
        current = "";
      }
      // Record chapter
      const title = chapterMatch[0].trim();
      chapters.push({ title, startIndex: currentPageIndex });
    }

    if ((current + "\n\n" + para).length <= CHARS_PER_PAGE) {
      current = current ? current + "\n\n" + para : para;
    } else {
      // Flush + start new page with this paragraph
      if (current.trim()) {
        pages.push({ index: currentPageIndex, text: current.trim() });
        currentPageIndex++;
      }
      current = para;
    }
  }
  if (current.trim()) {
    pages.push({ index: currentPageIndex, text: current.trim() });
  }

  // If no chapters detected, treat whole doc as one chapter
  if (chapters.length === 0 && pages.length > 0) {
    chapters.push({ title: "Beginning", startIndex: 0 });
  }

  return { pages, chapters };
}

/** Find which chapter a given page index belongs to. */
export function chapterForPage(
  pageIndex: number,
  chapters: Chapter[]
): Chapter | null {
  let result: Chapter | null = null;
  for (const ch of chapters) {
    if (ch.startIndex <= pageIndex) result = ch;
    else break;
  }
  return result;
}
