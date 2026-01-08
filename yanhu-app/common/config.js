export const BASE_URL = 'http://127.0.0.1:8000';
export const SNAPSHOT_BASE_URL = BASE_URL;

export function toSnapshotUrl(imagePath) {
  if (!imagePath) return '';
  const norm = imagePath.replace(/\\/g, '/');
  if (/^https?:\/\//.test(norm)) return norm;
  const key = 'storage/snapshots';
  if (norm.includes(key)) {
    const rel = norm.substring(norm.indexOf(key) + key.length);
    return `${SNAPSHOT_BASE_URL}/snapshots${rel}`;
  }
  if (norm.startsWith('/snapshots')) return `${SNAPSHOT_BASE_URL}${norm}`;
  return '';
}

export default {
  BASE_URL,
  SNAPSHOT_BASE_URL,
  toSnapshotUrl
}
