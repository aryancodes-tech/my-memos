/**
 * Package re-export of the shared constants module.
 * Source of truth: `shared/constants.ts`.
 *
 * Uses a relative path so Node/Vite SSR can resolve without relying on
 * `@shared/*` aliases during config bootstrap.
 */
export * from "../../shared/constants";
