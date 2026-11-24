/**
 * How the amount in a transaction history message is colored.
 *
 * Each tone maps to a complete class name. Tailwind only generates the classes it finds written
 * out in the source, so a class assembled at runtime (`text-${name}-500`) has no CSS behind it.
 * Taking a tone instead of a color name keeps every amount on the theme's colors.
 */
export const AMOUNT_TONE_CLASS = {
  /** Tokens left the account: sent, burned, failed. */
  negative: 'text-error',
  /** Tokens arrived: received, minted. */
  positive: 'text-success',
  /** Tokens moved on someone else's behalf, such as a community pool spend. */
  caution: 'text-warning',
  /** Neither a gain nor a loss for the account, such as a forced transfer. */
  neutral: 'text-content-muted',
} as const;

export type AmountTone = keyof typeof AMOUNT_TONE_CLASS;
