import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

/**
 * Shared hook to fetch all subjects (with their embedded topics).
 * Provides helpers to create new subjects and topics inline.
 */
export function useSubjects() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSubjects = useCallback(async () => {
    try {
      const { data } = await api.get('/subjects');
      setSubjects(data.subjects || []);
    } catch {
      // silently fail — subjects are optional
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSubjects(); }, [fetchSubjects]);

  const createSubject = async (name) => {
    try {
      const { data } = await api.post('/subjects', { name });
      const newSubject = data.subject;
      setSubjects(prev => [...prev, newSubject].sort((a, b) => a.name.localeCompare(b.name)));
      toast.success(`Subject "${newSubject.name}" created`);
      return newSubject;
    } catch (err) {
      // If subject already exists, the API returns it in err.response.data.subject
      if (err.response?.data?.subject) {
        toast.success('Using existing subject');
        return err.response.data.subject;
      }
      toast.error(err.response?.data?.message || 'Failed to create subject');
      return null;
    }
  };

  const createTopic = async (subjectId, name) => {
    try {
      const { data } = await api.post(`/subjects/${subjectId}/topics`, { name });
      const updatedSubject = data.subject;
      // Match by both id and _id for safety
      setSubjects(prev => prev.map(s =>
        (s.id === updatedSubject.id || s._id === updatedSubject._id) ? updatedSubject : s
      ));
      toast.success(`Topic "${name}" created`);
      return updatedSubject;
    } catch (err) {
      if (err.response?.data?.subject) {
        // topic already exists
        const existing = err.response.data.subject;
        setSubjects(prev => prev.map(s =>
          (s.id === existing.id || s._id === existing._id) ? existing : s
        ));
        toast.success('Using existing topic');
        return existing;
      }
      toast.error(err.response?.data?.message || 'Failed to create topic');
      return null;
    }
  };

  // Find topics for a given subjectId (works with both id and _id)
  const getTopicsForSubject = (subjectId) => {
    if (!subjectId) return [];
    const id = parseInt(subjectId);
    const subject = subjects.find(s => s.id === id || s._id === id);
    return subject ? (subject.topics || []) : [];
  };

  return { subjects, loading, fetchSubjects, createSubject, createTopic, getTopicsForSubject };
}
