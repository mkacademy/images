// Constants file to avoid circular dependencies
export const userApps: Record<number, string> = {
  0: "---CHOOSE_USERAPP---",
  1: "TUTORIAL",
  2: "COURSE",
  3: "QUIZ",
}
export const memberApps: Record<number, string> = {
  0: "---CHOOSE_MEMBERAPP---",
  5: "INCOMING",
  6: "OUTGOING",
};

// Content delay constant moved here to avoid circular dependency with utils.ts and store
export const contentDelay = 500; 