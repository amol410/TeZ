import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { ArrowLeft, RotateCcw, ChevronLeft, ChevronRight, Check, X, Lightbulb, Trophy, BarChart2 } from 'lucide-react';
import { PageLoader } from '../components/common/Loader';
import clsx from 'clsx';

const deckColorGradients = {
  default: 'from-gray-700 to-gray-800',
  blue: 'from-blue-700 to-blue-900',
  green: 'from-green-700 to-green-900',
  yellow: 'from-yellow-700 to-yellow-900',
  pink: 'from-pink-700 to-pink-900',
  purple: 'from-purple-700 to-purple-900',
};

export default function StudyPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [deck, setDeck] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [results, setResults] = useState({});
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get(`/flashcards/${id}`)
      .then(({ data }) => { setDeck(data.deck); setLoading(false); })
      .catch(() => { toast.error('Deck not found'); navigate('/flashcards'); });
  }, [id, navigate]);

  const card = deck?.cards[currentIdx];
  const total = deck?.cards.length || 0;
  const known = Object.values(results).filter(r => r === 'known').length;
  const unknown = Object.values(results).filter(r => r === 'unknown').length;

  const handleFlip = () => { setFlipped(!flipped); setShowHint(false); };

  const handleRate = (status) => {
    setResults(prev => ({ ...prev, [card._id]: status }));
    if (currentIdx < total - 1) {
      setCurrentIdx(currentIdx + 1);
      setFlipped(false);
      setShowHint(false);
    } else {
      setDone(true);
      saveProgress({ ...results, [card._id]: status });
    }
  };

  const saveProgress = async (finalResults) => {
    setSaving(true);
    try {
      const cardResults = deck.cards.map(c => ({
        cardId: c._id,
        status: finalResults[c._id] || 'unseen',
        reviewCount: finalResults[c._id] ? 1 : 0,
        lastReviewedAt: finalResults[c._id] ? new Date() : null,
      }));
      await api.post(`/flashcards/${id}/progress`, { cardResults });
    } catch {
      // silent
    } finally {
      setSaving(false);
    }
  };

  const restart = () => {
    setCurrentIdx(0);
    setFlipped(false);
    setShowHint(false);
    setResults({});
    setDone(false);
  };

  if (loading) return <PageLoader />;

  const gradient = deckColorGradients[deck.color] || deckColorGradients.default;

  // Completion screen
  if (done) {
    const masteryPct = Math.round((known / total) * 100);
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 animate-slide-up">
        <div className="glass-card p-8 text-center gradient-border">
          <div className="text-6xl mb-4">{masteryPct >= 80 ? '🏆' : masteryPct >= 50 ? '📚' : '💪'}</div>
          <h1 className="text-3xl font-bold text-white mb-2">Session Complete!</h1>
          <p className="text-gray-400 mb-8">{deck.deckName}</p>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="glass-card p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{known}</div>
              <div className="text-gray-500 text-xs mt-1">Known</div>
            </div>
            <div className="glass-card p-4 text-center">
              <div className="text-2xl font-bold text-red-400">{unknown}</div>
              <div className="text-gray-500 text-xs mt-1">Still Learning</div>
            </div>
            <div className="glass-card p-4 text-center">
              <div className="text-2xl font-bold text-dolphin-400">{masteryPct}%</div>
              <div className="text-gray-500 text-xs mt-1">Mastery</div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-white/5 rounded-full mb-8 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-600 to-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${masteryPct}%` }}
            />
          </div>

          <div className="flex gap-3 justify-center">
            <button onClick={() => navigate('/flashcards')} className="btn-secondary flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              All Decks
            </button>
            <button onClick={restart} className="btn-primary flex items-center gap-2">
              <RotateCcw className="w-4 h-4" />
              Study Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate('/flashcards')} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Exit Study
        </button>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span className="text-green-400">{known} ✓</span>
          <span>|</span>
          <span className="text-red-400">{unknown} ✗</span>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-500 mb-1.5">
          <span>{deck.deckName}</span>
          <span>{currentIdx + 1} / {total}</span>
        </div>
        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-dolphin-600 to-ocean-500 rounded-full transition-all duration-300"
            style={{ width: `${((currentIdx + 1) / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Flip card */}
      <div className="flip-card h-72 mb-4 cursor-pointer" onClick={handleFlip}>
        <div className={clsx('flip-card-inner w-full h-full', flipped && 'flipped')}>
          {/* Front */}
          <div className={clsx(
            'flip-card-front absolute inset-0 glass-card flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br',
            gradient, 'border border-white/10'
          )}>
            <div className="absolute top-3 right-3">
              <span className="text-xs text-white/40 bg-black/20 px-2 py-1 rounded-full">Front • Click to flip</span>
            </div>
            <p className="text-white text-xl font-medium leading-relaxed">{card?.front}</p>
            {card?.hint && !showHint && (
              <button
                onClick={(e) => { e.stopPropagation(); setShowHint(true); }}
                className="mt-4 flex items-center gap-1.5 text-white/50 hover:text-white/80 text-sm transition-colors"
              >
                <Lightbulb className="w-4 h-4" />
                Show hint
              </button>
            )}
            {card?.hint && showHint && (
              <div className="mt-4 px-4 py-2 bg-black/20 rounded-lg">
                <p className="text-white/70 text-sm italic">{card.hint}</p>
              </div>
            )}
          </div>

          {/* Back */}
          <div className="flip-card-back absolute inset-0 glass-card flex flex-col items-center justify-center p-8 text-center bg-gray-900 border border-white/10">
            <div className="absolute top-3 right-3">
              <span className="text-xs text-white/40 bg-white/5 px-2 py-1 rounded-full">Back</span>
            </div>
            <p className="text-white text-lg font-medium leading-relaxed">{card?.back}</p>
          </div>
        </div>
      </div>

      {/* Hint below card */}
      <p className="text-center text-gray-600 text-xs mb-6">
        {flipped ? 'How well did you know this?' : 'Click the card to reveal the answer'}
      </p>

      {/* Rating buttons (only shown when flipped) */}
      {flipped ? (
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleRate('unknown')}
            className="py-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 hover:border-red-500/50 transition-all duration-200 font-semibold flex items-center justify-center gap-2"
          >
            <X className="w-5 h-5" />
            Still Learning
          </button>
          <button
            onClick={() => handleRate('known')}
            className="py-4 rounded-xl bg-green-500/15 border border-green-500/30 text-green-400 hover:bg-green-500/25 hover:border-green-500/50 transition-all duration-200 font-semibold flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" />
            Got It!
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <button
            onClick={() => { setCurrentIdx(Math.max(0, currentIdx - 1)); setFlipped(false); setShowHint(false); }}
            disabled={currentIdx === 0}
            className="btn-secondary flex items-center gap-2 disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
            Prev
          </button>
          <button
            onClick={handleFlip}
            className="btn-primary px-8 flex items-center gap-2"
          >
            Flip Card
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setCurrentIdx(Math.min(total - 1, currentIdx + 1)); setFlipped(false); setShowHint(false); }}
            disabled={currentIdx === total - 1}
            className="btn-secondary flex items-center gap-2 disabled:opacity-30"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
