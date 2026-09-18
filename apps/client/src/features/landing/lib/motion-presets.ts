/** Shared timing keeps the landing's typography, surfaces and controls in rhythm. */
export const EDITORIAL_EASE = [0.22, 1, 0.36, 1] as const;
export const SURFACE_SPRING = { stiffness: 170, damping: 28, mass: 0.7 } as const;
export const CONTROL_SPRING = { type: "spring", stiffness: 360, damping: 34 } as const;
