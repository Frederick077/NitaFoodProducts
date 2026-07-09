import React from 'react';
import { Image as ImageIcon } from 'lucide-react';

interface SafeImageProps {
  src?: string;
  alt?: string;
  placeholderText?: string;
  className?: string;
  [key: string]: any;
}

export default function SafeImage({ src, alt, placeholderText = 'Upload Product Image', className = '', ...props }: SafeImageProps) {
  // Check if src is missing, empty, or a placeholder
  const isPlaceholder = !src || src === '' || src.includes('example.com') || src.includes('unsplash.com');

  if (isPlaceholder) {
    return (
      <div 
        className={`bg-gray-100 flex flex-col items-center justify-center p-6 text-center text-gray-400 select-none ${className}`}
        style={{ minHeight: '120px' }}
      >
        <ImageIcon className="w-8 h-8 mb-2 stroke-1.5 text-gray-400/80" />
        <span className="text-xs font-semibold tracking-wide text-gray-400/90">{placeholderText}</span>
      </div>
    );
  }

  return (
    <img 
      src={src} 
      alt={alt} 
      className={className} 
      referrerPolicy="no-referrer" 
      onError={(e) => {
        // Fallback on load error
        e.currentTarget.style.display = 'none';
        const parent = e.currentTarget.parentElement;
        if (parent) {
          const fallbackDiv = document.createElement('div');
          fallbackDiv.className = `bg-gray-100 flex flex-col items-center justify-center p-6 text-center text-gray-400 select-none ${className}`;
          fallbackDiv.style.minHeight = '120px';
          fallbackDiv.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="w-8 h-8 mb-2 text-gray-400/80"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
            <span class="text-xs font-semibold tracking-wide text-gray-400/90">${placeholderText}</span>
          `;
          parent.appendChild(fallbackDiv);
        }
      }}
      {...props}
    />
  );
}
