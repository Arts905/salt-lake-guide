// 统一后端域名配置（开发联调）
const BASE_URL = 'http://127.0.0.1:8000'; // 本地后端服务地址（与后端 uvicorn 默认端口一致）
const SNAPSHOT_BASE_URL = BASE_URL;

// 将后端返回的 image_path 转为可访问的快照URL
function toSnapshotUrl(imagePath) {
  if (!imagePath) return '';
  const norm = imagePath.replace(/\\/g, '/');
  if (/^https?:\/\//.test(norm)) return norm; // 已是绝对URL
  const key = 'storage/snapshots';
  if (norm.includes(key)) {
    const rel = norm.substring(norm.indexOf(key) + key.length);
    return `${SNAPSHOT_BASE_URL}/snapshots${rel}`;
  }
  if (norm.startsWith('/snapshots')) return `${SNAPSHOT_BASE_URL}${norm}`;
  return '';
}

module.exports = { BASE_URL, SNAPSHOT_BASE_URL, toSnapshotUrl };