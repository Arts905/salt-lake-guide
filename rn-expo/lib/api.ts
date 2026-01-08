import { BASE_URL } from './config';

export function fullCoverUrl(path?: string) {
  if (!path) return '';
  const p = String(path);
  if (/^https?:\/\//.test(p)) return p;
  if (p.startsWith('/')) {
    // 移除可能重复的 /static 前缀，统一路径格式
    let fixed = p;
    if (fixed.startsWith('/static/attractions/')) {
        fixed = fixed.replace('/static/attractions/', '/attractions/');
    } else if (fixed.startsWith('/attractions/')) {
        // do nothing
    } else {
        // 默认加上 /attractions 前缀
        fixed = `/attractions${fixed}`;
    }
    return `${BASE_URL}${fixed}`;
  }
  if (p.includes('/static/')) {
    const idx = p.indexOf('/static/');
    const rel = p.substring(idx).replace(/^\/static\/attractions/, '/attractions');
    return `${BASE_URL}${rel}`;
  }
  if (p.includes('storage/attractions')) {
    const key = 'storage/attractions';
    const rel = p.substring(p.indexOf(key) + key.length);
    return `${BASE_URL}/static/attractions${rel}`;
  }
  return '';
}

export async function fetchJSON(url: string) {
  try {
    const res = await fetch(url);
    if (!res.ok) return {} as any;
    return await res.json();
  } catch (e) {
    return {} as any;
  }
}

export async function getPredictionsToday() {
  return fetchJSON(`${BASE_URL}/api/prediction/today`);
}

export async function getRecommendedAttractions(limit = 10) {
  return fetchJSON(`${BASE_URL}/api/attractions/recommend?limit=${limit}`);
}

export async function searchAttractions(keyword: string, pageSize = 50) {
  return fetchJSON(`${BASE_URL}/api/attractions?page_size=${pageSize}&keyword=${encodeURIComponent(keyword)}`);
}

export async function getAttractionDetail(id: number) {
  return fetchJSON(`${BASE_URL}/api/attractions/${id}`);
}

export async function getUIRecommendations() {
  return fetchJSON(`${BASE_URL}/api/recommend`);
}
