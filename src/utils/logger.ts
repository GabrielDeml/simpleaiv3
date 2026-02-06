/* eslint-disable no-console */
export const logger = {
  log: (...args: unknown[]): void => {
    if (import.meta.env.DEV) {
      console.log(...args);
    }
  },
  warn: (...args: unknown[]): void => {
    if (import.meta.env.DEV) {
      console.warn(...args);
    }
  },
  error: (...args: unknown[]): void => {
    if (import.meta.env.DEV) {
      console.error(...args);
    }
  },
};
