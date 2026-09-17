/**
 * Build the hold-to-talk transcript from the latest recognition pieces.
 * Interim text must be read from a ref updated in `onresult`, not from
 * React state — `endHold` runs on pointer-up before the next render.
 */
export function combineHoldTranscript(finals: string, interim: string): string {
  return `${finals} ${interim}`.replace(/\s+/g, " ").trim();
}
