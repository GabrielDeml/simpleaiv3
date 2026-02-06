/* eslint-disable no-console */
export function installGlobalErrorHandler(): void {
  window.onerror = (_message, _source, _lineno, _colno, error) => {
    if (import.meta.env.DEV) {
      console.error('[Global Error]', error);
    }
  };

  window.addEventListener('unhandledrejection', (event) => {
    if (import.meta.env.DEV) {
      console.error('[Unhandled Rejection]', event.reason);
    }
  });
}
