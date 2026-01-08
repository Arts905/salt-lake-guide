import { useEffect, useMemo, useState } from 'react';
import { Appearance, Image, ScrollView, Text, TextInput, TouchableOpacity, useColorScheme, View, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../lib/config';
import { getPredictionsToday, getUIRecommendations, searchAttractions, fullCoverUrl } from '../lib/api';

type LakeCard = { id: number; name: string; sub: string; cover: string; isHot?: boolean; category: string; score: number; popularity: number };
type PredictionItem = { lake_id: number; lake_name: string; score: number; best_time: { start: string; end: string }; reason: string; cardClass: string };

export default function IndexScreen() {
  // v2.1 Force Refresh
  const scheme = useColorScheme();
  const [themeClass, setThemeClass] = useState(scheme === 'dark' ? 'theme-dark' : 'theme-light');
  const [hotLakes, setHotLakes] = useState<LakeCard[]>([]);
  const [list, setList] = useState<PredictionItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // 筛选状态
  const [selectedCategory, setSelectedCategory] = useState('全部');
  const [sortBy, setSortBy] = useState('default'); // 'default' | 'score' | 'popularity'

  const filteredLakes = useMemo(() => {
    let res = [...hotLakes];
    // 1. 筛选
    if (selectedCategory !== '全部') {
      res = res.filter(l => l.category && l.category.trim() === selectedCategory);
    }
    // 2. 排序
    if (sortBy === 'score') {
      res.sort((a, b) => b.score - a.score);
    } else if (sortBy === 'popularity') {
      res.sort((a, b) => b.popularity - a.popularity);
    }
    return res;
  }, [hotLakes, selectedCategory, sortBy]);

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => setThemeClass(colorScheme === 'dark' ? 'theme-dark' : 'theme-light'));
    return () => sub.remove();
  }, []);

  useEffect(() => { refresh(); }, []);

  function mapScoreToClass(score: number) {
    if (score >= 90) return 'grad-high';
    if (score >= 60) return 'grad-mid';
    return 'grad-low';
  }

  function getScoreColor(score: number) {
    if (score >= 80) return '#FF2D55';
    if (score >= 60) return '#FF9F0A';
    return '#0A84FF';
  }

  async function refresh() {
    try {
      const data = await getPredictionsToday();
      const raw = Array.isArray(data) ? data : [];
      let items: PredictionItem[] = raw.map((it: any) => ({ ...it, cardClass: mapScoreToClass(it.score) }));
      if (!items.length) {
        items = [{ lake_id: 1, lake_name: '运城盐湖', score: 92, best_time: { start: '15:00', end: '17:00' }, reason: '样例：云量低、光照强，利于盐藻显色', cardClass: mapScoreToClass(92) }];
      }
      setList(items);
    } catch {}
    fetchRecommended();
  }

  async function fetchRecommended() {
    try {
      const data = await getUIRecommendations();
      // 映射后端 UI 字段
      const lakes: LakeCard[] = (Array.isArray(data) ? data : []).map((item: any) => ({
        id: item.id,
        name: item.ui_title || item.name,
        sub: `${item.category} · 指数 ${(item.composite_score * 100).toFixed(0)}`,
        cover: item.ui_cover_image || 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=600&q=80',
        isHot: item.ui_is_photo_hotspot,
        category: item.category,
        score: item.composite_score,
        popularity: item.popularity
      }));
      setHotLakes(lakes);
    } catch (e) {
      // Fallback
      setHotLakes([]);
    }
  }

  function openDetail(id: number) { router.push({ pathname: '/lake-detail', params: { id: String(id) } }); }
  function openSurvey() { router.push('/survey'); }
  function onSearchConfirm() { const q = searchQuery.trim(); router.push({ pathname: '/attractions', params: q ? { keywords: q } : {} }); }

  return (
    <ScrollView style={[styles.page, themeClass === 'theme-dark' ? styles.pageDark : styles.pageLight]}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Let's Discover</Text>
        <Text style={styles.heroSub}>探索盐湖与周边的精彩</Text>
        <TouchableOpacity style={styles.heroCta} onPress={openSurvey}><Text style={styles.heroCtaText}>开始探索</Text></TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput style={styles.searchInput} placeholder="搜索目的地或景点" value={searchQuery} onChangeText={setSearchQuery} onSubmitEditing={onSearchConfirm} returnKeyType="search" />
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {['全部', '摄影型', '科普型', '休闲型'].map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.filterChip, selectedCategory === cat && styles.filterChipActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.filterText, selectedCategory === cat && styles.filterTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={styles.sortContainer}>
           <TouchableOpacity onPress={() => setSortBy(sortBy === 'score' ? 'default' : 'score')}>
             <Text style={[styles.sortText, sortBy === 'score' && styles.sortTextActive]}>色彩 ⇅</Text>
           </TouchableOpacity>
           <TouchableOpacity onPress={() => setSortBy(sortBy === 'popularity' ? 'default' : 'popularity')}>
             <Text style={[styles.sortText, sortBy === 'popularity' && styles.sortTextActive]}>人气 ⇅</Text>
           </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.sectionTitle}>热门湖泊推荐</Text>
      <View style={styles.gridContainer}>
        {/* Left Column */}
        <View style={styles.column}>
          {filteredLakes.filter((_, i) => i % 2 === 0).map((item) => (
            <TouchableOpacity key={item.id} onPress={() => openDetail(item.id)} style={[styles.lakeCardGrid, { height: item.id === 1 ? 260 : 200 }]}>
              <Image source={{ uri: fullCoverUrl(item.cover) }} style={styles.lakeCover} />
              <View style={styles.lakeOverlay}>
                <View style={styles.nameRow}>
                  <Text style={styles.lakeName}>{item.name}</Text>
                  {item.isHot && <Text style={styles.hotBadge}>🔥</Text>}
                </View>
                <Text style={styles.lakeMeta}>{item.sub}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Right Column */}
        <View style={styles.column}>
          {filteredLakes.filter((_, i) => i % 2 !== 0).map((item) => (
            <TouchableOpacity key={item.id} onPress={() => openDetail(item.id)} style={[styles.lakeCardGrid, { height: 200 }]}>
              <Image source={{ uri: fullCoverUrl(item.cover) }} style={styles.lakeCover} />
              <View style={styles.lakeOverlay}>
                <View style={styles.nameRow}>
                  <Text style={styles.lakeName}>{item.name}</Text>
                  {item.isHot && <Text style={styles.hotBadge}>🔥</Text>}
                </View>
                <Text style={styles.lakeMeta}>{item.sub}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Text style={[styles.sectionTitle, styles.sectionSub]}>今日观测条件预测</Text>
      {list.length ? list.map(item => (
        <View key={item.lake_id} style={[styles.card]}>
          <View style={styles.cardHeader}>
            <Text style={styles.lake}>{item.lake_name}</Text>
            <Text style={styles.time}>{`最佳时间：${item.best_time.start} ~ ${item.best_time.end}`}</Text>
          </View>
          <View style={styles.cardBody}>
            <Text style={[styles.score, { color: getScoreColor(item.score) }]}>{item.score}</Text>
            <Text style={styles.reason}>{item.reason}</Text>
          </View>
        </View>
      )) : (
        <View style={styles.empty}><Text style={styles.emptyTitle}>暂无预测数据</Text><Text style={styles.emptyDesc}>点击下方按钮刷新或检查服务</Text></View>
      )}

      <TouchableOpacity style={styles.btn} onPress={refresh}><Text style={styles.btnText}>刷新预测</Text></TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 16 },
  pageDark: { backgroundColor: '#0d1117' },
  pageLight: { backgroundColor: '#F2F2F7' },
  hero: { marginHorizontal: 8, marginBottom: 16, padding: 24, borderRadius: 20, backgroundColor: '#4F7BFF' },
  heroTitle: { fontSize: 24, fontWeight: '800', color: '#fff' },
  heroSub: { marginTop: 6, fontSize: 16, color: '#f0f0f0' },
  heroCta: { marginTop: 12, backgroundColor: '#FF7A59', borderRadius: 16, paddingVertical: 10, paddingHorizontal: 14 },
  heroCtaText: { color: '#fff', fontWeight: '700' },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 8, marginBottom: 12, padding: 12, backgroundColor: '#fff', borderRadius: 16 },
  searchIcon: { fontSize: 18 },
  searchInput: { flex: 1, fontSize: 16 },
  filterContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 8, marginBottom: 8 },
  categoryScroll: { flex: 1, marginRight: 8 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#eee', marginRight: 8 },
  filterChipActive: { backgroundColor: '#0A84FF' },
  filterText: { fontSize: 13, color: '#666' },
  filterTextActive: { color: '#fff', fontWeight: '700' },
  sortContainer: { flexDirection: 'row', gap: 10 },
  sortText: { fontSize: 13, color: '#666' },
  sortTextActive: { color: '#0A84FF', fontWeight: '700' },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#666', marginHorizontal: 8, marginVertical: 12 },
  sectionSub: { marginTop: 20 },
  hScroll: { paddingHorizontal: 8 },
  gridContainer: { flexDirection: 'row', paddingHorizontal: 8, gap: 12 },
  column: { flex: 1, gap: 12 },
  lakeCardGrid: { width: '100%', borderRadius: 16, overflow: 'hidden', backgroundColor: '#eee', marginBottom: 0 },
  lakeCard: { width: 280, height: 160, marginRight: 12, borderRadius: 16, overflow: 'hidden', backgroundColor: '#eee' },
  lakeCover: { width: '100%', height: '100%' },
  lakeOverlay: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 10, backgroundColor: 'rgba(0,0,0,0.35)' },
  lakeName: { color: '#fff', fontSize: 16, fontWeight: '700' },
  lakeMeta: { color: '#fff', fontSize: 12, marginTop: 4 },
  card: { marginHorizontal: 8, marginBottom: 12, borderRadius: 16, backgroundColor: '#fff', paddingBottom: 8 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, paddingTop: 12 },
  cardBody: { paddingHorizontal: 14, paddingBottom: 12 },
  lake: { fontSize: 18, fontWeight: '700', color: '#111' },
  time: { fontSize: 14, color: '#6B7280' },
  score: { fontSize: 32, fontWeight: '800', color: '#0A84FF' },
  reason: { marginTop: 6, fontSize: 14, color: '#333' },
  empty: { padding: 24, alignItems: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#1C1C1E' },
  emptyDesc: { marginTop: 6, fontSize: 14, color: '#8A8A8E' },
  btn: { marginHorizontal: 8, marginTop: 12, backgroundColor: '#0A84FF', borderRadius: 16, paddingVertical: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '700' }
});
