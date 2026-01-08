import { useEffect, useState } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { BASE_URL } from '../lib/config';
import { searchAttractions, fullCoverUrl, fetchJSON } from '../lib/api';

export default function Attractions() {
  const params = useLocalSearchParams<{ keywords?: string, ahp_at?: string, ahp_tc?: string, ahp_ac?: string }>();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => { fetchData(params.keywords || ''); }, [params.keywords, params.ahp_at]);

  async function fetchAll() {
    try {
      const data = await fetchJSON(`${BASE_URL}/api/attractions?page_size=100`);
      const list = (data.items || []).map((it: any) => ({ ...it, _cover: fullCoverUrl(it.cover_image) }));
      setItems(list);
    } catch (e) {
      Alert.alert('网络异常', '无法获取景点列表，请检查后端地址或网络');
      setItems([]);
    }
  }

  async function fetchData(keywords: string) {
    try {
      // 优先处理 AHP 推荐
      if (params.ahp_at && params.ahp_tc && params.ahp_ac) {
        const url = `${BASE_URL}/api/attractions/recommend?limit=100&ahp_at=${params.ahp_at}&ahp_tc=${params.ahp_tc}&ahp_ac=${params.ahp_ac}`;
        const data = await fetchJSON(url);
        const list = (Array.isArray(data) ? data : []).map((it: any) => ({ ...it, _cover: fullCoverUrl(it.cover_image) }));
        setItems(list);
        setLoading(false);
        return;
      }

      if (!keywords) { await fetchAll(); setLoading(false); return; }
      const keys = String(keywords).split(',').map(s => s.trim()).filter(Boolean);
      const reqs = keys.map(k => searchAttractions(k, 100));
      const groups = await Promise.all(reqs);
      const map = new Map<number, any>();
      groups.flat().forEach((it: any) => { if (!map.has(it.id)) map.set(it.id, it); });
      let list = Array.from(map.values()).map((it: any) => ({ ...it, _cover: fullCoverUrl(it.cover_image) }));
      if (!list.length) { await fetchAll(); }
      else setItems(list);
    } catch {
      Alert.alert('网络异常', '获取偏好推荐失败，已尝试回退');
      await fetchAll();
    }
    finally { setLoading(false); }
  }

  return (
    <ScrollView style={styles.page}>
      <View style={styles.header}><Text style={styles.title}>推荐景点</Text><Text style={styles.sub}>后台封面将展示在此</Text></View>
      {loading ? (
        <View style={styles.grid}>{[1,2,3,4,5,6].map(i => (<View key={i} style={styles.skeleton}><View style={styles.skeletonImg} /><View style={[styles.skeletonLine, styles.w80]} /><View style={[styles.skeletonLine, styles.w60]} /></View>))}</View>
      ) : items.length ? (
        <View style={styles.grid}>
          {items.map((item: any) => (
            <TouchableOpacity key={item.id} style={styles.card} onPress={() => router.push({ pathname: '/lake-detail', params: { id: String(item.id) } })}>
              <Image source={{ uri: item._cover }} style={styles.cover} />
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.meta}>{`${item.category || ''} · ⭐ ${item.rating || ''}`}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (<Text style={styles.empty}>暂无景点数据</Text>)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 12, backgroundColor: '#f7f7fb' },
  header: { padding: 12 },
  title: { fontSize: 22, fontWeight: '700', color: '#111827' },
  sub: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { width: '48%', backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' },
  cover: { width: '100%', height: 140, backgroundColor: '#f3f4f6' },
  name: { paddingHorizontal: 10, paddingTop: 10, fontWeight: '600', color: '#111827' },
  meta: { paddingHorizontal: 10, paddingBottom: 10, color: '#6b7280', fontSize: 12 },
  skeleton: { width: '48%', padding: 10 },
  skeletonImg: { width: '100%', height: 140, backgroundColor: '#e5e7eb', borderRadius: 10 },
  skeletonLine: { height: 20, backgroundColor: '#e5e7eb', borderRadius: 8, marginTop: 10 },
  w80: { width: '80%' },
  w60: { width: '60%' },
  empty: { color: '#9ca3af', textAlign: 'center', marginTop: 24 }
});
