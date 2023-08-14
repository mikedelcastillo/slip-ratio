export const limitValue = (value: number, limit: number) =>
  Math.max(-limit, Math.min(limit, value))