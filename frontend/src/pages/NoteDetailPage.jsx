import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { ArrowLeft, Edit, Trash2, Pin, Tag, Calendar, Maximize2, Minimize2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { PageLoader } from '../components/common/Loader';
import clsx from 'clsx';

const colorAccent = {
  default: 'border-gray-600/40',
  blue: 'border-blue-500/60',
  green: 'border-green-500/60',
  yellow: 'border-yellow-500/60',
  pink: 'border-pink-500/60',
  purple: 'border-purple-500/60',
};

export default function NoteDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const slideRef = useRef(null);
  const { user } = useAuth();

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      slideRef.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(f => !f);
  };

  useEffect(() => {
    const onFsChange = () => {
      if (!document.fullscreenElement) setIsFullscreen(false);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  useEffect(() => {
    api.get(`/notes/${id}`)
      .then(({ data }) => { setNote(data.note); setLoading(false); })
      .catch(() => { toast.error('Note not found'); navigate('/notes'); });
  }, [id, navigate]);

  const handleDelete = async () => {
    if (!confirm('Delete this note?')) return;
    try {
      await api.delete(`/notes/${id}`);
      toast.success('Note deleted');
      navigate('/notes');
    } catch {
      toast.error('Failed to delete');
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className={clsx('mx-auto px-4 sm:px-6 py-8 animate-fade-in', note.contentType === 'html' ? 'max-w-6xl' : 'max-w-4xl')}>
      <div className="flex items-center justify-between mb-6">
        <Link to="/notes" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Notes
        </Link>
        {(user?.role === 'admin' || user?.role === 'trainer') && (
          <div className="flex items-center gap-2">
            <Link to={`/notes/${id}/edit`} className="btn-secondary flex items-center gap-2 px-4 py-2 text-sm">
              <Edit className="w-4 h-4" />
              Edit
            </Link>
            <button onClick={handleDelete} className="btn-danger">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className={clsx('glass-card overflow-hidden border-l-4', colorAccent[note.color] || colorAccent.default)}>
        <div className="p-6 border-b border-white/10">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-3xl font-bold text-white leading-tight">{note.title}</h1>
            {note.isPinned && <Pin className="w-5 h-5 text-yellow-400 fill-yellow-400 flex-shrink-0" />}
          </div>
          <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(note.updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
            {note.tags?.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" />
                <div className="flex gap-1">
                  {note.tags.map(tag => (
                    <span key={tag} className="badge badge-blue">{tag}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        {note.contentType === 'html' ? (
          /* 16:9 slide viewer */
          <div
            ref={slideRef}
            className="relative w-full bg-black"
            style={{ aspectRatio: '16/9' }}
          >
            <iframe
              srcDoc={note.content}
              sandbox="allow-scripts"
              className="w-full h-full border-0"
              title={note.title}
            />

            <button
              onClick={toggleFullscreen}
              className="absolute bottom-14 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-sm border border-white/20 text-white text-xs font-medium hover:bg-black/80 transition-all"
            >
              {isFullscreen
                ? <><Minimize2 className="w-3.5 h-3.5" /> Exit Fullscreen</>
                : <><Maximize2 className="w-3.5 h-3.5" /> Fullscreen</>
              }
            </button>
          </div>
        ) : (
          <div
            className="ProseMirror p-6 prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: note.content }}
          />
        )}
      </div>
    </div>
  );
}
