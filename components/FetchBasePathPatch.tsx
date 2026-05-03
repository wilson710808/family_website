'use client';
import { useEffect } from 'react';

const BASE_PATH = '/ws/01-family-portal';

export default function FetchBasePathPatch() {
  useEffect(() => {
    const originalFetch = window.fetch;
    if (!(originalFetch as any).__patched) {
      window.fetch = function(input: RequestInfo | URL, init?: RequestInit) {
        let url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : (input as Request).url;
        if (url.startsWith('/api/')) {
          url = BASE_PATH + url;
          if (typeof input === 'string') {
            input = url;
          } else if (input instanceof URL) {
            input = new URL(url);
          } else {
            input = new Request(url, init);
            init = undefined;
          }
        }
        return originalFetch.call(this, input, init);
      };
      (window.fetch as any).__patched = true;
    }
  }, []);
  return null;
}
