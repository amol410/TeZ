import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import {
  ArrowLeft, Save, Bold, Italic, UnderlineIcon, List, ListOrdered,
  Heading1, Heading2, Code, Quote, Minus, Tag, X, Pin,
  FileText, Code2, Upload, Download,
} from 'lucide-react';
import clsx from 'clsx';
import { useSubjects } from '../hooks/useSubjects';
import { downloadNoteTemplate } from '../utils/downloadTemplateDoc';
import { BookOpen } from 'lucide-react';

const colors = ['default', 'blue', 'green', 'yellow', 'pink', 'purple'];
const colorDots = {
  default: 'bg-gray-500', blue: 'bg-blue-500', green: 'bg-green-500',
  yellow: 'bg-yellow-500', pink: 'bg-pink-500', purple: 'bg-purple-500',
};

function ToolbarBtn({ onClick, active, title, children }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      className={clsx(
        'p-2 rounded-lg text-sm transition-all duration-150',
        active ? 'bg-dolphin-600/40 text-dolphin-300' : 'text-gray-400 hover:text-white hover:bg-white/10'
      )}
    >
      {children}
    </button>
  );
}

export default function NoteEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [mode, setMode] = useState('richtext'); // 'richtext' | 'docx' | 'html'
  const [title, setTitle] = useState('');
  const [color, setColor] = useState('default');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState([]);
  const [isPinned, setIsPinned] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [uploadFile, setUploadFile] = useState(null);
  const [existingContentType, setExistingContentType] = useState('richtext');
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');

  // Course Selector State
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [modules, setModules] = useState([]);
  const [selectedModuleId, setSelectedModuleId] = useState('');

  const { subjects, createSubject, createTopic } = useSubjects();

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

  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: '',
    editorProps: {
      attributes: {
        class: 'ProseMirror focus:outline-none min-h-96 p-4',
        'data-placeholder': 'Start writing your note...',
      },
    },
  });

  useEffect(() => {
    if (isEdit && editor) {
      api.get(`/notes/${id}`).then(({ data }) => {
        const note = data.note;
        setTitle(note.title);
        setSubject(note.subjectId || '');
        setTopic(note.topic || '');
        setColor(note.color || 'default');
        setTags(note.tags || []);
        setIsPinned(note.isPinned || false);
        setExistingContentType(note.contentType || 'richtext');
        // For richtext and docx, load into editor. For html, switch to html mode.
        if (note.contentType === 'html') {
          setMode('html');
        } else {
          setMode('richtext');
          editor.commands.setContent(note.content);
        }
        setLoading(false);
      }).catch(() => {
        toast.error('Failed to load note');
        navigate('/notes');
      });
    }
  }, [isEdit, editor, id, navigate]);

  const addTag = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      const tag = tagInput.trim().toLowerCase().replace(/,/g, '');
      if (!tags.includes(tag)) setTags([...tags, tag]);
      setTagInput('');
    }
  };

  const removeTag = (tag) => setTags(tags.filter(t => t !== tag));

  const handleSubjectChange = async (val) => {
    if (val === 'CREATE_NEW') {
      const name = prompt('Enter new subject name:');
      if (name) {
        const s = await createSubject(name);
        if (s) { setSubject(s.id); setTopic(''); }
      }
    } else {
      setSubject(val);
      setTopic('');
    }
  };

  const handleTopicChange = async (val, subjectId) => {
    if (val === 'CREATE_NEW') {
      const name = prompt('Enter new topic name:');
      if (name) {
        const t = await createTopic(subjectId, name);
        if (t) setTopic(name);
      }
    } else {
      setTopic(val);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) { toast.error('Title is required'); return; }

    setSaving(true);
    try {
      if (mode === 'richtext') {
        const content = editor?.getHTML();
        if (!content || content === '<p></p>') { toast.error('Content is required'); setSaving(false); return; }
        if (isEdit) {
          await api.put(`/notes/${id}`, { title, content, tags, color, isPinned, contentType: 'richtext', subject, topic });
          toast.success('Note updated!');
        } else {
          await api.post('/notes', { title, content, tags, color, isPinned, contentType: 'richtext', subject, topic, moduleId: selectedModuleId || undefined });
          toast.success('Note created!');
        }
      } else {
        // docx or html — file upload
        if (!uploadFile && !isEdit) { toast.error('Please select a file'); setSaving(false); return; }
        const formData = new FormData();
        formData.append('title', title);
        formData.append('tags', JSON.stringify(tags));
        formData.append('color', color);
        formData.append('isPinned', isPinned);
        if (subject) formData.append('subject', subject);
        if (topic) formData.append('topic', topic);
        if (!isEdit && selectedModuleId) formData.append('moduleId', selectedModuleId);
        if (uploadFile) formData.append('file', uploadFile);
        if (isEdit) formData.append('noteId', id);
        await api.post('/notes/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success(isEdit ? 'Note updated!' : 'Note created!');
      }
      navigate('/notes');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-white/10 border-t-dolphin-500 rounded-full animate-spin" />
      </div>
    );
  }

  const modes = [
    { key: 'richtext', label: 'Rich Text', icon: FileText },
    { key: 'docx',     label: 'Upload DOCX', icon: Upload },
    { key: 'html',     label: 'Upload HTML', icon: Code2 },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate('/notes')} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Notes
        </button>
        <div className="flex items-center gap-3">
          <button onClick={() => setIsPinned(!isPinned)} className={clsx('btn-icon', isPinned && 'text-yellow-400')}>
            <Pin className={clsx('w-4 h-4', isPinned && 'fill-yellow-400')} />
          </button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            {isEdit ? 'Update' : 'Save Note'}
          </button>
        </div>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/10 mb-4 w-fit">
        {modes.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => { setMode(key); setUploadFile(null); }}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
              mode === key
                ? 'bg-dolphin-600 text-white shadow'
                : 'text-gray-400 hover:text-white'
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      <div className="glass-card overflow-hidden">
        {/* Title */}
        <div className="p-6 border-b border-white/10 space-y-4">
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Note title..."
            className="w-full text-3xl font-bold bg-transparent text-white placeholder-gray-700 border-none outline-none"
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Subject</label>
              <select value={subject} onChange={e => handleSubjectChange(e.target.value)} className="select-field text-sm">
                <option value="">Select Subject (Optional)</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
                <option value="CREATE_NEW" className="font-bold text-purple-400">+ Create New Subject</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Topic</label>
              <select 
                value={topic} 
                onChange={e => handleTopicChange(e.target.value, subject)} 
                className="select-field text-sm"
                disabled={!subject}
              >
                <option value="">Select Topic (Optional)</option>
                {subject && subjects.find(s => s.id === parseInt(subject))?.topics?.map(t => (
                  <option key={t.id} value={t.name}>{t.name}</option>
                ))}
                {subject && <option value="CREATE_NEW" className="font-bold text-purple-400">+ Create New Topic</option>}
              </select>
            </div>
          </div>

          {!isEdit && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 p-5 border border-white/10 rounded-xl bg-black/20">
              <div className="col-span-full mb-1">
                <h3 className="font-semibold text-white flex items-center gap-2"><BookOpen className="w-4 h-4 text-indigo-400" /> Add to Course (Optional)</h3>
                <p className="text-sm text-gray-400">Directly assign this note to a course section upon creation.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5 ml-1">Select Course</label>
                <select value={selectedCourseId} onChange={e => setSelectedCourseId(e.target.value)} className="input-field py-1.5 text-sm h-10">
                  <option value="">-- None --</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
              {selectedCourseId && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5 ml-1">Select Section (Module)</label>
                  <select value={selectedModuleId} onChange={e => setSelectedModuleId(e.target.value)} className="input-field py-1.5 text-sm h-10" required={!!selectedCourseId}>
                    <option value="">-- Select Section --</option>
                    {modules.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                  </select>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content area — changes based on mode */}
        {mode === 'richtext' && (
          <>
            <div className="flex flex-wrap items-center gap-0.5 px-4 py-2 border-b border-white/10 bg-white/3">
              <ToolbarBtn onClick={() => editor?.chain().focus().toggleBold().run()} active={editor?.isActive('bold')} title="Bold"><Bold className="w-4 h-4" /></ToolbarBtn>
              <ToolbarBtn onClick={() => editor?.chain().focus().toggleItalic().run()} active={editor?.isActive('italic')} title="Italic"><Italic className="w-4 h-4" /></ToolbarBtn>
              <ToolbarBtn onClick={() => editor?.chain().focus().toggleUnderline().run()} active={editor?.isActive('underline')} title="Underline"><UnderlineIcon className="w-4 h-4" /></ToolbarBtn>
              <div className="w-px h-5 bg-white/10 mx-1" />
              <ToolbarBtn onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()} active={editor?.isActive('heading', { level: 1 })} title="Heading 1"><Heading1 className="w-4 h-4" /></ToolbarBtn>
              <ToolbarBtn onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} active={editor?.isActive('heading', { level: 2 })} title="Heading 2"><Heading2 className="w-4 h-4" /></ToolbarBtn>
              <div className="w-px h-5 bg-white/10 mx-1" />
              <ToolbarBtn onClick={() => editor?.chain().focus().toggleBulletList().run()} active={editor?.isActive('bulletList')} title="Bullet List"><List className="w-4 h-4" /></ToolbarBtn>
              <ToolbarBtn onClick={() => editor?.chain().focus().toggleOrderedList().run()} active={editor?.isActive('orderedList')} title="Numbered List"><ListOrdered className="w-4 h-4" /></ToolbarBtn>
              <div className="w-px h-5 bg-white/10 mx-1" />
              <ToolbarBtn onClick={() => editor?.chain().focus().toggleCode().run()} active={editor?.isActive('code')} title="Inline Code"><Code className="w-4 h-4" /></ToolbarBtn>
              <ToolbarBtn onClick={() => editor?.chain().focus().toggleBlockquote().run()} active={editor?.isActive('blockquote')} title="Blockquote"><Quote className="w-4 h-4" /></ToolbarBtn>
              <ToolbarBtn onClick={() => editor?.chain().focus().setHorizontalRule().run()} active={false} title="Divider"><Minus className="w-4 h-4" /></ToolbarBtn>
            </div>
            <EditorContent editor={editor} className="min-h-96" />
          </>
        )}

        {mode === 'docx' && (
          <div className="p-8 flex flex-col items-center justify-center min-h-64 gap-4 relative">
            <div className="absolute top-4 right-4">
              <button type="button" onClick={downloadNoteTemplate} className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-2">
                <Download className="w-3.5 h-3.5" />
                Download Template
              </button>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center">
              <Upload className="w-6 h-6 text-blue-400" />
            </div>
            <div className="text-center">
              <p className="text-white font-medium mb-1">Upload a Word Document</p>
              <p className="text-gray-500 text-sm">Your .docx file will be converted to a note automatically</p>
            </div>
            <label className="cursor-pointer">
              <input type="file" accept=".docx" className="hidden" onChange={e => setUploadFile(e.target.files[0])} />
              <div className={clsx(
                'px-6 py-3 rounded-xl border-2 border-dashed transition-all text-sm font-medium',
                uploadFile
                  ? 'border-blue-500/60 bg-blue-500/10 text-blue-300'
                  : 'border-white/20 text-gray-400 hover:border-blue-500/40 hover:text-blue-400'
              )}>
                {uploadFile ? `✓ ${uploadFile.name}` : 'Click to choose .docx file'}
              </div>
            </label>
            {uploadFile && (
              <button onClick={() => setUploadFile(null)} className="text-xs text-gray-500 hover:text-gray-300">Clear file</button>
            )}
            {isEdit && !uploadFile && existingContentType === 'docx' && (
              <p className="text-gray-600 text-xs">Leave empty to keep existing content, or upload a new file to replace it.</p>
            )}
          </div>
        )}

        {mode === 'html' && (
          <div className="p-8 flex flex-col items-center justify-center min-h-64 gap-4">
            <div className="w-14 h-14 rounded-2xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center">
              <Code2 className="w-6 h-6 text-orange-400" />
            </div>
            <div className="text-center">
              <p className="text-white font-medium mb-1">Upload an HTML File</p>
              <p className="text-gray-500 text-sm">Your HTML file with CSS & JS will be displayed exactly as designed</p>
            </div>
            <label className="cursor-pointer">
              <input type="file" accept=".html,.htm" className="hidden" onChange={e => setUploadFile(e.target.files[0])} />
              <div className={clsx(
                'px-6 py-3 rounded-xl border-2 border-dashed transition-all text-sm font-medium',
                uploadFile
                  ? 'border-orange-500/60 bg-orange-500/10 text-orange-300'
                  : 'border-white/20 text-gray-400 hover:border-orange-500/40 hover:text-orange-400'
              )}>
                {uploadFile ? `✓ ${uploadFile.name}` : 'Click to choose .html file'}
              </div>
            </label>
            {uploadFile && (
              <button onClick={() => setUploadFile(null)} className="text-xs text-gray-500 hover:text-gray-300">Clear file</button>
            )}
            {isEdit && !uploadFile && existingContentType === 'html' && (
              <p className="text-gray-600 text-xs">Leave empty to keep existing content, or upload a new file to replace it.</p>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-white/3 space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-gray-500 text-xs font-medium">Color:</span>
            <div className="flex gap-2">
              {colors.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className={clsx('w-5 h-5 rounded-full transition-all duration-150', colorDots[c],
                    color === c ? 'ring-2 ring-white ring-offset-1 ring-offset-gray-900 scale-125' : 'opacity-60 hover:opacity-100'
                  )}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center flex-wrap gap-2">
            <Tag className="w-4 h-4 text-gray-500" />
            {tags.map(tag => (
              <span key={tag} className="inline-flex items-center gap-1 badge badge-blue">
                {tag}
                <button onClick={() => removeTag(tag)} className="hover:text-white"><X className="w-3 h-3" /></button>
              </span>
            ))}
            <input
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={addTag}
              placeholder="Add tag, press Enter..."
              className="bg-transparent text-gray-400 text-sm outline-none placeholder-gray-700 min-w-32"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
