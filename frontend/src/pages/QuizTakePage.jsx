import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { ArrowLeft, Clock, CheckCircle, XCircle, Award, RotateCcw, ChevronRight, ChevronLeft, Flag } from 'lucide-react';
import { CodeSnippetDisplay } from '../components/quiz/CodeSnippetQuestion';
import { PageLoader } from '../components/common/Loader';
import clsx from 'clsx';

export default function QuizTakePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [currentQ, setCurrentQ] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [flagged, setFlagged] = useState({});
  const startedAt = useRef(new Date().toISOString());
  const timerRef = useRef(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const attemptId = searchParams.get('attempt');

  useEffect(() => {
    if (!attemptId) {
      setSearchParams({ attempt: Date.now().toString() }, { replace: true });
    }
  }, [attemptId, setSearchParams]);

  useEffect(() => {
    if (!attemptId) return;

    api.get(`/quizzes/${id}`)
      .then(({ data }) => {
        setQuiz(data.quiz);
        setLoading(false);
        if (data.quiz.timeLimit > 0) {
          const sessionKey = `quiz_${id}_${attemptId}_state`;
          const savedStateStr = sessionStorage.getItem(sessionKey);
          if (savedStateStr) {
            const savedState = JSON.parse(savedStateStr);
            const remaining = Math.floor((savedState.endTime - Date.now()) / 1000);
            if (remaining > 0) {
              setTimeLeft(remaining);
              startedAt.current = savedState.startedAt;
            } else {
              setTimeLeft(0);
              startedAt.current = savedState.startedAt;
            }
          } else {
            const timeInSecs = data.quiz.timeLimit * 60;
            setTimeLeft(timeInSecs);
            sessionStorage.setItem(sessionKey, JSON.stringify({
              startedAt: startedAt.current,
              endTime: Date.now() + timeInSecs * 1000
            }));
          }
        }
      })
      .catch(() => { toast.error('Quiz not found'); navigate('/quizzes'); });
  }, [id, navigate, attemptId]);

  useEffect(() => {
    if (timeLeft === null || submitted) return;
    if (timeLeft <= 0) { handleSubmit(); return; }
    timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timerRef.current);
  }, [timeLeft, submitted]);

  // Navigation guards
  useEffect(() => {
    if (submitted || loading) return;

    // 1. Tab close or refresh
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = ''; // standard for most browsers to show prompt
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // 2. Back button
    window.history.pushState(null, null, window.location.href);
    const handlePopState = () => {
      if (window.confirm("You have an active quiz attempt. Are you sure you want to quit? Your progress will not be saved.")) {
        // They confirmed they want to leave.
        // We push state back and then navigate away cleanly.
        navigate('/quizzes', { replace: true });
      } else {
        // They want to stay, re-push dummy state
        window.history.pushState(null, null, window.location.href);
      }
    };
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [submitted, loading, navigate]);

  const toggleFlag = (questionId) => {
    setFlagged(prev => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  const handleAnswer = (questionId, chosenIndex) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [questionId]: chosenIndex }));
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    clearTimeout(timerRef.current);

    const timeTakenSecs = quiz.timeLimit > 0
      ? (quiz.timeLimit * 60) - (timeLeft || 0)
      : Math.round((new Date() - new Date(startedAt.current)) / 1000);

    try {
      const answerPayload = quiz.questions.map(q => ({
        questionId: q._id,
        chosenIndex: answers[q._id] ?? -1,
      }));

      const { data } = await api.post(`/quizzes/${id}/attempt`, {
        answers: answerPayload,
        startedAt: startedAt.current,
        timeTakenSecs,
      });

      setResult(data.result);
      setSubmitted(true);
      if (attemptId) sessionStorage.removeItem(`quiz_${id}_${attemptId}_state`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (secs) => `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;

  if (loading) return <PageLoader />;

  // Results view
  if (submitted && result) {
    const { attempt, questions } = result;
    const circumference = 2 * Math.PI * 45;
    const dashoffset = circumference - (attempt.percentage / 100) * circumference;

    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 animate-slide-up">
        {/* Score summary */}
        <div className="glass-card p-8 text-center mb-6 gradient-border">
          <div className="relative inline-flex items-center justify-center mb-4">
            <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
              <circle
                cx="50" cy="50" r="45" fill="none"
                stroke={attempt.passed ? '#22c55e' : '#ef4444'}
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={dashoffset}
                strokeLinecap="round"
                className="progress-ring"
              />
            </svg>
            <div className="absolute">
              <div className="text-3xl font-black text-white">{attempt.percentage}%</div>
            </div>
          </div>

          <div className={clsx(
            'inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold mb-3',
            attempt.passed ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          )}>
            {attempt.passed ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
            {attempt.passed ? 'Quiz Passed!' : 'Quiz Failed'}
          </div>

          <h1 className="text-2xl font-bold text-white mb-1">{quiz.title}</h1>
          <p className="text-gray-500">{attempt.score} / {attempt.maxScore} points</p>

          <div className="flex justify-center gap-4 mt-6">
            <button onClick={() => navigate('/quizzes')} className="btn-secondary flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              All Quizzes
            </button>
            <button
              onClick={() => { 
                setSubmitted(false); setResult(null); setAnswers({}); setCurrentQ(0); 
                startedAt.current = new Date().toISOString(); 
                
                // Generate a new attempt ID for the retake
                const newAttempt = Date.now().toString();
                setSearchParams({ attempt: newAttempt }, { replace: true });
                
                if (quiz.timeLimit > 0) {
                  const timeInSecs = quiz.timeLimit * 60;
                  setTimeLeft(timeInSecs);
                  sessionStorage.setItem(`quiz_${id}_${newAttempt}_state`, JSON.stringify({
                    startedAt: startedAt.current,
                    endTime: Date.now() + timeInSecs * 1000
                  }));
                } 
              }}
              className="btn-primary flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Retake
            </button>
          </div>
        </div>

        {/* Detailed results */}
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-purple-400" />
          Question Review
        </h2>
        <div className="space-y-4">
          {questions.map((q, i) => (
            <div key={q._id} className={clsx(
              'glass-card p-5 border-l-4',
              q.isCorrect ? 'border-green-500/60' : 'border-red-500/60'
            )}>
              <div className="flex items-start justify-between mb-3">
                <p className="text-white font-medium text-sm flex-1">{i + 1}. {q.text}</p>
                {q.isCorrect
                  ? <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 ml-3" />
                  : <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 ml-3" />
                }
              </div>
              <div className="space-y-2">
                {q.options.map((opt, optIdx) => (
                  <div key={optIdx} className={clsx(
                    'px-3 py-2 rounded-lg text-sm',
                    optIdx === q.correctIndex
                      ? 'bg-green-500/20 text-green-300 border border-green-500/40'
                      : optIdx === q.chosenIndex && !q.isCorrect
                        ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                        : 'text-gray-500'
                  )}>
                    {opt}
                    {optIdx === q.correctIndex && ' ✓'}
                    {optIdx === q.chosenIndex && !q.isCorrect && ' (your answer)'}
                  </div>
                ))}
              </div>
              {q.explanation && (
                <div className="mt-3 px-3 py-2 bg-dolphin-600/10 rounded-lg border border-dolphin-500/20">
                  <p className="text-dolphin-300 text-xs"><strong>Explanation:</strong> {q.explanation}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const q = quiz.questions[currentQ];
  const answered = Object.keys(answers).length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      {/* Quiz header */}
      <div className="glass-card p-4 mb-6 flex items-center justify-between sticky top-4 z-20 shadow-xl backdrop-blur-xl bg-black/40">
        <div>
          <h1 className="text-white font-semibold">{quiz.title}</h1>
          <p className="text-gray-500 text-sm">{answered}/{quiz.questions.length} answered</p>
        </div>
        <div className="flex items-center gap-6">
          {timeLeft !== null && (
            <div className={clsx(
              'flex items-center gap-1.5 font-mono font-bold text-lg',
              timeLeft < 60 ? 'text-red-400 animate-pulse' : 'text-dolphin-300'
            )}>
              <Clock className="w-5 h-5" />
              {formatTime(timeLeft)}
            </div>
          )}
          <div className="text-gray-500 text-sm border-l border-white/10 pl-6">Q {currentQ + 1}/{quiz.questions.length}</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-white/5 rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-dolphin-600 to-ocean-500 rounded-full transition-all duration-300"
          style={{ width: `${((currentQ + 1) / quiz.questions.length) * 100}%` }}
        />
      </div>

      <div className="flex gap-6 items-start">
        {/* Main question area */}
        <div className="flex-1 min-w-0">
          {/* Question */}
          <div className="glass-card p-6 mb-4">
            <div className="flex items-start gap-3 mb-6">
              <span className="w-8 h-8 rounded-lg bg-purple-600/30 text-purple-300 flex items-center justify-center text-sm font-bold flex-shrink-0">
                {currentQ + 1}
              </span>
              <h2 className="text-white text-lg font-medium leading-relaxed flex-1">{q.text}</h2>
              <button
                type="button"
                onClick={() => toggleFlag(q._id)}
                title={flagged[q._id] ? 'Remove mark' : 'Mark for review'}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 flex-shrink-0',
                  flagged[q._id]
                    ? 'bg-orange-500/20 border-orange-500/50 text-orange-400'
                    : 'bg-white/5 border-white/15 text-gray-500 hover:border-orange-500/40 hover:text-orange-400'
                )}
              >
                <Flag className={clsx('w-3.5 h-3.5', flagged[q._id] && 'fill-orange-400')} />
                {flagged[q._id] ? 'Marked' : 'Mark for Review'}
              </button>
            </div>

            {q.type === 'code-mcq' ? (
              <CodeSnippetDisplay
                question={q}
                selectedIndex={answers[q._id]}
                onSelect={(idx) => handleAnswer(q._id, idx)}
                disabled={submitted}
              />
            ) : (
              <div className="space-y-3">
                {q.options.map((opt, optIdx) => (
                  <button
                    key={optIdx}
                    onClick={() => handleAnswer(q._id, optIdx)}
                    className={clsx(
                      'w-full text-left px-4 py-3.5 rounded-xl border transition-all duration-200 text-sm font-medium',
                      answers[q._id] === optIdx
                        ? 'bg-dolphin-600/25 border-dolphin-500/60 text-dolphin-200'
                        : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20 hover:text-white'
                    )}
                  >
                    <span className={clsx(
                      'inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold mr-3 flex-shrink-0',
                      answers[q._id] === optIdx
                        ? 'bg-dolphin-500 text-white'
                        : 'bg-white/10 text-gray-500'
                    )}>
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
              disabled={currentQ === 0}
              className="btn-secondary flex items-center gap-2 disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            {currentQ < quiz.questions.length - 1 ? (
              <button onClick={() => setCurrentQ(currentQ + 1)} className="btn-primary flex items-center gap-2">
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => {
                  if (answered < quiz.questions.length && !confirm(`You've answered ${answered}/${quiz.questions.length} questions. Submit anyway?`)) return;
                  handleSubmit();
                }}
                disabled={submitting}
                className="btn-primary flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600"
              >
                {submitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Submit Quiz
              </button>
            )}
          </div>
        </div>

        {/* Right sidebar — question navigator */}
        <div className="w-52 flex-shrink-0 sticky top-24 space-y-4">
          <div className="glass-card p-4 border border-white/10">
            <h3 className="text-white text-sm font-semibold mb-3">Questions</h3>

            {/* Grid: 4 per row */}
            <div className="grid grid-cols-4 gap-1.5 mb-4">
              {quiz.questions.map((ques, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentQ(i)}
                  className={clsx(
                    'w-full aspect-square rounded-lg text-xs font-bold transition-all duration-200 relative',
                    i === currentQ
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40 scale-110'
                      : flagged[ques._id]
                        ? 'bg-orange-500/25 text-orange-300 border border-orange-500/40'
                        : answers[ques._id] !== undefined
                          ? 'bg-green-600/40 text-green-300 border border-green-500/30'
                          : 'bg-white/8 text-gray-500 hover:bg-white/15 hover:text-gray-300'
                  )}
                >
                  {i + 1}
                  {flagged[ques._id] && i !== currentQ && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-orange-400 rounded-full" />
                  )}
                </button>
              ))}
            </div>

            {/* Legend */}
            <div className="space-y-1.5 text-xs text-gray-500 border-t border-white/10 pt-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-purple-600 flex-shrink-0" />
                Current
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-green-600/40 border border-green-500/30 flex-shrink-0" />
                Answered
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-orange-500/25 border border-orange-500/40 flex-shrink-0" />
                Marked for review
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-white/8 flex-shrink-0" />
                Not answered
              </div>
            </div>

            {/* Submit button */}
            <button
              onClick={() => {
                if (answered < quiz.questions.length && !confirm(`You've answered ${answered}/${quiz.questions.length} questions. Submit anyway?`)) return;
                handleSubmit();
              }}
              disabled={submitting}
              className="w-full btn-primary text-xs py-2.5 flex items-center justify-center gap-1.5 bg-gradient-to-r from-green-600 to-emerald-600"
            >
              {submitting ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
              Submit Quiz
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
