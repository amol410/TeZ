const { Router } = require('express');
const db = require('../../db');
const { protect, authorize } = require('../../middleware/lmsAuth');

const router = Router();

// ─── PUBLIC/STUDENT ROUTES ───────────────────────────────────────────────────

// Get all published courses (Storefront)
router.get('/', protect, async (req, res) => {
  try {
    const [courses] = await db.query(
      `SELECT c.*, u.name as instructorName 
       FROM lms_courses c 
       JOIN lms_users u ON c.instructorId = u.id 
       WHERE c.isPublished = 1 
       ORDER BY c.createdAt DESC`
    );
    res.json({ success: true, courses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get enrolled courses for student
router.get('/my', protect, async (req, res) => {
  try {
    const [courses] = await db.query(
      `SELECT c.*, e.enrolledAt, e.status, u.name as instructorName
       FROM lms_courses c
       JOIN lms_enrollments e ON c.id = e.courseId
       JOIN lms_users u ON c.instructorId = u.id
       WHERE e.studentId = ? AND e.status = 'active'
       ORDER BY e.enrolledAt DESC`,
      [req.user.id]
    );
    res.json({ success: true, courses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Checkout / Enroll in multiple courses
router.post('/checkout', protect, async (req, res) => {
  try {
    const { courseIds } = req.body;
    if (!courseIds || !courseIds.length) {
      return res.status(400).json({ success: false, message: 'No courses provided' });
    }

    // Verify courses exist and are published
    const [courses] = await db.query(
      `SELECT id FROM lms_courses WHERE id IN (?) AND isPublished = 1`,
      [courseIds]
    );
    
    if (courses.length !== courseIds.length) {
      return res.status(400).json({ success: false, message: 'One or more courses are invalid or unavailable' });
    }

    // Insert enrollments ignoring duplicates
    const values = courses.map(c => [req.user.id, c.id, 'active']);
    if (values.length > 0) {
      await db.query(
        `INSERT IGNORE INTO lms_enrollments (studentId, courseId, status) VALUES ?`,
        [values]
      );
    }

    res.json({ success: true, message: 'Successfully enrolled' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get course details (Includes full syllabus if enrolled or instructor)
router.get('/:id', protect, async (req, res) => {
  try {
    const [courses] = await db.query(
      `SELECT c.*, u.name as instructorName 
       FROM lms_courses c 
       JOIN lms_users u ON c.instructorId = u.id 
       WHERE c.id = ?`,
      [req.params.id]
    );

    if (!courses.length) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const course = courses[0];

    // Check if user has access (is instructor, admin, or enrolled)
    const isInstructor = course.instructorId === req.user.id;
    const isAdmin = req.user.role === 'admin';
    let isEnrolled = false;
    
    if (!isInstructor && !isAdmin) {
      const [enrollments] = await db.query(
        `SELECT id FROM lms_enrollments WHERE studentId = ? AND courseId = ? AND status = 'active'`,
        [req.user.id, course.id]
      );
      isEnrolled = enrollments.length > 0;
    }

    const hasAccess = isInstructor || isAdmin || isEnrolled;
    
    // Only fetch modules if published or if user is admin/instructor
    if (!course.isPublished && !isInstructor && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Course is not published' });
    }

    // Fetch syllabus (modules and items)
    const [modules] = await db.query(
      `SELECT * FROM lms_course_modules WHERE courseId = ? ORDER BY orderIndex ASC`,
      [course.id]
    );

    let items = [];
    if (modules.length > 0) {
      const moduleIds = modules.map(m => m.id);
      [items] = await db.query(
        `SELECT * FROM lms_course_items WHERE moduleId IN (?) ORDER BY orderIndex ASC`,
        [moduleIds]
      );
      
      // If user has full access, we need to fetch the actual content metadata for the items
      if (hasAccess && items.length > 0) {
        // We do separate queries for each item type to get titles
        const videoIds = items.filter(i => i.itemType === 'video').map(i => i.itemId);
        const noteIds = items.filter(i => i.itemType === 'note').map(i => i.itemId);
        const quizIds = items.filter(i => i.itemType === 'quiz').map(i => i.itemId);
        const flashcardIds = items.filter(i => i.itemType === 'flashcard').map(i => i.itemId);

        const [videos] = videoIds.length ? await db.query(`SELECT id, title, youtubeVideoId FROM lms_videos WHERE id IN (?)`, [videoIds]) : [[]];
        const [notes] = noteIds.length ? await db.query(`SELECT id, title FROM lms_notes WHERE id IN (?)`, [noteIds]) : [[]];
        const [quizzes] = quizIds.length ? await db.query(`SELECT id, title FROM lms_quizzes WHERE id IN (?)`, [quizIds]) : [[]];
        const [flashcards] = flashcardIds.length ? await db.query(`SELECT id, deckName as title FROM lms_flashcards WHERE id IN (?)`, [flashcardIds]) : [[]];

        items = items.map(item => {
          let details = null;
          if (item.itemType === 'video') details = videos.find(v => v.id === item.itemId);
          if (item.itemType === 'note') details = notes.find(n => n.id === item.itemId);
          if (item.itemType === 'quiz') details = quizzes.find(q => q.id === item.itemId);
          if (item.itemType === 'flashcard') details = flashcards.find(f => f.id === item.itemId);
          return { ...item, details };
        });
      } else if (!hasAccess) {
        // Strip out specific itemIds if they don't have access, just show skeleton of what it is
        items = items.map(item => ({
          id: item.id,
          moduleId: item.moduleId,
          itemType: item.itemType,
          orderIndex: item.orderIndex
        }));
      }
    }

    // Structure modules with their items
    const structuredModules = modules.map(m => ({
      ...m,
      items: items.filter(i => i.moduleId === m.id)
    }));

    res.json({
      success: true,
      course: {
        ...course,
        hasAccess,
        modules: structuredModules
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


// ─── TRAINER/ADMIN ROUTES ────────────────────────────────────────────────────

// Get courses managed by this trainer
router.get('/manage/all', protect, authorize('trainer', 'admin'), async (req, res) => {
  try {
    let query = `SELECT * FROM lms_courses WHERE instructorId = ? ORDER BY createdAt DESC`;
    let params = [req.user.id];

    if (req.user.role === 'admin') {
      query = `SELECT c.*, u.name as instructorName FROM lms_courses c JOIN lms_users u ON c.instructorId = u.id ORDER BY c.createdAt DESC`;
      params = [];
    }

    const [courses] = await db.query(query, params);
    res.json({ success: true, courses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Create course
router.post('/', protect, authorize('trainer', 'admin'), async (req, res) => {
  try {
    const { title, description, price, thumbnailUrl, isPublished } = req.body;
    const [result] = await db.query(
      `INSERT INTO lms_courses (title, description, price, thumbnailUrl, instructorId, isPublished) VALUES (?, ?, ?, ?, ?, ?)`,
      [title, description, price || 0, thumbnailUrl || null, req.user.id, isPublished ? 1 : 0]
    );
    res.json({ success: true, courseId: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update course
router.put('/:id', protect, authorize('trainer', 'admin'), async (req, res) => {
  try {
    const { title, description, price, thumbnailUrl, isPublished } = req.body;
    
    // Check ownership
    const [courses] = await db.query(`SELECT instructorId FROM lms_courses WHERE id = ?`, [req.params.id]);
    if (!courses.length) return res.status(404).json({ success: false, message: 'Course not found' });
    if (courses[0].instructorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    await db.query(
      `UPDATE lms_courses SET title=?, description=?, price=?, thumbnailUrl=?, isPublished=? WHERE id=?`,
      [title, description, price, thumbnailUrl, isPublished ? 1 : 0, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Add Module
router.post('/:id/modules', protect, authorize('trainer', 'admin'), async (req, res) => {
  try {
    const { title, orderIndex } = req.body;
    const [result] = await db.query(
      `INSERT INTO lms_course_modules (courseId, title, orderIndex) VALUES (?, ?, ?)`,
      [req.params.id, title, orderIndex || 0]
    );
    res.json({ success: true, moduleId: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Add Item to Module
router.post('/:courseId/modules/:moduleId/items', protect, authorize('trainer', 'admin'), async (req, res) => {
  try {
    const { itemType, itemId, orderIndex } = req.body;
    const [result] = await db.query(
      `INSERT INTO lms_course_items (moduleId, itemType, itemId, orderIndex) VALUES (?, ?, ?, ?)`,
      [req.params.moduleId, itemType, itemId, orderIndex || 0]
    );
    res.json({ success: true, itemId: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete Course
router.delete('/:id', protect, authorize('trainer', 'admin'), async (req, res) => {
  try {
    const [courses] = await db.query(`SELECT instructorId FROM lms_courses WHERE id = ?`, [req.params.id]);
    if (!courses.length) return res.status(404).json({ success: false, message: 'Course not found' });
    if (courses[0].instructorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    await db.query(`DELETE FROM lms_courses WHERE id = ?`, [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
