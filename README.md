# React Frontend Migration

This folder is a React + Vite migration of the original vanilla HTML/CSS/JavaScript frontend. The backend and AI monitoring server are intentionally unchanged.

## Run locally

```bash
cd React-Frontend
npm install
cp .env.example .env
npm run dev
```

Open the Vite URL shown in the terminal.

## Build

```bash
npm run build
npm run preview
```

The production build output is generated in `dist/`.

## Environment variables

Create `.env` from `.env.example`:

```env
VITE_BACKEND_URL=https://crawling-prong-rotunda.ngrok-free.dev
VITE_AI_SERVER_URL=https://coralie-dumpy-taunya.ngrok-free.dev
```

Both URLs are also configured with the same legacy hardcoded fallbacks in the React clients so the migrated frontend can still run when `.env` is not present.

## Old HTML page to React route map

| Old page | New route | React page |
| --- | --- | --- |
| `index.html` | `/` | `src/pages/HomePage.jsx` |
| `login.html` | `/login` | `src/pages/LoginPage.jsx` |
| `exams.html` | `/exams` | `src/pages/ExamsPage.jsx` |
| `addExam.html` | `/add-exam` | `src/pages/AddExamPage.jsx` |
| `profile.html` | `/profile` | `src/pages/ProfilePage.jsx` |
| `exam.html` | `/exam` | `src/pages/ExamPage.jsx` |
| `about.html` | `/about` | `src/pages/AboutPage.jsx` |

Compatibility redirects for the old `.html` paths are defined in `src/App.jsx`.

## Project structure

```text
src/
  api/
    backendClient.js      # Backend fetch wrapper and all backend endpoint calls
    aiClient.js           # AI server REST + websocket URL helpers
  components/
    Navbar.jsx
    Footer.jsx
    ExamCard.jsx
    DoctorExamCard.jsx
    ExamSchedule.jsx
    Loader.jsx
    NoExams.jsx
    QuestionEditor.jsx
  hooks/
    useAuthState.js
    useBodyClass.js
    usePageTitle.js
    useStartExamFlow.js
  pages/
    HomePage.jsx
    LoginPage.jsx
    ExamsPage.jsx
    AddExamPage.jsx
    ProfilePage.jsx
    ExamPage.jsx
    AboutPage.jsx
    NotFoundPage.jsx
  utils/
    aiResult.js
    alerts.js
    datetime.js
    download.js
    examAvailability.js
    precheckExamAttempt.js
    storage.js
  styles/
    style.css             # Imports the original CSS and adds React-specific compatibility fixes
```

The original static assets were migrated to `public/assets/` and the original design CSS is reused through `src/styles/style.css`.

## Preserved localStorage keys

The React migration keeps the same key names used by the vanilla frontend:

- `token`
- `Doctor Id`
- `Updated Exam Id`
- `Exam Id`
- `Student Id`
- `Student Name`
- `Session Id`
- `Leaving Exam`
- `Subject Code`
- `AI_SERVER_URL`

Legacy keys that existed in the original script are also documented in `src/utils/storage.js` for compatibility: `comments`, `exams`, `logged-in doctor`, `updatedIndex`, `current exam`, and `current student`.

## Backend endpoints used by the React frontend

The migration preserves the existing backend contracts and does not introduce new backend routes.

- `POST /api/Auth/login`
- `GET /api/Exams/available`
- `GET /api/Exams/my-exams`
- `GET /api/Exams/{id}`
- `POST /api/Exams`
- `PUT /api/Exams/{id}`
- `DELETE /api/Exams/{id}`
- `PATCH /api/Exams/{id}/status`
- `POST /api/Questions/bulk`
- `GET /api/Questions/exam/{examId}`
- `GET /api/Users/{doctorId}/profile`
- `GET /api/Students`
- `POST /api/ExamSessions/join`
- `POST /api/ExamSessions/{sessionId}/submit`
- `POST /api/ExamSessions/{sessionId}/ai-result`
- `GET /api/ExamReports/exam/{examId}/export`
- `POST /api/Comments`

Instructor-only requests still send the existing `Authorization: Bearer <token>` header. `ngrok-skip-browser-warning: true` is preserved for the same ngrok-based flow.

## AI monitoring flow preserved

The exam page keeps the original proctoring flow:

1. The student enters subject code and student ID from `/exams`.
2. The frontend checks whether the student already took the exam using the current exam details and session list before camera, fullscreen, or backend session creation.
3. The exam page requests fullscreen and camera access.
4. Only after access is accepted, the frontend creates the backend `ExamSession` through `POST /api/ExamSessions/join`.
5. The frontend calls `POST /ai/sessions/start`.
6. The webcam frame stream is sent to `WS /ai/sessions/{sessionId}/stream` every 200 ms.
7. On submit or timer auto-submit, the frontend calls `POST /ai/sessions/{sessionId}/finish`.
8. The AI result is forwarded to `POST /api/ExamSessions/{sessionId}/ai-result` so reports receive `cheatingCount` and `screenshotsUrl`.

If the AI server is temporarily unavailable, the frontend logs the monitoring failure and continues submitting the student answers, matching the existing behavior.

## Behavior-preserving details

- Doctor login stores `token` and `Doctor Id` exactly as before.
- Logout removes only `token`, matching the old frontend.
- Exam creation uses `POST /api/Exams`, then `POST /api/Questions/bulk`.
- Exam update uses `PUT /api/Exams/{id}` with questions embedded in the exam payload, matching the current backend update contract.
- Active From and Active To are sent from `datetime-local` without converting the doctor-selected local time to UTC.
- Student exam listing shows active scheduled exams before `Active From`, blocks start before `Active From`, hides exams after `Active To`, and hides inactive exams.
- The backend `ExamSession` is not created until camera and fullscreen are accepted.
- Timer auto-submit sends unanswered questions as `Not Answered` and includes only `{ answers, leavingExam }` in the submit body.
- Manual submit warns about unanswered questions before sending.
- Browser back/forward, reload shortcuts, fullscreen exit, and window blur are blocked or recorded through the preserved leaving-exam counter.
- Report download still calls the existing export endpoint.

## Backend and AI server changes

No backend changes were required.

No AI server changes were required.

## Validation performed

```bash
npm install
npm run build
```

Both commands completed successfully.

## Manual regression checklist

Use this checklist against the uploaded backend and AI server:

1. Doctor login.
2. Doctor creates exam with Active From / Active To.
3. Scheduled exam appears to student before start but cannot start.
4. Exam starts after Active From.
5. Student enters code + ID.
6. If student already took exam, they are blocked before camera/fullscreen.
7. If student refuses camera/fullscreen, no session is created.
8. If student accepts, session is created and exam starts.
9. AI monitoring starts.
10. Leaving exam/fullscreen/blur counter works.
11. Manual submit works.
12. Timer auto-submit works with unanswered questions.
13. Unanswered questions are counted wrong by backend because `Not Answered` is submitted.
14. AI evidence reaches backend/report.
15. Doctor downloads report and sees cheating count + screenshots URL.
16. Doctor updates exam without backend 500 errors.
17. Doctor toggles Active/Inactive.
18. No broken routes, no missing assets, no console errors.
