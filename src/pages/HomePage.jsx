import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import Loader from '../components/Loader.jsx';
import ExamCard from '../components/ExamCard.jsx';
import { backendApi } from '../api/backendClient.js';
import { isExamAvailableForStudents } from '../utils/examAvailability.js';
import { useBodyClass } from '../hooks/useBodyClass.js';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { useAuthState } from '../hooks/useAuthState.js';
import { useStartExamFlow } from '../hooks/useStartExamFlow.js';
import { Swal, showToast } from '../utils/alerts.js';

const typedWords = ['Smarter', 'Secure', 'AI-Driven', 'Future'];

const initialComments = [
  {
    name: 'Omar Khalid',
    image: '/assets/images/letter O.png',
    text: "The platform is incredibly smooth. I took my midterm online and didn't face any technical issues. The interface is clear, and the countdown timer helped me stay focused on finishing my answers on time.",
  },
  {
    name: 'Sarah Ahmed',
    image: '/assets/images/letter S.png',
    text: 'Creating and managing exams has never been easier. The dashboard allows me to upload questions quickly and monitor student progress in real-time. It’s a very professional tool for academic assessment.',
  },
  {
    name: 'Adam Salem',
    image: '/assets/images/letter A.png',
    text: "A very reliable system for both students and faculty. The automated grading and proctoring features save a lot of time and ensure fairness. It’s definitely the best solution for digital examinations I've used so far.",
  },
];

const commentRegex = {
  name: /^[A-Za-z\s]{3,50}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
  comment: /^[A-Za-z0-9\s.,!?'")(\-]{10,300}$/,
};

function CommentCard({ comment }) {
  return (
    <div className="comment-card rounded-2 py-3 my-2">
      <div className="row">
        <div className="col-2 d-flex justify-content-center align-items-center ps-4">
          <img className="rounded-circle w-50" src={comment.image || '/assets/images/letter A.png'} alt="" />
        </div>
        <div className="col-10">
          <h6 className="fw-semibold">{comment.name}</h6>
          <p className="pe-5 my-0 lead fs-6 comment-message">{comment.text}</p>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  useBodyClass('home');
  usePageTitle('Home');

  const navigate = useNavigate();
  const { isAuthenticated } = useAuthState();
  const startExamFlow = useStartExamFlow();
  const [wordIndex, setWordIndex] = useState(0);
  const [exams, setExams] = useState([]);
  const [loadingExams, setLoadingExams] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', comment: '' });
  const [touched, setTouched] = useState({});
  const [submittedComments, setSubmittedComments] = useState([]);

  useEffect(() => {
    const interval = window.setInterval(() => setWordIndex((index) => (index + 1) % typedWords.length), 1200);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    let mounted = true;
    backendApi.getAvailableExams()
      .then((data) => {
        if (mounted) setExams((Array.isArray(data) ? data : []).filter(isExamAvailableForStudents).slice(0, 3));
      })
      .catch((error) => console.error('Could not load home exams:', error))
      .finally(() => mounted && setLoadingExams(false));
    return () => { mounted = false; };
  }, []);

  const comments = useMemo(() => [...initialComments, ...submittedComments], [submittedComments]);

  const validation = useMemo(() => ({
    name: commentRegex.name.test(form.name),
    email: commentRegex.email.test(form.email),
    comment: commentRegex.comment.test(form.comment),
  }), [form]);

  const controlClass = (field) => touched[field]
    ? validation[field] ? 'is-valid' : 'is-invalid'
    : '';

  const handleAddExamClick = () => {
    navigate(isAuthenticated ? '/add-exam' : '/login');
  };

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setTouched((current) => ({ ...current, [field]: true }));
  };

  const handleCommentSubmit = async (event) => {
    event.preventDefault();
    setTouched({ name: true, email: true, comment: true });

    if (!validation.name || !validation.email || !validation.comment) return;

    try {
      await backendApi.addComment({
        name: form.name,
        email: form.email,
        content: form.comment,
      });
      setSubmittedComments((current) => [...current, { name: form.name, image: '/assets/images/letter A.png', text: form.comment }]);
      setForm({ name: '', email: '', comment: '' });
      setTouched({});
      showToast('success', 'Comment submitted successfully');
    } catch (error) {
      console.error('Could not submit comment:', error);
      Swal.fire({ icon: 'error', title: 'Could not submit comment', text: error.message || 'Please try again later.', confirmButtonColor: '#27285d' });
    }
  };

  return (
    <>
      <Navbar transparentOnTop />
      <header className="vh-100 d-flex justify-content-center align-items-center position-relative">
        <div>
          <h3 className="position-absolute translate-middle display-1 fw-bolder">
            <span id="element">{typedWords[wordIndex]}</span> Exams
          </h3>
          <div className="icons mt-5 mb-3 d-flex justify-content-center">
            <a href="https://www.facebook.com/" className="text-decoration-none text-white"><i className="fa-brands fa-facebook-f text-center fs-5 px-3" /></a>
            <a href="https://x.com/" className="text-decoration-none"><i className="fa-brands fa-twitter text-white text-center fs-5 px-3" /></a>
            <a href="https://www.linkedin.com/" className="text-decoration-none"><i className="fa-brands fa-linkedin-in text-white text-center fs-5 px-3" /></a>
            <a href="https://www.youtube.com/" className="text-decoration-none"><i className="fa-brands fa-youtube text-white text-center fs-5 px-3" /></a>
          </div>
          <button type="button" className="btn px-5 py-1 fs-2" onClick={handleAddExamClick}>Add Exam</button>
        </div>
      </header>

      <section className="our-some-exams">
        <div className="container my-4 py-4">
          <h5 className={`ourSomeExamsHeading ${!loadingExams && exams.length === 0 ? 'd-none' : ''}`}>Our Some Exams</h5>
          <div id="someExamsContainer">
            {loadingExams && <Loader />}
            {!loadingExams && exams.map((exam) => <ExamCard key={exam.id} exam={exam} onStart={startExamFlow} />)}
          </div>
        </div>
      </section>

      <section className="comments">
        <div className="container my-4 pb-4">
          <h5 className="mb-3 fw-bolder">Comments</h5>
          {comments.map((comment, index) => <CommentCard key={`${comment.name}-${index}`} comment={comment} />)}
        </div>
      </section>

      <section className="write-comment py-4 my-4">
        <div className="container">
          <h5 className="mb-3 fw-bolder">Write A Comment</h5>
          <form onSubmit={handleCommentSubmit} noValidate>
            <div className="row gy-2">
              <div className="col-md-6">
                <input type="text" className={`form-control ${controlClass('name')}`} placeholder="Name" autoComplete="off" value={form.name} onChange={(event) => updateForm('name', event.target.value)} />
                <span className={`ms-1 ${touched.name && !validation.name ? '' : 'd-none'}`}>letters and spaces only, 3-50 characters</span>
              </div>
              <div className="col-md-6">
                <input type="email" className={`form-control ${controlClass('email')}`} placeholder="E-mail" autoComplete="off" value={form.email} onChange={(event) => updateForm('email', event.target.value)} />
                <span className={`ms-1 ${touched.email && !validation.email ? '' : 'd-none'}`}>valid email format like user@gmail.com</span>
              </div>
              <div className="col-12">
                <textarea className={`form-control ${controlClass('comment')}`} placeholder="Comment" rows="7" value={form.comment} onChange={(event) => updateForm('comment', event.target.value)} />
                <span className={`ms-1 ${touched.comment && !validation.comment ? '' : 'd-none'}`}>letters, numbers, spaces & basic punctuation; 10-300 characters</span>
              </div>
            </div>
            <button type="submit" className="btn me-auto mt-2 py-2 px-4">Submit</button>
          </form>
        </div>
      </section>
      <Footer />
    </>
  );
}
