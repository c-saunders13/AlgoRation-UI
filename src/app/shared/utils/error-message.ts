import { normalizeApiError } from './api-error-normalizer';

const DEFAULT_UI_ERROR_MESSAGE = 'Something went wrong. Please try again.';

export function getDisplayErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  const normalized = normalizeApiError(error);
  if (normalized.messages.length > 0) {
    return normalized.messages.join(' ');
  }

  return DEFAULT_UI_ERROR_MESSAGE;
}
