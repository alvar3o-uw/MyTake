export function validateUsername(value: string): string | null {
  if (!/^[a-z0-9_]{3,20}$/.test(value)) {
    return "Use 3–20 lowercase letters, numbers, or underscores.";
  }
  return null;
}
