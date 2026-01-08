import { useEffect, useState } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { getAttractionDetail, fullCoverUrl } from '../lib/api';

const { width } = Dimensions.get('window');

export default function LakeDetail() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [loading, setLoading] = useState(true);
  const [lake, setLake] = useState<any>(null);

  useEffect(() => {
    const n = Number(id || 0);
    if (n) {
      setLake(null); // Clear previous data
      fetchDetail(n);
    } else {
      setLoading(false);
    }
  }, [id]);

  async function fetchDetail(n: number) {
    try {
      setLoading(true);
      const data = await getAttractionDetail(n);
      const obj = {
        id: data.id,
        name: data.name,
        country: '山西·运城',
        rating: data.rating || 4.5,
        cover: fullCoverUrl(data.cover_image) || fullCoverUrl('/static/attractions/default.jpg'),
        desc: data.description || '暂无详细介绍',
        latitude: data.latitude || 0,
        longitude: data.longitude || 0,
        category: data.category || '景点',
        distance: data.distance || '未知距离',
        scores: {
          accessibility: (data.accessibility_score || 0.5) * 10,
          thematic: (data.thematic_score || 0.5) * 10,
          colorfulness: (data.colorfulness_score || 0.5) * 10,
        }
      };
      setLake(obj);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function openMap() {
    // 这里可以接入实际的地图跳转逻辑
    alert(`导航至: ${lake?.latitude}, ${lake?.longitude}`);
  }

  if (loading) {
    return (
      <View style={[styles.page, styles.center]}>
        <ActivityIndicator size="large" color="#0A84FF" />
        <Text style={{ marginTop: 10, color: '#666' }}>加载中...</Text>
      </View>
    );
  }

  if (!lake) {
    return (
      <View style={[styles.page, styles.center]}>
        <Text style={{ color: '#666' }}>未找到景点信息</Text>
        <TouchableOpacity style={styles.btnBack} onPress={() => router.back()}>
          <Text style={styles.btnBackText}>返回上一页</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.page} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.hero}>
        <Image source={{ uri: lake.cover }} style={styles.heroImg} />
        <View style={styles.heroOverlay} />
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.heroInfo}>
          <View style={styles.badgeRow}>
            <View style={styles.badge}><Text style={styles.badgeText}>{lake.category}</Text></View>
            <View style={[styles.badge, styles.badgeYellow]}><Text style={styles.badgeText}>{lake.rating}分</Text></View>
          </View>
          <Text style={styles.name}>{lake.name}</Text>
          <Text style={styles.meta}>{`${lake.country} · 距离 ${lake.distance}`}</Text>
        </View>
      </View>

      <View style={styles.container}>
        {/* 评分维度 */}
        <View style={styles.card}>
          <Text style={styles.secTitle}>特色指数</Text>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreLabel}>交通便利</Text>
            <View style={styles.barBg}>
              <View style={[styles.barFill, { width: `${lake.scores.accessibility * 10}%`, backgroundColor: '#34C759' }]} />
            </View>
            <Text style={styles.scoreVal}>{lake.scores.accessibility.toFixed(1)}</Text>
          </View>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreLabel}>主题特色</Text>
            <View style={styles.barBg}>
              <View style={[styles.barFill, { width: `${lake.scores.thematic * 10}%`, backgroundColor: '#FF9500' }]} />
            </View>
            <Text style={styles.scoreVal}>{lake.scores.thematic.toFixed(1)}</Text>
          </View>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreLabel}>色彩丰富</Text>
            <View style={styles.barBg}>
              <View style={[styles.barFill, { width: `${lake.scores.colorfulness * 10}%`, backgroundColor: '#FF2D55' }]} />
            </View>
            <Text style={styles.scoreVal}>{lake.scores.colorfulness.toFixed(1)}</Text>
          </View>
        </View>

        {/* 简介 */}
        <View style={styles.card}>
          <Text style={styles.secTitle}>景点简介</Text>
          <Text style={styles.desc}>{lake.desc}</Text>
        </View>

        {/* 底部操作 */}
        <TouchableOpacity style={styles.btnNav} onPress={openMap}>
          <Text style={styles.btnNavIcon}>📍</Text>
          <Text style={styles.btnNavText}>导航前往</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: '#F2F2F7', minHeight: '100%' },
  center: { justifyContent: 'center', alignItems: 'center' },
  hero: { position: 'relative', height: 300 },
  heroImg: { width: '100%', height: '100%' },
  heroOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)' },
  backButton: { position: 'absolute', top: 44, left: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  backIcon: { fontSize: 24, color: '#fff', fontWeight: 'bold', marginTop: -2 },
  heroInfo: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 20, paddingBottom: 30, backgroundColor: 'rgba(0,0,0,0.6)' },
  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: 'rgba(255,255,255,0.2)' },
  badgeYellow: { backgroundColor: '#FF9F0A' },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  name: { fontSize: 28, fontWeight: '800', color: '#fff', textShadowColor: 'rgba(0,0,0,0.3)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  meta: { marginTop: 4, fontSize: 14, color: '#eee' },
  container: { marginTop: -20, borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: '#F2F2F7', padding: 16, gap: 16 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  secTitle: { fontSize: 18, fontWeight: '700', color: '#111', marginBottom: 16 },
  desc: { fontSize: 15, color: '#444', lineHeight: 24 },
  btnNav: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, backgroundColor: '#0A84FF', borderRadius: 16, paddingVertical: 14, shadowColor: '#0A84FF', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  btnNavIcon: { fontSize: 18 },
  btnNavText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  scoreRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  scoreLabel: { width: 70, fontSize: 14, color: '#666' },
  barBg: { flex: 1, height: 8, backgroundColor: '#F2F2F7', borderRadius: 4, marginHorizontal: 12 },
  barFill: { height: '100%', borderRadius: 4 },
  scoreVal: { width: 30, fontSize: 14, fontWeight: '700', color: '#333', textAlign: 'right' },
  btnBack: { marginTop: 16, padding: 12, backgroundColor: '#ddd', borderRadius: 8 },
  btnBackText: { color: '#333' }
});
