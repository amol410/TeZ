import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Layers, Search, Plus, X, Play, Lock, Globe } from 'lucide-react';
import EmptyState from '../components/common/EmptyState';
import { GridSkeleton } from '../components/common/Loader';
import { useAuth } from '../contexts/AuthContext';
import clsx from 'clsx';

const deckColors = {
  default: 'from-slate-500 via-slate-600 to-slate-700',
  blue:    'from-blue-500 via-blue-600 to-indigo-700',
  green:   'from-emerald-500 via-green-600 to-teal-700',
  yellow:  'from-amber-400 via-yellow-500 to-orange-600',
  pink:    'from-pink-500 via-rose-500 to-pink-700',
  purple:  'from-violet-500 via-purple-600 to-indigo-700',
};

const deckEmojis = {
  default: '📚', blue: '🔷', green: '🌿', yellow: '⭐', pink: '🌸', purple: '🔮',
};

export default function FlashcardsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const isStaff = user?.role === 'trainer' || user?.role === 'admin';

  const fetchDecks = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 24 };
      if (search) params.q = search;
      const { data } = await api.get('/flashcards', { params });
      setDecks(data.decks);
    } catch {
      toast.error('Failed to load decks');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchDecks(); }, [fetchDecks]);

  const handleSearch = (e) => { e.preventDefault(); setSearch(searchInput); };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!confirm('Delete this deck?')) return;
    try {
      await api.delete(`/flashcards/${id}`);
      setDecks(prev => prev.filter(d => d.id !== id));
      toast.success('Deck deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Layers className="w-8 h-8 text-green-400" />
            Flashcard Decks
          </h1>
          <p className="text-gray-500 mt-1">{decks.length} decks • Spaced repetition learning</p>
        </div>
        {isStaff && (
          <Link to="/flashcards/new" className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Deck
          </Link>
        )}
      </div>

      <div className="glass-card p-4 mb-6">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input value={searchInput} onChange={e => setSearchInput(e.target.value)} className="input-field pl-11" placeholder="Search decks..." />
          </div>
          {search && (
            <button type="button" onClick={() => { setSearch(''); setSearchInput(''); }} className="btn-icon"><X className="w-4 h-4" /></button>
          )}
          <button type="submit" className="btn-primary px-5">Search</button>
        </form>
      </div>

      {loading ? (
        <GridSkeleton />
      ) : decks.length === 0 ? (
        <EmptyState
          icon="🃏"
          title="No decks yet"
          description="Create your first flashcard deck to start studying."
          action={isStaff ? <Link to="/flashcards/new" className="btn-primary inline-flex items-center gap-2"><Plus className="w-4 h-4" />Create Deck</Link> : null}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {decks.map(deck => {
            const ownerId = deck.owner?.id ?? deck.owner?.id ?? deck.owner;
            const isOwner = ownerId == user?.id;
            return (
              <div
                key={deck.id}
                className="overflow-hidden rounded-2xl hover:scale-[1.03] hover:shadow-2xl transition-all duration-300 group cursor-pointer border border-white/10"
                onClick={() => navigate(`/flashcards/${deck.id}/study`)}
              >
                {/* Color header */}
                <div className={clsx('h-36 bg-gradient-to-br flex flex-col items-center justify-center relative', deckColors[deck.color] || deckColors.default)}>
                  <div className="absolute inset-0 bg-black/10" />
                  {/* Decorative circles */}
                  <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10" />
                  <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-white/10" />
                  <div className="relative text-center px-4">
                    <div className="text-5xl mb-2">{deckEmojis[deck.color] || deckEmojis.default}</div>
                    <p className="text-white/80 text-xs font-semibold tracking-widest uppercase">{deck.cardCount} Cards</p>
                  </div>
                  <div className="absolute top-3 right-3">
                    {deck.isPublic
                      ? <span className="flex items-center gap-1 bg-black/30 backdrop-blur-sm text-white text-xs font-medium px-2 py-1 rounded-full border border-white/20"><Globe className="w-3 h-3" />Public</span>
                      : <span className="flex items-center gap-1 bg-black/30 backdrop-blur-sm text-white/70 text-xs font-medium px-2 py-1 rounded-full border border-white/10"><Lock className="w-3 h-3" />Private</span>
                    }
                  </div>
                </div>

                {/* Card body */}
                <div className="p-5 bg-gray-900/80 backdrop-blur-sm">
                  <h3 className="text-white font-bold text-lg mb-1 group-hover:text-green-300 transition-colors leading-tight line-clamp-2">
                    {deck.deckName}
                  </h3>
                  {deck.description && (
                    <p className="text-gray-400 text-sm line-clamp-2 mb-4 leading-relaxed">{deck.description}</p>
                  )}
                  {!deck.description && <div className="mb-4" />}

                  <div className="flex gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/flashcards/${deck.id}/study`); }}
                      className="flex-1 btn-primary text-sm py-2.5 flex items-center justify-center gap-2 font-semibold"
                    >
                      <Play className="w-4 h-4" />
                      Study Now
                    </button>
                    {isOwner && (
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/flashcards/${deck.id}/edit`); }}
                        className="btn-secondary text-sm px-4 py-2.5 font-medium"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
