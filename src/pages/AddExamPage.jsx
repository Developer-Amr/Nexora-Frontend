import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import Loader from '../components/Loader.jsx';
import QuestionEditor, { emptyQuestion, normalizeQuestion } from '../components/QuestionEditor.jsx';
import { backendApi } from '../api/backendClient.js';
import { datetimeLocalToISOString, nowDatetimeLocalValue, toDatetimeLocalValue } from '../utils/datetime.js';
import { getJSON, setJSON, STORAGE_KEYS } from '../utils/storage.js';
import { Swal, showToast } from '../utils/alerts.js';
import { useBodyClass } from '../hooks/useBodyClass.js';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { useAuthState } from '../hooks/useAuthState.js';

function randomExamCode() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID().slice(0, 8);
  return Math.random().toString(36).slice(2, 10);
}

const universities = [
  "Capital University",
  "Cairo University",
  "Ain Shams University",
  "Alexandria University",
  "Mansoura University"
];

const collegeDepartments = {
  Science: [
    "Computer Science & Statistics", 
    "Computer Science & Mathematics", 
    "Physics", 
    "Chemistry",
    "Biology", 
    "Geology", 
    "Biochemistry", 
    "Mathematics"
  ],
  Engineering: [
    "Civil Engineering",
    "Mechanical Engineering",
    "Electrical Engineering",
    "Computer Engineering",
    "Architecture Engineering",
    "Chemical Engineering",
    "Industrial Engineering"
  ],
  Commerce: [
    "Accounting",
    "Business Administration",
    "Economics",
    "Finance",
    "Marketing",
    "Management Information Systems"
  ],
  Arts: [
    "English Literature",
    "Arabic Literature",
    "History",
    "Geography",
    "Philosophy",
    "Sociology",
    "Psychology",
    "Media Studies"
  ],
};

const initialExamInfo = {
  university: '',
  college: '',
  subject: '',
  department: '',
  level: '',
  durationMinutes: '',
  activeFrom: '',
  activeTo: '',
};

function getQuestionsArray(exam) {
  return Array.isArray(exam?.questions)
    ? exam.questions
    : Array.isArray(exam?.Questions)
      ? exam.Questions
      : [];
}

export default function AddExamPage() {
  useBodyClass('addExam');
  usePageTitle('Add Exam');

  const navigate = useNavigate();
  const { isAuthenticated } = useAuthState();
  const [examInfo, setExamInfo] = useState(initialExamInfo);
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [updatedExamId, setUpdatedExamId] = useState(null);
  const [loadingExistingExam, setLoadingExistingExam] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [minActiveFrom, setMinActiveFrom] = useState(nowDatetimeLocalValue());

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const interval = window.setInterval(() => setMinActiveFrom(nowDatetimeLocalValue()), 60000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const pendingUpdatedExamId = getJSON(STORAGE_KEYS.updatedExamId, null);
    if (!pendingUpdatedExamId) return;

    setIsUpdateMode(true);
    setUpdatedExamId(pendingUpdatedExamId);
    setLoadingExistingExam(true);

    backendApi.getMyExams()
      .then((exams) => {
        const foundExam = (Array.isArray(exams) ? exams : []).find((exam) => String(exam.id) === String(pendingUpdatedExamId));
        if (!foundExam) throw new Error('The selected exam could not be found.');

        setExamInfo({
          university: foundExam.university || '',
          college: foundExam.college || '',
          subject: foundExam.subject || '',
          department: foundExam.department || '',
          level: foundExam.level ?? '',
          durationMinutes: foundExam.durationMinutes ?? '',
          activeFrom: toDatetimeLocalValue(foundExam.activeFrom),
          activeTo: toDatetimeLocalValue(foundExam.activeTo),
        });

        const existingQuestions = getQuestionsArray(foundExam)
          .sort((a, b) => Number(a.orderIndex || a.OrderIndex || 0) - Number(b.orderIndex || b.OrderIndex || 0))
          .map(normalizeQuestion);

        setQuestions(existingQuestions.length ? existingQuestions : [emptyQuestion()]);
      })
      .catch(async (error) => {
        console.error('Could not load exam for update:', error);
        setJSON(STORAGE_KEYS.updatedExamId, null);
        await Swal.fire({ icon: 'error', title: 'Could not load exam', text: error.message || 'Please try again.', confirmButtonColor: '#27285d' });
        navigate('/profile', { replace: true });
      })
      .finally(() => setLoadingExistingExam(false));
  }, [navigate]);

  const invalidFields = useMemo(() => {
    const fields = new Set();
    Object.entries(examInfo).forEach(([key, value]) => {
      if (value === '' || value === null || value === undefined) fields.add(key);
    });

    questions.forEach((question, index) => {
      ['questionText', 'optionA', 'optionB', 'optionC', 'optionD'].forEach((key) => {
        if (!String(question[key] || '').trim()) fields.add(`question-${index}-${key}`);
      });
    });

    if (examInfo.activeFrom && examInfo.activeTo && new Date(examInfo.activeTo) <= new Date(examInfo.activeFrom)) {
      fields.add('activeTo');
    }

    return fields;
  }, [examInfo, questions]);

  const inputClass = (field) => submitted && invalidFields.has(field) ? 'is-invalid' : '';

  const updateExamInfo = (field, value) => {
    setExamInfo((current) => ({
      ...current,
      [field]: value,
      ...(field === 'activeFrom' && current.activeTo && value && new Date(current.activeTo) <= new Date(value) ? { activeTo: '' } : {}),
    }));
  };

  const updateQuestion = (index, updatedQuestion) => {
    setQuestions((current) => current.map((question, questionIndex) => questionIndex === index ? updatedQuestion : question));
  };

  const deleteQuestion = (index) => {
    setQuestions((current) => current.filter((_, questionIndex) => questionIndex !== index));
  };

  const addQuestion = () => {
    setQuestions((current) => [...current, emptyQuestion()]);
  };

  const buildQuestionPayload = (examId = undefined) => questions.map((question, index) => ({
    ...(examId !== undefined ? { examId } : {}),
    questionText: question.questionText,
    optionA: question.optionA,
    optionB: question.optionB,
    optionC: question.optionC,
    optionD: question.optionD,
    correctAnswer: question.correctAnswer,
    orderIndex: index + 1,
  }));

  const validateBeforeSubmit = () => {
    setSubmitted(true);

    if (invalidFields.size > 0) {
      if (invalidFields.has('activeTo') && examInfo.activeFrom && examInfo.activeTo) {
        showToast('error', 'Active To must be after Active From');
      } else {
        showToast('error', 'Some fields are still empty');
      }
      return false;
    }
    return true;
  };

  const handlePublish = async () => {
    if (!validateBeforeSubmit() || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const createPayload = {
        code: randomExamCode(),
        university: examInfo.university,
        college: examInfo.college,
        subject: examInfo.subject,
        department: examInfo.department,
        level: Number(examInfo.level),
        durationMinutes: Number(examInfo.durationMinutes),
        activeFrom: datetimeLocalToISOString(examInfo.activeFrom),
        activeTo: datetimeLocalToISOString(examInfo.activeTo),
      };

      const createdExam = await backendApi.createExam(createPayload);
      const createdExamId = createdExam?.id;
      if (!createdExamId) throw new Error('Create exam response did not include an exam id.');

      await backendApi.bulkCreateQuestions(buildQuestionPayload(createdExamId));
      showToast('success', 'Exam published successfully');
      window.setTimeout(() => navigate('/profile', { replace: true }), 2000);
    } catch (error) {
      console.error('Could not publish exam:', error);
      await Swal.fire({ icon: 'error', title: 'Could not publish exam', text: error.message || 'Please try again.', confirmButtonColor: '#27285d' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!validateBeforeSubmit() || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const updatePayload = {
        code: randomExamCode(),
        subject: examInfo.subject,
        department: examInfo.department,
        university: examInfo.university,
        college: examInfo.college,
        level: Number(examInfo.level),
        durationMinutes: Number(examInfo.durationMinutes),
        activeFrom: datetimeLocalToISOString(examInfo.activeFrom),
        activeTo: datetimeLocalToISOString(examInfo.activeTo),
        questions: buildQuestionPayload(),
      };

      await backendApi.updateExam(updatedExamId, updatePayload);
      showToast('warning', 'Exam updated successfully');
      setJSON(STORAGE_KEYS.updatedExamId, null);
      window.setTimeout(() => navigate('/profile', { replace: true }), 2000);
    } catch (error) {
      console.error('Could not update exam:', error);
      await Swal.fire({ icon: 'error', title: 'Could not update exam', text: error.message || 'Please try again.', confirmButtonColor: '#27285d' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="add-exam-page">
        <section className="container py-3 my-4">
          <div className="d-flex justify-content-between align-items-center mt-2">
            <h2 className="fw-bold addExamHeading">{isUpdateMode ? 'Update Exam' : 'Add New Exam'}</h2>
          </div>

          {loadingExistingExam ? <Loader /> : (
            <form onSubmit={(event) => event.preventDefault()} noValidate>
              <div className="row">
                <div className="col-lg-4 mb-2">
                  <div className="card sidebar-card shadow-sm p-4 mb-1 border-0 round-2">
                    <h5 className="mb-2">Exam Information</h5>
                    <div className="mb-2">
                      <label className="form-label mb-1">University Name</label>
                      <select
                        className={`form-control shadow-sm universityName ${inputClass('university')}`}
                        value={examInfo.university}
                        onChange={(event) => updateExamInfo('university', event.target.value)}
                      >
                        <option value="">Select a University</option>

                        {universities.map((university) => (
                          <option key={university} value={university}>
                            {university}
                          </option>
                        ))}
                      </select>
                      <span className={`ms-1 ${inputClass('university') ? '' : 'd-none'}`}>Please fill out this field</span>
                    </div>
                    <div className="mb-2">
                      <label className="form-label mb-1">Faculty</label>
                      <select
                        className={`form-control shadow-sm college ${inputClass('college')}`}
                        value={examInfo.college}
                        onChange={(e) => {
                          updateExamInfo('college', e.target.value);
                          updateExamInfo('department', '');
                        }}
                      >
                        <option value="">Select College</option>
                        {Object.keys(collegeDepartments).map((college) => (
                          <option key={college} value={college}>
                            {college}
                          </option>
                        ))}
                      </select>
                      <span className={`ms-1 ${inputClass('college') ? '' : 'd-none'}`}>Please fill out this field</span>
                    </div>
                    <div className="mb-2">
                      <label className="form-label mb-1">Subject Title</label>
                      <input type="text" className={`form-control shadow-sm subjectTitle ${inputClass('subject')}`} placeholder="e.g. Artificial Intelligence" value={examInfo.subject} onChange={(event) => updateExamInfo('subject', event.target.value)} />
                      <span className={`ms-1 ${inputClass('subject') ? '' : 'd-none'}`}>Please fill out this field</span>
                    </div>
                    <div className="mb-2">
                      <label className="form-label mb-1">Department / Branch</label>
                      <select
                        className={`form-control shadow-sm department ${inputClass('department')}`}
                        value={examInfo.department}
                        onChange={(e) => updateExamInfo('department', e.target.value)}
                        disabled={!examInfo.college}
                      >
                        <option value="">Select Department</option>

                        {(collegeDepartments[examInfo.college] || []).map((department) => (
                          <option key={department} value={department}>
                            {department}
                          </option>
                        ))}
                      </select>
                      <span className={`ms-1 ${inputClass('department') ? '' : 'd-none'}`}>Please fill out this field</span>
                    </div>
                    <div className="row">
                      <div className="col-6 mb-2">
                        <label className="form-label mb-1">Level</label>
                        <input type="number" className={`form-control shadow-sm level ${inputClass('level')}`} placeholder="1" min="1" max="5" value={examInfo.level} onChange={(event) => updateExamInfo('level', event.target.value)} />
                        <span className={`ms-1 ${inputClass('level') ? '' : 'd-none'}`}>Please fill out this field</span>
                      </div>
                      <div className="col-6 mb-2">
                        <label className="form-label mb-1">Duration (Min)</label>
                        <input type="number" className={`form-control shadow-sm duration ${inputClass('durationMinutes')}`} placeholder="60" min="1" max="120" value={examInfo.durationMinutes} onChange={(event) => updateExamInfo('durationMinutes', event.target.value)} />
                        <span className={`ms-1 ${inputClass('durationMinutes') ? '' : 'd-none'}`}>Please fill out this field</span>
                      </div>
                    </div>
                    <div className="pt-2">
                      <div className="mb-2">
                        <label className="form-label mb-1">Active From</label>
                        <input type="datetime-local" className={`form-control shadow-sm activeFrom ${inputClass('activeFrom')}`} min={minActiveFrom} value={examInfo.activeFrom} onChange={(event) => updateExamInfo('activeFrom', event.target.value)} />
                        <span className={`ms-1 ${inputClass('activeFrom') ? '' : 'd-none'}`}>Please choose when the exam becomes active</span>
                      </div>
                      <div className="mb-2">
                        <label className="form-label mb-1">Active To</label>
                        <input type="datetime-local" className={`form-control shadow-sm activeTo ${inputClass('activeTo')}`} min={examInfo.activeFrom || minActiveFrom} value={examInfo.activeTo} onChange={(event) => updateExamInfo('activeTo', event.target.value)} />
                        <span className={`ms-1 ${inputClass('activeTo') ? '' : 'd-none'}`}>Please choose when the exam becomes inactive</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-lg-8">
                  <div id="questions-list">
                    {questions.map((question, index) => (
                      <QuestionEditor
                        key={question.id || index}
                        question={question}
                        index={index}
                        onChange={updateQuestion}
                        onDelete={deleteQuestion}
                        canDelete={questions.length > 1}
                      />
                    ))}
                  </div>
                  {submitted && Array.from(invalidFields).some((field) => field.startsWith('question-')) && (
                    <div className="alert alert-danger">Please complete all question text and option fields.</div>
                  )}
                  <div className="d-grid gap-3 d-md-flex mt-4">
                    <button type="button" className="btn btn-add px-4 py-2 flex-grow-1" onClick={addQuestion}>+ Add New Question</button>
                    {!isUpdateMode && <button type="button" className="btn publish-btn px-5 py-2 fw-bold" onClick={handlePublish} disabled={isSubmitting}>{isSubmitting ? 'Publishing...' : 'Publish Exam'}</button>}
                    {isUpdateMode && <button type="button" className="btn update-btn px-5 py-2 fw-bold" onClick={handleUpdate} disabled={isSubmitting}>{isSubmitting ? 'Updating...' : 'Update Exam'}</button>}
                  </div>
                </div>
              </div>
            </form>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
