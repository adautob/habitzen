
'use client';

import { useEffect, useState } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';

/**
 * This component listens for custom 'permission-error' events and throws them
 * as uncaught exceptions. This is a deliberate strategy for development environments
 * to ensure that Firestore permission errors are surfaced prominently in the
 * Next.js error overlay, providing rich, debuggable context.
 *
 * In a production build, this component does nothing, allowing errors to be
 * handled by other mechanisms if necessary, without interrupting the user experience
 * with overlays.
 */
export function FirebaseErrorListener() {
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const handleError = (e: Error) => {
      // In a development environment, we want to throw the error
      // to make it highly visible in the Next.js overlay.
      if (process.env.NODE_ENV === 'development') {
        setError(() => {
          throw e;
        });
      } else {
        // In production, you might log this to a service like Sentry,
        // but we won't crash the app. For now, we just log it.
        console.error('Firestore Permission Error:', e);
      }
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, []);

  // This component does not render anything itself.
  return null;
}
