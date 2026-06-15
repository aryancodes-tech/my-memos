import aiContent from "@/lib/ai-content.json";
import { SITE_ORIGIN } from "@/lib/constants";
import { buildAbsoluteUrl } from "@/lib/url";

/** Plain-text segment in a landing FAQ answer. */
export type LandingFaqTextSegment = { type: "text"; text: string };

/** Link segment in a landing FAQ answer (path resolved to href at runtime). */
export type LandingFaqLinkSegment = {
  type: "link";
  /** Site path, e.g. `/demo/` - combined with `VITE_SITE_URL` when set. */
  path: string;
  /** Resolved absolute or relative URL for rendering and schema exports. */
  href: string;
  label: string;
};

/** Plain-text or link segment in a landing FAQ answer. */
export type LandingFaqAnswerSegment = LandingFaqTextSegment | LandingFaqLinkSegment;

/** One FAQ pair shown on the landing page and in FAQPage schema. */
export type LandingFaqItem = {
  question: string;
  /** Plain-text answer fallback when no segments are defined. */
  answer: string;
  /** Optional rich answer segments; when set, used for landing UI rendering. */
  answerSegments?: LandingFaqAnswerSegment[];
};

type RawLandingFaqLinkSegment = {
  type: "link";
  path: string;
  label: string;
};

type RawLandingFaqItem = {
  question: string;
  answer: string;
  answerSegments?: Array<LandingFaqTextSegment | RawLandingFaqLinkSegment>;
};

/**
 * Resolves a FAQ link path against a site origin.
 * Uses a relative path when origin is empty (local dev without `VITE_SITE_URL`).
 */
export function resolveFaqLinkHref(origin: string, path: string): string {
  if (origin.length === 0) {
    return path;
  }

  return buildAbsoluteUrl(origin, path);
}

/** Resolves FAQ link paths to hrefs for the given site origin. */
export function resolveLandingFaqItems(origin: string): LandingFaqItem[] {
  return (aiContent.faq as RawLandingFaqItem[]).map((item) => ({
    question: item.question,
    answer: item.answer,
    answerSegments: item.answerSegments?.map((segment) =>
      segment.type === "link"
        ? {
            type: "link",
            path: segment.path,
            label: segment.label,
            href: resolveFaqLinkHref(origin, segment.path),
          }
        : segment,
    ),
  }));
}

/**
 * FAQ entries for the landing UI.
 * Link hrefs use `VITE_SITE_URL` when set at build time; otherwise relative paths.
 */
export const LANDING_FAQ_ITEMS: LandingFaqItem[] = resolveLandingFaqItems(SITE_ORIGIN);

/** Flattens FAQ answer segments into plain text with absolute URLs for schema exports. */
export function flattenFaqAnswerForSchema(item: LandingFaqItem): string {
  if (item.answerSegments === undefined || item.answerSegments.length === 0) {
    return item.answer;
  }

  return item.answerSegments
    .map((segment) => (segment.type === "link" ? segment.href : segment.text))
    .join("");
}
