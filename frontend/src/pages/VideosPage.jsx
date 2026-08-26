import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { Video, Search, Plus, Eye, Play, X, Clock } from 'lucide-react';
import EmptyState from '../components/common/EmptyState';
import { GridSkeleton } from '../components/common/Loader';

function formatViews(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n;
}

export default function VideosPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 12, page };
      if (search) params.q = search;
      const { data } = await api.get('/videos', { params });
      setVideos(data.videos);
      setPagination(data.pagination);
    } catch {
      toast.error('Failed to load videos');
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => { fetchVideos(); }, [fetchVideos]);

  const handleSearch = (e) => { e.preventDefault(); setPage(1); setSearch(searchInput); };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Video className="w-8 h-8 text-red-400" />
            Video Library
          </h1>
          <p className="text-gray-500 mt-1">
            {pagination?.total || 0} videos • YouTube embedded
          </p>
        </div>
        {(user?.role === 'trainer' || user?.role === 'admin') && (
          <Link to="/videos/new" className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Video
          </Link>
        )}
      </div>

      <div className="glass-card p-4 mb-6">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input value={searchInput} onChange={e => setSearchInput(e.target.value)} className="input-field pl-11" placeholder="Search videos..." />
          </div>
          {search && (
            <button type="button" onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }} className="btn-icon">
              <X className="w-4 h-4" />
            </button>
          )}
          <button type="submit" className="btn-primary px-5">Search</button>
        </form>
      </div>

      {loading ? (
        <GridSkeleton />
      ) : videos.length === 0 ? (
        <EmptyState
          icon="🎬"
          title="No videos yet"
          description={(user?.role === 'trainer' || user?.role === 'admin') ? 'Add your first YouTube video.' : 'No videos have been added yet.'}
          action={(user?.role === 'trainer' || user?.role === 'admin') ? (
            <Link to="/videos/new" className="btn-primary inline-flex items-center gap-2"><Plus className="w-4 h-4" />Add Video</Link>
          ) : null}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {videos.map(video => (
              <div
                key={video._id}
                onClick={() => navigate(`/videos/${video._id}`)}
                className="glass-card overflow-hidden hover:scale-[1.02] transition-all duration-300 cursor-pointer group border border-white/5 hover:border-red-500/20"
              >
                <div className="relative aspect-video overflow-hidden bg-gray-900">
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={e => { e.target.style.display='none'; }}
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  {/* Play button */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-14 h-14 rounded-full bg-red-600/90 flex items-center justify-center shadow-2xl backdrop-blur-sm scale-90 group-hover:scale-100 transition-transform duration-300">
                      <Play className="w-6 h-6 text-white fill-white ml-0.5" />
                    </div>
                  </div>
                  {/* View count overlay */}
                  <div className="absolute bottom-2 right-2 flex items-center gap-1 text-white/80 text-xs bg-black/50 px-2 py-0.5 rounded-full backdrop-blur-sm">
                    <Eye className="w-3 h-3" />
                    {formatViews(video.viewCount)}
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="text-white font-semibold text-sm line-clamp-2 group-hover:text-red-300 transition-colors mb-1.5 leading-snug">
                    {video.title}
                  </h3>
                  {video.description && (
                    <p className="text-gray-600 text-xs line-clamp-2 mb-2">{video.description}</p>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>{video.addedBy?.name}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(video.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  {video.tags?.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {video.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="badge bg-red-500/10 text-red-400 border border-red-500/20 text-xs">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary px-4 py-2 text-sm disabled:opacity-30">
                Previous
              </button>
              <span className="text-gray-500 text-sm">{page} of {pagination.pages}</span>
              <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} className="btn-secondary px-4 py-2 text-sm disabled:opacity-30">
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
