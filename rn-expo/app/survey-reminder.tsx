import { ScrollView, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

export default function SurveyReminder() {
  async function goSurvey() {
    await AsyncStorage.removeItem('survey_dismissed_until');
    router.push('/survey');
  }
  async function dismiss() {
    const until = Date.now() + 3 * 24 * 60 * 60 * 1000;
    await AsyncStorage.setItem('survey_dismissed_until', String(until));
    router.back();
  }
  return (
    <ScrollView style={styles.page}>
      <View style={styles.card}>
        <Text style={styles.title}>定制你的专属推荐</Text>
        <Text style={styles.desc}>花几秒钟告诉我们你的旅行偏好，让我们为你发现更合心意的盐湖秘境。</Text>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.btnPrimary} onPress={goSurvey}><Text style={styles.btnText}>立即开始</Text></TouchableOpacity>
          <TouchableOpacity style={styles.btnSecondary} onPress={dismiss}><Text style={styles.btnTextSecondary}>以后再说</Text></TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 16, backgroundColor: '#f0f5ff' },
  card: { borderRadius: 20, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '700' },
  desc: { fontSize: 14, color: '#334155', marginTop: 6 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 18 },
  btnPrimary: { flex: 1, height: 44, borderRadius: 12, backgroundColor: '#0A84FF', alignItems: 'center', justifyContent: 'center' },
  btnSecondary: { flex: 1, height: 44, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.12)', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  btnText: { color: '#fff', fontWeight: '700' },
  btnTextSecondary: { color: '#1c1c1e', fontWeight: '700' }
});
