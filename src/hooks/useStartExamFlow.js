import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { backendApi } from '../api/backendClient.js';
import { formatExamDateTime, getExamActiveFrom } from '../utils/datetime.js';
import { isExamAvailableForStudents, isExamStartableForStudents } from '../utils/examAvailability.js';
import { precheckExamAttempt } from '../utils/precheckExamAttempt.js';
import { resetExamStartStorage, setJSON, STORAGE_KEYS } from '../utils/storage.js';
import { Swal } from '../utils/alerts.js';

export function useStartExamFlow() {
  const navigate = useNavigate();

  return useCallback(async (examIdentifier) => {
    Swal.fire({
      title: 'Loading Data...',
      text: 'Please wait while we prepare your exam.',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      resetExamStartStorage();

      const exams = await backendApi.getAvailableExams();
      const exam = exams.find((item) => String(item.id) === String(examIdentifier));

      if (!exam || !exam.id || !isExamAvailableForStudents(exam)) {
        throw new Error('Selected exam is not available.');
      }

      if (!isExamStartableForStudents(exam)) {
        throw new Error(`This exam has not started yet. It will start at ${formatExamDateTime(getExamActiveFrom(exam))}.`);
      }

      const selectedExamId = exam.id;
      setJSON(STORAGE_KEYS.examId, selectedExamId);

      const students = await backendApi.getStudents();

      Swal.close();

      const { value: typedSubjectCode } = await Swal.fire({
        title: 'Verification',
        text: 'Enter Subject Code',
        input: 'text',
        inputPlaceholder: 'e.g., 1a2b3c4d',
        showCancelButton: true,
        confirmButtonColor: '#27285d',
        inputAttributes: {
          autocomplete: 'off',
          autocapitalize: 'off',
          autocorrect: 'off',
        },
        inputValidator: (value) => {
          if (!value) return 'Please enter the subject code!';
          if (value !== exam.code) return 'Subject code is not valid!';
          return undefined;
        },
      });

      if (!typedSubjectCode) return;

      const { value: typedStudentId } = await Swal.fire({
        title: 'Student Identity',
        text: 'Enter your Student ID to start',
        input: 'text',
        showCancelButton: true,
        confirmButtonColor: '#27285d',
        confirmButtonText: 'Continue',
        inputAttributes: {
          autocomplete: 'off',
          autocapitalize: 'off',
          autocorrect: 'off',
        },
        inputValidator: (value) => {
          if (!value) return 'Please enter your ID!';
          const student = students.find((s) => String(s.studentUniversityID) === String(value));
          if (!student) return 'Student ID not found!';
          return undefined;
        },
      });

      if (!typedStudentId) return;

      try {
        Swal.fire({
          title: 'Checking exam attempt...',
          text: 'Please wait while we verify that you have not taken this exam before.',
          allowOutsideClick: false,
          allowEscapeKey: false,
          showConfirmButton: false,
          didOpen: () => Swal.showLoading(),
        });

        await precheckExamAttempt(typedSubjectCode, typedStudentId, selectedExamId);
        Swal.close();
      } catch (error) {
        Swal.close();
        resetExamStartStorage();

        await Swal.fire({
          icon: 'error',
          title: 'Cannot start exam',
          text: error.message || 'You cannot start this exam.',
          confirmButtonColor: '#27285d',
          allowOutsideClick: false,
          allowEscapeKey: false,
        });
        return;
      }

      const matchedStudent = students.find((s) => String(s.studentUniversityID) === String(typedStudentId));
      const matchedStudentName = matchedStudent?.fullName || matchedStudent?.name || matchedStudent?.Name || String(typedStudentId);

      setJSON(STORAGE_KEYS.studentId, String(typedStudentId));
      setJSON(STORAGE_KEYS.studentName, matchedStudentName);
      setJSON(STORAGE_KEYS.subjectCode, typedSubjectCode);
      setJSON(STORAGE_KEYS.sessionId, null);

      await Swal.fire({
        icon: 'success',
        title: 'Camera Access Required',
        text: 'The exam page will open now. The exam will not start until you allow camera access and fullscreen mode.',
        timer: 2000,
        showConfirmButton: false,
        allowOutsideClick: false,
        allowEscapeKey: false,
      });

      navigate('/exam', { replace: true });
    } catch (error) {
      console.error('startExamFlow failed:', error);
      Swal.close();
      await Swal.fire({
        icon: 'error',
        title: 'Could not start exam',
        text: error.message?.split(/Status: \d+\. /)[1] || error.message || 'Something went wrong while preparing the exam.',
        confirmButtonColor: '#27285d',
      });
    }
  }, [navigate]);
}
