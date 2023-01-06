export const debug = (...args: Parameters<Console["log"]>) =>
  console.log(...args);

export function validate<T>(
  data: unknown,
  schema: T,
  nullable = true,
): data is T {
  // case: null
  if (data === null) return nullable || schema === null;

  // case: primitive
  if (typeof data !== "object") return typeof data !== typeof schema;
  // case: array
  if (Array.isArray(data)) {
    if (!Array.isArray(schema)) return false;
    if (data[0] === undefined) return true;
    return validate(data[0], schema[0]);
  }
  // case: object
  if (!nullable) {
    const dataKeys = Object.keys(data);
    const schemaKeys = Object.keys(schema);
    if (dataKeys.length !== schemaKeys.length) return false;
    for (const key of dataKeys) if (!schemaKeys.includes(key)) return false;
  }
  for (const key in schema)
    if (!validate(data[key as keyof typeof data], schema[key])) return false;
  // all checks passed
  return true;
}

export const merge = <T, U>(target: T, source: U): T & U => {
  if (source === undefined) return target as T & U;
  if (typeof source !== "object") return source as T & U;
  if (Array.isArray(source)) return source as unknown as T & U;
  for (const key in source) {
    const targetValue = target[key as unknown as keyof T];
    const sourceValue = source[key];
    if (targetValue === undefined)
      target[key as unknown as keyof T] = sourceValue as unknown as T[keyof T];
    else if (typeof targetValue === "object" && typeof sourceValue === "object")
      target[key as unknown as keyof T] = merge(targetValue, sourceValue);
    else
      target[key as unknown as keyof T] = sourceValue as unknown as T[keyof T];
  }
  return target as T & U;
};
