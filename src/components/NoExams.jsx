import { Link } from 'react-router-dom';

const BASE = import.meta.env.BASE_URL;

export default function NoExams({ variant = 'student' }) {
  if (variant === 'profile') {
    return (
      <div className="row justify-content-center text-center no-exams">
        <div className="col-md-8">
          <img src={`${import.meta.env.BASE_URL}assets/images/no-exams.jpg`} alt="No Exams" className="w-50" />
          <div className="my-3">
            <h2 className="fw-bold text-dark mb-0">No Exams Found!</h2>
            <p className="text-muted mb-0">It looks like you haven&apos;t created any exams yet. Start by creating your first exam.</p>
          </div>
          <Link to="/add-exam">
            <button className="btn mb-5 px-4 py-2 fs-5">
              <i className="fa-solid fa-plus fs-6" /> Create New Exam
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="row justify-content-center text-center no-exams my-5">
      <div className="col-md-8">
        <img src="/assets/images/no-exams.jpg" alt="No Exams" className="img-fluid mb-4" style={{ maxWidth: '350px' }} />
        <h2 className="fw-bold text-dark">There are no exams available at the moment.</h2>
        <p className="text-muted">Please check back later or contact your instructor for updates.</p>
      </div>
    </div>
  );
}
