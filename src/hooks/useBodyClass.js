import { useEffect } from 'react';

export function useBodyClass(className) {
  useEffect(() => {
    const previous = document.body.className;
    document.body.className = className || '';
    return () => {
      document.body.className = previous;
    };
  }, [className]);
}
