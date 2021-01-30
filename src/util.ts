export function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function writeable<T>(val: T): { -readonly [P in keyof T]: T[P] } {
  return val;
}