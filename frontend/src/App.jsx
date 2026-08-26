import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Navbar from './components/common/Navbar';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import NotesPage from './pages/NotesPage';
import NoteEditorPage from './pages/NoteEditorPage';
import NoteDetailPage from './pages/NoteDetailPage';
import VideosPage from './pages/VideosPage';
import VideoDetailPage from './pages/VideoDetailPage';
import VideoFormPage from './pages/VideoFormPage';
import QuizzesPage from './pages/QuizzesPage';
import QuizFormPage from './pages/QuizFormPage';
import QuizTakePage from './pages/QuizTakePage';
import FlashcardsPage from './pages/FlashcardsPage';
import FlashcardFormPage from './pages/FlashcardFormPage';
import StudyPage from './pages/StudyPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';

function Layout({ children }) {
  const location = useLocation();
  const isQuizTake = location.pathname.includes('/take');
  
  return (
    <div className={isQuizTake ? "min-h-screen" : "pt-24 min-h-screen"}>
      {!isQuizTake && <Navbar />}
      <main className={isQuizTake ? "pb-0" : "pb-12"}>{children}</main>
    </div>
  );
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Landing />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />

      <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />

      <Route path="/notes" element={<ProtectedRoute><Layout><NotesPage /></Layout></ProtectedRoute>} />
      <Route path="/notes/new" element={<ProtectedRoute roles={['trainer', 'admin']}><Layout><NoteEditorPage /></Layout></ProtectedRoute>} />
      <Route path="/notes/:id" element={<ProtectedRoute><Layout><NoteDetailPage /></Layout></ProtectedRoute>} />
      <Route path="/notes/:id/edit" element={<ProtectedRoute roles={['trainer', 'admin']}><Layout><NoteEditorPage /></Layout></ProtectedRoute>} />

      <Route path="/videos" element={<ProtectedRoute><Layout><VideosPage /></Layout></ProtectedRoute>} />
      <Route path="/videos/new" element={<ProtectedRoute roles={['trainer', 'admin']}><Layout><VideoFormPage /></Layout></ProtectedRoute>} />
      <Route path="/videos/:id" element={<ProtectedRoute><Layout><VideoDetailPage /></Layout></ProtectedRoute>} />
      <Route path="/videos/:id/edit" element={<ProtectedRoute roles={['trainer', 'admin']}><Layout><VideoFormPage /></Layout></ProtectedRoute>} />

      <Route path="/quizzes" element={<ProtectedRoute><Layout><QuizzesPage /></Layout></ProtectedRoute>} />
      <Route path="/quizzes/new" element={<ProtectedRoute roles={['trainer', 'admin']}><Layout><QuizFormPage /></Layout></ProtectedRoute>} />
      <Route path="/quizzes/:id/edit" element={<ProtectedRoute roles={['trainer', 'admin']}><Layout><QuizFormPage /></Layout></ProtectedRoute>} />
      <Route path="/quizzes/:id/take" element={<ProtectedRoute><Layout><QuizTakePage /></Layout></ProtectedRoute>} />

      <Route path="/flashcards" element={<ProtectedRoute><Layout><FlashcardsPage /></Layout></ProtectedRoute>} />
      <Route path="/flashcards/new" element={<ProtectedRoute roles={['trainer', 'admin']}><Layout><FlashcardFormPage /></Layout></ProtectedRoute>} />
      <Route path="/flashcards/:id/edit" element={<ProtectedRoute roles={['trainer', 'admin']}><Layout><FlashcardFormPage /></Layout></ProtectedRoute>} />
      <Route path="/flashcards/:id/study" element={<ProtectedRoute><Layout><StudyPage /></Layout></ProtectedRoute>} />

      <Route path="/admin" element={<ProtectedRoute roles={['admin']}><Layout><AdminPage /></Layout></ProtectedRoute>} />

      <Route path="/profile" element={<ProtectedRoute><Layout><ProfilePage /></Layout></ProtectedRoute>} />

      <Route path="*" element={
        <div className="min-h-screen flex items-center justify-center text-center">
          <div>
            <div className="text-8xl mb-4">🚀</div>
            <h1 className="text-4xl font-bold text-white mb-2">404</h1>
            <p className="text-gray-500 mb-6">Page not found</p>
            <a href="/" className="btn-primary inline-flex">Go Home</a>
          </div>
        </div>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'rgba(17, 24, 39, 0.95)',
              color: '#f3f4f6',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(12px)',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
