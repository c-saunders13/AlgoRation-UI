import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

import { normalizeApiError } from '../../shared/utils/api-error-normalizer';

function resolveApiErrorMessage(error: HttpErrorResponse): string {
  const normalized = normalizeApiError(error.error, { status: error.status });
  return normalized.messages.join(' ');
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
