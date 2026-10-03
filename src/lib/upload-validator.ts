/**
 * File upload validation rules for community photo attachments.
 * Enforces maximum size (5MB) and strict image MIME types.
 */

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

export interface UploadValidationResult {
  valid: boolean;
  error?: string;
}

export function validateImageUpload(
  file: { size: number; type: string } | null | undefined
): UploadValidationResult {
  if (!file) {
    return { valid: false, error: "No file provided" };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size exceeds the 5MB maximum limit (received ${(file.size / (1024 * 1024)).toFixed(1)}MB)`,
    };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type '${file.type}'. Only JPG, PNG, and WebP images are allowed.`,
    };
  }

  return { valid: true };
}
