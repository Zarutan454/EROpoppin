import DOMPurify from 'dompurify';

export const sanitizeHTML = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  });
};

export const escapeHTML = (str: string): string => {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
};

export const validateUrl = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);
    return ['http:', 'https:'].includes(parsedUrl.protocol);
  } catch {
    return false;
  }
};

export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-z0-9.-]/gi, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();
};

export const generateNonce = (): string => {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

export const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

export const rateLimiter = (() => {
  const requests: Record<string, number[]> = {};
  const limit = 100; // Anzahl der erlaubten Requests
  const timeWindow = 60 * 1000; // Zeitfenster in ms (1 Minute)

  return {
    checkLimit: (ip: string): boolean => {
      const now = Date.now();
      const userRequests = requests[ip] || [];
      
      // Alte Requests entfernen
      const recentRequests = userRequests.filter(
        timestamp => timestamp > now - timeWindow
      );
      
      if (recentRequests.length >= limit) {
        return false;
      }
      
      recentRequests.push(now);
      requests[ip] = recentRequests;
      
      return true;
    },
    
    resetLimit: (ip: string): void => {
      delete requests[ip];
    }
  };
})();

// Content Security Policy Header Generator
export const generateCSP = (options: {
  scriptSrc?: string[];
  styleSrc?: string[];
  imgSrc?: string[];
  connectSrc?: string[];
} = {}): string => {
  const defaultDirectives = {
    'default-src': ["'self'"],
    'script-src': ["'self'", ...((options.scriptSrc || []))],
    'style-src': ["'self'", ...((options.styleSrc || []))],
    'img-src': ["'self'", ...((options.imgSrc || []))],
    'connect-src': ["'self'", ...((options.connectSrc || []))],
    'frame-ancestors': ["'none'"],
    'form-action': ["'self'"],
    'base-uri': ["'self'"],
    'object-src': ["'none'"]
  };

  return Object.entries(defaultDirectives)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ');
};