import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Plus, Search, BookOpen, Pin, Trash2, Edit, Tag, X, SortDesc } from 'lucide-react';
import EmptyState from '../components/common/EmptyState';
import { GridSkeleton } from '../components/common/Loader';
import { useAuth } from '../contexts/AuthContext';
import { useSubjects } from '../hooks/useSubjects';
import clsx from 'clsx';

const colorMap = {
  default: { border: 'border-l-gray-600/40', bg: '',                line: 'bg-gray-600/40' },
  blue:    { border: 'border-l-blue-500',     bg: 'bg-blue-500/3',   line: 'bg-blue-500/60' },
  green:   { border: 'border-l-green-500',    bg: 'bg-green-500/3',  line: 'bg-green-500/60' },
  yellow:  { border: 'border-l-yellow-500',   bg: 'bg-yellow-500/3', line: 'bg-yellow-500/60' },
  pink:    { border: 'border-l-pink-500',     bg: 'bg-pink-500/3',   line: 'bg-pink-500/60' },
  purple:  { border: 'border-l-purple-500',   bg: 'bg-purple-500/3', line: 'bg-purple-500/60' },
};

const colorOptions = [
  { value: 'default', dot: 'bg-gray-500', label: 'Default' },
  { value: 'blue', dot: 'bg-blue-500', label: 'Blue' },
  { value: 'green', dot: 'bg-green-500', label: 'Green' },
  { value: 'yellow', dot: 'bg-yellow-500', label: 'Yellow' },
  { value: 'pink', dot: 'bg-pink-500', label: 'Pink' },
  { value: 'purple', dot: 'bg-purple-500', label: 'Purple' },
];

export default function NotesPage() {
  const { user } = useAuth();
  const { subjects } = useSubjects();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const isStaff = user?.role === 'trainer' || user?.role === 'admin';
  const [searchInput, setSearchInput] = useState('');
  const [activeTag, setActiveTag] = useState('');
  const [activeColor, setActiveColor] = useState('');
  const [allTags, setAllTags] = useState([]);
  const [filterSubject, setFilterSubject] = useState('');
  const [filterTopic, setFilterTopic] = useState('');

  const filterTopics = filterSubject
    ? (subjects.find(s => s.id === parseInt(filterSubject))?.topics || [])
    : [];

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 50 };
      if (search) params.q = search;
      if (activeTag) params.tag = activeTag;
      if (filterSubject) params.subject = filterSubject;
      if (filterTopic) params.topic = filterTopic;
      const { data } = await api.get('/notes', { params });
      let result = data.notes;
      if (activeColor) result = result.filter(n => n.color === activeColor);
      setNotes(result);
      const tags = [...new Set(data.notes.flatMap(n => n.tags))].filter(Boolean);
      setAllTags(tags);
    } catch {
      toast.error('Failed to load notes');
    } finally {
      setLoading(false);
    }
  }, [search, activeTag, activeColor, filterSubject, filterTopic]);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  const handleSearch = (e) => { e.preventDefault(); setSearch(searchInput); };

  const clearAll = () => { setSearch(''); setSearchInput(''); setActiveTag(''); setActiveColor(''); setFilterSubject(''); setFilterTopic(''); };

  const handlePin = async (id, isPinned) => {
    try {
      await api.patch(`/notes/${id}/pin`);
      setNotes(prev =>
        prev.map(n => n._id === id ? { ...n, isPinned: !isPinned } : n)
          .sort((a, b) => b.isPinned - a.isPinned || new Date(b.updatedAt) - new Date(a.updatedAt))
      );
      toast.success(isPinned ? 'Unpinned' : 'Pinned!');
    } catch { toast.error('Failed to update'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this note?')) return;
    try {
      await api.delete(`/notes/${id}`);
      setNotes(prev => prev.filter(n => n._id !== id));
      toast.success('Note deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const stripHtml = (html) => html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160);

  const pinned = notes.filter(n => n.isPinned);
  const unpinned = notes.filter(n => !n.isPinned);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-blue-400" />
            My Notes
          </h1>
          <p className="text-gray-500 mt-1">{notes.length} notes • Click to read, hover to edit</p>
        </div>
        {isStaff && (
          <Link to="/notes/new" className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Note
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="glass-card p-4 mb-6 space-y-3">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input value={searchInput} onChange={e => setSearchInput(e.target.value)} className="input-field pl-11" placeholder="Search notes..." />
          </div>
          {(search || activeTag || activeColor || filterSubject || filterTopic) && (
            <button type="button" onClick={clearAll} className="btn-icon flex items-center gap-1.5 px-3 text-sm text-gray-400">
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
          <button type="submit" className="btn-primary px-5">Search</button>
        </form>

        {/* Subject + Topic filters */}
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <select
              value={filterSubject}
              onChange={e => { setFilterSubject(e.target.value); setFilterTopic(''); }}
              className="select-field text-sm py-2 min-w-36"
            >
              <option value="">All Subjects</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <select
              value={filterTopic}
              onChange={e => setFilterTopic(e.target.value)}
              disabled={!filterSubject}
              className="select-field text-sm py-2 min-w-36 disabled:opacity-40"
            >
              <option value="">All Topics</option>
              {filterTopics.map(t => <option key={t._id} value={t.name}>{t.name}</option>)}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Tags */}
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <Tag className="w-4 h-4 text-gray-600 self-center" />
              {allTags.map(tag => (
                <button key={tag} onClick={() => setActiveTag(activeTag === tag ? '' : tag)}
                  className={clsx('badge transition-all', activeTag === tag ? 'badge-blue' : 'bg-white/5 text-gray-400 border border-white/10 hover:border-white/20')}>
                  {tag}
                </button>
              ))}
            </div>
          )}

          {/* Colors */}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-gray-600 text-xs">Color:</span>
            {colorOptions.map(({ value, dot }) => (
              <button key={value} onClick={() => setActiveColor(activeColor === value ? '' : value)}
                className={clsx('w-4 h-4 rounded-full transition-all', dot, activeColor === value ? 'ring-2 ring-white ring-offset-1 ring-offset-gray-900 scale-125' : 'opacity-50 hover:opacity-100')} />
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <GridSkeleton />
      ) : notes.length === 0 ? (
        <EmptyState
          icon="📝"
          title="No notes found"
          description={search || activeTag ? 'No notes match your filters.' : 'Create your first note!'}
          action={!search && !activeTag && isStaff ? <Link to="/notes/new" className="btn-primary inline-flex items-center gap-2"><Plus className="w-4 h-4" />Create Note</Link> : null}
        />
      ) : (
        <>
          {/* Pinned */}
          {pinned.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                <Pin className="w-3.5 h-3.5 text-yellow-500" /> Pinned
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {pinned.map(note => <NoteCard key={note._id} note={note} onPin={handlePin} onDelete={handleDelete} isStaff={isStaff} />)}
              </div>
            </div>
          )}

          {/* All notes */}
          {unpinned.length > 0 && (
            <div>
              {pinned.length > 0 && <h2 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2"><SortDesc className="w-3.5 h-3.5" /> All Notes</h2>}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {unpinned.map(note => <NoteCard key={note._id} note={note} onPin={handlePin} onDelete={handleDelete} isStaff={isStaff} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function NoteCard({ note, onPin, onDelete, isStaff }) {
  const color = colorMap[note.color] || colorMap.default;
  return (
    <div className={clsx('glass-card border-l-4 p-5 hover:scale-[1.02] transition-all duration-300 group cursor-pointer', color.border, color.bg)}>
      {/* Title row */}
      <div className="flex items-start justify-between mb-3">
        <Link to={`/notes/${note._id}`} className="flex-1 min-w-0">
          <h3 className="text-white font-bold text-base leading-snug group-hover:text-dolphin-300 transition-colors">
            {note.isPinned && <Pin className="inline w-3.5 h-3.5 text-yellow-400 fill-yellow-400 mr-1.5 -mt-0.5" />}
            {note.title}
          </h3>
        </Link>
        {isStaff && (
          <div className="flex items-center gap-0.5 ml-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <button onClick={() => onPin(note._id, note.isPinned)} className="btn-icon p-1.5" title={note.isPinned ? 'Unpin' : 'Pin'}>
              <Pin className={clsx('w-3.5 h-3.5', note.isPinned ? 'text-yellow-400 fill-yellow-400' : 'text-gray-500')} />
            </button>
            <Link to={`/notes/${note._id}/edit`} className="btn-icon p-1.5" title="Edit">
              <Edit className="w-3.5 h-3.5 text-gray-500" />
            </Link>
            <button onClick={() => onDelete(note._id)} className="btn-icon p-1.5" title="Delete">
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
            </button>
          </div>
        )}
      </div>

      {/* Colored divider line */}
      <div className={clsx('h-px w-full rounded-full mb-4', color.line)} />

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {note.tags?.slice(0, 2).map(tag => (
            <span key={tag} className="badge bg-white/8 text-gray-500 border border-white/8 text-xs">{tag}</span>
          ))}
          {note.tags?.length > 2 && <span className="badge bg-white/8 text-gray-600 text-xs">+{note.tags.length - 2}</span>}
        </div>
        <span className="text-gray-700 text-xs">{new Date(note.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
      </div>
    </div>
  );
}
