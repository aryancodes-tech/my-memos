import { PRODUCT_TOUR_STEPS, PRODUCT_TOUR_TARGETS } from "@/lib/constants";

export type ProductTourStepId = (typeof PRODUCT_TOUR_STEPS)[number]["id"];

export type ProductTourTarget = (typeof PRODUCT_TOUR_TARGETS)[keyof typeof PRODUCT_TOUR_TARGETS];

/** True when the step spotlights the editor or toolbar (needs an open page). */
export function tourStepNeedsPage(stepId: string): boolean {
  return stepId === "slash-menu" || stepId === "add-image" || stepId === "add-voice";
}

/** True when the step spotlights create-page targets (prefer dashboard). */
export function tourStepPrefersDashboard(stepId: string): boolean {
  return stepId === "create-page";
}

export { PRODUCT_TOUR_STEPS, PRODUCT_TOUR_TARGETS };
