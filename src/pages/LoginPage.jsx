import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { backendApi } from '../api/backendClient.js';
import { setJSON, STORAGE_KEYS } from '../utils/storage.js';
import { useBodyClass } from '../hooks/useBodyClass.js';
import { usePageTitle } from '../hooks/usePageTitle.js';

export default function LoginPage() {
  useBodyClass('login');
  usePageTitle('Login');

  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [messageState, setMessageState] = useState('danger');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const login = async () => {
    if (!email || !password) {
      setMessageState('danger');
      setMessage('All inputs is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await backendApi.login({ email, password });
      setMessageState('success');
      setMessage('Login successfully');
      setJSON(STORAGE_KEYS.token, data.token);
      setJSON(STORAGE_KEYS.doctorId, data.id);
      window.setTimeout(() => navigate('/', { replace: true }), 1000);
    } catch (error) {
      console.error('Login failed:', error);
      setMessageState('danger');
      setMessage('Email or password is incorrect');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = (event) => {
    event.preventDefault();
    login();
  };

  return (
    <div className="login-page-wrapper d-flex align-items-center">
      <div className="container">
        <div className="row justify-content-center my-3">
          <div className="col-12 col-lg-10 col-xl-9">
            <div className="login-card border-0 shadow-lg">
              <div className="row g-0">
                <div className="col-md-5 bg-prof-dark text-white p-5 d-none d-md-flex flex-column justify-content-between sidebar-pattern">
                  <div>
                    <i className="fa-solid fa-chalkboard fs-1 text-white mb-4 d-block"></i>
                    <h3 className="fw-bold border-bottom border-warning border-3 pb-2 d-inline-block text-gold">Faculty Portal</h3>
                    <p className="mt-4 lead opacity-75">Access exam management, student grading, and tracking students.</p>
                  </div>
                  <div className="small opacity-50">
                    <p className="mb-1"><i className="fa-solid fa-shield-halved me-2" /> End-to-End Encrypted</p>
                    <p className="mb-0"><i className="fa-solid fa-location-dot me-2" /> IP Tracked Session</p>
                  </div>
                </div>
                <div className="col-md-7 p-4 p-md-5 bg-white">
                  <div className="mb-4">
                    <h2 className="fw-bold text-dark">Professor Login</h2>
                    <p className="text-muted small">Authorized Faculty Members Only</p>
                  </div>
                  <div className="alert alert-warning border-0 border-start border-4 border-warning d-flex align-items-center mb-4" role="alert">
                    <i className="fa-solid fa-triangle-exclamation fs-5 me-3" />
                    <div className="small">Strictly for Professors. Unauthorized access attempts are logged and reported.</div>
                  </div>
                  <form onSubmit={onSubmit}>
                    <div className="mb-2">
                      <label className="form-label fw-bold text-secondary">Academic Email / ID</label>
                      <div className="input-group">
                        <span className="input-group-text bg-light text-muted border-secondary-subtle"><i className="fa-regular fa-id-badge" /></span>
                        <input type="text" className="form-control emailInput bg-light border-secondary-subtle shadow-none p-2" placeholder="dr.nameID@university.edu" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} />
                      </div>
                    </div>
                    <div className="mb-2">
                      <label className="form-label fw-bold text-secondary">Security Password</label>
                      <div className="input-group">
                        <span className="input-group-text bg-light text-muted border-secondary-subtle"><i className="fa-solid fa-key" /></span>
                        <input type="password" className="form-control passwordInput bg-light border-secondary-subtle shadow-none p-2" placeholder="••••••••" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} />
                      </div>
                    </div>
                    <div className="mb-2">
                      <span className={`registerMessage small fw-bold text-${messageState} d-flex justify-content-center align-items-center`}>{message}</span>
                    </div>
                    <button type="submit" className="btn py-2 fw-bold px-4 mb-4" disabled={isSubmitting}>
                      {isSubmitting ? 'Please wait...' : 'Register'} <i className="fa-solid fa-right-to-bracket ps-2" />
                    </button>
                    <div className="text-center">
                      <Link to="/" className="text-muted text-decoration-none small hover-primary"><i className="fa-solid fa-arrow-left me-1" /> Back to Home</Link>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
