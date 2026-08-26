import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { BookOpen, Plus, Save, ArrowLeft, Trash2, Video, FileText, Brain, Layers, Edit3 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CourseBuilderPage() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [course, setCourse] = useState({ title: '', description: '', price: 0, thumbnailUrl: '', isPublished: false });
  const [modules, setModules] = useState([]);
  
  // Resources for dropdowns
  const [resources, setResources] = useState({ videos: [], notes: [], quizzes: [], flashcards: [] });

  useEffect(() => {
    if (isEditing) {
      fetchCourse();
    }
    fetchResources();
  }, [id]);

  const fetchCourse = async () => {
    try {
      const { data } = await api.get(`/courses/${id}`);
      if (data.success) {
        setCourse(data.course);
        setModules(data.course.modules || []);
      }
    } catch (err) {
      toast.error('Failed to load course');
      navigate('/courses/manage');
    } finally {
      setLoading(false);
    }
  };

  const fetchResources = async () => {
    try {
      // In a real app we would paginate or search. Here we fetch all for simplicity.
      const [vRes, nRes, qRes, fRes] = await Promise.all([
        api.get('/videos'),
        api.get('/notes'),
        api.get('/quizzes'),
        api.get('/flashcards')
      ]);
      setResources({
        videos: vRes.data.success ? (vRes.data.videos || []) : [],
        notes: nRes.data.success ? (nRes.data.notes || []) : [],
        quizzes: qRes.data.success ? (qRes.data.quizzes || []) : [],
        flashcards: fRes.data.success ? (fRes.data.flashcards || fRes.data.decks || []) : []
      });
    } catch (err) {
      console.error('Failed to load resources');
    }
  };

  const handleSaveCourse = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEditing) {
        await api.put(`/courses/${id}`, course);
        toast.success('Course updated');
      } else {
        const { data } = await api.post('/courses', course);
        toast.success('Course created');
        navigate(`/courses/${data.courseId}/edit`);
      }
    } catch (err) {
      toast.error('Failed to save course');
    } finally {
      setSaving(false);
    }
  };

  const addModule = async () => {
    const title = prompt('Enter module title:');
    if (!title) return;
    try {
      const { data } = await api.post(`/courses/${id}/modules`, { title, orderIndex: modules.length });
      if (data.success) {
        setModules([...modules, { id: data.moduleId, title, items: [] }]);
        toast.success('Module added');
      }
    } catch (err) {
      toast.error('Failed to add module');
    }
  };

  const addItemToModule = async (moduleId, itemType, itemId) => {
    try {
      const modIndex = modules.findIndex(m => m.id === moduleId);
      const { data } = await api.post(`/courses/${id}/modules/${moduleId}/items`, { 
        itemType, 
        itemId, 
        orderIndex: modules[modIndex].items.length 
      });
      
      if (data.success) {
        // Find details for local state update
        let details = null;
        if (itemType === 'video') details = resources.videos.find(v => v.id == itemId);
        if (itemType === 'note') details = resources.notes.find(n => n.id == itemId);
        if (itemType === 'quiz') details = resources.quizzes.find(q => q.id == itemId);
        if (itemType === 'flashcard') details = resources.flashcards.find(f => f.id == itemId);

        const newModules = [...modules];
        newModules[modIndex].items.push({ id: data.itemId, itemType, itemId, details });
        setModules(newModules);
        toast.success('Item added');
      }
    } catch (err) {
      toast.error('Failed to add item');
    }
  };

  const deleteModule = async (moduleId) => {
    if (!window.confirm('Are you sure you want to delete this section?')) return;
    try {
      const { data } = await api.delete(`/courses/${id}/modules/${moduleId}`);
      if (data.success) {
        setModules(modules.filter(m => m.id !== moduleId));
        toast.success('Section deleted');
      }
    } catch (err) {
      toast.error('Failed to delete section');
    }
  };

  const deleteItemFromModule = async (moduleId, itemId) => {
    if (!window.confirm('Are you sure you want to remove this item?')) return;
    try {
      const { data } = await api.delete(`/courses/${id}/modules/${moduleId}/items/${itemId}`);
      if (data.success) {
        const newModules = [...modules];
        const modIndex = newModules.findIndex(m => m.id === moduleId);
        newModules[modIndex].items = newModules[modIndex].items.filter(i => i.id !== itemId);
        setModules(newModules);
        toast.success('Item removed');
      }
    } catch (err) {
      toast.error('Failed to remove item');
    }
  };

  const getItemEditLink = (itemType, itemId) => {
    switch (itemType) {
      case 'video': return `/videos/${itemId}/edit`;
      case 'note': return `/notes/${itemId}/edit`;
      case 'quiz': return `/quizzes/${itemId}/edit`;
      case 'flashcard': return `/flashcards/${itemId}/edit`;
      default: return '#';
    }
  };

  if (loading) return <div className="p-8 text-white">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <button onClick={() => navigate('/courses/manage')} className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 mb-6 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to management
      </button>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-black text-white">{isEditing ? 'Edit Course' : 'Create New Course'}</h1>
      </div>

      <form onSubmit={handleSaveCourse} className="glass-card p-6 mb-8 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5 ml-1">Course Title</label>
          <input required type="text" value={course.title} onChange={e => setCourse({...course, title: e.target.value})} className="input-field" placeholder="e.g. Master React in 30 Days" />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5 ml-1">Description</label>
          <textarea required rows="4" value={course.description} onChange={e => setCourse({...course, description: e.target.value})} className="input-field" placeholder="Course details..." />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5 ml-1">Price ($)</label>
            <input required type="number" step="0.01" min="0" value={course.price} onChange={e => setCourse({...course, price: e.target.value})} className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5 ml-1">Thumbnail URL</label>
            <input type="url" value={course.thumbnailUrl} onChange={e => setCourse({...course, thumbnailUrl: e.target.value})} className="input-field" placeholder="https://..." />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <input type="checkbox" id="publish" checked={course.isPublished} onChange={e => setCourse({...course, isPublished: e.target.checked})} className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-gray-900" />
          <label htmlFor="publish" className="text-white font-medium">Publish this course (visible to students)</label>
        </div>

        <div className="pt-4 border-t border-white/10 flex justify-end">
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Details'}
          </button>
        </div>
      </form>

      {isEditing && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Curriculum</h2>
            <button onClick={addModule} className="btn-primary py-2 text-sm flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Section
            </button>
          </div>

          {modules.map((mod, mIndex) => (
            <div key={mod.id} className="glass-card overflow-hidden">
              <div className="bg-white/5 px-5 py-4 border-b border-white/10 flex justify-between items-center">
                <h3 className="font-bold text-white">Section {mIndex + 1}: {mod.title}</h3>
                <button onClick={() => deleteModule(mod.id)} className="text-gray-500 hover:text-red-400 p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <div className="p-5">
                {mod.items?.length > 0 ? (
                  <div className="space-y-2 mb-4">
                    {mod.items.map((item, i) => (
                      <div key={item.id} className="flex items-center gap-3 bg-black/20 p-3 rounded-lg border border-white/5 group">
                        <span className="text-gray-500 text-sm font-medium w-4">{i + 1}.</span>
                        {item.itemType === 'video' && <Video className="w-4 h-4 text-red-400" />}
                        {item.itemType === 'note' && <FileText className="w-4 h-4 text-blue-400" />}
                        {item.itemType === 'quiz' && <Brain className="w-4 h-4 text-purple-400" />}
                        {item.itemType === 'flashcard' && <Layers className="w-4 h-4 text-green-400" />}
                        <span className="text-white flex-1">{item.details?.title || item.details?.deckName || `Unknown ${item.itemType}`}</span>
                        
                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-2 transition-opacity">
                          <button onClick={() => window.open(getItemEditLink(item.itemType, item.itemId), '_blank')} className="p-1.5 text-gray-400 hover:text-indigo-400 hover:bg-white/10 rounded-lg transition-colors" title="Edit Item">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button onClick={() => deleteItemFromModule(mod.id, item.id)} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-white/10 rounded-lg transition-colors" title="Remove from Course">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm mb-4">No lessons in this section yet.</p>
                )}

                {/* Add Item Controls */}
                <div className="flex flex-wrap gap-2 pt-4 border-t border-white/5">
                  <select 
                    className="input-field py-2 text-sm w-auto"
                    onChange={(e) => {
                      if(e.target.value) {
                        addItemToModule(mod.id, 'video', e.target.value);
                        e.target.value = ''; // reset
                      }
                    }}
                  >
                    <option value="">+ Add Video</option>
                    {resources.videos.map(v => <option key={v.id} value={v.id}>{v.title}</option>)}
                  </select>
                  
                  <select 
                    className="input-field py-2 text-sm w-auto"
                    onChange={(e) => {
                      if(e.target.value) {
                        addItemToModule(mod.id, 'note', e.target.value);
                        e.target.value = '';
                      }
                    }}
                  >
                    <option value="">+ Add Note</option>
                    {resources.notes.map(n => <option key={n.id} value={n.id}>{n.title}</option>)}
                  </select>
                  
                  <select 
                    className="input-field py-2 text-sm w-auto"
                    onChange={(e) => {
                      if(e.target.value) {
                        addItemToModule(mod.id, 'quiz', e.target.value);
                        e.target.value = '';
                      }
                    }}
                  >
                    <option value="">+ Add Quiz</option>
                    {resources.quizzes.map(q => <option key={q.id} value={q.id}>{q.title}</option>)}
                  </select>

                  <select 
                    className="input-field py-2 text-sm w-auto"
                    onChange={(e) => {
                      if(e.target.value) {
                        addItemToModule(mod.id, 'flashcard', e.target.value);
                        e.target.value = '';
                      }
                    }}
                  >
                    <option value="">+ Add Flashcard</option>
                    {resources.flashcards.map(f => <option key={f.id} value={f.id}>{f.deckName}</option>)}
                  </select>
                </div>
              </div>
            </div>
          ))}
          
          {modules.length === 0 && (
            <div className="text-center py-8 border border-dashed border-gray-600 rounded-xl">
              <p className="text-gray-400">Save your course details, then add a section to start building your curriculum.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
