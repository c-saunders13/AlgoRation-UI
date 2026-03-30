export type ApiErrorKind = 'validation' | 'problem' | 'message' | 'unknown';

export interface ValidationProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  traceId?: string;
  errors: Record<string, unknown>;
}

export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  traceId?: string;
}

export interface LegacyMessageError {
  message: string;
  status?: number;
  traceId?: string;
}

export interface NormalizedApiError {
  kind: ApiErrorKind;
  status: number | undefined;
  title: string;
  detail: string | undefined;
  fieldErrors: Record<string, string[]>;
  messages: string[];
  traceId: string | undefined;
}

interface NormalizeApiErrorOptions {
  status?: number;
}

const DEFAULT_UI_ERROR_MESSAGE = 'Something went wrong. Please try again.';
const DEFAULT_VALIDATION_TITLE = 'One or more validation errors occurred.';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toTrimmedString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function toStatus(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function normalizeFieldErrors(errors: unknown): Record<string, string[]> {
  if (!isRecord(errors)) {
    return {};
  }

  const normalized: Record<string, string[]> = {};

  for (const [key, rawValue] of Object.entries(errors)) {
    if (Array.isArray(rawValue)) {
      const messages = rawValue
        .map((item) => toTrimmedString(item))
        .filter((item): item is string => item !== undefined);

      if (messages.length > 0) {
        normalized[key] = messages;
      }
      continue;
    }

    const singleMessage = toTrimmedString(rawValue);
    if (singleMessage) {
      normalized[key] = [singleMessage];
    }
  }

  return normalized;
}

export function isValidationProblem(value: unknown): value is ValidationProblemDetails {
  if (!isRecord(value)) {
    return false;
  }

  return isRecord(value['errors']);
}

export function isProblemDetails(value: unknown): value is ProblemDetails {
  if (!isRecord(value) || isValidationProblem(value)) {
    return false;
  }

  const hasStatus = typeof value['status'] === 'number';
  const hasTitle = typeof value['title'] === 'string';
  const hasDetail = typeof value['detail'] === 'string';

  return hasStatus || hasTitle || hasDetail;
}

export function normalizeApiError(
  payload: unknown,
  options: NormalizeApiErrorOptions = {},
): NormalizedApiError {
  const fallbackStatus = options.status;

  if (isValidationProblem(payload)) {
    const fieldErrors = normalizeFieldErrors(payload.errors);
    const messages = Object.values(fieldErrors).flat();

    const title =
      toTrimmedString(payload.title) ??
      (messages.length > 0 ? DEFAULT_VALIDATION_TITLE : DEFAULT_UI_ERROR_MESSAGE);

    return {
      kind: 'validation',
      status: toStatus(payload.status) ?? fallbackStatus,
      title,
      detail: undefined,
      fieldErrors,
      messages: messages.length > 0 ? messages : [title],
      traceId: toTrimmedString(payload.traceId),
    };
  }

  if (isProblemDetails(payload)) {
    const title = toTrimmedString(payload.title) ?? DEFAULT_UI_ERROR_MESSAGE;
    const detail = toTrimmedString(payload.detail);

    return {
      kind: 'problem',
      status: toStatus(payload.status) ?? fallbackStatus,
      title,
      detail,
      fieldErrors: {},
      messages: detail ? [title, detail] : [title],
      traceId: toTrimmedString(payload.traceId),
    };
  }

  if (isRecord(payload)) {
    const legacyMessage = toTrimmedString(payload['message']);
    if (legacyMessage) {
      return {
        kind: 'message',
        status: toStatus(payload['status']) ?? fallbackStatus,
        title: legacyMessage,
        detail: undefined,
        fieldErrors: {},
        messages: [legacyMessage],
        traceId: toTrimmedString(payload['traceId']),
      };
    }
  }

  const directMessage = toTrimmedString(payload);
  if (directMessage) {
    return {
      kind: 'message',
      status: fallbackStatus,
      title: directMessage,
      detail: undefined,
      fieldErrors: {},
      messages: [directMessage],
      traceId: undefined,
    };
  }

  return {
    kind: 'unknown',
    status: fallbackStatus,
    title: DEFAULT_UI_ERROR_MESSAGE,
    detail: undefined,
    fieldErrors: {},
    messages: [DEFAULT_UI_ERROR_MESSAGE],
    traceId: undefined,
  };
}
