// Kubb-generated SDK barrel. Re-exports the typed client utilities the app
// needs. The fetcher itself stays internal — only its narrowing helpers
// (ApiError, isApiError, get/setBaseUrl) leak through.
export { abort as abortRequest } from './client/abort-registry';
export {
  type ApiError,
  getBaseUrl,
  isApiError,
  setAcceptLanguageProvider,
  setBaseUrl,
} from './client/fetcher';
export * from './generated/clients';
export * from './generated/hooks';
export * from './generated/models';
