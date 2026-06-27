import { backendApi } from '../api/backendClient.js';
import { getJSON, STORAGE_KEYS } from './storage.js';

export function pickFirstDefined(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim() !== '') return value;
  }
  return null;
}

export function findFirstUrlDeep(value, depth = 0) {
  if (depth > 5 || value === null || value === undefined) return null;

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findFirstUrlDeep(item, depth + 1);
      if (found) return found;
    }
    return null;
  }

  if (typeof value === 'object') {
    const priorityKeys = [
      'screenshotsUrl', 'ScreenshotsUrl', 'screenshotUrl', 'ScreenshotUrl',
      'screenshotsURL', 'screenshotURL', 'screenshots_url', 'screenshot_url',
      'evidenceUrl', 'EvidenceUrl', 'evidenceURL', 'evidence_url',
      'folderUrl', 'FolderUrl', 'folder_url', 'driveUrl', 'DriveUrl', 'url', 'link',
    ];

    for (const key of priorityKeys) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        const found = findFirstUrlDeep(value[key], depth + 1);
        if (found) return found;
      }
    }

    for (const key of Object.keys(value)) {
      const found = findFirstUrlDeep(value[key], depth + 1);
      if (found) return found;
    }
  }

  return null;
}

export function findFirstNumberDeep(value, possibleKeys = [], depth = 0) {
  if (depth > 5 || value === null || value === undefined) return null;

  if (typeof value === 'number' && Number.isFinite(value)) return value;

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findFirstNumberDeep(item, possibleKeys, depth + 1);
      if (found !== null) return found;
    }
    return null;
  }

  if (typeof value === 'object') {
    for (const key of possibleKeys) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        const found = findFirstNumberDeep(value[key], possibleKeys, depth + 1);
        if (found !== null) return found;
      }
    }

    for (const key of Object.keys(value)) {
      if (possibleKeys.length > 0 && !possibleKeys.includes(key)) continue;
      const found = findFirstNumberDeep(value[key], possibleKeys, depth + 1);
      if (found !== null) return found;
    }
  }

  if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) {
    return Number(value);
  }

  return null;
}

function getAiSource(aiResult) {
  return aiResult?.payload ||
    aiResult?.data?.payload ||
    aiResult?.result?.payload ||
    aiResult?.data ||
    aiResult?.result ||
    aiResult ||
    {};
}

export async function forwardAiResultToBackend(sessionIdValue, aiResult = {}) {
  const currentStudentUniversityID = getJSON(STORAGE_KEYS.studentId, null);
  if (!sessionIdValue || !currentStudentUniversityID) return null;

  const source = getAiSource(aiResult);
  const nestedPayload = aiResult?.payload || aiResult?.data?.payload || aiResult?.result?.payload || {};

  const cheatingCountValue = pickFirstDefined(
    source.cheatingCount,
    source.CheatingCount,
    source.cheating_count,
    source.totalCheatingCount,
    source.total_cheating_count,
    source.count,
    nestedPayload.cheatingCount,
    nestedPayload.CheatingCount,
    nestedPayload.cheating_count,
    findFirstNumberDeep(source, [
      'cheatingCount', 'CheatingCount', 'cheating_count',
      'totalCheatingCount', 'total_cheating_count', 'count',
    ]),
  );

  const screenshotsUrlValue = pickFirstDefined(
    source.screenshotsUrl,
    source.ScreenshotsUrl,
    source.screenshotUrl,
    source.ScreenshotUrl,
    source.screenshotsURL,
    source.screenshotURL,
    source.screenshots_url,
    source.screenshot_url,
    source.evidenceUrl,
    source.EvidenceUrl,
    source.evidenceURL,
    source.evidence_url,
    source.folderUrl,
    source.FolderUrl,
    source.folder_url,
    source.driveUrl,
    source.DriveUrl,
    source.url,
    source.link,
    nestedPayload.screenshotsUrl,
    nestedPayload.ScreenshotsUrl,
    nestedPayload.screenshots_url,
    findFirstUrlDeep(source),
  );

  const payload = {
    studentUniversityID: String(currentStudentUniversityID),
    cheatingCount: Number(cheatingCountValue ?? 0) || 0,
    screenshotsUrl: screenshotsUrlValue ? String(screenshotsUrlValue) : 'Not Available',
  };

  return backendApi.submitAiResult(sessionIdValue, payload);
}
