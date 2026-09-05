import React, { useState, useRef } from 'react';
import { Upload, X, CheckCircle, AlertCircle, Loader2, Image as ImageIcon } from 'lucide-react';

interface ImageUploaderProps {
  token: string | null;
  currentImageUrl?: string;
  currentPublicId?: string;
  category?: string;
  label?: string;
  recommendedDimensions?: string;
  onUploadSuccess: (data: { imageUrl: string; publicId: string }) => void;
  onRemove?: () => void;
  className?: string;
}

export default function ImageUploader({
  token,
  currentImageUrl = '',
  category = 'general',
  label = 'Upload Image',
  recommendedDimensions,
  onUploadSuccess,
  onRemove,
  className = '',
}: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(currentImageUrl);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync preview when currentImageUrl changes externally
  React.useEffect(() => {
    setPreviewUrl(currentImageUrl);
  }, [currentImageUrl]);

  const handleFile = async (file: File) => {
    setError(null);
    setUploadSuccess(false);

    // Validate type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setError('Please select a valid image file (JPG, PNG, or WebP).');
      return;
    }

    // Validate size (10 MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image exceeds 10MB limit. Please upload a smaller file.');
      return;
    }

    // Show temporary local object preview
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
    setIsUploading(true);

    const effectiveToken = token || localStorage.getItem('nita_admin_token') || '';
    if (!effectiveToken) {
      setError('Your Admin session has expired. Please sign in again.');
      setIsUploading(false);
      setPreviewUrl(currentImageUrl);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('category', category);

      // Note: We deliberately do NOT set Content-Type header so the browser sets multipart/form-data with the correct boundary
      const res = await fetch('/api/admin/images/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${effectiveToken}`,
        },
        body: formData,
      });

      // Robust check: inspect Content-Type before parsing JSON to prevent HTML parse crash
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        console.error(
          '[ImageUploader] Expected JSON from upload API but received:',
          res.status,
          contentType,
          text.slice(0, 300)
        );

        if (res.status === 401) {
          throw new Error('Your Admin session has expired. Please sign in again.');
        } else if (res.status === 404) {
          throw new Error('Image upload service endpoint could not be reached (404). Please try again.');
        } else if (res.status >= 500) {
          throw new Error('Image upload service temporarily unavailable on server. Please try again.');
        } else {
          throw new Error('Image upload service could not be reached. Please try again.');
        }
      }

      const data = await res.json();
      if (!res.ok || !data.success) {
        if (res.status === 401) {
          throw new Error(data.error || 'Your Admin session has expired. Please sign in again.');
        }
        throw new Error(data.error || 'Failed to upload image.');
      }

      setPreviewUrl(data.imageUrl);
      setUploadSuccess(true);
      onUploadSuccess({
        imageUrl: data.imageUrl,
        publicId: data.publicId || '',
      });

      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (err: any) {
      console.error('[ImageUploader] Image upload failed:', err);
      setError(err.message || 'Image upload failed. Please try again.');
      setPreviewUrl(currentImageUrl);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const onDragLeave = () => {
    setDragOver(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleManualSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleClear = () => {
    setPreviewUrl('');
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onRemove) {
      onRemove();
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">{label}</label>
          {recommendedDimensions && (
            <span className="text-[11px] text-gray-400 font-medium">{recommendedDimensions}</span>
          )}
        </div>
      )}

      {/* Upload Dropzone / Preview Area */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`relative rounded-2xl border-2 border-dashed transition-all duration-200 overflow-hidden ${
          dragOver
            ? 'border-emerald-500 bg-emerald-50/50 scale-[1.01]'
            : previewUrl
            ? 'border-emerald-200 bg-slate-50'
            : 'border-gray-200 hover:border-emerald-400 bg-gray-50/60 hover:bg-emerald-50/20'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          onChange={handleManualSelect}
          className="hidden"
        />

        {previewUrl ? (
          <div className="relative group min-h-[160px] flex items-center justify-center p-3">
            <img
              src={previewUrl}
              alt="Uploaded visual preview"
              className="max-h-48 max-w-full rounded-xl object-contain shadow-sm"
              referrerPolicy="no-referrer"
            />

            {/* Overlay on hover or while uploading */}
            <div className={`absolute inset-0 bg-black/50 backdrop-blur-xs flex flex-col items-center justify-center gap-2 rounded-2xl transition-opacity duration-200 ${
              isUploading ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}>
              {isUploading ? (
                <div className="flex flex-col items-center gap-2 text-white">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
                  <span className="text-xs font-semibold">Uploading to secure storage...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-2 bg-white text-gray-900 text-xs font-bold rounded-xl shadow hover:bg-emerald-50 transition"
                  >
                    Replace Image
                  </button>
                  <button
                    type="button"
                    onClick={handleClear}
                    className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow transition"
                    title="Remove image"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {uploadSuccess && (
              <div className="absolute top-2 right-2 bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md animate-fade-in">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Uploaded</span>
              </div>
            )}
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="p-6 flex flex-col items-center justify-center text-center cursor-pointer min-h-[140px]"
          >
            {isUploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                <span className="text-xs font-semibold text-gray-600">Uploading image...</span>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl bg-white border border-gray-200 shadow-xs flex items-center justify-center text-emerald-600 mb-3 group-hover:scale-105 transition">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-gray-800">
                  Click to browse <span className="font-normal text-gray-500">or drag & drop</span>
                </p>
                <p className="text-[11px] text-gray-400 mt-1">PNG, JPG, or WebP up to 10MB</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-600 font-medium bg-red-50 p-2.5 rounded-xl border border-red-100">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}

function TrashIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      {...props}
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}
