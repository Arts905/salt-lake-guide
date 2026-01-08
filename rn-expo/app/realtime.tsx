import { useEffect, useState } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { toSnapshotUrl, BASE_URL } from '../lib/config';
import { fetchJSON } from '../lib/api';

export default function Realtime() {
  const [selected, setSelected] = useState(0);
  const [lakeName, setLakeName] = useState('');
  const [capturedAt, setCapturedAt] = useState('');
  const [score, setScore] = useState(0);
  const [reason, setReason] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [satPct, setSatPct] = useState(0);
  const [redPct, setRedPct] = useState(0);
  const [pinkPct, setPinkPct] = useState(0);
  const lakes = ['1号盐湖', '2号盐湖', '3号盐湖'];

  useEffect(() => { fetchRealtime(); }, [selected]);

  async function fetchRealtime() {
    const lakeId = selected + 1;
    try {
      const data = await fetchJSON(`${BASE_URL}/api/prediction/realtime/${lakeId}`);
      const url = toSnapshotUrl(data.image_path);
      const ia = (data.factors && data.factors.image_analysis) || {};
      const sat = Math.round(((ia.avg_saturation || ia.saturation_mean || 0) * 100));
      const red = Math.round(((ia.red_ratio || 0) * 100));
      const pink = Math.round(((ia.pink_ratio || 0) * 100));
      setLakeName(data.lake_name || '1号盐湖');
      setCapturedAt(data.captured_at || new Date().toISOString());
      setScore(data.score || 88);
      setReason(data.reason || '饱和度较高，红/粉色占比较大');
      setImageUrl(url || '');
      setSatPct(sat || 80);
      setRedPct(red || 40);
      setPinkPct(pink || 20);
    } catch {
      setLakeName('1号盐湖');
      setCapturedAt(new Date().toISOString());
      setScore(88);
      setReason('网络不可达，展示离线示例数据');
      setImageUrl('');
      setSatPct(80);
      setRedPct(40);
      setPinkPct(20);
    }
  }

  return (
    <ScrollView style={styles.page}>
      <View style={styles.pickerRow}>
        {lakes.map((name, i) => (
          <TouchableOpacity key={i} style={[styles.pill, selected === i && styles.pillActive]} onPress={() => setSelected(i)}>
            <Text style={[styles.pillText, selected === i && styles.pillTextActive]}>{name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.hero}>
        {imageUrl ? (<Image source={{ uri: imageUrl }} style={styles.heroImg} />) : (<View style={styles.placeholder}><Text style={styles.placeholderText}>暂无实时图片</Text></View>)}
        <View style={styles.floatCard}>
          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.fcScore}>{score}</Text>
              <Text style={styles.fcSub}>{`今日出片指数：${score}%`}</Text>
            </View>
          </View>
          <Text style={styles.fcMeta}>{`${lakeName} · ${capturedAt}`}</Text>
          <Text style={styles.fcReason}>{reason}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.factor}><View style={styles.factorHeader}><Text style={styles.title}>饱和度</Text><Text style={styles.value}>{`${satPct}%`}</Text></View><View style={styles.bar}><View style={[styles.barInner, styles.sat, { width: `${satPct}%` }]} /></View></View>
        <View style={styles.factor}><View style={styles.factorHeader}><Text style={styles.title}>红色占比</Text><Text style={styles.value}>{`${redPct}%`}</Text></View><View style={styles.bar}><View style={[styles.barInner, styles.red, { width: `${redPct}%` }]} /></View></View>
        <View style={styles.factor}><View style={styles.factorHeader}><Text style={styles.title}>粉色占比</Text><Text style={styles.value}>{`${pinkPct}%`}</Text></View><View style={styles.bar}><View style={[styles.barInner, styles.pink, { width: `${pinkPct}%` }]} /></View></View>
      </View>

      <TouchableOpacity style={styles.btn} onPress={fetchRealtime}><Text style={styles.btnText}>刷新实时</Text></TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: '#ffffff' },
  pickerRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  pill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, backgroundColor: '#eef2ff' },
  pillActive: { backgroundColor: '#0A84FF' },
  pillText: { color: '#334155' },
  pillTextActive: { color: '#fff' },
  hero: { position: 'relative', width: '100%', height: 280, backgroundColor: '#000' },
  heroImg: { width: '100%', height: '100%' },
  placeholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e5e7eb' },
  placeholderText: { color: '#6b7280' },
  floatCard: { position: 'absolute', left: 16, right: 16, bottom: 16, padding: 16, backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 18 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fcScore: { fontSize: 36, fontWeight: '800', color: '#0A84FF' },
  fcSub: { fontSize: 14, color: '#374151' },
  fcMeta: { color: '#6B7280', marginTop: 6 },
  fcReason: { marginTop: 8, color: '#1C1C1E', fontSize: 14 },
  section: { padding: 16 },
  factor: { marginBottom: 16 },
  factorHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 16, color: '#333' },
  value: { fontSize: 14, color: '#111' },
  bar: { height: 16, backgroundColor: '#eef2ff', borderRadius: 8, overflow: 'hidden', marginTop: 6 },
  barInner: { height: '100%', borderRadius: 8 },
  sat: { backgroundColor: '#60a5fa' },
  red: { backgroundColor: '#ef4444' },
  pink: { backgroundColor: '#ec4899' },
  btn: { margin: 16, padding: 14, backgroundColor: '#16a34a', borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff' }
});
