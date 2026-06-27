import Swal from 'sweetalert2';

export { Swal };

export function showToast(icon, title) {
  return Swal.fire({
    toast: true,
    position: 'bottom-start',
    icon,
    title,
    showConfirmButton: false,
    timer: 2000,
    timerProgressBar: true,
  });
}

export function getApiErrorMessage(errorText, fallback = 'Something went wrong') {
  if (!errorText) return fallback;
  if (errorText instanceof Error) return errorText.message || fallback;

  try {
    const data = JSON.parse(errorText);
    if (typeof data === 'string') return data;
    return data.message || data.title || data.error || fallback;
  } catch {
    return String(errorText).replace(/^"|"$/g, '') || fallback;
  }
}
