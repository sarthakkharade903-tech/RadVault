import React from 'react';
import { Loader2 } from 'lucide-react';

export function LoadingSpinner({ message = 'Loading patient health data...' }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center" role="status" aria-live="polite">
      <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-4" />
      <p className="text-slate-300 font-medium text-sm">{message}</p>
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export default LoadingSpinner;
