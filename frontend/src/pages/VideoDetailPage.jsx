import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import YouTube from 'react-youtube';
import { ArrowLeft, Eye, Trash2, Edit } from 'lucide-react';
import { PageLoader } from '../components/common/Loader';

export default function VideoDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/videos/${id}`)
      .then(({ data }) => { setVideo(data.video); setLoading(false); })
      .catch(() => { toast.error('Video not found'); navigate('/videos'); });
  }, [id, navigate]);

  const handleDelete = async () => {
    if (!confirm('Delete this video?')) return;
    try {
      await api.delete(`/videos/${id}`);
      toast.success('Video deleted');
      navigate('/videos');
    } catch {
      toast.error('Failed to delete');
    }
  };

  if (loading) return <PageLoader />;

  const addedById = video.addedBy?.id ?? video.addedBy?.id ?? video.addedBy;
  const isOwner = (user?.role === 'trainer' || user?.role === 'admin') && addedById == user.id;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <Link to="/videos" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Videos
        </Link>
        {isOwner && (
          <div className="flex items-center gap-2">
            <Link to={`/videos/${id}/edit`} className="btn-secondary px-4 py-2 text-sm flex items-center gap-2">
              <Edit className="w-4 h-4" />
              Edit
            </Link>
            <button onClick={handleDelete} className="btn-danger">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Player */}
      <div className="glass-card overflow-hidden mb-6">
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <div className="absolute inset-0">
            <YouTube
              videoId={video.youtubeVideoId}
              opts={{
                width: '100%',
                height: '100%',
                playerVars: { autoplay: 0, rel: 0, modestbranding: 1 },
              }}
              className="w-full h-full"
              iframeClassName="w-full h-full"
            />
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="glass-card p-6">
        <h1 className="text-2xl font-bold text-white mb-2">{video.title}</h1>
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
          <span className="flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" />
            {video.viewCount} views
          </span>
          <span>Added by {video.addedBy?.name}</span>
          <span>{new Date(video.createdAt).toLocaleDateString()}</span>
        </div>
        {video.description && (
          <p className="text-gray-400 leading-relaxed">{video.description}</p>
        )}
        {video.tags?.length > 0 && (
          <div className="flex gap-2 mt-4 flex-wrap">
            {video.tags.map(tag => (
              <span key={tag} className="badge badge-blue">{tag}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
