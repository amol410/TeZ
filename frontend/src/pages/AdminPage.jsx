import { useState, useEffect } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { ShieldCheck, Plus, Trash2, UserX, UserCheck, Users, X, BookOpen, Tag, ChevronDown, ChevronUp } from 'lucide-react';
import { useSubjects } from '../hooks/useSubjects';

export default function AdminPage() {
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [kycRequests, setKycRequests] = useState([]);
  const [loadingKyc, setLoadingKyc] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [creating, setCreating] = useState(false);

  const { subjects, fetchSubjects, createSubject, createTopic } = useSubjects();
  const [newSubjectName, setNewSubjectName] = useState('');
  const [addingSubject, setAddingSubject] = useState(false);
  const [expandedSubject, setExpandedSubject] = useState(null);
  const [newTopicName, setNewTopicName] = useState('');
  const [addingTopic, setAddingTopic] = useState(false);

  const fetchUsers = async (pageNumber = 1) => {
    if (pageNumber === 1) setLoading(true);
    else setLoadingMore(true);
    
    try {
      const { data } = await api.get(`/admin/users?page=${pageNumber}`);
      if (pageNumber === 1) {
        setUsers(data.users);
      } else {
        setUsers(prev => [...prev, ...data.users]);
      }
      setHasMore(data.pagination?.page < data.pagination?.pages);
      setPage(data.pagination?.page || 1);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const fetchKycRequests = async () => {
    setLoadingKyc(true);
    try {
      const { data } = await api.get('/admin/kyc-requests');
      setKycRequests(data.requests);
    } catch {
      toast.error('Failed to load KYC requests');
    } finally {
      setLoadingKyc(false);
    }
  };

  useEffect(() => { 
    fetchUsers(1); 
    fetchKycRequests();
  }, []);

  const handleCreateTrainer = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const { data } = await api.post('/admin/trainers', form);
      toast.success(`Trainer "${data.user.name}" created!`);
      setForm({ name: '', email: '', password: '' });
      setShowCreateForm(false);
      fetchUsers(1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create trainer');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (userId) => {
    try {
      const { data } = await api.put(`/admin/users/${userId}/toggle-active`);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: data.user.isActive } : u));
      toast.success(data.user.isActive ? 'User activated' : 'User deactivated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user');
    }
  };

  const handleApproveKyc = async (userId, status) => {
    try {
      await api.post('/admin/kyc-approve', { userId, status });
      setKycRequests(prev => prev.filter(u => u.id !== userId));
      toast.success(`KYC ${status}`);
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${status} KYC`);
    }
  };

  const handleDelete = async (userId, userName) => {
    if (!confirm(`Delete user "${userName}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers(prev => prev.filter(u => u.id !== userId));
      toast.success('User deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;
    setAddingSubject(true);
    await createSubject(newSubjectName.trim());
    setNewSubjectName('');
    setAddingSubject(false);
  };

  const handleDeleteSubject = async (subjectId, name) => {
    if (!confirm(`Delete subject "${name}"? All notes and quizzes in this subject will lose their subject tag.`)) return;
    try {
      await api.delete(`/subjects/${subjectId}`);
      toast.success('Subject deleted');
      fetchSubjects();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete subject');
    }
  };

  const handleAddTopic = async (e, subjectId) => {
    e.preventDefault();
    if (!newTopicName.trim()) return;
    setAddingTopic(true);
    await createTopic(subjectId, newTopicName.trim());
    setNewTopicName('');
    setAddingTopic(false);
  };

  const handleDeleteTopic = async (subjectId, topicId, name) => {
    if (!confirm(`Delete topic "${name}"?`)) return;
    try {
      await api.delete(`/subjects/${subjectId}/topics/${topicId}`);
      toast.success('Topic deleted');
      fetchSubjects();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete topic');
    }
  };

  const roleBadge = (role) => {
    const styles = {
      admin: 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
      trainer: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
      student: 'bg-gray-500/20 text-gray-300 border border-gray-500/30',
    };
    return <span className={`badge text-xs capitalize ${styles[role] || styles.student}`}>{role}</span>;
  };

  const trainers = users.filter(u => u.role === 'trainer');
  const students = users.filter(u => u.role === 'student');

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-orange-400" />
            Admin Panel
          </h1>
          <p className="text-gray-500 mt-1">{users.length} total users • {trainers.length} trainers • {students.length} students</p>
        </div>
        {tab === 'users' && (
          <button onClick={() => setShowCreateForm(!showCreateForm)} className="btn-primary flex items-center gap-2">
            {showCreateForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showCreateForm ? 'Cancel' : 'Add Trainer'}
          </button>
        )}
      </div>

      {/* Create Trainer Form */}
      {showCreateForm && tab === 'users' && (
        <div className="glass-card p-6 mb-6 border border-orange-500/20">
          <h2 className="text-lg font-semibold text-white mb-4">Create New Trainer</h2>
          <form onSubmit={handleCreateTrainer} className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Full Name</label>
              <input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="input-field text-sm"
                placeholder="Trainer Name"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="input-field text-sm"
                placeholder="trainer@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="input-field text-sm"
                placeholder="Min 6 characters"
                minLength={6}
                required
              />
            </div>
            <div className="sm:col-span-3 flex justify-end">
              <button type="submit" disabled={creating} className="btn-primary flex items-center gap-2">
                {creating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus className="w-4 h-4" />}
                Create Trainer
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { key: 'users', label: `All Users (${users.length})` },
          { key: 'trainers', label: `Trainers (${trainers.length})` },
          { key: 'students', label: `Students (${students.length})` },
          { key: 'subjects', label: `Subjects (${subjects.length})` },
          { key: 'kyc', label: `KYC Approvals (${kycRequests.length})` },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              tab === t.key ? 'bg-orange-600/20 text-orange-300 border border-orange-500/30' : 'text-gray-400 hover:text-white hover:bg-white/8'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Users Table */}
      {(tab === 'users' || tab === 'trainers' || tab === 'students') && (
        loading ? (
          <div className="glass-card p-8 text-center text-gray-500">Loading users...</div>
        ) : (
          <div className="glass-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Joined</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {(tab === 'users' ? users : tab === 'trainers' ? trainers : students).map(u => (
                  <tr key={u.id} className="hover:bg-white/3 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-dolphin-500 to-ocean-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {u.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{u.name}</p>
                          <p className="text-gray-500 text-xs">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">{roleBadge(u.role)}</td>
                    <td className="px-5 py-4 text-gray-500 text-sm hidden sm:table-cell">
                      {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`badge text-xs ${u.isActive ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {u.role !== 'admin' && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleActive(u.id)}
                            className={`p-1.5 rounded-lg transition-colors ${u.isActive ? 'text-yellow-400 hover:bg-yellow-500/20' : 'text-green-400 hover:bg-green-500/20'}`}
                            title={u.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {u.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleDelete(u.id, u.name)}
                            className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors"
                            title="Delete user"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {(tab === 'users' ? users : tab === 'trainers' ? trainers : students).length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-gray-500">
                      <Users className="w-10 h-10 mx-auto mb-2 text-gray-700" />
                      No {tab === 'trainers' ? 'trainers' : tab === 'students' ? 'students' : 'users'} found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="p-4 border-t border-white/10 flex justify-center">
              <button
                onClick={() => {
                  if (!hasMore || loadingMore) return;
                  fetchUsers(page + 1);
                }}
                disabled={loadingMore || !hasMore}
                className="w-full py-4 text-sm font-medium text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingMore ? 'Loading more...' : hasMore ? 'Load More Users' : 'No more users'}
              </button>
            </div>
          </div>
        )
      )}

      {/* KYC Table */}
      {tab === 'kyc' && (
        loadingKyc ? (
          <div className="glass-card p-8 text-center text-gray-500">Loading KYC requests...</div>
        ) : kycRequests.length === 0 ? (
          <div className="glass-card p-8 text-center text-gray-500">No pending KYC requests</div>
        ) : (
          <div className="glass-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">Aadhar</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase">PAN</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {kycRequests.map(r => (
                  <tr key={r.id} className="hover:bg-white/3 transition-colors">
                    <td className="px-5 py-4">
                      <div>
                        <p className="text-white text-sm font-medium">{r.name}</p>
                        <p className="text-gray-500 text-xs">{r.email}</p>
                        <p className="text-gray-500 text-xs">{r.phone}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {r.aadharUrl ? (
                        <a href={`http://localhost:3000${r.aadharUrl}`} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline text-sm flex items-center gap-1">
                          <BookOpen className="w-4 h-4"/> View Aadhar
                        </a>
                      ) : (
                        <span className="text-gray-500 text-sm">No file</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {r.panUrl ? (
                        <a href={`http://localhost:3000${r.panUrl}`} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline text-sm flex items-center gap-1">
                          <BookOpen className="w-4 h-4"/> View PAN
                        </a>
                      ) : (
                        <span className="text-gray-500 text-sm">No file</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleApproveKyc(r.id, 'APPROVED')} className="p-2 text-green-400 hover:bg-green-500/10 rounded-lg transition-colors" title="Approve">
                          <UserCheck className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleApproveKyc(r.id, 'REJECTED')} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Reject">
                          <UserX className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* Subjects Tab */}
      {tab === 'subjects' && (
        <div className="space-y-4">
          {/* Add Subject */}
          <div className="glass-card p-5 border border-green-500/20">
            <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-green-400" />
              Add New Subject
            </h2>
            <form onSubmit={handleAddSubject} className="flex gap-3">
              <input
                value={newSubjectName}
                onChange={e => setNewSubjectName(e.target.value)}
                className="input-field flex-1 text-sm"
                placeholder="e.g. Python, Web Development, Data Science"
                required
              />
              <button type="submit" disabled={addingSubject} className="btn-primary flex items-center gap-2 flex-shrink-0">
                {addingSubject ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus className="w-4 h-4" />}
                Add Subject
              </button>
            </form>
          </div>

          {/* Subject List */}
          {subjects.length === 0 ? (
            <div className="glass-card p-10 text-center text-gray-500">
              <BookOpen className="w-10 h-10 mx-auto mb-2 text-gray-700" />
              No subjects yet. Add your first subject above.
            </div>
          ) : (
            subjects.map(subject => (
              <div key={subject.id} className="glass-card overflow-hidden border border-white/10">
                {/* Subject header */}
                <div className="flex items-center justify-between px-5 py-4">
                  <button
                    className="flex items-center gap-3 flex-1 text-left"
                    onClick={() => setExpandedSubject(expandedSubject === subject.id ? null : subject.id)}
                  >
                    <div className="w-8 h-8 rounded-lg bg-green-500/15 border border-green-500/20 flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-green-400" />
                    </div>
                    <div>
                      <p className="text-white font-semibold">{subject.name}</p>
                      <p className="text-gray-500 text-xs">{subject.topics?.length || 0} topics</p>
                    </div>
                    {expandedSubject === subject.id
                      ? <ChevronUp className="w-4 h-4 text-gray-500 ml-2" />
                      : <ChevronDown className="w-4 h-4 text-gray-500 ml-2" />
                    }
                  </button>
                  <button
                    onClick={() => handleDeleteSubject(subject.id, subject.name)}
                    className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors ml-4"
                    title="Delete subject"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Topics (expanded) */}
                {expandedSubject === subject.id && (
                  <div className="border-t border-white/10 px-5 py-4 space-y-3">
                    {/* Existing topics */}
                    {subject.topics?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {subject.topics.map(topic => (
                          <div key={topic.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
                            <Tag className="w-3 h-3 text-blue-400" />
                            <span className="text-blue-300 text-sm">{topic.name}</span>
                            <button
                              onClick={() => handleDeleteTopic(subject.id, topic.id, topic.name)}
                              className="text-blue-400/50 hover:text-red-400 transition-colors ml-1"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-600 text-sm">No topics yet.</p>
                    )}

                    {/* Add topic */}
                    <form onSubmit={(e) => handleAddTopic(e, subject.id)} className="flex gap-2">
                      <input
                        value={expandedSubject === subject.id ? newTopicName : ''}
                        onChange={e => setNewTopicName(e.target.value)}
                        className="input-field flex-1 text-sm py-2"
                        placeholder="Add new topic..."
                        required
                      />
                      <button type="submit" disabled={addingTopic} className="btn-secondary py-2 px-4 text-sm flex items-center gap-1.5 flex-shrink-0">
                        {addingTopic ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                        Add Topic
                      </button>
                    </form>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
