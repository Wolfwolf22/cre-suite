import React from 'react';

export default function LoadingSpinner({ message = 'Generating with AI...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="relative">
        <div className="w-14 h-14 border-4 border-cream-200 border-t-accent rounded-full animate-spin" />
        <div className="absolute inset-2 border-2 border-cream-200 border-b-accent/40 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
      </div>
      <p className="text-charcoal-600 text-sm font-medium">{message}</p>
      <p className="text-charcoal-600/40 text-xs">This may take 15–30 seconds</p>
    </div>
  );
}

export function SkeletonLine({ width = 'full' }) {
  return (
    <div className={`h-4 bg-cream-200 rounded shimmer w-${width}`} />
  );
}
