export const UI_WIZARD_STEPS = 8;

export function beStepToUiStep(beStep: number): number {
  const n = Math.max(1, Math.floor(beStep || 1));
  if (n <= 1) return 1;
  if (n <= 3) return 2;
  if (n === 4) return 3;
  if (n <= 6) return 4;
  if (n === 7) return 5;
  if (n === 8) return 6;
  if (n === 9) return 7;
  return 8;
}

export function beStepToUiStepLegacyV3(beStep: number): number {
  const n = Math.max(1, Math.floor(beStep || 1));
  if (n <= 1) return 1;
  if (n <= 3) return 2;
  if (n === 4) return 3;
  if (n <= 6) return 4;
  if (n === 7) return 5;
  if (n === 8) return 5;
  if (n === 9) return 6;
  if (n === 10) return 7;
  return 8;
}

export function remapWizardUiStepV3ToV4(uiStep: number): number {
  const n = Math.max(1, Math.floor(uiStep || 1));
  if (n <= 4) return n;
  if (n === 5) return 6;
  if (n === 6) return 7;
  if (n === 7) return 5;
  return 8;
}

export function resolveRemoteUiStep(
  beStep: number,
  wizardVersion: number,
): number {
  if (wizardVersion >= 4) return beStepToUiStep(beStep);
  return remapWizardUiStepV3ToV4(beStepToUiStepLegacyV3(beStep));
}

export function uiStepToBeProgressStep(uiStep: number): number {
  const map: Record<number, number> = {
    1: 1,
    2: 3,
    3: 4,
    4: 6,
    5: 7,
    6: 8,
    7: 9,
    8: 11,
  };
  return map[uiStep] ?? Math.min(11, Math.max(1, uiStep));
}

export function beCompletedToUiCompleted(completedSteps: number[]): number[] {
  const ui = new Set<number>();
  for (const be of completedSteps) {
    if (be >= 1) ui.add(1);
    if (be >= 3) ui.add(2);
    if (be >= 4) ui.add(3);
    if (be >= 6) ui.add(4);
    if (be >= 7) ui.add(5);
    if (be >= 8) ui.add(6);
    if (be >= 9) ui.add(7);
    if (be >= 10) ui.add(5);
  }
  return [...ui].sort((a, b) => a - b);
}

export function firstIncompleteUiStep(completedSteps: number[]): number {
  const done = new Set(beCompletedToUiCompleted(completedSteps));
  for (let step = 1; step <= UI_WIZARD_STEPS; step += 1) {
    if (step === UI_WIZARD_STEPS) return step;
    if (!done.has(step)) return step;
  }
  return UI_WIZARD_STEPS;
}
