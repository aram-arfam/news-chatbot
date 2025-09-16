// src/utils/logger.ts
const isDevelopment = import.meta.env.DEV;

export const debugLog = (...args: any[]) => {
  if (isDevelopment) {
    console.log(...args);
  }
};

export const debugError = (...args: any[]) => {
  if (isDevelopment) {
    console.error(...args);
  }
};

// Always log these regardless of environment (critical errors/warnings)
export const criticalLog = (...args: any[]) => {
  console.log(...args);
};

export const criticalError = (...args: any[]) => {
  console.error(...args);
};
