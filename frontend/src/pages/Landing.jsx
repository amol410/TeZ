import { Link } from 'react-router-dom';
import { BookOpen, Video, Brain, Layers, ArrowRight, Zap, Star, Users } from 'lucide-react';

const features = [
  {
    icon: BookOpen,
    title: 'Smart Notes',
    description: 'Rich text editor with tags, colors, and instant search to organize your knowledge.',
    gradient: 'from-blue-500 to-cyan-500',
    bg: 'bg-blue-500/10',
  },
  {
    icon: Video,
    title: 'Video Library',
    description: 'Embed and organize YouTube videos in one central learning hub.',
    gradient: 'from-red-500 to-orange-500',
    bg: 'bg-red-500/10',
  },
  {
    icon: Brain,
    title: 'Interactive Quizzes',
    description: 'Auto-graded quizzes with instant feedback and detailed explanations.',
    gradient: 'from-purple-500 to-pink-500',
    bg: 'bg-purple-500/10',
  },
  {
    icon: Layers,
    title: 'Flashcard Decks',
    description: 'Flip cards with self-rating to master any topic using spaced repetition.',
    gradient: 'from-green-500 to-emerald-500',
    bg: 'bg-green-500/10',
  },
];

const stats = [
  { value: '10K+', label: 'Students', icon: Users },
  { value: '500+', label: 'Quizzes', icon: Brain },
  { value: '4.9', label: 'Rating', icon: Star },
  { value: '99%', label: 'Uptime', icon: Zap },
];

export default function Landing() {
  return (
    <div className="min-h-screen overflow-hidden">
      {/* Animated background orbs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-dolphin-600/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-ocean-600/8 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-purple-600/6 rounded-full blur-3xl animate-float" style={{ animationDelay: '3s' }}></div>
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between max-w-7xl mx-auto px-6 pt-8 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-dolphin-500 to-ocean-500 flex items-center justify-center shadow-lg shadow-dolphin-900/40">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-white font-bold text-lg leading-none block">TezSend</span>
            <span className="text-gray-500 text-xs">Learning Management System</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="btn-secondary px-4 py-2 text-sm">Sign In</Link>
          <Link to="/register" className="btn-primary px-4 py-2 text-sm">Get Started</Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border border-dolphin-500/30 text-dolphin-300 text-sm font-medium mb-8 animate-fade-in">
          <Zap className="w-4 h-4" />
          Powered by TezSend
        </div>

        <h1 className="text-6xl md:text-7xl font-black text-white mb-6 leading-tight animate-slide-up text-balance">
          Learn Smarter,
          <br />
          <span className="gradient-text">Not Harder</span>
        </h1>

        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in" style={{ animationDelay: '0.1s' }}>
          The all-in-one learning platform for modern students and educators.
          Notes, videos, quizzes, and flashcards — all in one place.
        </p>

        <div className="flex items-center justify-center gap-4 flex-wrap animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <Link to="/register" className="btn-primary flex items-center gap-2 text-base px-8 py-4">
            Start Learning Free
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link to="/login" className="btn-secondary flex items-center gap-2 text-base px-8 py-4">
            Sign In
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto mt-16">
          {stats.map(({ value, label, icon: Icon }) => (
            <div key={label} className="glass-card p-4 text-center rounded-xl">
              <Icon className="w-5 h-5 text-dolphin-400 mx-auto mb-1" />
              <div className="text-2xl font-bold text-white">{value}</div>
              <div className="text-gray-500 text-xs">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-bold text-white mb-4">Everything You Need to Learn</h2>
          <p className="text-gray-400 max-w-xl mx-auto">Four powerful tools, one unified platform. Built for serious learners.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map(({ icon: Icon, title, description, gradient, bg }) => (
            <div key={title} className="glass-card-hover p-6 group">
              <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-20">
        <div className="gradient-border glass-card p-12 text-center rounded-3xl">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to Dive In?</h2>
          <p className="text-gray-400 mb-8 text-lg">Join thousands of learners on TezSend LMS today.</p>
          <Link to="/register" className="btn-primary inline-flex items-center gap-2 text-base px-10 py-4">
            Create Free Account
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <footer className="relative z-10 text-center pb-8 text-gray-600 text-sm">
        © 2024 TezSend LMS — tezsend.com
      </footer>
    </div>
  );
}
