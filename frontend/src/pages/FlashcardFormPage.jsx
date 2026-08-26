import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, Trash2, Save, Layers, Globe, Lock, Upload, FileText, BookOpen } from 'lucide-react';
import clsx from 'clsx';

const colors = ['default', 'blue', 'green', 'yellow', 'pink', 'purple'];
const colorDots = {
  default: 'bg-gray-500', blue: 'bg-blue-500', green: 'bg-green-500',
  yellow: 'bg-yellow-500', pink: 'bg-pink-500', purple: 'bg-purple-500',
};

const defaultCard = () => ({ front: '', back: '', hint: '' });

export default function FlashcardFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({ deckName: '', description: '', color: 'default', isPublic: false });
  const [cards, setCards] = useState([defaultCard(), defaultCard()]);
  const [saving, setSaving] = useState(false);
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkUploading, setBulkUploading] = useState(false);

  // Course Selector State
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [modules, setModules] = useState([]);
  const [selectedModuleId, setSelectedModuleId] = useState('');

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
      api.get(`/flashcards/${id}`).then(({ data }) => {
        const d = data.deck;
        setForm({ deckName: d.deckName, description: d.description, color: d.color, isPublic: d.isPublic });
        setCards(d.cards.length > 0 ? d.cards : [defaultCard()]);
      }).catch(() => navigate('/flashcards'));
    }
  }, [isEdit, id, navigate]);

  const addCard = () => setCards([...cards, defaultCard()]);
  const removeCard = (idx) => {
    if (cards.length === 1) { toast.error('At least one card required'); return; }
    setCards(cards.filter((_, i) => i !== idx));
  };
  const updateCard = (idx, field, value) => {
    setCards(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c));
  };

  const handleBulkUpload = async () => {
    if (!bulkFile) return;
    setBulkUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', bulkFile);
      const { data } = await api.post('/flashcards/bulk-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(data.message || 'Deck uploaded!');
      navigate('/flashcards');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setBulkUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${form.deckName}"? This will also remove all students progress for this deck.`)) return;
    try {
      await api.delete(`/flashcards/${id}`);
      toast.success('Deck deleted');
      navigate('/flashcards');
    } catch {
      toast.error('Failed to delete deck');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    for (let i = 0; i < cards.length; i++) {
      if (!cards[i].front.trim() || !cards[i].back.trim()) {
        toast.error(`Card ${i + 1}: front and back are required`);
        return;
      }
    }

    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/flashcards/${id}`, { ...form, cards });
        toast.success('Deck updated!');
      } else {
        await api.post('/flashcards', { ...form, cards, moduleId: selectedModuleId || undefined });
        toast.success('Deck created!');
      }
      navigate('/flashcards');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate('/flashcards')} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Flashcards
        </button>
        {isEdit && (
          <button
            type="button"
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500/50 transition-all text-sm font-medium"
          >
            <Trash2 className="w-4 h-4" />
            Delete Deck
          </button>
        )}
      </div>

      {/* Bulk Upload — only on create */}
      {!isEdit && (
        <div className="glass-card p-6 mb-4 border border-green-500/20">
          <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
            <Upload className="w-5 h-5 text-green-400" />
            Bulk Upload via Word File
          </h2>
          <p className="text-gray-500 text-sm mb-4">Upload a .docx file to create a deck instantly. Use the format below (copy it and ask AI to fill in cards).</p>

          <div className="bg-black/30 rounded-xl p-4 mb-4 font-mono text-xs text-gray-400 border border-white/10 overflow-auto">
            <pre>{`DECK_NAME: My Flashcard Deck
DESCRIPTION: Brief description here
COLOR: blue

Q: What is RAM?
A: Random Access Memory — temporary storage used by the CPU
HINT: Think about what clears on restart

Q: What is an API?
A: Application Programming Interface
HINT: Like a waiter between kitchen and customer

Q: What is Python?
A: A high-level programming language known for simplicity
HINT: Named after Monty Python`}</pre>
          </div>

          <div className="flex gap-3 items-center">
            <label className="flex-1">
              <input type="file" accept=".docx" className="hidden" onChange={e => setBulkFile(e.target.files[0])} />
              <div className={`input-field flex items-center gap-2 cursor-pointer hover:border-green-500/50 transition-colors ${bulkFile ? 'border-green-500/40' : ''}`}>
                <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <span className={bulkFile ? 'text-white text-sm' : 'text-gray-500 text-sm'}>
                  {bulkFile ? bulkFile.name : 'Click to choose .docx file...'}
                </span>
              </div>
            </label>
            <button type="button" onClick={handleBulkUpload} disabled={!bulkFile || bulkUploading} className="btn-primary flex items-center gap-2 flex-shrink-0">
              {bulkUploading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Upload className="w-4 h-4" />}
              Upload
            </button>
          </div>
          {bulkFile && (
            <button type="button" onClick={() => setBulkFile(null)} className="mt-2 text-xs text-gray-500 hover:text-gray-300">Clear file</button>
          )}
          <p className="mt-3 text-xs text-gray-600">— or create deck manually below —</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Deck settings */}
        <div className="glass-card p-6">
          <h1 className="text-2xl font-bold text-white mb-5 flex items-center gap-3">
            <Layers className="w-7 h-7 text-green-400" />
            {isEdit ? 'Edit Deck' : 'Create Flashcard Deck'}
          </h1>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Deck Name *</label>
              <input value={form.deckName} onChange={e => setForm({ ...form, deckName: e.target.value })} className="input-field" placeholder="e.g. Biology Chapter 3" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input-field resize-none" rows={2} placeholder="What is this deck about?" />
            </div>
            <div className="flex items-center gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Color</label>
                <div className="flex gap-2">
                  {colors.map(c => (
                    <button
                      key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                      className={clsx('w-6 h-6 rounded-full transition-all', colorDots[c], form.color === c ? 'ring-2 ring-white ring-offset-1 ring-offset-gray-900 scale-125' : 'opacity-50 hover:opacity-100')}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Visibility</label>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, isPublic: !form.isPublic })}
                  className={clsx(
                    'flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 transition-all duration-200 font-medium text-sm',
                    form.isPublic
                      ? 'bg-green-500/20 border-green-500/60 text-green-300'
                      : 'bg-white/5 border-white/20 text-gray-400 hover:border-white/40'
                  )}
                >
                  {form.isPublic
                    ? <><Globe className="w-4 h-4" /> Public — visible to all students</>
                    : <><Lock className="w-4 h-4" /> Private — only you can see this</>
                  }
                  <div className={clsx(
                    'w-10 h-5 rounded-full transition-all duration-200 relative ml-2 flex-shrink-0',
                    form.isPublic ? 'bg-green-500' : 'bg-gray-600'
                  )}>
                    <div className={clsx(
                      'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200',
                      form.isPublic ? 'left-5' : 'left-0.5'
                    )} />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {!isEdit && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 p-5 border border-white/10 rounded-xl bg-black/20">
            <div className="col-span-full mb-1">
              <h3 className="font-semibold text-white flex items-center gap-2"><BookOpen className="w-4 h-4 text-indigo-400" /> Add to Course (Optional)</h3>
              <p className="text-sm text-gray-400">Directly assign this flashcard deck to a course section upon creation.</p>
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

        {/* Cards */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Cards ({cards.length})</h2>
          </div>

          {cards.map((card, idx) => (
            <div key={idx} className="glass-card p-4 border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-400 text-sm font-medium">Card {idx + 1}</span>
                <button type="button" onClick={() => removeCard(idx)} className="btn-icon p-1">
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Front (Question) *</label>
                  <textarea
                    value={card.front}
                    onChange={e => updateCard(idx, 'front', e.target.value)}
                    className="input-field text-sm resize-none"
                    rows={3}
                    placeholder="Question or term..."
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">Back (Answer) *</label>
                  <textarea
                    value={card.back}
                    onChange={e => updateCard(idx, 'back', e.target.value)}
                    className="input-field text-sm resize-none"
                    rows={3}
                    placeholder="Answer or definition..."
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Hint (optional)</label>
                <input
                  value={card.hint}
                  onChange={e => updateCard(idx, 'hint', e.target.value)}
                  className="input-field text-sm py-2"
                  placeholder="A helpful hint..."
                />
              </div>
            </div>
          ))}

          <button type="button" onClick={addCard} className="btn-secondary w-full flex items-center justify-center gap-2 py-3 border-dashed border-white/20">
            <Plus className="w-4 h-4" />
            Add Card
          </button>
        </div>

        <button type="submit" disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2 py-4">
          {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
          {isEdit ? 'Update Deck' : 'Create Deck'}
        </button>
      </form>
    </div>
  );
}
