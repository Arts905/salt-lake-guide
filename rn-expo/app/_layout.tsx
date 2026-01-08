import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';

export default function Layout() {
  const scheme = useColorScheme();
  return (
    <Stack screenOptions={{
      headerShown: true,
      contentStyle: { backgroundColor: scheme === 'dark' ? '#0d1117' : '#ffffff' }
    }}>
      <Stack.Screen name="index" options={{ title: '盐湖预测' }} />
      <Stack.Screen name="realtime" options={{ title: '实时指数' }} />
      <Stack.Screen name="attractions" options={{ title: '推荐景点' }} />
      <Stack.Screen name="lake-detail" options={{ title: '盐湖详情' }} />
      <Stack.Screen name="survey" options={{ title: '偏好调研' }} />
      <Stack.Screen name="survey-reminder" options={{ title: '完善偏好' }} />
    </Stack>
  );
}
