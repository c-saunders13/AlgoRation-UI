import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

const DEFAULT_API_ERROR_MESSAGE = 'Something went wrong. Please try again.';

function resolveApiErrorMessage(error: HttpErrorResponse): string {
  const payload = error.error;

  if (typeof payload === 'object' && payload !== null) {
    const message = (payload as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim().length > 0) {
      return message;
    }
  }

  if (typeof payload === 'string' && payload.trim().length > 0) {
    return payload;
  }

  if (typeof error.message === 'string' && error.message.trim().length > 0) {
    return error.message;
  }

  return DEFAULT_API_ERROR_MESSAGE;
}

export const apiErrorInterceptor: HttpInterceptorFn = (request, next) =>
  next(request).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) {
        return throwError(() => error);
      }

      return throwError(() => new Error(resolveApiErrorMessage(error)));
    }),
  );
