import { getExamActiveFrom, getExamActiveTo, parseApiDate } from './datetime.js';

export function isExamInsideAvailabilityWindow(exam) {
  const activeFromDate = parseApiDate(getExamActiveFrom(exam));
  const activeToDate = parseApiDate(getExamActiveTo(exam));
  const now = new Date();

  if (activeFromDate && now < activeFromDate) return false;
  if (activeToDate && now > activeToDate) return false;
  return true;
}

export function isExamExpiredForStudents(exam) {
  const activeToDate = parseApiDate(getExamActiveTo(exam));
  return Boolean(activeToDate && new Date() > activeToDate);
}

export function isExamAvailableForStudents(exam) {
  const status = String(exam?.status || 'Active').toLowerCase();
  return status === 'active' && !isExamExpiredForStudents(exam);
}

export function isExamStartableForStudents(exam) {
  const status = String(exam?.status || 'Active').toLowerCase();
  return status === 'active' && isExamInsideAvailabilityWindow(exam);
}

export function getExamScheduleStatus(exam) {
  const status = String(exam?.status || 'Inactive').toLowerCase();
  const activeFromDate = parseApiDate(getExamActiveFrom(exam));
  const activeToDate = parseApiDate(getExamActiveTo(exam));
  const now = new Date();

  if (status !== 'active') return 'Manually inactive';
  if (activeFromDate && now < activeFromDate) return 'Scheduled';
  if (activeToDate && now > activeToDate) return 'Expired';
  return 'Active now';
}

export function getExamScheduleBadgeClass(exam) {
  const scheduleStatus = getExamScheduleStatus(exam);
  if (scheduleStatus === 'Active now') return 'bg-success';
  if (scheduleStatus === 'Scheduled') return 'bg-warning text-dark';
  return 'bg-secondary';
}
