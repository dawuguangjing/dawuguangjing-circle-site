export const withBase = (path: string) => {
  const base = import.meta.env.BASE_URL;
  if (!path) return base;
  const normalized = path.startsWith('/') ? path.slice(1) : path;
  return `${base}${normalized}`;
};
