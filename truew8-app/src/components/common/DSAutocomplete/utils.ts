export function getNestedValue<T>(obj: T, path: string | keyof T): unknown {
  if (typeof path === "string" && path.includes(".")) {
    return path
      .split(".")
      .reduce((acc: unknown, part: string) => (acc as Record<string, unknown> | undefined)?.[part], obj as unknown);
  }

  return (obj as Record<string, unknown>)[path as string];
}
