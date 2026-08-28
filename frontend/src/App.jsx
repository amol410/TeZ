import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';

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

// Course Pages
import BrowseCoursesPage from './pages/BrowseCoursesPage';
import CourseDetailsPage from './pages/CourseDetailsPage';
import CartPage from './pages/CartPage';
import MyCoursesPage from './pages/MyCoursesPage';
import CoursePlayerPage from './pages/CoursePlayerPage';
import CourseManagementPage from './pages/CourseManagementPage';
import CourseBuilderPage from './pages/CourseBuilderPage';

// Legal Pages
import AboutUs from './pages/legal/AboutUs';
import ContactUs from './pages/legal/ContactUs';
import TermsAndConditions from './pages/legal/TermsAndConditions';
import PrivacyPolicy from './pages/legal/PrivacyPolicy';
import RefundPolicy from './pages/legal/RefundPolicy';

function Layout({ children }) {
  const location = useLocation();
  const isQuizTake = location.pathname.includes('/take');
  
  return (
    <div className={isQuizTake ? "min-h-screen" : "pt-24 min-h-screen flex flex-col"}>
      {!isQuizTake && <Navbar />}
      <main className={isQuizTake ? "pb-0 flex-1" : "pb-12 flex-1"}>{children}</main>
      {!isQuizTake && <Footer />}
    </div>
  );
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />

      {/* Legal Routes */}
      <Route path="/about" element={<Layout><AboutUs /></Layout>} />
      <Route path="/contact" element={<Layout><ContactUs /></Layout>} />
      <Route path="/terms" element={<Layout><TermsAndConditions /></Layout>} />
      <Route path="/privacy" element={<Layout><PrivacyPolicy /></Layout>} />
      <Route path="/refund-policy" element={<Layout><RefundPolicy /></Layout>} />

      <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />

      <Route path="/notes" element={<Layout><NotesPage /></Layout>} />
      <Route path="/notes/new" element={<ProtectedRoute roles={['trainer', 'admin']}><Layout><NoteEditorPage /></Layout></ProtectedRoute>} />
      <Route path="/notes/:id" element={<Layout><NoteDetailPage /></Layout>} />
      <Route path="/notes/:id/edit" element={<ProtectedRoute roles={['trainer', 'admin']}><Layout><NoteEditorPage /></Layout></ProtectedRoute>} />

      <Route path="/videos" element={<Layout><VideosPage /></Layout>} />
      <Route path="/videos/new" element={<ProtectedRoute roles={['trainer', 'admin']}><Layout><VideoFormPage /></Layout></ProtectedRoute>} />
      <Route path="/videos/:id" element={<Layout><VideoDetailPage /></Layout>} />
      <Route path="/videos/:id/edit" element={<ProtectedRoute roles={['trainer', 'admin']}><Layout><VideoFormPage /></Layout></ProtectedRoute>} />

      <Route path="/quizzes" element={<Layout><QuizzesPage /></Layout>} />
      <Route path="/quizzes/new" element={<ProtectedRoute roles={['trainer', 'admin']}><Layout><QuizFormPage /></Layout></ProtectedRoute>} />
      <Route path="/quizzes/:id/edit" element={<ProtectedRoute roles={['trainer', 'admin']}><Layout><QuizFormPage /></Layout></ProtectedRoute>} />
      <Route path="/quizzes/:id/take" element={<Layout><QuizTakePage /></Layout>} />

      <Route path="/flashcards" element={<Layout><FlashcardsPage /></Layout>} />
      <Route path="/flashcards/new" element={<ProtectedRoute roles={['trainer', 'admin']}><Layout><FlashcardFormPage /></Layout></ProtectedRoute>} />
      <Route path="/flashcards/:id/edit" element={<ProtectedRoute roles={['trainer', 'admin']}><Layout><FlashcardFormPage /></Layout></ProtectedRoute>} />
      <Route path="/flashcards/:id/study" element={<Layout><StudyPage /></Layout>} />

      <Route path="/courses" element={<Layout><BrowseCoursesPage /></Layout>} />
      <Route path="/courses/my" element={<ProtectedRoute><Layout><MyCoursesPage /></Layout></ProtectedRoute>} />
      <Route path="/courses/manage" element={<ProtectedRoute roles={['trainer', 'admin']}><Layout><CourseManagementPage /></Layout></ProtectedRoute>} />
      <Route path="/courses/new" element={<ProtectedRoute roles={['trainer', 'admin']}><Layout><CourseBuilderPage /></Layout></ProtectedRoute>} />
      <Route path="/courses/:id" element={<Layout><CourseDetailsPage /></Layout>} />
      <Route path="/courses/:id/edit" element={<ProtectedRoute roles={['trainer', 'admin']}><Layout><CourseBuilderPage /></Layout></ProtectedRoute>} />
      <Route path="/courses/:id/learn" element={<Layout><CoursePlayerPage /></Layout>} />
      
      <Route path="/cart" element={<ProtectedRoute><Layout><CartPage /></Layout></ProtectedRoute>} />

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
        <CartProvider>
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
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
