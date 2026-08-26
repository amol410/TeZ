/**
 * downloadTemplateDoc.js
 *
 * Generates and downloads a .docx template for quiz or note bulk uploads.
 * Uses the `docx` library to create a proper Word document with the exact
 * format that the backend bulk-upload parsers expect.
 * No extra dependencies — uses native browser Blob + anchor download.
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
} from 'docx';

/** Trigger a browser download for a Blob */
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ─── helper: plain paragraph ──────────────────────────────────────── */
const p = (text, opts = {}) =>
  new Paragraph({
    children: [new TextRun({ text, font: 'Courier New', size: 22, ...opts })],
    spacing: { after: 0, before: 0 },
  });

const blank = () =>
  new Paragraph({ children: [new TextRun({ text: '' })], spacing: { after: 0 } });

const heading = (text) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text, bold: true, color: '7C3AED', size: 26 })],
    spacing: { after: 120, before: 200 },
  });

const comment = (text) =>
  new Paragraph({
    children: [new TextRun({ text: `// ${text}`, italics: true, color: '6B7280', size: 18, font: 'Courier New' })],
    spacing: { after: 40 },
  });

/* ─── QUIZ TEMPLATE ────────────────────────────────────────────────── */
export async function downloadQuizTemplate() {
  const doc = new Document({
    creator: 'SpeedUpExam LMS',
    title: 'Quiz Bulk Upload Template',
    description: 'Use this file to bulk upload quizzes to SpeedUpExam LMS',
    sections: [
      {
        children: [
          heading('📋 Quiz Bulk Upload Template'),
          comment('Fill in the details below, then upload this file on the Create Quiz page.'),
          comment('Lines starting with // are for guidance only — REMOVE THEM before uploading.'),
          blank(),

          heading('— Header (Required) —'),
          p('TITLE: My Quiz Title'),
          comment('Replace with your quiz title'),
          p('DESCRIPTION: A brief description of this quiz'),
          p('PASSING_SCORE: 70'),
          comment('Percentage required to pass (0–100)'),
          p('TIME_LIMIT: 30'),
          comment('Time limit in minutes. Use 0 for no limit.'),
          p('TAGS: tag1, tag2, tag3'),
          comment('Comma-separated tags (optional)'),
          blank(),

          heading('— Multiple Choice Question Example —'),
          comment('Start each question with Q: followed by the question text.'),
          p('Q: What does EC2 stand for?'),
          p('A) Elastic Compute Cloud'),
          p('B) Elastic Container Cloud'),
          p('C) Extended Compute Core'),
          p('D) Enterprise Cloud Compute'),
          p('ANSWER: A'),
          comment('Use the letter (A, B, C, or D) of the correct option.'),
          p('EXPLANATION: EC2 stands for Elastic Compute Cloud, a core AWS compute service.'),
          comment('Explanation shown to students after they answer.'),
          p('POINTS: 1'),
          comment('Points awarded for a correct answer.'),
          blank(),

          heading('— True / False Question Example —'),
          comment('Add TRUE_FALSE on its own line after Q: to make it a true/false question.'),
          p('Q: Amazon S3 is a storage service.'),
          p('TRUE_FALSE'),
          p('ANSWER: TRUE'),
          comment('Answer must be TRUE or FALSE (uppercase).'),
          p('EXPLANATION: Amazon S3 (Simple Storage Service) provides scalable object storage.'),
          p('POINTS: 1'),
          blank(),

          heading('— Add More Questions Below —'),
          comment('Copy any question block above and paste below to add more questions.'),
          comment('There is NO limit to the number of questions.'),
          blank(),
          p('Q: Your question text here?'),
          p('A) Option 1'),
          p('B) Option 2'),
          p('C) Option 3'),
          p('D) Option 4'),
          p('ANSWER: A'),
          p('EXPLANATION: Explanation here.'),
          p('POINTS: 1'),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, 'quiz_upload_template.docx');
}

/* ─── NOTE TEMPLATE ────────────────────────────────────────────────── */
export async function downloadNoteTemplate() {
  const doc = new Document({
    creator: 'SpeedUpExam LMS',
    title: 'Note Bulk Upload Template',
    description: 'Use this file to bulk upload notes to SpeedUpExam LMS',
    sections: [
      {
        children: [
          heading('📝 Note Bulk Upload Template'),
          comment('Fill in the header fields below, then write your note content.'),
          comment('Lines starting with // are for guidance only — REMOVE THEM before uploading.'),
          blank(),

          heading('— Header (Required) —'),
          p('TITLE: My Note Title'),
          comment('Replace with your note title.'),
          p('TAGS: aws, cloud, basics'),
          comment('Comma-separated tags (optional).'),
          p('COLOR: blue'),
          comment('Card color. Options: default, blue, green, yellow, pink, purple'),
          blank(),

          heading('— Note Content (Required) —'),
          comment('Write your note content below this line.'),
          comment('Leave a blank line between paragraphs — each paragraph will be preserved.'),
          blank(),
          p('Your first paragraph goes here. This is the introduction to your note.'),
          blank(),
          p('Your second paragraph goes here. Keep content well-organized with blank lines between paragraphs.'),
          blank(),
          p('You can have as many paragraphs as you need. The content supports rich formatting when edited inside the app.'),
          blank(),

          heading('— Example (AWS Basics) —'),
          comment('Here is a filled-in example to show the full format:'),
          blank(),
          p('TITLE: AWS IAM Overview'),
          p('TAGS: aws, iam, security, cloud'),
          p('COLOR: blue'),
          blank(),
          p('AWS Identity and Access Management (IAM) is a web service that helps you securely control access to AWS resources.'),
          blank(),
          p('With IAM, you can manage permissions that control which AWS resources users can access.'),
          blank(),
          p('Key concepts: Users, Groups, Roles, and Policies.'),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, 'note_upload_template.docx');
}
