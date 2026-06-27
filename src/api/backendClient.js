import { getToken } from '../utils/storage.js';
import { getApiErrorMessage } from '../utils/alerts.js';

const FALLBACK_BACKEND_URL = 'https://crawling-prong-rotunda.ngrok-free.dev';

export const BACKEND_BASE_URL = (import.meta.env.VITE_BACKEND_URL || FALLBACK_BACKEND_URL).replace(/\/+$/, '');

function buildHeaders({ json = true, auth = false, extraHeaders = {} } = {}) {
  const headers = {
    'ngrok-skip-browser-warning': 'true',
    ...extraHeaders,
  };

  if (json) headers['Content-Type'] = 'application/json';

  const token = getToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  return headers;
}

async function parseResponse(response, { raw = false, fallbackError = 'Request failed' } = {}) {
  if (raw) {
    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(getApiErrorMessage(errorText, `${fallbackError}. Status: ${response.status}`));
    }
    return response;
  }

  if (response.status === 204) return null;

  const text = await response.text();
  const contentType = response.headers.get('content-type') || '';
  const data = text && contentType.includes('application/json') ? JSON.parse(text) : text;

  if (!response.ok) {
    throw new Error(getApiErrorMessage(text, `${fallbackError}. Status: ${response.status}`));
  }

  return data;
}

export async function backendRequest(path, options = {}) {
  const {
    method = 'GET',
    body,
    auth = false,
    raw = false,
    json = true,
    headers: extraHeaders = {},
    signal,
    fallbackError,
  } = options;

  const response = await fetch(`${BACKEND_BASE_URL}${path}`, {
    method,
    headers: buildHeaders({ json: json && body !== undefined, auth, extraHeaders }),
    body: body === undefined ? undefined : json ? JSON.stringify(body) : body,
    signal,
  });

  return parseResponse(response, { raw, fallbackError });
}

export const backendApi = {
  login(credentials) {
    return backendRequest('/api/Auth/login', {
      method: 'POST',
      body: credentials,
      fallbackError: 'Login failed',
    });
  },

  getAvailableExams() {
    return backendRequest('/api/Exams/available', { json: false, fallbackError: 'Could not load available exams' });
  },

  getExam(examId, { auth = false } = {}) {
    return backendRequest(`/api/Exams/${examId}`, { auth, json: false, fallbackError: 'Could not load exam' });
  },

  createExam(payload) {
    return backendRequest('/api/Exams', {
      method: 'POST',
      auth: true,
      body: payload,
      fallbackError: 'Could not publish exam',
    });
  },

  getMyExams() {
    return backendRequest('/api/Exams/my-exams', { auth: true, json: false, fallbackError: 'Could not load my exams' });
  },

  updateExam(examId, payload) {
    return backendRequest(`/api/Exams/${examId}`, {
      method: 'PUT',
      auth: true,
      body: payload,
      fallbackError: 'Could not update exam',
    });
  },

  changeExamStatus(examId, status) {
    return backendRequest(`/api/Exams/${examId}/status`, {
      method: 'PATCH',
      auth: true,
      body: status,
      fallbackError: 'Could not update exam status',
    });
  },

  deleteExam(examId) {
    return backendRequest(`/api/Exams/${examId}`, {
      method: 'DELETE',
      auth: true,
      body: undefined,
      json: false,
      fallbackError: 'Could not delete exam',
    });
  },

  bulkCreateQuestions(questions) {
    return backendRequest('/api/Questions/bulk', {
      method: 'POST',
      auth: true,
      body: questions,
      fallbackError: 'Exam was created, but questions could not be saved',
    });
  },

  getQuestionsByExam(examId) {
    return backendRequest(`/api/Questions/exam/${examId}`, {
      auth: true,
      json: false,
      fallbackError: 'Could not load exam questions',
    });
  },

  getDoctorProfile(doctorId) {
    return backendRequest(`/api/Users/${doctorId}/profile`, { json: false, fallbackError: 'Could not load doctor profile' });
  },

  getStudents() {
    return backendRequest('/api/Students', { json: false, fallbackError: 'Could not load students' });
  },

  joinExamSession(payload) {
    return backendRequest('/api/ExamSessions/join', {
      method: 'POST',
      body: payload,
      fallbackError: 'Failed to join exam session',
    });
  },

  submitExam(sessionId, payload) {
    return backendRequest(`/api/ExamSessions/${sessionId}/submit`, {
      method: 'POST',
      body: payload,
      fallbackError: 'Exam submit failed',
    });
  },

  submitAiResult(sessionId, payload) {
    return backendRequest(`/api/ExamSessions/${sessionId}/ai-result`, {
      method: 'POST',
      body: payload,
      fallbackError: 'Saving AI result failed',
    });
  },

  downloadExamReportByExamId(examId) {
    return backendRequest(`/api/ExamReports/exam/${examId}/export`, {
      auth: true,
      raw: true,
      json: false,
      fallbackError: 'Report download failed',
    });
  },

  addComment(payload) {
    return backendRequest('/api/Comments', {
      method: 'POST',
      body: payload,
      fallbackError: 'Could not submit comment',
    });
  },
};
