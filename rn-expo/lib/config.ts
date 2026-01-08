import { Platform } from 'react-native';
// 自动检测本机 IP，方便手机调试
// 注意：请将 '192.168.31.13' 替换为您电脑在局域网的实际 IP
const LOCAL_IP = '192.168.31.13';

let HOST = LOCAL_IP;

if (Platform.OS === 'web') {
  // Web 模式下直接使用 localhost 或当前域名
  HOST = 'localhost';
  if (typeof window !== 'undefined' && window.location && window.location.hostname) {
    HOST = window.location.hostname;
  }
} else {
  // 模拟器使用 10.0.2.2，真机使用局域网 IP
  // 如果是真机调试，请确保手机和电脑在同一 WiFi 下
  HOST = LOCAL_IP; 
}

export const BASE_URL = `http://${HOST}:8002`;
export const SNAPSHOT_BASE_URL = BASE_URL;

export function toSnapshotUrl(imagePath?: string) {
  if (!imagePath) return '';
  const norm = String(imagePath).replace(/\\/g, '/');
  if (/^https?:\/\//.test(norm)) return norm;
  const key = 'storage/snapshots';
  if (norm.includes(key)) {
    const rel = norm.substring(norm.indexOf(key) + key.length);
    return `${SNAPSHOT_BASE_URL}/snapshots${rel}`;
  }
  if (norm.startsWith('/snapshots')) return `${SNAPSHOT_BASE_URL}${norm}`;
  return '';
}
