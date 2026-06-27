import { formatExamDateTime, getExamActiveFrom, getExamActiveTo } from '../utils/datetime.js';
import { getExamScheduleBadgeClass, getExamScheduleStatus } from '../utils/examAvailability.js';

export default function ExamSchedule({ exam }) {
  const activeFrom = getExamActiveFrom(exam);
  const activeTo = getExamActiveTo(exam);

  return (
    <div className="mt-4 pt-3 border-top schedule-line">
      <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
        <span className={`badge rounded-pill px-3 py-2 ${getExamScheduleBadgeClass(exam)}`}>{getExamScheduleStatus(exam)}</span>
      </div>
      <div className="row gy-2 small text-muted">
        <div className="col-md-6">
          <i className="fa-regular fa-calendar-check me-1" />
          <strong>Active From:</strong> {activeFrom ? formatExamDateTime(activeFrom) : 'Available now'}
        </div>
        <div className="col-md-6">
          <i className="fa-regular fa-calendar-xmark me-1" />
          <strong>Active To:</strong> {activeTo ? formatExamDateTime(activeTo) : 'No end time'}
        </div>
      </div>
    </div>
  );
}
