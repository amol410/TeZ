import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api/axios';
import {
  BookOpen, Video, Brain, Layers, ArrowRight, TrendingUp,
  Clock, Plus, Zap, Flame,
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ notes: 0, videos: 0, quizzes: 0, flashcards: 0 });
  const [recentItems, setRecentItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const isStaff = user?.role === 'trainer' || user?.role === 'admin';

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const fetchPromises = isStaff ? [
          api.get('/notes?limit=3'),
          api.get('/videos?limit=1'),
          api.get('/quizzes?limit=1'),
          api.get('/flashcards?limit=1'),
        ] : [
          api.get('/courses/my'),
          api.get('/videos?limit=1'),
          api.get('/quizzes?limit=1'),
          api.get('/flashcards?limit=1'),
        ];

        const [itemRes, videosRes, quizzesRes, flashcardsRes] = await Promise.allSettled(fetchPromises);
        
        if (itemRes.status === 'fulfilled') {
          if (isStaff) {
            setStats(prev => ({ ...prev, notes: itemRes.value.data.pagination?.total || 0 }));
            setRecentItems(itemRes.value.data.notes || []);
          } else {
            setStats(prev => ({ ...prev, notes: itemRes.value.data.courses?.length || 0 }));
            setRecentItems(itemRes.value.data.courses?.slice(0, 3) || []);
          }
        }
        if (videosRes.status === 'fulfilled') setStats(prev => ({ ...prev, videos: videosRes.value.data.pagination?.total || 0 }));
        if (quizzesRes.status === 'fulfilled') setStats(prev => ({ ...prev, quizzes: quizzesRes.value.data.pagination?.total || 0 }));
        if (flashcardsRes.status === 'fulfilled') setStats(prev => ({ ...prev, flashcards: flashcardsRes.value.data.pagination?.total || 0 }));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [isStaff]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const statCards = isStaff ? [
    { to: '/courses/manage', icon: BookOpen, label: 'Manage Courses', value: stats.notes || 0, gradient: 'from-blue-500 to-indigo-500', shadow: 'shadow-blue-900/20', border: 'border-blue-500/20', action: '/courses/new' },
    { to: '/videos', icon: Video, label: 'Total Videos', value: stats.videos || 0, gradient: 'from-red-500 to-pink-500', shadow: 'shadow-red-900/20', border: 'border-red-500/20', action: '/videos/new' },
    { to: '/quizzes', icon: Brain, label: 'Active Quizzes', value: stats.quizzes || 0, gradient: 'from-purple-500 to-fuchsia-500', shadow: 'shadow-purple-900/20', border: 'border-purple-500/20', action: '/quizzes/new' },
    { to: '/flashcards', icon: Layers, label: 'Flashcard Decks', value: stats.flashcards || 0, gradient: 'from-green-500 to-emerald-500', shadow: 'shadow-green-900/20', border: 'border-green-500/20', action: '/flashcards/new' },
  ] : [
    { to: '/courses/my', icon: BookOpen, label: 'My Courses', value: stats.notes || 0, gradient: 'from-blue-500 to-indigo-500', shadow: 'shadow-blue-900/20', border: 'border-blue-500/20' },
    { to: '/videos', icon: Video, label: 'Saved Videos', value: stats.videos || 0, gradient: 'from-red-500 to-pink-500', shadow: 'shadow-red-900/20', border: 'border-red-500/20' },
    { to: '/quizzes', icon: Brain, label: 'Quizzes Taken', value: stats.quizzes || 0, gradient: 'from-purple-500 to-fuchsia-500', shadow: 'shadow-purple-900/20', border: 'border-purple-500/20' },
    { to: '/flashcards', icon: Layers, label: 'Decks Mastered', value: stats.flashcards || 0, gradient: 'from-green-500 to-emerald-500', shadow: 'shadow-green-900/20', border: 'border-green-500/20' },
  ];

  const quickActions = isStaff
    ? [
        { to: '/courses/new', icon: BookOpen, label: 'Build Course', desc: 'Create a new course', color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
        { to: '/notes/new', icon: BookOpen, label: 'Write a Note', desc: 'Create study material', color: 'text-blue-400', bg: 'bg-blue-500/10' },
        { to: '/videos/new', icon: Video, label: 'Add Video', desc: 'Embed YouTube', color: 'text-red-400', bg: 'bg-red-500/10' },
        { to: '/quizzes/new', icon: Brain, label: 'New Quiz', desc: 'Create a quiz', color: 'text-purple-400', bg: 'bg-purple-500/10' },
      ]
    : [
        { to: '/courses', icon: BookOpen, label: 'Browse Courses', desc: 'Find new courses', color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
        { to: '/quizzes', icon: Brain, label: 'Take a Quiz', desc: 'Test yourself', color: 'text-purple-400', bg: 'bg-purple-500/10' },
        { to: '/videos', icon: Video, label: 'Watch Videos', desc: 'Learn from videos', color: 'text-red-400', bg: 'bg-red-500/10' },
        { to: '/flashcards', icon: Layers, label: 'Study Flashcards', desc: 'Spaced repetition', color: 'text-green-400', bg: 'bg-green-500/10' },
      ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      {/* Hero greeting */}
      <div className="glass-card p-6 mb-8 bg-gradient-to-r from-dolphin-600/10 to-ocean-600/10 border border-dolphin-500/20 gradient-border">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-dolphin-500 to-ocean-500 flex items-center justify-center text-white text-2xl font-black shadow-xl shadow-dolphin-900/40 flex-shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="text-gray-400 text-sm mb-1">{greeting} 👋</p>
            <h1 className="text-3xl font-black text-white">
              Welcome back, <span className="gradient-text">{user?.name?.split(' ')[0]}!</span>
            </h1>
            <p className="text-gray-500 text-sm mt-1 capitalize flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-dolphin-500" />
              {user?.role} • TezSend LMS
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2 text-orange-400">
            <Flame className="w-5 h-5" />
            <span className="text-sm font-semibold">Keep learning!</span>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(({ to, icon: Icon, label, value, gradient, shadow, border, action }) => (
          <div key={to} className={`glass-card p-5 border ${border} hover:scale-[1.03] transition-all duration-300 group`}>
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg ${shadow}`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              {action && (
                <Link to={action} className="w-7 h-7 rounded-lg bg-white/8 flex items-center justify-center hover:bg-white/15 transition-colors" title="Create new">
                  <Plus className="w-3.5 h-3.5 text-gray-400" />
                </Link>
              )}
            </div>
            <Link to={to}>
              <div className="text-3xl font-black text-white mb-0.5">{loading ? '—' : value}</div>
              <div className="text-gray-500 text-sm group-hover:text-gray-400 transition-colors">{label}</div>
            </Link>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-dolphin-400" />
            Quick Actions
          </h2>
          <div className="space-y-2">
            {quickActions.map(({ to, icon: Icon, label, desc, color, bg }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/8 transition-all duration-200 group"
              >
                <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium group-hover:text-dolphin-300 transition-colors">{label}</p>
                  <p className="text-gray-600 text-xs">{desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-700 group-hover:text-gray-400 transition-colors flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Items Panel */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-dolphin-400" />
              {isStaff ? 'Recent Notes' : 'My Courses'}
            </h2>
            <Link to={isStaff ? "/notes" : "/courses/my"} className="text-sm text-dolphin-400 hover:text-dolphin-300 transition-colors flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}
            </div>
          ) : recentItems.length === 0 ? (
            <div className="text-center py-10">
              <BookOpen className="w-12 h-12 text-gray-800 mx-auto mb-3" />
              <p className="text-gray-600 text-sm mb-4">
                {isStaff ? 'No notes yet' : 'Not enrolled in any courses yet'}
              </p>
              {isStaff ? (
                <Link to="/notes/new" className="btn-primary inline-flex items-center gap-2 text-sm px-4 py-2">
                  <Plus className="w-3.5 h-3.5" />
                  Create First Note
                </Link>
              ) : (
                <Link to="/courses" className="btn-primary inline-flex items-center gap-2 text-sm px-4 py-2">
                  Browse Courses
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {recentItems.map(item => {
                if (isStaff) {
                  // Rendering a Note
                  const colorAccent = {
                    default: 'bg-gray-500', blue: 'bg-blue-500', green: 'bg-green-500',
                    yellow: 'bg-yellow-500', pink: 'bg-pink-500', purple: 'bg-purple-500',
                  }[item.color] || 'bg-gray-500';

                  return (
                    <Link
                      key={item._id || item.id}
                      to={`/notes/${item._id || item.id}`}
                      className="flex items-center gap-3 p-3.5 rounded-xl hover:bg-white/8 transition-all duration-200 group"
                    >
                      <div className={`w-1 h-10 rounded-full flex-shrink-0 ${colorAccent}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium group-hover:text-dolphin-300 transition-colors truncate">{item.title}</p>
                        <p className="text-gray-600 text-xs mt-0.5">
                          {new Date(item.updatedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                      {item.tags?.length > 0 && (
                        <span className="badge bg-white/8 text-gray-500 border border-white/8 text-xs hidden sm:inline-flex">
                          {item.tags[0]}
                        </span>
                      )}
                      <ArrowRight className="w-4 h-4 text-gray-700 group-hover:text-gray-400 flex-shrink-0" />
                    </Link>
                  );
                } else {
                  // Rendering a Course
                  return (
                    <Link
                      key={item._id || item.id}
                      to={`/courses/${item._id || item.id}/learn`}
                      className="flex items-center gap-3 p-3.5 rounded-xl hover:bg-white/8 transition-all duration-200 group border border-white/5 bg-black/20"
                    >
                      {item.thumbnailUrl ? (
                        <img src={item.thumbnailUrl} alt={item.title} className="w-16 h-10 object-cover rounded-md" />
                      ) : (
                        <div className="w-16 h-10 bg-indigo-500/20 rounded-md flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-indigo-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium group-hover:text-dolphin-300 transition-colors truncate">{item.title}</p>
                        <p className="text-gray-500 text-xs mt-0.5 truncate">
                          By {item.instructorName}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-indigo-400 px-2 py-1 rounded bg-indigo-400/10">Start</span>
                    </Link>
                  );
                }
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
