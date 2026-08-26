import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { BookOpen, PlayCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MyCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyCourses();
  }, []);

  const fetchMyCourses = async () => {
    try {
      const { data } = await api.get('/courses/my');
      if (data.success) {
        setCourses(data.courses);
      }
    } catch (err) {
      toast.error('Failed to load your courses');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white flex items-center gap-3">
          My Learning
        </h1>
        <p className="text-gray-400 mt-2">Jump back in and continue your journey.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="skeleton h-64 rounded-2xl" />)}
        </div>
      ) : courses.length === 0 ? (
        <div className="glass-card p-12 text-center border border-white/5">
          <BookOpen className="w-16 h-16 text-gray-700 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No enrolled courses</h3>
          <p className="text-gray-500 mb-6">You haven't purchased or enrolled in any courses yet.</p>
          <button onClick={() => navigate('/courses')} className="btn-primary inline-flex">
            Browse Courses
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div key={course.id} className="glass-card flex flex-col group overflow-hidden border border-white/5 hover:border-white/10 transition-all duration-300 hover:scale-[1.02] cursor-pointer" onClick={() => navigate(`/courses/${course.id}/learn`)}>
              <div 
                className="h-40 bg-gray-800 relative bg-cover bg-center"
                style={course.thumbnailUrl ? { backgroundImage: `url(${course.thumbnailUrl})` } : {}}
              >
                {!course.thumbnailUrl && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <BookOpen className="w-12 h-12 text-gray-700" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                    <PlayCircle className="w-6 h-6" />
                  </div>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-lg font-bold text-white mb-1 line-clamp-2 leading-tight group-hover:text-indigo-400 transition-colors">
                  {course.title}
                </h3>
                <p className="text-gray-500 text-xs mb-4">
                  By {course.instructorName}
                </p>
                
                <div className="mt-auto pt-4 border-t border-white/5">
                  <div className="w-full bg-gray-800 rounded-full h-1.5 mb-2 overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full" style={{ width: '0%' }}></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>0% complete</span>
                    <span>Start Learning</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
