import React, { useState, useEffect } from 'react';
import { Image as ImageIcon } from 'lucide-react';

interface SafeImageProps {
  src?: string;
  alt?: string;
  placeholderText?: string;
  className?: string;
  [key: string]: any;
}

export default function SafeImage({
  src,
  alt,
  placeholderText = 'NITA Photo',
  className = '',
  ...props
}: SafeImageProps) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  // Clean empty or error state
  const isEmpty = !src || src.trim() === '' || hasError;

  if (isEmpty) {
    return (
      <div 
        className={`bg-slate-100 flex flex-col items-center justify-center p-6 text-center text-slate-400 select-none ${className}`}
        style={{ minHeight: '120px' }}
      >
        <ImageIcon className="w-8 h-8 mb-2 stroke-1.5 text-slate-400" />
        <span className="text-xs font-semibold tracking-wide text-slate-500">{placeholderText}</span>
      </div>
    );
  }

  return (
    <img 
      src={src} 
      alt={alt || placeholderText} 
      className={className} 
      referrerPolicy="no-referrer" 
      onError={() => setHasError(true)}
      {...props}
    />
  );
}
