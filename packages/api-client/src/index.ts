// `customFetch` is intentionally NOT re-exported here. App code must consume
// the generated `createXxx` hooks / `xxx()` functions under `./generated/api/*`
// instead of hand-rolling requests. The fetcher stays internal to this package
// (and the generated code that imports it via `api-client/client`).
export { type ApiError, getBaseUrl, isApiError, setBaseUrl } from './client/fetcher';
export * from './generated/api';
export * from './generated/models';
