export const LOG_EVENTS = {
  FRONTEND_SERVER_STARTED: 'frontend.server.started',
  FRONTEND_BOOTSTRAP_FAILED: 'frontend.bootstrap.failed',

  HTTP_REQUEST_STARTED: 'http.request.started',
  HTTP_REQUEST_SUCCEEDED: 'http.request.succeeded',
  HTTP_REQUEST_FAILED_TRACE: 'http.request.failed.trace',
  HTTP_REQUEST_FAILED: 'http.request.failed',
  HTTP_AUTH_CREDENTIALS_ATTACHED: 'http.auth.credentials.attached',

  BOOK_SEARCH_COMBINED_FAILED: 'book_search.combined.failed',
  BOOK_SEARCH_BACKEND_FAILED: 'book_search.backend.failed',

  SERIES_DETAIL_LOAD_FAILED: 'series_detail.load.failed',
  SERIES_DETAIL_POSTS_LOAD_FAILED: 'series_detail.posts.load.failed',
} as const;

export type FrontendLogEvent = typeof LOG_EVENTS[keyof typeof LOG_EVENTS];
