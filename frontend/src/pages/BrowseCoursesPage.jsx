import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useCart } from '../contexts/CartContext';
import { BookOpen, Search, ArrowRight, ShoppingCart, Check, Star } from 'lucide-react';

export default function BrowseCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { cart, addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const { data } = await api.get('/courses');
      if (data.success) {
        setCourses(data.courses);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter(c => 
    c.title.toLowerCase().includes(search.toLowerCase()) || 
    c.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            Explore Courses
          </h1>
          <p className="text-gray-400 mt-2">Discover new topics and advance your skills.</p>
        </div>

        <div className="relative">
          <Search className="w-5 h-5 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10 w-full md:w-64 bg-white/5"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="skeleton h-72 rounded-2xl" />)}
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <BookOpen className="w-12 h-12 text-gray-700 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No courses found</h3>
          <p className="text-gray-500">Check back later for new content!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCourses.map((course) => {
            const inCart = cart.find(c => c.id === course.id);
            
            return (
              <div key={course.id} className="glass-card flex flex-col group overflow-hidden border border-white/5 hover:border-white/10 transition-all duration-300 hover:scale-[1.02]">
                <div 
                  className="h-40 bg-gray-800 relative bg-cover bg-center cursor-pointer"
                  style={course.thumbnailUrl ? { backgroundImage: `url(${course.thumbnailUrl})` } : {}}
                  onClick={() => navigate(`/courses/${course.id}`)}
                >
                  {!course.thumbnailUrl && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-gray-700" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
                    <span className="text-white font-bold">${Number(course.price).toFixed(2)}</span>
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="text-lg font-bold text-white mb-1 line-clamp-2 leading-tight group-hover:text-indigo-400 transition-colors cursor-pointer" onClick={() => navigate(`/courses/${course.id}`)}>
                    {course.title}
                  </h3>
                  <p className="text-gray-500 text-xs mb-3 flex items-center gap-1">
                    By <span className="text-gray-400 font-medium">{course.instructorName}</span>
                  </p>
                  
                  <div className="flex items-center gap-1 mb-4 text-yellow-500 text-xs font-medium">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <Star className="w-3.5 h-3.5 text-gray-600" />
                    <span className="text-gray-500 ml-1">(4.0)</span>
                  </div>

                  <div className="mt-auto pt-4 border-t border-white/5 flex gap-2">
                    {course.hasAccess ? (
                      <button
                        onClick={() => navigate(`/courses/${course.id}/learn`)}
                        className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold transition-all duration-200 bg-indigo-500 hover:bg-indigo-600 text-white"
                      >
                        Go to Course
                      </button>
                    ) : (
                      <button
                        onClick={() => inCart ? navigate('/cart') : addToCart(course)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                          inCart 
                            ? 'bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20' 
                            : 'bg-white text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        {inCart ? <><Check className="w-4 h-4" /> In Cart</> : <><ShoppingCart className="w-4 h-4" /> Add to Cart</>}
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
