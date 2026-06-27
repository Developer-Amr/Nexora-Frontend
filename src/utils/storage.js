export const STORAGE_KEYS = {
  token: 'token',
  doctorId: 'Doctor Id',
  updatedExamId: 'Updated Exam Id',
  examId: 'Exam Id',
  studentId: 'Student Id',
  studentName: 'Student Name',
  sessionId: 'Session Id',
  leavingExam: 'Leaving Exam',
  subjectCode: 'Subject Code',
  aiServerUrl: 'AI_SERVER_URL',
  comments: 'comments',
  exams: 'exams',
  loggedInDoctor: 'logged-in doctor',
  updatedIndex: 'updatedIndex',
  currentExam: 'current exam',
  currentStudent: 'current student',
};

export function getJSON(key, fallback = null) {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null || raw === undefined || raw === '') return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function setJSON(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event('exam-storage-changed'));
}

export function setRaw(key, value) {
  window.localStorage.setItem(key, value);
  window.dispatchEvent(new Event('exam-storage-changed'));
}

export function removeItem(key) {
  window.localStorage.removeItem(key);
  window.dispatchEvent(new Event('exam-storage-changed'));
}

export function getToken() {
  return getJSON(STORAGE_KEYS.token, null);
}

export function getDoctorId() {
  return getJSON(STORAGE_KEYS.doctorId, null);
}

export function logoutLikeLegacyFrontend() {
  removeItem(STORAGE_KEYS.token);
}

export function resetExamStartStorage() {
  setJSON(STORAGE_KEYS.examId, null);
  setJSON(STORAGE_KEYS.sessionId, null);
  setJSON(STORAGE_KEYS.studentId, null);
  setJSON(STORAGE_KEYS.studentName, null);
  setJSON(STORAGE_KEYS.subjectCode, null);
}

export function clearExamRuntimeStorage() {
  setJSON(STORAGE_KEYS.leavingExam, null);
  setJSON(STORAGE_KEYS.sessionId, null);
  setJSON(STORAGE_KEYS.studentId, null);
  setJSON(STORAGE_KEYS.studentName, null);
  setJSON(STORAGE_KEYS.examId, null);
}

export function getLeavingExamCount() {
  const parsed = getJSON(STORAGE_KEYS.leavingExam, 0);
  return Number(parsed || 0);
}

export function incrementLeavingExamCounter(reason = 'exam_violation') {
  const nextValue = getLeavingExamCount() + 1;
  setJSON(STORAGE_KEYS.leavingExam, nextValue);
  console.warn('Exam environment violation:', reason, 'count:', nextValue);
  return nextValue;
}
