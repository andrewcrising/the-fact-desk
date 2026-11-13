/** Platform Preview deployments are public-news readers with no editorial writes. */
export function isReadOnlyEvaluation(): boolean {
  return process.env.FACT_DESK_PREVIEW_ISOLATED === "true" || process.env.VERCEL_ENV === "preview";
}
