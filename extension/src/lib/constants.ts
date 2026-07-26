/**
 * Package re-export of the shared constants module.
 * Source of truth: `shared/constants.ts`.
 *
 * Uses a relative path so Node can resolve this when Vite loads
 * `manifest.config.ts` (path aliases are not applied during config load).
 */
export * from "../../../shared/constants";
