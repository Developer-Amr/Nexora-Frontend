import { backendApi } from '../api/backendClient.js';
import { getApiErrorMessage } from './alerts.js';

function getSessionStudentUniversityId(session) {
  return session?.studentInfo?.universityId ??
    session?.studentInfo?.UniversityId ??
    session?.studentInfo?.studentUniversityID ??
    session?.studentInfo?.StudentUniversityID ??
    session?.studentInfo?.studentUniversityId ??
    session?.universityId ??
    session?.UniversityId ??
    session?.studentUniversityID ??
    session?.StudentUniversityID ??
    null;
}

export async function precheckExamAttempt(examCode, studentUniversityID, examIdValue) {
  if (!examIdValue) {
    throw new Error('Exam ID is missing. Please refresh the exams page and try again.');
  }

  let examDetails;
  try {
    examDetails = await backendApi.getExam(examIdValue);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Cannot check exam attempt.'));
  }

  if (!examDetails || !examDetails.id) {
    throw new Error('Exam data could not be loaded.');
  }

  if (examCode && examDetails.code && String(examDetails.code) !== String(examCode)) {
    throw new Error('Subject code is not valid.');
  }

  const sessions = Array.isArray(examDetails.sessions)
    ? examDetails.sessions
    : Array.isArray(examDetails.Sessions)
      ? examDetails.Sessions
      : [];

  const alreadyTaken = sessions.some((session) => String(getSessionStudentUniversityId(session)) === String(studentUniversityID));

  if (alreadyTaken) {
    throw new Error('You have already taken this exam.');
  }

  return { canJoin: true, examId: examDetails.id };
}
