import { useEffect, useState } from 'react';
import { getDoctorId, getToken, logoutLikeLegacyFrontend } from '../utils/storage.js';

export function useAuthState() {
  const [state, setState] = useState(() => ({ token: getToken(), doctorId: getDoctorId() }));

  useEffect(() => {
    const sync = () => setState({ token: getToken(), doctorId: getDoctorId() });
    window.addEventListener('storage', sync);
    window.addEventListener('exam-storage-changed', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('exam-storage-changed', sync);
    };
  }, []);

  return {
    ...state,
    isAuthenticated: Boolean(state.token),
    logout: logoutLikeLegacyFrontend,
  };
}
