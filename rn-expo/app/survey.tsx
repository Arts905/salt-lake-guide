import { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

// AHP 标度: 9, 7, 5, 3, 1, 1/3, 1/5, 1/7, 1/9
// 简化为 5 档: 
// 强烈偏向A (9)
// 稍微偏向A (3)
// 相同 (1)
// 稍微偏向B (1/3)
// 强烈偏向B (1/9)

const SCALE_OPTIONS = [
  { value: 9, label: '左侧非常重要' },
  { value: 3, label: '左侧略重要' },
  { value: 1, label: '两者一样重要' },
  { value: 1/3, label: '右侧略重要' },
  { value: 1/9, label: '右侧非常重要' }
];

function ComparisonRow({ title, leftLabel, rightLabel, value, onChange }: any) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowTitle}>{title}</Text>
      <View style={styles.labels}>
        <Text style={styles.labelSide}>{leftLabel}</Text>
        <Text style={styles.labelSide}>{rightLabel}</Text>
      </View>
      <View style={styles.options}>
        {SCALE_OPTIONS.map((opt) => (
          <TouchableOpacity 
            key={opt.value} 
            style={[styles.scaleBtn, Math.abs(value - opt.value) < 0.01 && styles.scaleBtnActive]} 
            onPress={() => onChange(opt.value)}
          >
            <Text style={[styles.scaleText, Math.abs(value - opt.value) < 0.01 && styles.scaleTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

export default function Survey() {
  const [at, setAt] = useState(1); // Access vs Theme
  const [tc, setTc] = useState(1); // Theme vs Color
  const [ac, setAc] = useState(1); // Access vs Color

  async function submit() {
    try {
      await AsyncStorage.setItem('survey_completed', JSON.stringify(true));
      
      // 保存 AHP 偏好
      const prefs = { 
        ahp: { at, tc, ac }, 
        updatedAt: Date.now() 
      };
      await AsyncStorage.setItem('user_prefs', JSON.stringify(prefs));
      
      // 跳转到推荐页
      router.push({ 
        pathname: '/attractions', 
        params: { 
          ahp_at: String(at),
          ahp_tc: String(tc),
          ahp_ac: String(ac)
        } 
      });
    } catch (e) {
      Alert.alert('错误', '保存偏好失败');
    }
  }

  return (
    <ScrollView style={styles.page}>
      <View style={styles.card}>
        <Text style={styles.title}>个性化推荐 (AHP)</Text>
        <Text style={styles.desc}>请比较以下因素的重要性，我们将为您量身定制推荐。</Text>
        
        <View style={styles.form}>
          <ComparisonRow 
            title="比较 1" 
            leftLabel="可达性 (方便到达)" 
            rightLabel="主题性 (文化/特色)" 
            value={at} 
            onChange={setAt} 
          />
          
          <ComparisonRow 
            title="比较 2" 
            leftLabel="主题性 (文化/特色)" 
            rightLabel="色彩性 (视觉美感)" 
            value={tc} 
            onChange={setTc} 
          />
          
          <ComparisonRow 
            title="比较 3" 
            leftLabel="可达性 (方便到达)" 
            rightLabel="色彩性 (视觉美感)" 
            value={ac} 
            onChange={setAc} 
          />
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.btnPrimary} onPress={submit}>
            <Text style={styles.btnText}>生成我的推荐</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 16, backgroundColor: '#f0f5ff' },
  card: { borderRadius: 20, padding: 16, backgroundColor: '#fff', paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  desc: { fontSize: 14, color: '#64748b', marginBottom: 20 },
  form: { gap: 24 },
  row: { marginBottom: 10 },
  rowTitle: { fontSize: 16, fontWeight: '600', marginBottom: 8, color: '#334155' },
  labels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  labelSide: { fontSize: 14, fontWeight: '500', color: '#0A84FF' },
  options: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#f1f5f9', borderRadius: 10, padding: 4 },
  scaleBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  scaleBtnActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  scaleText: { fontSize: 12, color: '#94a3b8' },
  scaleTextActive: { color: '#0A84FF', fontWeight: '700' },
  actions: { marginTop: 30 },
  btnPrimary: { height: 48, borderRadius: 12, backgroundColor: '#0A84FF', alignItems: 'center', justifyContent: 'center', shadowColor: '#0A84FF', shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 }
});
