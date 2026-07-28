import type { StateCreator } from "zustand";
import * as db from "@/storage/db";
import { PRODUCT_TOUR_STATUS_DONE, PRODUCT_TOUR_STEPS, SETTINGS_KEYS } from "@/lib/constants";
import type { OnboardingSlice, StoreState } from "@/store/types";

/** Product tour coachmark state + settings persistence. */
export const createOnboardingSlice: StateCreator<StoreState, [], [], OnboardingSlice> = (
  set,
  get,
) => ({
  tourHydrated: false,
  tourActive: false,
  tourStepIndex: 0,
  tourCompleted: false,

  async hydrateTour() {
    const status = await db.getSetting<string>(SETTINGS_KEYS.productTour);
    const tourCompleted = status === PRODUCT_TOUR_STATUS_DONE;
    set({
      tourHydrated: true,
      tourCompleted,
      tourActive: !tourCompleted,
      tourStepIndex: 0,
    });
  },

  startTour() {
    set({ tourActive: true, tourStepIndex: 0 });
  },

  async completeTour() {
    await db.setSetting(SETTINGS_KEYS.productTour, PRODUCT_TOUR_STATUS_DONE);
    set({ tourActive: false, tourCompleted: true, tourStepIndex: 0 });
  },

  async skipTour() {
    await get().completeTour();
  },

  nextTourStep() {
    const { tourStepIndex } = get();
    const lastIndex = PRODUCT_TOUR_STEPS.length - 1;
    if (tourStepIndex >= lastIndex) {
      void get().completeTour();
      return;
    }
    set({ tourStepIndex: tourStepIndex + 1 });
  },

  prevTourStep() {
    set((s) => ({ tourStepIndex: Math.max(0, s.tourStepIndex - 1) }));
  },
});
