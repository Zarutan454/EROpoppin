export const isClient = typeof window !== 'undefined';

export const isBrowser = !!(
  typeof window !== 'undefined' &&
  window.document &&
  window.document.createElement
);

export function getWindowDimensions() {
  if (!isClient) {
    return {
      width: 0,
      height: 0,
    };
  }
  
  const { innerWidth: width, innerHeight: height } = window;
  return {
    width,
    height,
  };
}

export function safeLocalStorage() {
  if (!isClient) {
    return {
      getItem: () => null,
      setItem: () => null,
      removeItem: () => null,
    };
  }
  return window.localStorage;
}

export function safeSessionStorage() {
  if (!isClient) {
    return {
      getItem: () => null,
      setItem: () => null,
      removeItem: () => null,
    };
  }
  return window.sessionStorage;
}