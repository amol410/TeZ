import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, Trash2, Save, Brain, ChevronDown, ChevronUp, Upload, FileText, Globe, Lock, Download, BookOpen } from 'lucide-react';
import clsx from 'clsx';
import { CodeSnippetForm } from '../components/quiz/CodeSnippetQuestion';
import { useSubjects } from '../hooks/useSubjects';
import { downloadQuizTemplate } from '../utils/downloadTemplateDoc';

const defaultQuestion = () => ({
  text: '',
  type: 'multiple-choice',
  options: ['', '', '', ''],
  correctIndex: 0,
  explanation: '',
  points: 1,
});

export default function QuizFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    title: '',
    description: '',
    passingScore: 70,
    timeLimit: 0,
    shuffleQuestions: false,
    isPublished: true,
    subject: '',
    topic: '',
  });
  const [questions, setQuestions] = useState([defaultQuestion()]);
  const [expandedQ, setExpandedQ] = useState(0);
  const [saving, setSaving] = useState(false);
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkSubject, setBulkSubject] = useState('');
  const [bulkTopic, setBulkTopic] = useState('');

  // Course Selector State
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [modules, setModules] = useState([]);
  const [selectedModuleId, setSelectedModuleId] = useState('');

  const { subjects, createSubject, createTopic } = useSubjects();

  useEffect(() => {
    if (!isEdit) {
      api.get('/courses/manage/all').then(res => setCourses(res.data.courses || []));
    }
  }, [isEdit]);

  useEffect(() => {
    if (selectedCourseId) {
      api.get(`/courses/${selectedCourseId}`).then(res => {
        setModules(res.data.course.modules || []);
        setSelectedModuleId('');
      });
    } else {
      setModules([]);
      setSelectedModuleId('');
    }
  }, [selectedCourseId]);

  useEffect(() => {
    if (isEdit) {
      api.get(`/quizzes/${id}`).then(({ data }) => {
        const q = data.quiz;
        setForm({
          title: q.title, description: q.description, passingScore: q.passingScore,
          timeLimit: q.timeLimit, shuffleQuestions: q.shuffleQuestions, isPublished: q.isPublished,
          subject: q.subjectId || '', topic: q.topic || ''
        });
        setQuestions(q.questions.length > 0 ? q.questions : [defaultQuestion()]);
      }).catch(() => navigate('/quizzes'));
    }
  }, [isEdit, id, navigate]);

  const addQuestion = () => {
    setQuestions([...questions, defaultQuestion()]);
    setExpandedQ(questions.length);
  };

  const removeQuestion = (idx) => {
    if (questions.length === 1) { toast.error('At least one question required'); return; }
    setQuestions(questions.filter((_, i) => i !== idx));
    if (expandedQ >= idx) setExpandedQ(Math.max(0, expandedQ - 1));
  };

  const updateQuestion = (idx, field, value) => {
    setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, [field]: value } : q));
  };

  const updateOption = (qIdx, optIdx, value) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qIdx) return q;
      const options = [...q.options];
      options[optIdx] = value;
      return { ...q, options };
    }));
  };

  const handleTypeChange = (idx, type) => {
    const options = type === 'true-false' ? ['True', 'False'] : ['', '', '', ''];
    const extra = type === 'code-mcq' ? { language: 'python' } : {};
    setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, type, options, correctIndex: 0, ...extra } : q));
  };

  const handleSubjectChange = async (val, isBulk = false) => {
    if (val === 'CREATE_NEW') {
      const name = prompt('Enter new subject name:');
      if (name) {
        const s = await createSubject(name);
        if (s) {
          isBulk ? setBulkSubject(s.id) : setForm({ ...form, subject: s.id, topic: '' });
          if (isBulk) setBulkTopic('');
        }
      }
    } else {
      if (isBulk) { setBulkSubject(val); setBulkTopic(''); }
      else setForm({ ...form, subject: val, topic: '' });
    }
  };

  const handleTopicChange = async (val, subjectId, isBulk = false) => {
    if (val === 'CREATE_NEW') {
      const name = prompt('Enter new topic name:');
      if (name) {
        const t = await createTopic(subjectId, name);
        if (t) isBulk ? setBulkTopic(name) : setForm({ ...form, topic: name });
      }
    } else {
      isBulk ? setBulkTopic(val) : setForm({ ...form, topic: val });
    }
  };

  const handleBulkUpload = async () => {
    if (!bulkFile) return;
    setBulkUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', bulkFile);
      if (bulkSubject) formData.append('subject', bulkSubject);
      if (bulkTopic) formData.append('topic', bulkTopic);
      const { data } = await api.post('/quizzes/bulk-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(data.message || 'Quiz uploaded!');
      navigate('/quizzes');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setBulkUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${form.title}"? This will also remove all students attempts for this quiz.`)) return;
    try {
      await api.delete(`/quizzes/${id}`);
      toast.success('Quiz deleted');
      navigate('/quizzes');
    } catch {
      toast.error('Failed to delete quiz');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) { toast.error(`Question ${i + 1}: text is required`); return; }
      if (q.options.some(o => !o.trim())) { toast.error(`Question ${i + 1}: all options must be filled`); return; }
    }

    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/quizzes/${id}`, { ...form, questions });
        toast.success('Quiz updated!');
      } else {
        await api.post('/quizzes', { ...form, questions, moduleId: selectedModuleId || undefined });
        toast.success('Quiz created!');
      }
      navigate('/quizzes');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate('/quizzes')} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Quizzes
        </button>
        {isEdit && (
          <button
            type="button"
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500/50 transition-all text-sm font-medium"
          >
            <Trash2 className="w-4 h-4" />
            Delete Quiz
          </button>
        )}
      </div>

      {/* Bulk Upload */}
      {!isEdit && (
        <div className="glass-card p-6 mb-4 border border-purple-500/20">
          <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
            <Upload className="w-5 h-5 text-purple-400" />
            Bulk Upload via Word File
          </h2>
          <div className="flex items-center justify-between mb-4">
            <p className="text-gray-500 text-sm">Upload a .docx file to create a quiz instantly. Use the format below (copy it and ask AI to fill in questions).</p>
            <button type="button" onClick={downloadQuizTemplate} className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-2">
              <Download className="w-3.5 h-3.5" />
              Download Template
            </button>
          </div>

          <div className="bg-black/30 rounded-xl p-4 mb-4 font-mono text-xs text-gray-400 border border-white/10 overflow-auto max-h-48">
            <pre>{`TITLE: My Quiz Title
DESCRIPTION: Brief description here
PASSING_SCORE: 70
TIME_LIMIT: 30
TAGS: topic1, topic2

Q: What is the capital of France?
A) London
B) Paris
C) Berlin
D) Madrid
ANSWER: B
EXPLANATION: Paris is the capital of France.
POINTS: 1

Q: Is JavaScript case-sensitive?
TRUE_FALSE
ANSWER: TRUE
EXPLANATION: JavaScript is case-sensitive.
POINTS: 1`}</pre>
          </div>

          <div className="flex gap-3 mb-4">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Subject</label>
              <select value={bulkSubject} onChange={e => handleSubjectChange(e.target.value, true)} className="select-field text-sm">
                <option value="">Select Subject (Optional)</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
                <option value="CREATE_NEW" className="font-bold text-purple-400">+ Create New Subject</option>
              </select>
            </div>
            {bulkSubject && (
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Topic</label>
                <select value={bulkTopic} onChange={e => handleTopicChange(e.target.value, bulkSubject, true)} className="select-field text-sm">
                  <option value="">Select Topic (Optional)</option>
                  {subjects.find(s => s.id === parseInt(bulkSubject))?.topics?.map(t => (
                    <option key={t._id} value={t.name}>{t.name}</option>
                  ))}
                  <option value="CREATE_NEW" className="font-bold text-purple-400">+ Create New Topic</option>
                </select>
              </div>
            )}
          </div>

          <div className="flex gap-3 items-center">
            <label className="flex-1">
              <input
                type="file"
                accept=".docx"
                className="hidden"
                onChange={e => setBulkFile(e.target.files[0])}
              />
              <div className={`input-field flex items-center gap-2 cursor-pointer hover:border-purple-500/50 transition-colors ${bulkFile ? 'border-purple-500/40' : ''}`}>
                <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <span className={bulkFile ? 'text-white text-sm' : 'text-gray-500 text-sm'}>
                  {bulkFile ? bulkFile.name : 'Click to choose .docx file...'}
                </span>
              </div>
            </label>
            <button
              type="button"
              onClick={handleBulkUpload}
              disabled={!bulkFile || bulkUploading}
              className="btn-primary flex items-center gap-2 flex-shrink-0"
            >
              {bulkUploading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Upload className="w-4 h-4" />}
              Upload
            </button>
          </div>
          {bulkFile && (
            <button type="button" onClick={() => setBulkFile(null)} className="mt-2 text-xs text-gray-500 hover:text-gray-300">
              Clear file
            </button>
          )}
          <p className="mt-3 text-xs text-gray-600 text-center">— or create quiz manually below —</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Quiz settings */}
        <div className="glass-card p-6">
          <h1 className="text-2xl font-bold text-white mb-5 flex items-center gap-3">
            <Brain className="w-7 h-7 text-purple-400" />
            {isEdit ? 'Edit Quiz' : 'Create Quiz'}
          </h1>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Quiz Title *</label>
              <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="input-field" placeholder="e.g. JavaScript Fundamentals" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Subject</label>
                <select value={form.subject} onChange={e => handleSubjectChange(e.target.value)} className="select-field">
                  <option value="">Select Subject (Optional)</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                  <option value="CREATE_NEW" className="font-bold text-purple-400">+ Create New Subject</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Topic</label>
                <select 
                  value={form.topic} 
                  onChange={e => handleTopicChange(e.target.value, form.subject)} 
                  className="select-field"
                  disabled={!form.subject}
                >
                  <option value="">Select Topic (Optional)</option>
                  {form.subject && subjects.find(s => s.id === parseInt(form.subject))?.topics?.map(t => (
                    <option key={t._id} value={t.name}>{t.name}</option>
                  ))}
                  {form.subject && <option value="CREATE_NEW" className="font-bold text-purple-400">+ Create New Topic</option>}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input-field resize-none" rows={3} placeholder="Brief quiz description..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Passing Score (%)</label>
                <input type="number" min={0} max={100} value={form.passingScore} onChange={e => setForm({ ...form, passingScore: parseInt(e.target.value) })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Time Limit (mins, 0=none)</label>
                <input type="number" min={0} value={form.timeLimit} onChange={e => setForm({ ...form, timeLimit: parseInt(e.target.value) })} className="input-field" />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.shuffleQuestions} onChange={e => setForm({ ...form, shuffleQuestions: e.target.checked })} className="w-4 h-4 rounded bg-gray-800 border-gray-600 text-dolphin-500 focus:ring-dolphin-500 focus:ring-offset-gray-900" />
                <span className="text-gray-300 text-sm">Shuffle questions for each attempt</span>
              </label>
            </div>
          </div>

          {!isEdit && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 p-5 border border-white/10 rounded-xl bg-black/20">
              <div className="col-span-full mb-1">
                <h3 className="font-semibold text-white flex items-center gap-2"><BookOpen className="w-4 h-4 text-indigo-400" /> Add to Course (Optional)</h3>
                <p className="text-sm text-gray-400">Directly assign this quiz to a course section upon creation.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5 ml-1">Select Course</label>
                <select value={selectedCourseId} onChange={e => setSelectedCourseId(e.target.value)} className="input-field py-1.5 text-sm h-10">
                  <option value="">-- None --</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
              {selectedCourseId && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5 ml-1">Select Section (Module)</label>
                  <select value={selectedModuleId} onChange={e => setSelectedModuleId(e.target.value)} className="input-field py-1.5 text-sm h-10" required={!!selectedCourseId}>
                    <option value="">-- Select Section --</option>
                    {modules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                  </select>
                </div>
              )}
            </div>
          )}

          <div className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() => setForm({ ...form, isPublished: !form.isPublished })}
                className={clsx(
                  'flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 transition-all duration-200 font-medium text-sm',
                  form.isPublished
                    ? 'bg-purple-500/20 border-purple-500/60 text-purple-300'
                    : 'bg-white/5 border-white/20 text-gray-400 hover:border-white/40'
                )}
              >
                {form.isPublished
                  ? <><Globe className="w-4 h-4" /> Public — visible to all students</>
                  : <><Lock className="w-4 h-4" /> Private — only staff can see this</>
                }
                <div className={clsx(
                  'w-10 h-5 rounded-full transition-all duration-200 relative ml-2 flex-shrink-0',
                  form.isPublished ? 'bg-purple-500' : 'bg-gray-600'
                )}>
                  <div className={clsx(
                    'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200',
                    form.isPublished ? 'left-5' : 'left-0.5'
                  )} />
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Questions ({questions.length})</h2>

          {questions.map((q, qIdx) => (
            <div key={qIdx} className="glass-card overflow-hidden border border-white/10">
              {/* Question header */}
              <button
                type="button"
                onClick={() => setExpandedQ(expandedQ === qIdx ? -1 : qIdx)}
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-purple-600/30 text-purple-300 flex items-center justify-center text-sm font-bold">
                    {qIdx + 1}
                  </div>
                  <span className="text-gray-300 text-sm text-left truncate max-w-md">
                    {q.text || 'Untitled question'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeQuestion(qIdx); }}
                    className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  {expandedQ === qIdx ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                </div>
              </button>

              {expandedQ === qIdx && (
                <div className="border-t border-white/10 p-4 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Question Text *</label>
                    <textarea
                      value={q.text}
                      onChange={e => updateQuestion(qIdx, 'text', e.target.value)}
                      className="input-field resize-none text-sm"
                      rows={2}
                      placeholder="Enter your question..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1.5">Type</label>
                      <select value={q.type} onChange={e => handleTypeChange(qIdx, e.target.value)} className="select-field text-sm">
                        <option value="multiple-choice">Multiple Choice</option>
                        <option value="true-false">True / False</option>
                        <option value="code-mcq">Code Snippet</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1.5">Points</label>
                      <input type="number" min={1} value={q.points} onChange={e => updateQuestion(qIdx, 'points', parseInt(e.target.value))} className="input-field text-sm" />
                    </div>
                  </div>

                  {q.type === 'code-mcq' ? (
                    <CodeSnippetForm question={q} qIdx={qIdx} updateQuestion={updateQuestion} />
                  ) : (
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-2">Options (select correct)</label>
                      <div className="space-y-2">
                        {q.options.map((opt, optIdx) => (
                          <div key={optIdx} className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => updateQuestion(qIdx, 'correctIndex', optIdx)}
                              className={`w-5 h-5 rounded-full border-2 flex-shrink-0 transition-all ${
                                q.correctIndex === optIdx
                                  ? 'border-green-500 bg-green-500'
                                  : 'border-white/20 hover:border-white/40'
                              }`}
                            >
                              {q.correctIndex === optIdx && (
                                <span className="block w-full h-full rounded-full bg-green-500" />
                              )}
                            </button>
                            {q.type === 'true-false' ? (
                              <span className="input-field text-sm py-2 flex-1">{opt}</span>
                            ) : (
                              <input
                                value={opt}
                                onChange={e => updateOption(qIdx, optIdx, e.target.value)}
                                className="input-field text-sm py-2 flex-1"
                                placeholder={`Option ${optIdx + 1}`}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">Explanation (shown after answer)</label>
                    <input
                      value={q.explanation}
                      onChange={e => updateQuestion(qIdx, 'explanation', e.target.value)}
                      className="input-field text-sm"
                      placeholder="Why is this the correct answer?"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}

          <button type="button" onClick={addQuestion} className="btn-secondary w-full flex items-center justify-center gap-2 py-3 border-dashed border-white/20">
            <Plus className="w-4 h-4" />
            Add Question
          </button>
        </div>

        <button type="submit" disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2 py-4">
          {saving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {isEdit ? 'Update Quiz' : 'Create Quiz'}
        </button>
      </form>
    </div>
  );
}
