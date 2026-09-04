export function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);

  return slug || "story";
}

export function slugWithSuffix(value: string): string {
  return `${slugify(value)}-${Math.random().toString(36).slice(2, 8)}`;
}
