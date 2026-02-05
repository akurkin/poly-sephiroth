export type Result<T, E = Error> = { data: T } | { error: E }

export const ok = <T>(data: T): Result<T, never> => ({ data })
export const err = <E>(error: E): Result<never, E> => ({ error })
export const isOk = <T, E>(r: Result<T, E>): r is { data: T } => "data" in r
export const isErr = <T, E>(r: Result<T, E>): r is { error: E } => "error" in r
