import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { BookOpen, Video, FileText, Layers, Brain, ArrowLeft, Menu, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CoursePlayerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeItem, setActiveItem] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    fetchCourse();
  }, [id]);

  const fetchCourse = async () => {
    try {
      const { data } = await api.get(`/courses/${id}`);
      if (data.success) {
        if (!data.course.hasAccess) {
          toast.error('You do not have access to this course');
          navigate(`/courses/${id}`);
          return;
        }
        setCourse(data.course);
        
        // Auto-select first item if exists
        if (data.course.modules?.length > 0) {
          const firstModWithItems = data.course.modules.find(m => m.items?.length > 0);
          if (firstModWithItems) {
            setActiveItem(firstModWithItems.items[0]);
          }
        }
      }
    } catch (err) {
      toast.error('Failed to load course content');
      navigate('/courses/my');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;
  if (!course) return null;

  const ItemIcon = ({ type, className }) => {
    switch (type) {
      case 'video': return <Video className={className} />;
      case 'note': return <FileText className={className} />;
      case 'flashcard': return <Layers className={className} />;
      case 'quiz': return <Brain className={className} />;
      default: return <BookOpen className={className} />;
    }
  };

  const renderContent = () => {
    if (!activeItem) return <div className="text-gray-500 text-center py-20">No content selected</div>;

    switch (activeItem.itemType) {
      case 'video':
        return (
          <div className="w-full aspect-video bg-black rounded-xl overflow-hidden border border-white/10 shadow-2xl">
            <iframe
              src={`https://www.youtube.com/embed/${activeItem.details?.youtubeVideoId}?autoplay=0&rel=0`}
              title="YouTube video player"
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        );
      case 'note':
        return (
          <div className="glass-card p-8 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-6">{activeItem.details?.title}</h2>
            <div className="prose prose-invert max-w-none">
              <Link to={`/notes/${activeItem.itemId}`} className="btn-primary inline-flex items-center gap-2">
                Open Full Note <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        );
      case 'quiz':
        return (
          <div className="glass-card p-12 text-center border border-white/10">
            <Brain className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">{activeItem.details?.title}</h2>
            <p className="text-gray-400 mb-6">Test your knowledge with this quiz.</p>
            <Link to={`/quizzes/${activeItem.itemId}/take`} className="btn-primary inline-flex px-8 py-3 bg-purple-600 hover:bg-purple-700">
              Start Quiz
            </Link>
          </div>
        );
      case 'flashcard':
        return (
          <div className="glass-card p-12 text-center border border-white/10">
            <Layers className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">{activeItem.details?.title}</h2>
            <p className="text-gray-400 mb-6">Practice active recall with flashcards.</p>
            <Link to={`/flashcards/${activeItem.itemId}/study`} className="btn-primary inline-flex px-8 py-3 bg-green-600 hover:bg-green-700">
              Study Flashcards
            </Link>
          </div>
        );
      default:
        return <div className="text-gray-500">Unknown content type</div>;
    }
  };

  return (
    <div className="fixed inset-0 top-16 bg-[#0B0F19] flex overflow-hidden z-40 animate-fade-in pt-4">
      {/* Sidebar Syllabus */}
      <div className={`flex-shrink-0 w-80 bg-gray-900/50 border-r border-white/5 flex flex-col transition-all duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`} style={{ position: sidebarOpen ? 'relative' : 'absolute' }}>
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-white font-bold truncate pr-4">{course.title}</h2>
          <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-white lg:hidden">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar pb-20">
          {course.modules?.map((mod, index) => (
            <div key={mod.id} className="border-b border-white/5">
              <div className="px-4 py-3 bg-white/[0.02]">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Section {index + 1}</h3>
                <p className="text-sm text-gray-200 font-medium mt-1">{mod.title}</p>
              </div>
              
              <div>
                {mod.items?.map((item, i) => {
                  const isActive = activeItem?.id === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveItem(item)}
                      className={`w-full text-left px-4 py-3 flex items-start gap-3 transition-colors ${
                        isActive ? 'bg-indigo-500/10 border-l-2 border-indigo-500' : 'hover:bg-white/5 border-l-2 border-transparent'
                      }`}
                    >
                      <ItemIcon type={item.itemType} className={`w-4 h-4 mt-0.5 ${isActive ? 'text-indigo-400' : 'text-gray-500'}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${isActive ? 'text-white font-medium' : 'text-gray-300'}`}>
                          {item.details ? item.details.title : `Lesson ${i + 1}`}
                        </p>
                      </div>
                    </button>
                  );
                })}
                {(!mod.items || mod.items.length === 0) && (
                  <div className="px-11 py-3 text-xs text-gray-600 italic">No items</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative overflow-y-auto custom-scrollbar">
        <div className="p-4 flex items-center gap-4 bg-[#0B0F19] sticky top-0 z-10 border-b border-white/5">
          {!sidebarOpen && (
            <button onClick={() => setSidebarOpen(true)} className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/5">
              <Menu className="w-5 h-5" />
            </button>
          )}
          <Link to="/courses/my" className="text-sm text-gray-400 hover:text-white transition-colors">My Courses</Link>
          <ChevronRight className="w-3 h-3 text-gray-600" />
          <span className="text-sm text-gray-300 font-medium truncate">{activeItem?.details?.title || 'Learning'}</span>
        </div>
        
        <div className="flex-1 p-4 sm:p-8 max-w-5xl mx-auto w-full">
          {renderContent()}
          
          {activeItem && (
            <div className="mt-8 flex justify-end">
              <button className="btn-primary text-sm px-6">Mark as Complete</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
