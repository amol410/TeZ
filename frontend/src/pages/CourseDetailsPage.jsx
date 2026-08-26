import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useCart } from '../contexts/CartContext';
import { BookOpen, Video, FileText, Layers, Brain, Check, ShoppingCart, Lock, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CourseDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { cart, addToCart } = useCart();
  
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourseDetails();
  }, [id]);

  const fetchCourseDetails = async () => {
    try {
      const { data } = await api.get(`/courses/${id}`);
      if (data.success) {
        setCourse(data.course);
      }
    } catch (err) {
      toast.error('Failed to load course details');
      navigate('/courses');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="skeleton h-64 rounded-2xl mb-8" />
        <div className="skeleton h-12 w-1/3 mb-4 rounded-lg" />
        <div className="skeleton h-4 w-2/3 mb-8 rounded" />
      </div>
    );
  }

  if (!course) return null;

  const inCart = cart.find(c => c.id === course.id);
  
  // Icon mapping
  const ItemIcon = ({ type, className }) => {
    switch (type) {
      case 'video': return <Video className={className} />;
      case 'note': return <FileText className={className} />;
      case 'flashcard': return <Layers className={className} />;
      case 'quiz': return <Brain className={className} />;
      default: return <BookOpen className={className} />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <button onClick={() => navigate('/courses')} className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 mb-6 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to courses
      </button>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white mb-4">{course.title}</h1>
            <p className="text-gray-400 text-lg leading-relaxed whitespace-pre-wrap">{course.description}</p>
            <div className="mt-6 flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4" /> Instructor: <span className="text-white">{course.instructorName}</span></span>
            </div>
          </div>

          {/* Curriculum */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold text-white mb-6">Course Curriculum</h2>
            
            {course.modules && course.modules.length > 0 ? (
              <div className="space-y-4">
                {course.modules.map((mod, index) => (
                  <div key={mod.id} className="border border-white/10 rounded-xl overflow-hidden">
                    <div className="bg-white/5 px-5 py-4 border-b border-white/10">
                      <h3 className="font-semibold text-white">Section {index + 1}: {mod.title}</h3>
                    </div>
                    <div className="divide-y divide-white/5">
                      {mod.items && mod.items.length > 0 ? mod.items.map((item, i) => (
                        <div key={item.id} className="px-5 py-3 flex items-center justify-between hover:bg-white/5 transition-colors">
                          <div className="flex items-center gap-3">
                            <ItemIcon type={item.itemType} className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-300">
                              {item.details ? item.details.title : `Lesson ${i + 1} (${item.itemType})`}
                            </span>
                          </div>
                          {!course.hasAccess && <Lock className="w-4 h-4 text-gray-600" />}
                        </div>
                      )) : (
                        <div className="px-5 py-3 text-sm text-gray-500 italic">No lessons added yet.</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Curriculum is being prepared.</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="glass-card border border-white/10 overflow-hidden sticky top-28">
            <div 
              className="h-48 bg-gray-800 bg-cover bg-center"
              style={course.thumbnailUrl ? { backgroundImage: `url(${course.thumbnailUrl})` } : {}}
            >
              {!course.thumbnailUrl && (
                <div className="flex h-full items-center justify-center">
                  <BookOpen className="w-16 h-16 text-gray-700" />
                </div>
              )}
            </div>
            
            <div className="p-6">
              <div className="text-3xl font-black text-white mb-6">
                ${Number(course.price).toFixed(2)}
              </div>

              {course.hasAccess ? (
                <button
                  onClick={() => navigate(`/courses/${course.id}/learn`)}
                  className="btn-primary w-full flex justify-center py-3 text-base"
                >
                  Go to Course
                </button>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={() => inCart ? navigate('/cart') : addToCart(course)}
                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-base font-bold transition-all duration-200 ${
                      inCart 
                        ? 'bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20' 
                        : 'bg-white text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {inCart ? <><Check className="w-5 h-5" /> In Cart</> : <><ShoppingCart className="w-5 h-5" /> Add to Cart</>}
                  </button>
                </div>
              )}

              <div className="mt-6 space-y-3 text-sm text-gray-400">
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> Full lifetime access</div>
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> Access on mobile and TV</div>
                <div className="flex items-center gap-2"><Check className="w-4 h-4 text-green-400" /> Certificate of completion</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
