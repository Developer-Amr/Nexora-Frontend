import { Link, useNavigate } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import Loader from '../components/Loader.jsx';
import NoExams from '../components/NoExams.jsx';
import DoctorExamCard from '../components/DoctorExamCard.jsx';
import { backendApi } from '../api/backendClient.js';
import { getDoctorId, setJSON, STORAGE_KEYS } from '../utils/storage.js';
import { downloadBlob } from '../utils/download.js';
import { Swal, showToast } from '../utils/alerts.js';
import { useBodyClass } from '../hooks/useBodyClass.js';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { useAuthState } from '../hooks/useAuthState.js';

function safeFilenamePart(value) {
  return String(value || 'Exam').replace(/[^a-z0-9_\-]+/gi, '_');
}

export default function ProfilePage() {
  useBodyClass('profile');
  usePageTitle('Exams');

  const navigate = useNavigate();
  const { isAuthenticated } = useAuthState();
  const [doctor, setDoctor] = useState(null);
  const [exams, setExams] = useState([]);
  const [loadingDoctor, setLoadingDoctor] = useState(true);
  const [loadingExams, setLoadingExams] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) navigate('/login', { replace: true });
  }, [isAuthenticated, navigate]);

  const loadExams = useCallback(async () => {
    setLoadingExams(true);
    try {
      const data = await backendApi.getMyExams();
      setExams(Array.isArray(data) ? data : []);
    } catch (loadError) {
      console.error('Could not load profile exams:', loadError);
      setError(loadError.message || 'Could not load exams.');
    } finally {
      setLoadingExams(false);
    }
  }, []);

  useEffect(() => {
    const doctorId = getDoctorId();
    if (!doctorId || !isAuthenticated) return;

    setLoadingDoctor(true);
    backendApi.getDoctorProfile(doctorId)
      .then(setDoctor)
      .catch((loadError) => {
        console.error('Could not load doctor profile:', loadError);
        setError(loadError.message || 'Could not load profile.');
      })
      .finally(() => setLoadingDoctor(false));

    loadExams();
  }, [isAuthenticated, loadExams]);

  const handleToggleStatus = async (exam) => {
    const nextStatus = exam.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await backendApi.changeExamStatus(exam.id, nextStatus);
      await loadExams();
    } catch (error) {
      console.error('Could not update exam status:', error);
      showToast('error', 'Could not update exam status');
    }
  };

  const handleDownload = async (exam) => {
    try {
      const response = await backendApi.downloadExamReportByExamId(exam.id);
      const blob = await response.blob();
      downloadBlob(blob, `Exam_${safeFilenamePart(exam.subject)}_Report.xlsx`);
    } catch (error) {
      console.error('Could not download report:', error);
      await Swal.fire({ icon: 'error', title: 'Download failed', text: error.message || 'Could not download report.', confirmButtonColor: '#27285d' });
    }
  };

  const handleEdit = (exam) => {
    setJSON(STORAGE_KEYS.updatedExamId, exam.id);
    navigate('/add-exam');
  };

  const handleDelete = async (exam) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'No, cancel!',
      reverseButtons: true,
      customClass: { confirmButton: 'btn btn-success mx-2', cancelButton: 'btn btn-danger mx-2' },
      buttonsStyling: false,
    });

    if (!result.isConfirmed) {
      await Swal.fire({ title: 'Cancelled', text: 'Your exam is safe.', icon: 'error', timer: 1500, showConfirmButton: false });
      return;
    }

    try {
      await backendApi.deleteExam(exam.id);
      await Swal.fire({ title: 'Deleted!', text: 'Your exam has been deleted.', icon: 'success', timer: 2000, showConfirmButton: false });
      await loadExams();
    } catch (error) {
      console.error('Could not delete exam:', error);
      await Swal.fire({ icon: 'error', title: 'Could not delete exam', text: error.message || 'Please try again.', confirmButtonColor: '#27285d' });
    }
  };

  return (
    <>
      <Navbar />
      <main className="profile-page">
        <section className="doctor-section py-4 mt-4">
          <div className="container mt-2">
            <div className="doctor-card d-flex align-items-center p-3 rounded-4 shadow-sm" id="doctorCard">
              {loadingDoctor ? <Loader className="ms-5 my-2" /> : doctor ? (
                <div className="doctor-details">
                  <h3 className="mb-0 fw-bold">Dr. {doctor.fullName}</h3>
                  <p className="mb-0 mt-1 text-muted">
                    <span className="badge bg-light text-dark me-2">{doctor.instructorCode}</span>
                    <span className="small"><i className="far fa-envelope me-1" /> {doctor.email}</span>
                  </p>
                </div>
              ) : <div className="text-muted">Doctor profile was not loaded.</div>}
            </div>
          </div>
        </section>

        <section className="profile-exams">
          <div className="container">
            {exams.length > 0 && (
              <div className="myExamsHeading mt-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
                <h2 className="fw-bolder d-flex align-items-center">My Exams <span className="fs-6 ms-2 mt-2 text-muted noOfDoctorExams">({exams.length})</span></h2>
                <Link to="/add-exam">
                  <button className="btn create-btn px-4 py-2 fs-5"><i className="fa-solid fa-plus fs-6" /> Create New Exam</button>
                </Link>
              </div>
            )}
            {error && <div className="alert alert-danger my-3">{error}</div>}
            <div className="container p-0" id="profileExamsContainer">
              {loadingExams && <Loader />}
              {!loadingExams && exams.length === 0 && <NoExams variant="profile" />}
              {!loadingExams && exams.map((exam) => (
                <DoctorExamCard
                  key={exam.id}
                  exam={exam}
                  onToggleStatus={handleToggleStatus}
                  onDownload={handleDownload}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
