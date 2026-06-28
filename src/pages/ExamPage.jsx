import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Loader from '../components/Loader.jsx';
import { backendApi } from '../api/backendClient.js';
import { aiApi, getAiWebSocketUrl } from '../api/aiClient.js';
import { forwardAiResultToBackend } from '../utils/aiResult.js';
import { precheckExamAttempt } from '../utils/precheckExamAttempt.js';
import {
  clearExamRuntimeStorage,
  getJSON,
  incrementLeavingExamCounter,
  resetExamStartStorage,
  setJSON,
  STORAGE_KEYS,
} from '../utils/storage.js';
import { Swal } from '../utils/alerts.js';
import { useBodyClass } from '../hooks/useBodyClass.js';
import { usePageTitle } from '../hooks/usePageTitle.js';

const AI_FRAME_INTERVAL_MS = 200;

function getExamQuestions(exam) {
  return Array.isArray(exam?.questions)
    ? exam.questions
    : Array.isArray(exam?.Questions)
      ? exam.Questions
      : [];
}

function sortQuestions(questions) {
  return [...questions].sort((a, b) => Number(a.orderIndex || a.OrderIndex || 0) - Number(b.orderIndex || b.OrderIndex || 0));
}

function formatInitialTimer(minutes) {
  const value = Number(minutes || 0);
  return `${value < 10 ? '0' : ''}${value}:00`;
}

async function enterExamFullscreen() {
  const element = document.documentElement;
  if (document.fullscreenElement) return true;
  if (element.requestFullscreen) await element.requestFullscreen();
  else if (element.webkitRequestFullscreen) await element.webkitRequestFullscreen();
  else if (element.msRequestFullscreen) await element.msRequestFullscreen();
  else throw new Error('Fullscreen API is not supported by this browser.');
  return true;
}

async function exitFullscreenIfNeeded() {
  if (document.fullscreenElement && document.exitFullscreen) {
    try {
      await document.exitFullscreen();
    } catch (error) {
      console.warn('Could not exit fullscreen', error);
    }
  }
}

export default function ExamPage() {
  useBodyClass('exam');
  usePageTitle('Exam');

  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startupError, setStartupError] = useState('');
  const [timerDisplay, setTimerDisplay] = useState('00:00');
  const [timerWarning, setTimerWarning] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState({});

  const videoRef = useRef(null);
  const aiMonitoringSocketRef = useRef(null);
  const aiMonitoringStreamRef = useRef(null);
  const aiFrameTimerRef = useRef(null);
  const aiFrameCanvasRef = useRef(null);
  const aiMonitoringStartedRef = useRef(false);
  const timerIntervalRef = useRef(null);
  const examTimerExpiredRef = useRef(false);
  const examSubmissionInProgressRef = useRef(false);
  const examWasSubmittedRef = useRef(false);
  const examNavigationProtectionEnabledRef = useRef(false);
  const examFullscreenGuardEnabledRef = useRef(false);
  const fullscreenPromptActiveRef = useRef(false);
  const initializedRef = useRef(false);
  const examRef = useRef(null);
  const selectedAnswersRef = useRef({});

  useEffect(() => {
    examRef.current = exam;
  }, [exam]);

  useEffect(() => {
    selectedAnswersRef.current = selectedAnswers;
  }, [selectedAnswers]);

  const stopAiTransport = useCallback(() => {
    if (aiFrameTimerRef.current) {
      window.clearInterval(aiFrameTimerRef.current);
      aiFrameTimerRef.current = null;
    }

    if (aiMonitoringSocketRef.current && aiMonitoringSocketRef.current.readyState === WebSocket.OPEN) {
      aiMonitoringSocketRef.current.close();
    }
    aiMonitoringSocketRef.current = null;

    if (aiMonitoringStreamRef.current) {
      aiMonitoringStreamRef.current.getTracks().forEach((track) => track.stop());
      aiMonitoringStreamRef.current = null;
    }

    aiMonitoringStartedRef.current = false;
  }, []);

  const disableExamNavigationProtection = useCallback(() => {
    examNavigationProtectionEnabledRef.current = false;
    examFullscreenGuardEnabledRef.current = false;
  }, []);

  const goBackToExams = useCallback(async () => {
    stopAiTransport();
    disableExamNavigationProtection();
    await exitFullscreenIfNeeded();
    navigate('/exams', { replace: true });
  }, [disableExamNavigationProtection, navigate, stopAiTransport]);

  const requestCameraAccess = useCallback(async () => {
    const result = await Swal.fire({
      title: 'Exam Requirements',
      html: 'Before the exam starts, you must:<br><b>1)</b> allow Full-Screen mode<br><b>2)</b> allow camera access',
      icon: 'info',
      showCancelButton: true,
      confirmButtonColor: '#27285d',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Allow Access & Start',
      cancelButtonText: 'Back to Exams',
      allowOutsideClick: false,
      allowEscapeKey: false,
    });

    if (!result.isConfirmed) {
      await Swal.fire({
        icon: 'warning',
        title: 'Exam Not Started',
        text: 'The exam cannot start without Full-Screen mode and camera access.',
        confirmButtonColor: '#27285d',
        allowOutsideClick: false,
        allowEscapeKey: false,
      });
      await goBackToExams();
      return false;
    }

    try {
      await enterExamFullscreen();

      console.log("isSecureContext:", window.isSecureContext);
console.log("mediaDevices:", navigator.mediaDevices);
console.log("getUserMedia:", navigator.mediaDevices?.getUserMedia);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported. Please use a modern browser over HTTPS or localhost.');
      }

      aiMonitoringStreamRef.current = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false,
      });

      const video = videoRef.current;
      if (!video) throw new Error('Camera preview element is missing.');

      video.autoplay = true;
      video.playsInline = true;
      video.muted = true;
      video.srcObject = aiMonitoringStreamRef.current;
      await video.play();

      return true;
    } catch (error) {
      console.warn('Exam access requirements failed', error);
      stopAiTransport();
      await exitFullscreenIfNeeded();
      await Swal.fire({
        title: 'Access Required',
        text: 'Camera access and Full-Screen mode are required. The exam did not start.',
        icon: 'error',
        confirmButtonColor: '#27285d',
        allowOutsideClick: false,
        allowEscapeKey: false,
      });
      navigate('/exams', { replace: true });
      return false;
    }
  }, [goBackToExams, navigate, stopAiTransport]);

  const joinExamSessionAfterAccess = useCallback(async (freshExamId, freshStudentId) => {
    const storedSubjectCode = getJSON(STORAGE_KEYS.subjectCode, null);
    if (!storedSubjectCode) {
      throw new Error('Subject code is missing. Please restart the exam.');
    }

    const data = await backendApi.joinExamSession({
      examCode: storedSubjectCode,
      studentUniversityID: String(freshStudentId),
    });

    if (!data || !data.sessionId) {
      throw new Error('Join exam response does not contain sessionId.');
    }

    setJSON(STORAGE_KEYS.sessionId, data.sessionId);
    return data.sessionId;
  }, []);

  const startAiMonitoring = useCallback(async () => {
    const currentSessionId = getJSON(STORAGE_KEYS.sessionId, null);
    const currentStudentUniversityID = getJSON(STORAGE_KEYS.studentId, null);

    if (!currentSessionId || !currentStudentUniversityID || aiMonitoringStartedRef.current) return;

    try {
      await aiApi.startSession(currentSessionId, currentStudentUniversityID);

      const video = videoRef.current;
      if (!video) throw new Error('Camera preview element is missing.');

      if (!aiMonitoringStreamRef.current) {
        aiMonitoringStreamRef.current = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: false,
        });
      }

      video.srcObject = aiMonitoringStreamRef.current;
      await video.play();

      const socket = new WebSocket(getAiWebSocketUrl(currentSessionId));
      aiMonitoringSocketRef.current = socket;

      aiFrameCanvasRef.current = document.createElement('canvas');
      aiFrameCanvasRef.current.width = 640;
      aiFrameCanvasRef.current.height = 480;
      const context = aiFrameCanvasRef.current.getContext('2d');

      socket.onopen = () => {
        aiMonitoringStartedRef.current = true;
        aiFrameTimerRef.current = window.setInterval(() => {
          const currentSocket = aiMonitoringSocketRef.current;
          const currentVideo = videoRef.current;
          const canvas = aiFrameCanvasRef.current;
          if (!currentSocket || currentSocket.readyState !== WebSocket.OPEN) return;
          if (!currentVideo || !currentVideo.videoWidth || !currentVideo.videoHeight || !canvas) return;

          context.drawImage(currentVideo, 0, 0, canvas.width, canvas.height);
          const image = canvas.toDataURL('image/jpeg', 0.75);
          currentSocket.send(JSON.stringify({ image }));
        }, AI_FRAME_INTERVAL_MS);
      };

      socket.onerror = (error) => {
        console.warn('AI monitoring websocket error', error);
      };
    } catch (error) {
      console.warn('AI monitoring could not start', error);
    }
  }, []);

  const finishAiMonitoring = useCallback(async () => {
    const currentSessionId = getJSON(STORAGE_KEYS.sessionId, null);
    if (!currentSessionId) throw new Error('Cannot finish AI monitoring because Session Id is missing.');

    if (aiFrameTimerRef.current) {
      window.clearInterval(aiFrameTimerRef.current);
      aiFrameTimerRef.current = null;
    }

    if (aiMonitoringSocketRef.current && aiMonitoringSocketRef.current.readyState === WebSocket.OPEN) {
      aiMonitoringSocketRef.current.close();
    }
    aiMonitoringSocketRef.current = null;

    if (aiMonitoringStreamRef.current) {
      aiMonitoringStreamRef.current.getTracks().forEach((track) => track.stop());
      aiMonitoringStreamRef.current = null;
    }

    aiMonitoringStartedRef.current = false;

    const aiResult = await aiApi.finishSession(currentSessionId);

    try {
      await forwardAiResultToBackend(currentSessionId, aiResult);
    } catch (saveError) {
      console.warn('AI result was returned but could not be saved to backend:', saveError);
    }

    return aiResult;
  }, []);

  const prepareStudentAnswers = useCallback(async ({ allowIncomplete = false, unansweredValue = 'Not Answered' } = {}) => {
    const freshExamId = getJSON(STORAGE_KEYS.examId, null);
    const freshSessionId = getJSON(STORAGE_KEYS.sessionId, null);

    if (!freshExamId || !freshSessionId) {
      await Swal.fire({
        icon: 'error',
        title: 'Missing session data',
        text: 'Exam session data is missing. Please restart the exam.',
        confirmButtonColor: '#27285d',
      });
      return null;
    }

    let questions = [];
    try {
      questions = await backendApi.getQuestionsByExam(freshExamId);
    } catch (error) {
      console.warn('Could not load /api/Questions/exam before submit; using already loaded exam questions.', error);
      questions = getExamQuestions(examRef.current);
    }

    questions = sortQuestions(Array.isArray(questions) ? questions : []);

    if (!questions.length) {
      await Swal.fire({
        icon: 'error',
        title: 'Submit failed',
        text: 'Could not load exam questions before submitting.',
        confirmButtonColor: '#27285d',
      });
      return null;
    }

    const answers = [];
    let unansweredCount = 0;

    questions.forEach((question, index) => {
      const questionId = question.id ?? question.Id;
      const selectedAnswer = selectedAnswersRef.current[String(questionId)] || selectedAnswersRef.current[String(index)] || '';
      if (!selectedAnswer) unansweredCount += 1;
      answers.push({
        sessionId: Number(freshSessionId),
        questionId,
        selectedAnswer: selectedAnswer || unansweredValue,
      });
    });

    if (!allowIncomplete && unansweredCount > 0) {
      await Swal.fire({
        icon: 'warning',
        title: 'Wait!',
        text: `You have ${unansweredCount} unanswered questions. Please answer all questions before submitting.`,
        confirmButtonColor: '#27285d',
      });
      return null;
    }

    return answers;
  }, []);

  const endExam = useCallback(async (options = {}) => {
    const forceSubmit = Boolean(options.forceSubmit) || examTimerExpiredRef.current;
    const submitReason = options.reason || (forceSubmit ? 'timer' : 'manual');

    if (examSubmissionInProgressRef.current || examWasSubmittedRef.current) return;

    const freshSessionId = getJSON(STORAGE_KEYS.sessionId, null);
    const freshStudentId = getJSON(STORAGE_KEYS.studentId, null);
    const leavingExamValue = getJSON(STORAGE_KEYS.leavingExam, 0) || 0;

    if (!freshSessionId || !freshStudentId) {
      await Swal.fire({
        icon: 'error',
        title: 'Missing session data',
        text: 'Session ID or Student ID is missing. Please restart the exam.',
        confirmButtonColor: '#27285d',
      });
      return;
    }

    const answers = await prepareStudentAnswers({
      allowIncomplete: forceSubmit,
      unansweredValue: 'Not Answered',
    });

    if (answers === null) return;

    if (!forceSubmit) {
      const { value: typedStudentId } = await Swal.fire({
        title: 'Student Identity',
        text: 'Enter your Student ID to end',
        input: 'text',
        showCancelButton: true,
        confirmButtonColor: '#27285d',
        inputAttributes: {
          autocomplete: 'off',
          autocapitalize: 'off',
          autocorrect: 'off',
        },
        inputValidator: (value) => {
          if (!value) return 'Please enter your ID!';
          if (String(freshStudentId) !== String(value)) return 'This is not your ID!';
          return undefined;
        },
      });

      if (!typedStudentId) return;
    }

    examSubmissionInProgressRef.current = true;

    Swal.fire({
      title: forceSubmit ? "Time's Up! Submitting exam..." : 'Submitting exam...',
      text: 'Please wait while we send your answers and monitoring evidence.',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      Swal.update({
        title: 'Saving monitoring evidence...',
        text: 'Please wait while we send AI screenshots and cheating result to the backend.',
      });

      try {
        await finishAiMonitoring();
      } catch (monitoringError) {
        console.warn('AI monitoring evidence was not saved, submitting answers anyway:', monitoringError);
      }

      Swal.update({
        title: 'Submitting answers...',
        text: 'Please wait while we submit your exam answers.',
      });

      await backendApi.submitExam(freshSessionId, {
        answers,
        leavingExam: Number(leavingExamValue),
      });

      examWasSubmittedRef.current = true;
      examSubmissionInProgressRef.current = false;
      disableExamNavigationProtection();

      if (timerIntervalRef.current) {
        window.clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }

      clearExamRuntimeStorage();

      await Swal.fire({
        icon: 'success',
        title: 'Success',
        text: submitReason === 'timer' ? 'Time is over. Your exam was submitted successfully!' : 'Exam submitted successfully!',
        timer: 2000,
        showConfirmButton: false,
      });

      navigate('/', { replace: true });
    } catch (error) {
      examSubmissionInProgressRef.current = false;
      console.error('End exam failed:', error);

      await Swal.fire({
        icon: 'error',
        title: 'Submit failed',
        text: 'The exam was not submitted. Please check the connection and try Submit again.',
        confirmButtonColor: '#27285d',
      });
    }
  }, [disableExamNavigationProtection, finishAiMonitoring, navigate, prepareStudentAnswers]);

  const startExamTimer = useCallback((timeInMinutes) => {
    if (timerIntervalRef.current) {
      window.clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    examTimerExpiredRef.current = false;
    setTimerWarning(false);
    setTimerDisplay(formatInitialTimer(timeInMinutes));

    const durationInMs = Number(timeInMinutes) * 60 * 1000;
    const endTime = Date.now() + durationInMs;

    timerIntervalRef.current = window.setInterval(() => {
      const timeLeftInMs = endTime - Date.now();

      if (timeLeftInMs <= 0) {
        if (timerIntervalRef.current) {
          window.clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }

        setTimerDisplay('00:00');
        setTimerWarning(true);
        examTimerExpiredRef.current = true;
        endExam({ forceSubmit: true, reason: 'timer' });
        return;
      }

      const totalSeconds = Math.floor(timeLeftInMs / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      setTimerDisplay(`${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
      setTimerWarning(totalSeconds <= 120);
    }, 1000);
  }, [endExam]);

  const setupExamNavigationProtection = useCallback(() => {
    if (examNavigationProtectionEnabledRef.current) return () => {};
    examNavigationProtectionEnabledRef.current = true;

    try {
      window.history.pushState({ examLocked: true }, '', window.location.href);
    } catch (error) {
      console.warn('Could not lock browser history', error);
    }

    const onPopState = () => {
      if (!examNavigationProtectionEnabledRef.current || examWasSubmittedRef.current) return;
      try {
        window.history.pushState({ examLocked: true }, '', window.location.href);
      } catch (error) {
        console.warn('Could not restore exam history state', error);
      }

      incrementLeavingExamCounter('browser_back_or_forward');
      Swal.fire({
        title: 'Navigation Blocked',
        text: 'You cannot leave or navigate away during an active exam.',
        icon: 'warning',
        confirmButtonColor: '#27285d',
        allowOutsideClick: false,
        allowEscapeKey: false,
      });
    };

    const onBeforeUnload = (event) => {
      if (!examNavigationProtectionEnabledRef.current || examWasSubmittedRef.current) return undefined;
      event.preventDefault();
      event.returnValue = '';
      return '';
    };

    const onKeyDown = (event) => {
      if (!examNavigationProtectionEnabledRef.current || examWasSubmittedRef.current) return;
      const key = event.key;
      const lowerKey = key.toLowerCase();
      const isReloadKey = key === 'F5' || ((event.ctrlKey || event.metaKey) && lowerKey === 'r');
      const isNavigationKey = (event.altKey && (key === 'ArrowLeft' || key === 'ArrowRight')) || key === 'BrowserBack' || key === 'BrowserForward';
      const isFullscreenToggleKey = key === 'F11';

      if (isReloadKey || isNavigationKey || isFullscreenToggleKey) {
        event.preventDefault();
        event.stopPropagation();
        incrementLeavingExamCounter('reload_or_navigation_key');
        Swal.fire({
          title: 'Action Blocked',
          text: 'Reloading, browser navigation, and leaving full screen are not allowed during the exam.',
          icon: 'warning',
          confirmButtonColor: '#27285d',
          allowOutsideClick: false,
          allowEscapeKey: false,
        });
      }
    };

    const onBlur = () => {
      if (!examNavigationProtectionEnabledRef.current || examWasSubmittedRef.current || examSubmissionInProgressRef.current) return;
      incrementLeavingExamCounter('window_blur');
      Swal.fire({
        title: 'Cheating Attempt Detected!',
        text: 'Leaving the exam page is recorded. Please return to the exam.',
        icon: 'warning',
        confirmButtonColor: '#27285d',
        confirmButtonText: 'I understand, return to exam',
        allowOutsideClick: false,
        allowEscapeKey: false,
      });
    };

    window.addEventListener('popstate', onPopState);
    window.addEventListener('beforeunload', onBeforeUnload);
    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('blur', onBlur);

    return () => {
      window.removeEventListener('popstate', onPopState);
      window.removeEventListener('beforeunload', onBeforeUnload);
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('blur', onBlur);
      examNavigationProtectionEnabledRef.current = false;
    };
  }, []);

  const setupFullscreenGuard = useCallback(() => {
    if (examFullscreenGuardEnabledRef.current) return () => {};
    examFullscreenGuardEnabledRef.current = true;

    const onFullscreenChange = async () => {
      if (!examFullscreenGuardEnabledRef.current || examWasSubmittedRef.current || examSubmissionInProgressRef.current) return;
      if (document.fullscreenElement || fullscreenPromptActiveRef.current) return;

      fullscreenPromptActiveRef.current = true;
      incrementLeavingExamCounter('fullscreen_exit');

      try {
        await Swal.fire({
          title: 'Full Screen Required',
          text: 'Leaving full-screen mode is not allowed during the exam. Click Continue to return.',
          icon: 'warning',
          confirmButtonColor: '#27285d',
          confirmButtonText: 'Continue',
          allowOutsideClick: false,
          allowEscapeKey: false,
        });
        await enterExamFullscreen();
      } catch (error) {
        console.warn('Could not return to full screen', error);
      } finally {
        fullscreenPromptActiveRef.current = false;
      }
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      examFullscreenGuardEnabledRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (initializedRef.current) return undefined;
    initializedRef.current = true;
    let mounted = true;
    let removeNavigationProtection = null;
    let removeFullscreenGuard = null;

    const initializeExamPage = async () => {
      const freshExamId = getJSON(STORAGE_KEYS.examId, null);
      const freshStudentId = getJSON(STORAGE_KEYS.studentId, null);
      const storedSubjectCode = getJSON(STORAGE_KEYS.subjectCode, null);
      let freshSessionId = getJSON(STORAGE_KEYS.sessionId, null);

      if (!freshExamId || !freshStudentId || !storedSubjectCode) {
        await Swal.fire({
          icon: 'error',
          title: 'Missing exam data',
          text: 'Please enter the subject code and your Student ID before opening the exam page.',
          confirmButtonColor: '#27285d',
          allowOutsideClick: false,
          allowEscapeKey: false,
        });
        navigate('/exams', { replace: true });
        return;
      }

      if (!freshSessionId) {
        try {
          Swal.fire({
            title: 'Checking exam attempt...',
            text: 'Please wait while we verify your exam access.',
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            didOpen: () => Swal.showLoading(),
          });

          await precheckExamAttempt(storedSubjectCode, freshStudentId, freshExamId);
          Swal.close();
        } catch (error) {
          Swal.close();
          console.warn('Exam precheck failed before camera access:', error);
          resetExamStartStorage();

          await Swal.fire({
            icon: 'error',
            title: 'Cannot start exam',
            text: error.message || 'You cannot start this exam.',
            confirmButtonColor: '#27285d',
            allowOutsideClick: false,
            allowEscapeKey: false,
          });

          navigate('/exams', { replace: true });
          return;
        }
      }

      const accessGranted = await requestCameraAccess();
      if (!accessGranted) return;

      if (!freshSessionId) {
        try {
          Swal.fire({
            title: 'Starting Exam...',
            text: 'Please wait while we create your exam session.',
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            didOpen: () => Swal.showLoading(),
          });

          freshSessionId = await joinExamSessionAfterAccess(freshExamId, freshStudentId);
          Swal.close();
        } catch (error) {
          console.error('Could not create exam session after access was granted:', error);
          Swal.close();
          stopAiTransport();
          await exitFullscreenIfNeeded();

          await Swal.fire({
            icon: 'error',
            title: 'Could not start exam',
            text: error.message?.split(/Status: \d+\. /)[1] || error.message || 'Something went wrong while starting the exam session.',
            confirmButtonColor: '#27285d',
            allowOutsideClick: false,
            allowEscapeKey: false,
          });

          navigate('/exams', { replace: true });
          return;
        }
      }

      try {
        const examData = await backendApi.getExam(freshExamId);
        const normalizedQuestions = sortQuestions(getExamQuestions(examData));
        const normalizedExam = { ...examData, questions: normalizedQuestions };
        if (!mounted) return;

        setExam(normalizedExam);
        setTimerDisplay(formatInitialTimer(normalizedExam.durationMinutes));
        setLoading(false);

        removeNavigationProtection = setupExamNavigationProtection();
        removeFullscreenGuard = setupFullscreenGuard();
        startExamTimer(normalizedExam.durationMinutes);
        await startAiMonitoring();
      } catch (error) {
        console.error('Could not load exam page:', error);
        setStartupError(error.message || 'Could not load exam.');
        setLoading(false);
      }
    };

    initializeExamPage();

    return () => {
      mounted = false;
      if (timerIntervalRef.current) {
        window.clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      removeNavigationProtection?.();
      removeFullscreenGuard?.();
      disableExamNavigationProtection();
      stopAiTransport();
    };
  }, [disableExamNavigationProtection, joinExamSessionAfterAccess, navigate, requestCameraAccess, setupExamNavigationProtection, setupFullscreenGuard, startAiMonitoring, startExamTimer, stopAiTransport]);

  const studentId = getJSON(STORAGE_KEYS.studentId, null);
  const studentName = getJSON(STORAGE_KEYS.studentName, null);
  const questions = getExamQuestions(exam);

  const handleAnswerChange = (question, index, value) => {
    const questionId = question.id ?? question.Id ?? index;
    setSelectedAnswers((current) => ({ ...current, [String(questionId)]: value }));
  };

  if (loading) {
    return (
      <main className="exam-loading-shell d-flex justify-content-center align-items-center">
        <video ref={videoRef} id="webcam-preview" className="d-none" autoPlay playsInline muted />
        <Loader />
      </main>
    );
  }

  if (startupError) {
    return (
      <main className="exam-loading-shell d-flex justify-content-center align-items-center p-4">
        <div className="card shadow-sm border-0 p-4 text-center">
          <h2 className="fw-bold text-danger">Could not load exam</h2>
          <p className="text-muted">{startupError}</p>
          <button className="btn start-btn px-4" onClick={() => navigate('/exams', { replace: true })}>Back to Exams</button>
        </div>
      </main>
    );
  }

  return (
    <main className="exam-page">
      <video ref={videoRef} id="webcam-preview" className="d-none" autoPlay playsInline muted />
      <nav className="exam-navbar navbar fixed-top py-3 d-flex align-items-center">
        <div className="container-fluid px-4 position-relative d-flex flex-wrap align-items-center">
          <div className="d-flex flex-column text-white">
            <div className="fw-bold"><span className="fw-lighter fs-6">Welcome,</span> {studentName}</div>
            <div className="student-id mt-1 opacity-75">ID: {studentId}</div>
          </div>

          <div className="info-center position-absolute top-50 start-50 translate-middle d-flex gap-4 flex-wrap">
            <div className="info-item d-flex flex-column align-items-center text-white">
              <span className="opacity-75">Subject</span>
              <strong className="fw-semibold">{exam.subject}</strong>
            </div>
            <div className="info-item d-flex flex-column align-items-center text-white">
              <span className="opacity-75">Questions</span>
              <strong className="fw-semibold">{questions.length}</strong>
            </div>
          </div>

          <div className={`timer-box bg-white ms-auto fw-semibold rounded-5 py-2 px-4 ${timerWarning ? 'time-out' : ''}`}>
            <i className="fa-regular fa-clock" /> <span id="timer-display">{timerDisplay}</span>
          </div>
        </div>
      </nav>

      <section className="exam-content container py-5 my-5">
        <div id="questionsContainer" className='mt-3 pt-3'>
          {questions.map((question, index) => {
            const questionId = question.id ?? question.Id ?? index;
            const name = `q${index}`;
            return (
              <div className="card question-card p-4 shadow-sm rounded-4 mb-4" key={questionId}>
                <div className="d-flex align-items-start mb-3">
                  <span className="badge rounded-pill me-3 mt-1 text-white">Q{index + 1}</span>
                  <h5 className="question-text">{question.questionText || question.QuestionText}</h5>
                </div>
                <div className="options-list">
                  {[
                    ['A', question.optionA || question.OptionA],
                    ['B', question.optionB || question.OptionB],
                    ['C', question.optionC || question.OptionC],
                    ['D', question.optionD || question.OptionD],
                  ].map(([option, text]) => {
                    const id = `q${index}${option.toLowerCase()}`;
                    return (
                      <label className="form-check option-container d-flex align-items-center rounded-4" htmlFor={id} key={option}>
                        <input
                          className="form-check-input me-3"
                          type="radio"
                          name={name}
                          id={id}
                          value={option}
                          checked={selectedAnswers[String(questionId)] === option}
                          onChange={() => handleAnswerChange(question, index, option)}
                        />
                        <span className="form-check-label w-100">{text}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        <div className="d-flex justify-content-end my-4">
          <button type="button" className="btn end-btn px-5 py-2 fw-bold rounded-3" onClick={() => endExam()}>Submit Exam</button>
        </div>
      </section>
    </main>
  );
}
