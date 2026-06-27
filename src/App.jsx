import { Navigate, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import ExamsPage from './pages/ExamsPage.jsx';
import AddExamPage from './pages/AddExamPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import ExamPage from './pages/ExamPage.jsx';
import AboutPage from './pages/AboutPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/index.html" element={<Navigate to="/" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/login.html" element={<Navigate to="/login" replace />} />
      <Route path="/exams" element={<ExamsPage />} />
      <Route path="/exams.html" element={<Navigate to="/exams" replace />} />
      <Route path="/add-exam" element={<AddExamPage />} />
      <Route path="/addExam.html" element={<Navigate to="/add-exam" replace />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/profile.html" element={<Navigate to="/profile" replace />} />
      <Route path="/exam" element={<ExamPage />} />
      <Route path="/exam.html" element={<Navigate to="/exam" replace />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/about.html" element={<Navigate to="/about" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
