import PDFDocument from 'pdfkit';
import fs from 'fs';

const doc = new PDFDocument();
const out = '/home/z/my-project/upload/test-ebook.pdf';
doc.pipe(fs.createWriteStream(out));

doc.fontSize(20).text('The Garden of Forking Paths', { align: 'center' });
doc.moveDown(2);
doc.fontSize(13).text('Chapter One: The Invitation', { underline: true });
doc.moveDown();
doc.fontSize(12).text(
  'The letter arrived on a Tuesday, sealed with crimson wax that bore no crest. Dr. Elena Miranda held it to the light, turning it slowly, as though the paper itself might whisper its secrets. The handwriting inside was elegant, precise, and utterly unfamiliar.'
);
doc.moveDown();
doc.text(
  '"You are invited," it read, "to the Garden of Forking Paths. Come at midnight. Come alone."'
);
doc.moveDown();
doc.text(
  'She had heard the legends, of course. Everyone in the city had. The Garden was a place where time branched and split, where every choice you had ever made lived on in parallel paths, visible if you knew where to look. Most people dismissed it as a fairy tale. Elena, who had spent her career studying the mathematics of possibility, was not most people.'
);
doc.moveDown();
doc.text(
  'At midnight, she stood before the iron gate. The garden beyond was overgrown, wild, lit by a moon that seemed too large and too close. A path of white stones wound between hedges that whispered in a wind she could not feel.'
);
doc.addPage();
doc.fontSize(13).text('Chapter Two: The First Fork', { underline: true });
doc.moveDown();
doc.fontSize(12).text(
  'The path split almost immediately. To the left, a narrow trail lined with white roses. To the right, a wider path shaded by ancient oaks. A small bronze plaque stood at the junction, engraved with a single word: "Choose."'
);
doc.moveDown();
doc.text(
  'Elena studied both paths. The rose trail called to her sense of beauty, but the oak path promised shade and, perhaps, answers. She thought of her research, of the branching diagrams she had spent years drawing. Every choice, she knew, was both an ending and a beginning.'
);
doc.moveDown();
doc.text(
  'She turned right, into the shade of the oaks. The leaves rustled above her, and somewhere in the distance, a clock began to strike. Not midnight. That hour had passed. This was something else entirely.'
);
doc.end();
console.log('PDF created at', out);
