import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, Youtube, Tag, X, BookOpen } from 'lucide-react';

export default function VideoFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [form, setForm] = useState({ title: '', description: '', youtubeUrl: '', isPublic: true });
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);

  // Course Selector State
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [modules, setModules] = useState([]);
  const [selectedModuleId, setSelectedModuleId] = useState('');

  useEffect(() => {
    if (!isEdit) {
      api.get('/courses/manage/all').then(res => setCourses(res.data.courses || []));
    }
  }, [isEdit]);

  useEffect(() => {
    if (selectedCourseId) {
      api.get(`/courses/${selectedCourseId}`).then(res => {
        setModules(res.data.course.modules || []);
        setSelectedModuleId('');
      });
    } else {
      setModules([]);
      setSelectedModuleId('');
    }
  }, [selectedCourseId]);

  useEffect(() => {
    if (isEdit) {
      api.get(`/videos/${id}`).then(({ data }) => {
        const v = data.video;
        setForm({ title: v.title, description: v.description, youtubeUrl: v.youtubeUrl, isPublic: v.isPublic });
        setTags(v.tags || []);
      }).catch(() => navigate('/videos'));
    }
  }, [isEdit, id, navigate]);

  const addTag = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      const tag = tagInput.trim().toLowerCase().replace(/,/g, '');
      if (!tags.includes(tag)) setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/videos/${id}`, { ...form, tags });
        toast.success('Video updated!');
      } else {
        await api.post('/videos', { 
          ...form, 
          tags,
          moduleId: selectedModuleId || undefined 
        });
        toast.success('Video added!');
      }
      navigate('/videos');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <button onClick={() => navigate('/videos')} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back to Videos
      </button>

      <div className="glass-card p-8">
        <h1 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <Youtube className="w-7 h-7 text-red-400" />
          {isEdit ? 'Edit Video' : 'Add YouTube Video'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Video Title *</label>
            <input
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              className="input-field"
              placeholder="Enter video title..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">YouTube URL *</label>
            <input
              value={form.youtubeUrl}
              onChange={e => setForm({ ...form, youtubeUrl: e.target.value })}
              className="input-field"
              placeholder="https://www.youtube.com/watch?v=..."
              required
            />
            <p className="text-gray-600 text-xs mt-1">Supports youtube.com/watch, youtu.be, shorts, and embed URLs</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="input-field resize-none"
              rows={4}
              placeholder="Video description (optional)..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Tags</label>
            <div className="input-field flex flex-wrap gap-2 items-center min-h-12">
              {tags.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 badge badge-blue">
                  {tag}
                  <button type="button" onClick={() => setTags(tags.filter(t => t !== tag))}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={addTag}
                placeholder={tags.length === 0 ? "Add tags, press Enter..." : ""}
                className="bg-transparent text-gray-400 text-sm outline-none flex-1 min-w-24 placeholder-gray-700"
              />
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isPublic}
              onChange={e => setForm({ ...form, isPublic: e.target.checked })}
              className="w-4 h-4 rounded accent-dolphin-500"
            />
            <span className="text-gray-300 text-sm">Make this video public</span>
          </label>

          {!isEdit && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 p-5 border border-white/10 rounded-xl bg-black/20">
              <div className="col-span-full mb-1">
                <h3 className="font-semibold text-white flex items-center gap-2"><BookOpen className="w-4 h-4 text-indigo-400" /> Add to Course (Optional)</h3>
                <p className="text-sm text-gray-400">Directly assign this video to a course section upon creation.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5 ml-1">Select Course</label>
                <select value={selectedCourseId} onChange={e => setSelectedCourseId(e.target.value)} className="input-field">
                  <option value="">-- None --</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
              {selectedCourseId && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5 ml-1">Select Section (Module)</label>
                  <select value={selectedModuleId} onChange={e => setSelectedModuleId(e.target.value)} className="input-field" required={!!selectedCourseId}>
                    <option value="">-- Select Section --</option>
                    {modules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                  </select>
                </div>
              )}
            </div>
          )}

          <button type="submit" disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2">
            {saving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isEdit ? 'Update Video' : 'Add Video'}
          </button>
        </form>
      </div>
    </div>
  );
}
