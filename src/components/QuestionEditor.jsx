export const emptyQuestion = () => ({
  questionText: '',
  optionA: '',
  optionB: '',
  optionC: '',
  optionD: '',
  correctAnswer: 'A',
});

export function normalizeQuestion(question = {}) {
  return {
    id: question.id,
    questionText: question.questionText || '',
    optionA: question.optionA || '',
    optionB: question.optionB || '',
    optionC: question.optionC || '',
    optionD: question.optionD || '',
    correctAnswer: question.correctAnswer || 'A',
  };
}

export default function QuestionEditor({ question, index, onChange, onDelete, canDelete = true }) {
  const updateField = (field, value) => onChange?.(index, { ...question, [field]: value });

  return (
    <div className="card question-card shadow-sm p-4 mb-4 border-start border-5 border-0 round-2">
      <div className="d-flex justify-content-between align-items-start question-actions">
        <h6 className="mb-3 question-number">Question #{index + 1}</h6>
        {canDelete && <button type="button" className="btn-close" onClick={() => onDelete?.(index)} aria-label="Delete" />}
      </div>

      <div className="mb-4">
        <label className="form-label">Question Text</label>
        <textarea
          className="form-control mb-3 question"
          rows="3"
          placeholder="Enter your question here..."
          value={question.questionText}
          onChange={(event) => updateField('questionText', event.target.value)}
        />
      </div>

      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label small">Option A</label>
          <textarea className="form-control optionA" rows="2" placeholder="Enter option A content" value={question.optionA} onChange={(event) => updateField('optionA', event.target.value)} />
        </div>
        <div className="col-md-6">
          <label className="form-label small">Option B</label>
          <textarea className="form-control optionB" rows="2" placeholder="Enter option B content" value={question.optionB} onChange={(event) => updateField('optionB', event.target.value)} />
        </div>
        <div className="col-md-6">
          <label className="form-label small">Option C</label>
          <textarea className="form-control optionC" rows="2" placeholder="Enter option C content" value={question.optionC} onChange={(event) => updateField('optionC', event.target.value)} />
        </div>
        <div className="col-md-6">
          <label className="form-label small">Option D</label>
          <textarea className="form-control optionD" rows="2" placeholder="Enter option D content" value={question.optionD} onChange={(event) => updateField('optionD', event.target.value)} />
        </div>
      </div>

      <div className="mt-4 pt-3 border-top">
        <label className="form-label text-success">Define Correct Answer</label>
        <select className="form-select correctAnswer" value={question.correctAnswer} onChange={(event) => updateField('correctAnswer', event.target.value)}>
          <option value="A">Option A</option>
          <option value="B">Option B</option>
          <option value="C">Option C</option>
          <option value="D">Option D</option>
        </select>
      </div>
    </div>
  );
}
