import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { BookOpen, Plus, Settings, Trash2, Edit3, Globe, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CourseManagementPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const { data } = await api.get('/courses/manage/all');
      if (data.success) {
        setCourses(data.courses);
      }
    } catch (err) {
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const deleteCourse = async (id) => {
    if (!window.confirm('Are you sure you want to delete this course? All enrollments will be lost.')) return;
    try {
      const { data } = await api.delete(`/courses/${id}`);
      if (data.success) {
        toast.success('Course deleted');
        setCourses(courses.filter(c => c.id !== id));
      }
    } catch (err) {
      toast.error('Failed to delete course');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <Settings className="w-8 h-8 text-indigo-400" />
            Manage Courses
          </h1>
          <p className="text-gray-400 mt-2">Create and edit your course offerings.</p>
        </div>
        
        <button onClick={() => navigate('/courses/new')} className="btn-primary flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Create New Course
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="skeleton h-24 rounded-xl" />)}
        </div>
      ) : courses.length === 0 ? (
        <div className="glass-card p-12 text-center border border-white/5">
          <BookOpen className="w-16 h-16 text-gray-700 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No courses found</h3>
          <p className="text-gray-500 mb-6">You haven't created any courses yet.</p>
          <button onClick={() => navigate('/courses/new')} className="btn-primary inline-flex">
            Create your first course
          </button>
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-sm text-gray-400">
                <th className="p-4 font-semibold">Course Details</th>
                <th className="p-4 font-semibold">Price</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {courses.map(course => (
                <tr key={course.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-16 h-12 bg-gray-800 rounded-lg flex-shrink-0 bg-cover bg-center"
                        style={course.thumbnailUrl ? { backgroundImage: `url(${course.thumbnailUrl})` } : {}}
                      >
                        {!course.thumbnailUrl && <BookOpen className="w-6 h-6 text-gray-700 m-auto mt-3" />}
                      </div>
                      <div>
                        <Link to={`/courses/${course.id}`} className="font-bold text-white hover:text-indigo-400 line-clamp-1">
                          {course.title}
                        </Link>
                        <p className="text-xs text-gray-500 mt-1">Created: {new Date(course.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-white font-medium">
                    ${Number(course.price).toFixed(2)}
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                      course.isPublished 
                        ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                        : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                    }`}>
                      {course.isPublished ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                      {course.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button onClick={() => navigate(`/courses/${course.id}/edit`)} className="p-2 text-gray-400 hover:text-indigo-400 hover:bg-white/5 rounded-lg transition-colors inline-flex">
                      <Edit3 className="w-5 h-5" />
                    </button>
                    <button onClick={() => deleteCourse(course.id)} className="p-2 text-gray-400 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors inline-flex">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
