import ExamSchedule from './ExamSchedule.jsx';

export default function DoctorExamCard({ exam, onToggleStatus, onDownload, onEdit, onDelete }) {
  const isActive = exam.status === 'Active';

  return (
    <div className="card my-4 shadow-sm w-100 border-0 overflow-hidden">
      <div className="card-header text-white py-3 px-4">
        <div className="d-flex justify-content-between align-items-center flex-wrap">
          <div>
            <p className="mb-0 small text-uppercase fw-light opacity-75">{exam.university}</p>
            <h3 className="mb-0 fw-bold">{exam.subject}</h3>
          </div>
          <div className="text-md-end mt-2 mt-md-0">
            <span className="badge bg-white rounded-pill px-3 py-2 fw-bold">Faculty of {exam.college}</span>
          </div>
        </div>
      </div>
      <div className="card-body p-4">
        <div className="row g-4 align-items-center">
          <div className="col-md-4 col-sm-6">
            <div className="d-flex align-items-center">
              <div>
                <label className="text-muted small d-block mb-0 text-uppercase">code</label>
                <span className="fw-bold h6 mb-0">{exam.code}</span>
              </div>
            </div>
          </div>
          <div className="col-md-4 col-sm-12 border-start-md">
            <div className="d-flex align-items-center">
              <div>
                <label className="text-muted small d-block mb-0 text-uppercase">Department</label>
                <span className="fw-bold h6 mb-0">{exam.department}</span>
              </div>
            </div>
          </div>
          <div className="col-md-4 col-sm-12 border-start-md">
            <div className="d-flex align-items-center">
              <div>
                <label className="text-muted small d-block mb-0 text-uppercase">Academic Level</label>
                <span className="fw-bold h6 mb-0">Level {exam.level}</span>
              </div>
            </div>
          </div>
        </div>
        <ExamSchedule exam={exam} />
      </div>
      <div className="card-footer border-0 p-3 d-flex justify-content-between align-items-center">
        <small className="text-muted ps-2"><i className="fa-regular fa-clock" /> Time: {exam.durationMinutes} Mins</small>
        <div className="d-flex flex-wrap gap-2 justify-content-end">
          <button type="button" onClick={() => onToggleStatus?.(exam)} className={`btn active-btn px-3 py-2 fw-bold shadow-sm rounded-3 ${isActive ? '' : 'inactive-style'}`}>{isActive ? 'Active' : 'Inactive'}</button>
          <button type="button" onClick={() => onDownload?.(exam)} className="btn download-btn px-2 py-2 fw-bold shadow-sm rounded-3">Download Details <i className="fa-solid fa-download" /></button>
          <button type="button" onClick={() => onEdit?.(exam)} className="btn edit-btn px-2 py-2 fw-bold shadow-sm rounded-3">Edit <i className="fa-solid fa-pen-to-square" /></button>
          <button type="button" onClick={() => onDelete?.(exam)} className="btn delete-btn px-2 py-2 fw-bold shadow-sm rounded-3">Delete <i className="fa-solid fa-trash-can" /></button>
        </div>
      </div>
    </div>
  );
}
