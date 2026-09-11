const MINUTE = 60_000;
const MAX_DELAY = 24 * 60 * MINUTE;

export function retryDelayMs(
  attempt: number,
  options: { retryAfterSeconds?: number; configurationError?: boolean; random?: () => number } = {},
) {
  const random = options.random ?? Math.random;
  // Equal jitter avoids synchronized workers while maintaining a useful minimum delay.
  const exponential = Math.min(MAX_DELAY, MINUTE * 2 ** Math.min(Math.max(attempt - 1, 0), 20));
  const jittered = Math.round(exponential * (0.5 + random() * 0.5));
  const minimum = options.configurationError ? 60 * MINUTE : 0;
  const retryAfter = Math.max(0, options.retryAfterSeconds ?? 0) * 1000;
  return Math.max(jittered, minimum, retryAfter);
}
