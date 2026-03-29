const DEFAULT_UI_ERROR_MESSAGE = 'Something went wrong. Please try again.';

export function getDisplayErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return DEFAULT_UI_ERROR_MESSAGE;
}
