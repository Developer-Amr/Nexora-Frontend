import ExamSchedule from './ExamSchedule.jsx';
import { formatExamDateTime, getExamActiveFrom, getExamActiveTo } from '../utils/datetime.js';
import { getExamScheduleStatus, isExamStartableForStudents } from '../utils/examAvailability.js';

function getCardScheduleClass(exam) {
  const status = getExamScheduleStatus(exam);
  if (status === 'Scheduled') return 'exam-card-scheduled';
  if (status === 'Expired') return 'exam-card-expired';
  if (status === 'Manually inactive') return 'exam-card-inactive';
  return '';
}

export default function ExamCard({ exam, onStart, searchable = false }) {
  const startable = isExamStartableForStudents(exam);
  const status = getExamScheduleStatus(exam);
  const startText = getExamActiveFrom(exam) ? `Starts: ${formatExamDateTime(getExamActiveFrom(exam))}` : 'Available now';
  const endText = getExamActiveTo(exam) ? `Ends: ${formatExamDateTime(getExamActiveTo(exam))}` : 'No end time';

  return (
    <div className={`card my-4 shadow-sm w-100 border-1 overflow-hidden ${getCardScheduleClass(exam)}`}>
      <div className="card-header text-white py-3 px-4">
        <div className="d-flex justify-content-between align-items-center flex-wrap">
          <div>
            <p className={`${searchable ? 'university-name ' : ''}mb-0 small text-uppercase fw-light opacity-75`}>{exam.university}</p>
            <h3 className={`${searchable ? 'subject-title ' : ''}mb-0 fw-bold`}>{exam.subject}</h3>
          </div>
          <div className="text-md-end mt-2 mt-md-0">
            <span className={`${searchable ? 'college-name ' : ''}badge bg-white rounded-pill px-3 py-2 fw-bold`}>Faculty of {exam.college}</span>
          </div>
        </div>
      </div>
      <div className="card-body p-4">
        <div className="row g-4 align-items-center">
          <div className="col-md-4 col-sm-6">
            <div className="d-flex align-items-center">
              <div>
                <label className="text-muted small d-block mb-0 text-uppercase">Dr.</label>
                <span className={`${searchable ? 'doctor-name ' : ''}fw-bold h6 mb-0`}>{exam.instructorName || exam.doctorName || 'Instructor'}</span>
              </div>
            </div>
          </div>
          <div className="col-md-4 col-sm-12 border-start-md">
            <div className="d-flex align-items-center">
              <div>
                <label className="text-muted small d-block mb-0 text-uppercase">Department</label>
                <span className={`${searchable ? 'department-name ' : ''}fw-bold h6 mb-0`}>{exam.department}</span>
              </div>
            </div>
          </div>
          <div className="col-md-4 col-sm-6 border-start-md">
            <div className="d-flex align-items-center">
              <div>
                <label className="text-muted small d-block mb-0 text-uppercase">Academic Level</label>
                <span className={`${searchable ? 'academic-level ' : ''}fw-bold h6 mb-0`}>Level {exam.level}</span>
              </div>
            </div>
          </div>
        </div>
        <ExamSchedule exam={exam} />
      </div>
      <div className="card-footer border-0 p-3 d-flex justify-content-between align-items-center">
        <small className="text-muted ps-2"><i className="fa-regular fa-clock" /> Time: {exam.durationMinutes} Mins</small>
        <div className="d-flex flex-column flex-md-row gap-2 align-items-center">
          <small className="text-muted d-block text-md-end">{status === 'Scheduled' ? startText : endText}</small>
          <button
            className="btn px-5 start-btn fw-bold shadow-sm py-2 rounded-3"
            type="button"
            disabled={!startable}
            title={startable ? 'Start Exam' : status === 'Scheduled' ? startText : status}
            onClick={() => onStart?.(exam.id)}
          >
            {startable ? 'Start Exam' : status === 'Scheduled' ? 'Not Started' : status}
          </button>
        </div>
      </div>
    </div>
  );
}
