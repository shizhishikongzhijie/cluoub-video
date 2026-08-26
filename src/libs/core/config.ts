export type ConfigRecord = Record<string, unknown>

export const parseConfigObject = (input: unknown, pluginId: string, allowedKeys: readonly string[]): ConfigRecord => {
    if (input === undefined) return {}
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
        throw new TypeError(`${pluginId} config must be an object`)
    }
    const config = input as ConfigRecord
    const unknownKey = Object.keys(config).find((key) => !allowedKeys.includes(key))
    if (unknownKey) throw new TypeError(`${pluginId} config contains unknown field: ${unknownKey}`)
    return config
}

export const optionalBoolean = (config: ConfigRecord, key: string, fallback: boolean): boolean => {
    const value = config[key]
    if (value === undefined) return fallback
    if (typeof value !== 'boolean') throw new TypeError(`${key} must be a boolean`)
    return value
}

export const optionalString = (config: ConfigRecord, key: string, fallback: string): string => {
    const value = config[key]
    if (value === undefined) return fallback
    if (typeof value !== 'string') throw new TypeError(`${key} must be a string`)
    return value
}

export const optionalNumber = (config: ConfigRecord, key: string, fallback: number): number => {
    const value = config[key]
    if (value === undefined) return fallback
    if (typeof value !== 'number' || !Number.isFinite(value)) throw new TypeError(`${key} must be a finite number`)
    return value
}
