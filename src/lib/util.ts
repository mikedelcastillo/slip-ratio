export const limitValue = (value: number, limit: number) =>
  Math.max(-limit, Math.min(limit, value))

export const createNotYetImplementedError = (obj: object, key: string) =>
  new Error(`[${Object.getPrototypeOf(obj).constructor.name}]: Method "${key}" not yet implemented`)