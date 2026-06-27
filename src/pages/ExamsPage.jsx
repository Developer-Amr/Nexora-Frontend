import { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import Loader from '../components/Loader.jsx';
import ExamCard from '../components/ExamCard.jsx';
import NoExams from '../components/NoExams.jsx';
import { backendApi } from '../api/backendClient.js';
import { isExamAvailableForStudents } from '../utils/examAvailability.js';
import { useBodyClass } from '../hooks/useBodyClass.js';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { useStartExamFlow } from '../hooks/useStartExamFlow.js';

function searchableText(exam) {
  return [exam.university, exam.college, exam.subject, exam.instructorName, exam.doctorName, exam.department, exam.level]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export default function ExamsPage() {
  useBodyClass('exams');
  usePageTitle('Exams');

  const startExamFlow = useStartExamFlow();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    backendApi.getAvailableExams()
      .then((data) => {
        if (mounted) setExams((Array.isArray(data) ? data : []).filter(isExamAvailableForStudents));
      })
      .catch((err) => {
        console.error('Could not load exams:', err);
        if (mounted) setError(err.message || 'Could not load exams.');
      })
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  const filteredExams = useMemo(() => {
    const value = search.toLowerCase().trim();
    if (!value) return exams;
    return exams.filter((exam) => searchableText(exam).includes(value));
  }, [exams, search]);

  return (
    <>
      <Navbar />
      <main className="exams-page">
        <section className="all-exams">
          <div className="container my-4 py-4">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
              <h2 className="fw-bold mb-0">Available Exams</h2>
              {exams.length > 0 && (
                <div className="position-relative search flex-grow-1" style={{ maxWidth: '600px' }}>
                  <i className="fa-solid fa-magnifying-glass search-icon position-absolute top-50 translate-middle-y" />
                  <input
                    type="text"
                    className="form-control searchInput ps-5 rounded-3"
                    placeholder="Search by university, college, subject, doctor, department, or level"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>
              )}
            </div>
            {loading && <Loader />}
            {!loading && error && <div className="alert alert-danger">{error}</div>}
            {!loading && !error && exams.length === 0 && <NoExams />}
            {!loading && !error && exams.length > 0 && filteredExams.length === 0 && (
              <div className="text-center my-5 py-5">
                <h3 className="fw-bold text-dark">No exams found</h3>
                <p className="text-muted">Try another search term.</p>
              </div>
            )}
            <div id="allExamsContainer">
              {!loading && filteredExams.map((exam) => <ExamCard key={exam.id} exam={exam} searchable onStart={startExamFlow} />)}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
