import { STORAGE_KEYS } from '../utils/storage.js';

const FALLBACK_AI_SERVER_URL = 'https://coralie-dumpy-taunya.ngrok-free.dev';

function getLocalStorageAiUrl() {
  try {
    return window.localStorage.getItem(STORAGE_KEYS.aiServerUrl);
  } catch {
    return null;
  }
}

export function getAiBaseUrl() {
  return (import.meta.env.VITE_AI_SERVER_URL || getLocalStorageAiUrl() || FALLBACK_AI_SERVER_URL).replace(/\/+$/, '');
}

export function getAiWebSocketUrl(sessionId) {
  return `${getAiBaseUrl().replace(/^http/i, 'ws')}/ai/sessions/${sessionId}/stream`;
}

export const aiApi = {
  async startSession(sessionId, studentUniversityID) {
    const response = await fetch(`${getAiBaseUrl()}/ai/sessions/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: Number(sessionId),
        studentUniversityID: String(studentUniversityID),
      }),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`AI monitoring start failed: ${response.status} ${text}`);
    }

    return response.json().catch(() => ({ ok: true }));
  },

  async finishSession(sessionId) {
    const response = await fetch(`${getAiBaseUrl()}/ai/sessions/${sessionId}/finish`, {
      method: 'POST',
      headers: {
        'ngrok-skip-browser-warning': 'true',
      },
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      throw new Error(`AI monitoring finish failed: ${response.status} ${text}`);
    }

    return response.json().catch(() => ({ ok: true }));
  },
};




// import { STORAGE_KEYS } from '../utils/storage.js';

// const FALLBACK_AI_SERVER_URL = 'https://scuba-laptop-croak.ngrok-free.dev';

// function getLocalStorageAiUrl() {
//   try {
//     return window.localStorage.getItem(STORAGE_KEYS.aiServerUrl);
//   } catch {
//     return null;
//   }
// }

// export function getAiBaseUrl() {
//   return (
//     import.meta.env.VITE_AI_SERVER_URL ||
//     getLocalStorageAiUrl() ||
//     FALLBACK_AI_SERVER_URL
//   ).replace(/\/+$/, '');
// }

// export function getAiWebSocketUrl(sessionId) {
//   // تم إضافة الـ Backticks هنا
//   return `${getAiBaseUrl().replace(/^http/i, 'ws')}/ai/sessions/${sessionId}/stream`;
// }

// async function parseJsonSafe(response) {
//   if (response.status === 204) return null;
//   return response.json().catch(() => null);
// }

// async function aiRequest(path, options = {}) {
//   // تم إضافة الـ Backticks هنا
//   const response = await fetch(`${getAiBaseUrl()}${path}`, {
//     ...options,
//     headers: {
//       'ngrok-skip-browser-warning': 'true',
//       ...(options.headers || {}),
//     },
//   });

//   if (!response.ok && response.status !== 202 && response.status !== 204) {
//     const text = await response.text().catch(() => '');
//     // تم إضافة الـ Backticks هنا
//     throw new Error(`AI request failed: ${response.status} ${text}`);
//   }

//   return parseJsonSafe(response);
// }

// export function captureFrameFromVideo(videoElement) {
//   const canvas = document.createElement('canvas');
//   canvas.width = videoElement.videoWidth;
//   canvas.height = videoElement.videoHeight;

//   const context = canvas.getContext('2d');
//   context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

//   return canvas.toDataURL('image/jpeg', 0.8);
// }

// export const aiApi = {
//   health() {
//     return aiRequest('/health');
//   },

//   startSession(sessionId, studentUniversityID) {
//     return aiRequest('/ai/sessions/start', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({
//         sessionId: Number(sessionId),
//         studentUniversityID: String(studentUniversityID),
//       }),
//     });
//   },

//   submitFrame(sessionId, frameB64, frameId = undefined) {
//     const cleanFrame = frameB64.includes(',')
//       ? frameB64.split(',')[1]
//       : frameB64;

//     // تم إضافة الـ Backticks هنا
//     return aiRequest(`/ai/sessions/${sessionId}/frames`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({
//         frame_b64: cleanFrame,
//         frame_id: frameId,
//         client_ts: Date.now(),
//       }),
//     });
//   },

//   getLatestResult(sessionId) {
//     // تم إضافة الـ Backticks هنا
//     return aiRequest(`/ai/sessions/${sessionId}/results/latest`);
//   },

//   getFrameResult(sessionId, frameId) {
//     // تم إضافة الـ Backticks هنا
//     return aiRequest(`/ai/sessions/${sessionId}/results/${frameId}`);
//   },

//   waitForFrameResult(sessionId, frameId, timeout = 10) {
//     // تم إضافة الـ Backticks هنا
//     return aiRequest(
//       `/ai/sessions/${sessionId}/results/${frameId}/wait?timeout=${timeout}`
//     );
//   },

//   getSessionStats(sessionId) {
//     // تم إضافة الـ Backticks هنا
//     return aiRequest(`/ai/sessions/${sessionId}/stats`);
//   },

//   finishSession(sessionId) {
//     // تم إضافة الـ Backticks هنا
//     return aiRequest(`/ai/sessions/${sessionId}/finish`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ reason: 'exam_completed' }),
//     });
//   },

//   getEvidenceFiles(sessionId) {
//     // تم إضافة الـ Backticks هنا
//     return aiRequest(`/evidence/${sessionId}/`);
//   },

//   getEvidenceReport(sessionId) {
//     // تم إضافة الـ Backticks هنا
//     return aiRequest(`/evidence/${sessionId}/report`);
//   },

//   getEvidenceFileUrl(sessionId, fileName) {
//     // تم إضافة الـ Backticks هنا
//     return `${getAiBaseUrl()}/evidence-files/${sessionId}/${fileName}`;
//   },

//   createWebSocket(sessionId) {
//     return new WebSocket(getAiWebSocketUrl(sessionId));
//   },
// };