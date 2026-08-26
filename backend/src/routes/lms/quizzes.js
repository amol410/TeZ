const { Router } = require('express');
const multer  = require('multer');
const mammoth = require('mammoth');
const db = require('../../db');
const { protect, authorize } = require('../../middleware/lmsAuth');

const router  = Router();
const upload  = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const safeJSON = (v) => { try { return JSON.parse(v); } catch { return []; } };

const assignIds = (questions) => questions.map((q, i) => ({ _id: i, ...q }));

const calcTotalPoints = (questions) =>
  questions.reduce((sum, q) => sum + (q.points || 1), 0);

const formatQuiz = (row) => ({
  ...row,
  questions: safeJSON(row.questions),
  tags: safeJSON(row.tags),
  isPublished: !!row.isPublished,
  shuffleQuestions: !!row.shuffleQuestions,
  createdBy: row.createdByName
    ? { id: row.createdBy, name: row.createdByName, avatar: row.createdByAvatar }
    : row.createdBy,
  subject: row.subjectId ? { id: row.subjectId, name: row.subjectName } : null,
});

const stripAnswers = (quiz) => ({
  ...quiz,
  questions: quiz.questions.map(({ correctIndex, explanation, ...rest }) => rest),
});

// ─── GET /api/quizzes ────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { q, tag, page = 1, limit = 12, subject, topic } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const user = req.user; // may be undefined for public list

    let where = 'q.isPublished = 1';
    const params = [];

    if (q) { where += ` AND (q.title LIKE ? OR q.description LIKE ?)`; params.push(`%${q}%`, `%${q}%`); }
    if (tag) { where += ` AND q.tags LIKE ?`; params.push(`%"${tag}"%`); }
    if (subject) { where += ` AND q.subjectId = ?`; params.push(parseInt(subject)); }
    if (topic)   { where += ` AND q.topic = ?`; params.push(topic); }

    const sql = `
      SELECT q.*, u.name AS createdByName, u.avatar AS createdByAvatar, s.name AS subjectName
      FROM lms_quizzes q
      LEFT JOIN User u ON u.id = q.createdBy
      LEFT JOIN lms_subjects s ON s.id = q.subjectId
      WHERE ${where} ORDER BY q.createdAt DESC LIMIT ? OFFSET ?`;

    const [rows] = await db.query(sql, [...params, parseInt(limit), offset]);
    const [countRows] = await db.query(
      `SELECT COUNT(*) AS total FROM lms_quizzes q WHERE ${where}`, params);

    const quizzes = rows.map(r => stripAnswers(formatQuiz(r)));
    res.json({
      success: true,
      quizzes,
      pagination: { total: countRows[0].total, page: parseInt(page), pages: Math.ceil(countRows[0].total / parseInt(limit)) },
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ─── GET /api/quizzes/:id ────────────────────────────────────────────────────
router.get('/:id', protect, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT q.*, u.name AS createdByName, u.avatar AS createdByAvatar, s.name AS subjectName
       FROM lms_quizzes q
       LEFT JOIN User u ON u.id = q.createdBy
       LEFT JOIN lms_subjects s ON s.id = q.subjectId
       WHERE q.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Quiz not found' });

    const quiz = formatQuiz(rows[0]);
    const isOwner = quiz.createdBy?.id === req.user.id || quiz.createdBy === req.user.id;
    res.json({ success: true, quiz: isOwner ? quiz : stripAnswers(quiz) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ─── POST /api/quizzes ───────────────────────────────────────────────────────
router.post('/', protect, authorize('trainer', 'admin'), async (req, res) => {
  try {
    const { title, description = '', questions, passingScore = 70, timeLimit = 0,
            shuffleQuestions = false, isPublished = true, tags = [], subject, topic, moduleId } = req.body;
    if (!questions?.length) return res.status(400).json({ success: false, message: 'At least one question is required' });

    const withIds = assignIds(questions);
    const totalPoints = calcTotalPoints(withIds);
    const [result] = await db.query(
      `INSERT INTO lms_quizzes (createdBy, subjectId, topic, title, description, questions, tags, totalPoints, passingScore, timeLimit, shuffleQuestions, isPublished)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [req.user.id, subject || null, topic || null, title, description,
       JSON.stringify(withIds), JSON.stringify(tags), totalPoints,
       passingScore, timeLimit, shuffleQuestions ? 1 : 0, isPublished ? 1 : 0]
    );

    if (moduleId) {
      await db.query(
        `INSERT INTO lms_course_items (moduleId, itemType, itemId) VALUES (?, 'quiz', ?)`,
        [moduleId, result.insertId]
      );
    }

    const [rows] = await db.query('SELECT * FROM lms_quizzes WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, quiz: formatQuiz(rows[0]) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ─── PUT /api/quizzes/:id ────────────────────────────────────────────────────
router.put('/:id', protect, authorize('trainer', 'admin'), async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM lms_quizzes WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Quiz not found' });
    if (rows[0].createdBy !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });

    const q = rows[0];
    const { title, description, questions, passingScore, timeLimit, shuffleQuestions, isPublished, tags, subject, topic } = req.body;
    const withIds = questions ? assignIds(questions) : safeJSON(q.questions);
    const totalPoints = calcTotalPoints(withIds);

    await db.query(
      `UPDATE lms_quizzes SET title=?, description=?, questions=?, tags=?, totalPoints=?,
       passingScore=?, timeLimit=?, shuffleQuestions=?, isPublished=?, subjectId=?, topic=?, updatedAt=NOW() WHERE id=?`,
      [title ?? q.title, description ?? q.description, JSON.stringify(withIds),
       tags !== undefined ? JSON.stringify(tags) : q.tags, totalPoints,
       passingScore ?? q.passingScore, timeLimit ?? q.timeLimit,
       shuffleQuestions !== undefined ? (shuffleQuestions ? 1 : 0) : q.shuffleQuestions,
       isPublished !== undefined ? (isPublished ? 1 : 0) : q.isPublished,
       subject !== undefined ? (subject || null) : q.subjectId,
       topic !== undefined ? (topic || null) : q.topic,
       req.params.id]
    );
    const [updated] = await db.query('SELECT * FROM lms_quizzes WHERE id = ?', [req.params.id]);
    res.json({ success: true, quiz: formatQuiz(updated[0]) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ─── DELETE /api/quizzes/:id ─────────────────────────────────────────────────
router.delete('/:id', protect, authorize('trainer', 'admin'), async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM lms_quizzes WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Quiz not found' });
    if (rows[0].createdBy !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });
    await db.query('DELETE FROM lms_quiz_attempts WHERE quizId = ?', [req.params.id]);
    await db.query('DELETE FROM lms_quizzes WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Quiz deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ─── POST /api/quizzes/:id/attempt ──────────────────────────────────────────
router.post('/:id/attempt', protect, async (req, res) => {
  try {
    const [quizRows] = await db.query('SELECT * FROM lms_quizzes WHERE id = ?', [req.params.id]);
    if (!quizRows.length) return res.status(404).json({ success: false, message: 'Quiz not found' });

    const quiz = quizRows[0];
    const questions = safeJSON(quiz.questions);
    const { answers, startedAt, timeTakenSecs } = req.body;

    if (quiz.attemptLimit) {
      const [[{ cnt }]] = await db.query(
        'SELECT COUNT(*) AS cnt FROM lms_quiz_attempts WHERE quizId = ? AND studentId = ?',
        [quiz.id, req.user.id]
      );
      if (cnt >= quiz.attemptLimit) return res.status(400).json({ success: false, message: 'Attempt limit reached' });
    }

    const [[{ attemptNumber }]] = await db.query(
      'SELECT COUNT(*) + 1 AS attemptNumber FROM lms_quiz_attempts WHERE quizId = ? AND studentId = ?',
      [quiz.id, req.user.id]
    );

    const gradedAnswers = questions.map((question, index) => {
      const sub = answers.find(a => String(a.questionId) === String(question._id ?? index));
      const chosenIndex = sub ? sub.chosenIndex : -1;
      const isCorrect = chosenIndex === question.correctIndex;
      return { questionId: question._id ?? index, chosenIndex, isCorrect, pointsEarned: isCorrect ? (question.points || 1) : 0 };
    });

    const score = gradedAnswers.reduce((s, a) => s + a.pointsEarned, 0);
    const maxScore = quiz.totalPoints || questions.reduce((s, q) => s + (q.points || 1), 0);
    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    const passed = percentage >= quiz.passingScore ? 1 : 0;

    const [result] = await db.query(
      `INSERT INTO lms_quiz_attempts (quizId, studentId, answers, score, maxScore, percentage, passed, attemptNumber, startedAt, submittedAt, timeTakenSecs)
       VALUES (?,?,?,?,?,?,?,?,?,NOW(),?)`,
      [quiz.id, req.user.id, JSON.stringify(gradedAnswers), score, maxScore, percentage, passed, attemptNumber,
       startedAt ? new Date(startedAt) : new Date(), timeTakenSecs || null]
    );
    const [attemptRows] = await db.query('SELECT * FROM lms_quiz_attempts WHERE id = ?', [result.insertId]);

    res.status(201).json({
      success: true,
      result: {
        attempt: { ...attemptRows[0], answers: safeJSON(attemptRows[0].answers), passed: !!attemptRows[0].passed },
        questions: questions.map((q, i) => ({
          _id: q._id ?? i, text: q.text, options: q.options,
          correctIndex: q.correctIndex, explanation: q.explanation,
          chosenIndex: gradedAnswers[i].chosenIndex,
          isCorrect: gradedAnswers[i].isCorrect,
          pointsEarned: gradedAnswers[i].pointsEarned,
        })),
      },
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ─── GET /api/quizzes/:id/attempts (my attempts) ─────────────────────────────
router.get('/:id/attempts', protect, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM lms_quiz_attempts WHERE quizId = ? AND studentId = ? ORDER BY createdAt DESC',
      [req.params.id, req.user.id]
    );
    res.json({ success: true, attempts: rows.map(r => ({ ...r, answers: safeJSON(r.answers), passed: !!r.passed })) });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ─── GET /api/quizzes/:id/results (all attempts — staff) ─────────────────────
router.get('/:id/results', protect, authorize('trainer', 'admin'), async (req, res) => {
  try {
    const [quizRows] = await db.query('SELECT * FROM lms_quizzes WHERE id = ?', [req.params.id]);
    if (!quizRows.length) return res.status(404).json({ success: false, message: 'Quiz not found' });
    if (req.user.role !== 'admin' && quizRows[0].createdBy !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    const [rows] = await db.query(
      `SELECT a.*, u.id AS stuId, u.name AS stuName, u.email AS stuEmail, u.avatar AS stuAvatar
       FROM lms_quiz_attempts a LEFT JOIN User u ON u.id = a.studentId
       WHERE a.quizId = ? ORDER BY a.createdAt DESC`,
      [req.params.id]
    );
    const attempts = rows.map(r => ({
      ...r,
      answers: safeJSON(r.answers),
      passed: !!r.passed,
      student: { id: r.stuId, name: r.stuName, email: r.stuEmail, avatar: r.stuAvatar },
    }));
    res.json({ success: true, attempts });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ─── POST /api/quizzes/bulk-upload ───────────────────────────────────────────
router.post('/bulk-upload', protect, authorize('trainer', 'admin'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const result = await mammoth.extractRawText({ buffer: req.file.buffer });
    const text = result.value;

    const titleMatch    = text.match(/^TITLE:\s*(.+)/m);
    const descMatch     = text.match(/^DESCRIPTION:\s*(.+)/m);
    const passingMatch  = text.match(/^PASSING_SCORE:\s*(\d+)/m);
    const timeLimitMatch= text.match(/^TIME_LIMIT:\s*(\d+)/m);
    const tagsMatch     = text.match(/^TAGS:\s*(.+)/m);

    const title       = titleMatch    ? titleMatch[1].trim()    : 'Uploaded Quiz';
    const description = descMatch     ? descMatch[1].trim()     : '';
    const passingScore= passingMatch  ? parseInt(passingMatch[1]) : 70;
    const timeLimit   = timeLimitMatch? parseInt(timeLimitMatch[1]) : 0;
    const tags        = tagsMatch     ? tagsMatch[1].split(',').map(t => t.trim()).filter(Boolean) : [];

    const questionBlocks = text.split(/\n(?=Q\d*:|\nQ\d*:)/i).filter(b => b.match(/^Q\d*:/i));
    const questions = [];

    for (const block of questionBlocks) {
      const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
      const qLineMatch = lines[0].match(/^Q\d*:\s*(.+)/i);
      if (!qLineMatch) continue;
      const qText = qLineMatch[1].trim();
      const isTrueFalse = lines.some(l => /^TRUE_FALSE$/i.test(l));
      let options = [], correctIndex = 0, explanation = '', points = 1;

      if (isTrueFalse) {
        options = ['True', 'False'];
        const answerLine = lines.find(l => /^ANSWER:/i.test(l));
        if (answerLine) correctIndex = answerLine.replace(/^ANSWER:/i, '').trim().toUpperCase() === 'TRUE' ? 0 : 1;
      } else {
        options = lines.filter(l => /^[A-D]\)/i.test(l)).map(l => l.replace(/^[A-D]\)\s*/i, '').trim());
        const answerLine = lines.find(l => /^ANSWER:/i.test(l));
        if (answerLine) {
          const idx = ['A','B','C','D'].indexOf(answerLine.replace(/^ANSWER:/i,'').trim().toUpperCase());
          correctIndex = idx >= 0 ? idx : 0;
        }
      }
      const expLine = lines.find(l => /^EXPLANATION:/i.test(l));
      if (expLine) explanation = expLine.replace(/^EXPLANATION:/i,'').trim();
      const ptLine = lines.find(l => /^POINTS:/i.test(l));
      if (ptLine) points = parseInt(ptLine.replace(/^POINTS:/i,'').trim()) || 1;
      if (options.length >= 2) questions.push({ text: qText, type: isTrueFalse ? 'true-false' : 'multiple-choice', options, correctIndex, explanation, points });
    }

    if (!questions.length) return res.status(400).json({ success: false, message: 'No valid questions found' });

    const { subject, topic: reqTopic } = req.body;
    const withIds = assignIds(questions);
    const totalPoints = calcTotalPoints(withIds);
    const [dbResult] = await db.query(
      `INSERT INTO lms_quizzes (createdBy, subjectId, topic, title, description, questions, tags, totalPoints, passingScore, timeLimit, isPublished)
       VALUES (?,?,?,?,?,?,?,?,?,?,1)`,
      [req.user.id, subject || null, reqTopic || null, title, description,
       JSON.stringify(withIds), JSON.stringify(tags), totalPoints, passingScore, timeLimit]
    );
    const [rows] = await db.query('SELECT * FROM lms_quizzes WHERE id = ?', [dbResult.insertId]);
    res.status(201).json({ success: true, quiz: formatQuiz(rows[0]), message: `Quiz created with ${questions.length} questions` });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
