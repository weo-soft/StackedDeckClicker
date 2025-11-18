import type { HandleServerError } from '@sveltejs/kit';

export const handleError: HandleServerError = ({ error, event }) => {
  // Handle 404 errors for favicon and other missing static assets gracefully
  if (event.url.pathname === '/favicon.png' || event.url.pathname === '/favicon.ico') {
    return {
      message: 'Favicon not found',
      status: 404
    };
  }

  return {
    message: error instanceof Error ? error.message : 'An error occurred',
    status: 500
  };
};

