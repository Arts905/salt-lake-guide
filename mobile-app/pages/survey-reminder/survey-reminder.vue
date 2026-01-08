<template>
	<view class="reminder-page" :class="themeClass">
		<view class="card">
			<view class="icon-wrapper">📝</view>
			<view class="title">定制你的专属推荐</view>
			<view class="desc">花几秒钟告诉我们你的旅行偏好，让我们为你发现更合心意的盐湖秘境。</view>
			<view class="actions">
				<button class="btn primary" @click="goSurvey">立即开始</button>
				<button class="btn secondary" @click="dismiss">以后再说</button>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				themeClass: ''
			}
		},
		onLoad() {
			try {
				const info = uni.getSystemInfoSync();
				const theme = info.theme || 'light';
				const themeClass = theme === 'dark' ? 'theme-dark' : 'theme-light';
				this.themeClass = themeClass;
				if (theme === 'dark') {
					uni.setNavigationBarColor({ frontColor: '#ffffff', backgroundColor: '#0d1117' });
				} else {
					uni.setNavigationBarColor({ frontColor: '#000000', backgroundColor: '#ffffff' });
				}
				// uni.onThemeChange...
			} catch (e) {}
		},
		methods: {
			goSurvey() {
				try { uni.removeStorageSync('survey_dismissed_until'); } catch (e) {}
				uni.navigateTo({ url: '/pages/survey/survey' });
			},
			dismiss() {
				const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
				const until = Date.now() + threeDaysMs;
				try { uni.setStorageSync('survey_dismissed_until', until); } catch (e) {}
				uni.navigateBack({ delta: 1 });
			}
		}
	}
</script>

<style>
/* 页面背景采用暗/浅色渐变（居中卡片） */
.reminder-page { 
  min-height: 100vh; 
  padding: 64rpx 48rpx; 
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 暗色主题 */
.reminder-page.theme-dark {
  background: radial-gradient(1200rpx 600rpx at 30% 10%, #1b2330 0%, #0d1117 60%, #0a0d12 100%);
  color: #e9edf3;
}
/* 浅色主题 */
.reminder-page.theme-light {
  background: radial-gradient(1200rpx 600rpx at 30% 10%, #f0f5ff 0%, #e9efff 50%, #f7f9fc 100%);
  color: #1c1c1e;
}

/* 优化卡片宽度限制，确保居中更美观 */
.card {
  max-width: 640rpx;
  width: 92vw;
}

/* 毛玻璃卡片（随主题调整） */
.reminder-page.theme-dark .card {
  backdrop-filter: blur(10rpx);
  background: rgba(28, 33, 43, 0.75);
  border: 1rpx solid rgba(255,255,255,0.08);
  border-radius: 24rpx;
  padding: 40rpx 32rpx;
  box-shadow: 0 24rpx 60rpx rgba(0,0,0,0.35);
  animation: riseIn 420ms ease-out;
}
.reminder-page.theme-light .card {
  backdrop-filter: blur(10rpx);
  background: rgba(255, 255, 255, 0.72);
  border: 1rpx solid rgba(0,0,0,0.08);
  border-radius: 24rpx;
  padding: 40rpx 32rpx;
  box-shadow: 0 24rpx 60rpx rgba(0,0,0,0.15);
  animation: riseIn 420ms ease-out;
}

.icon-wrapper {
  width: 96rpx;
  height: 96rpx;
  border-radius: 48rpx;
  background: linear-gradient(135deg, #0A84FF 0%, #6C5CE7 100%);
  display: flex; align-items: center; justify-content: center;
  color: #fff;
  font-size: 52rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 12rpx 24rpx rgba(10, 132, 255, 0.35);
}

.title { font-size: 40rpx; font-weight: 700; letter-spacing: 1rpx; margin-bottom: 16rpx; }
.desc { font-size: 28rpx; color: #c7cbd2; line-height: 1.8; }
.reminder-page.theme-light .desc { color: #334155; }
.actions { display: flex; gap: 20rpx; margin-top: 36rpx; }

/* 按钮样式 */
.btn { 
  flex: 1; 
  height: 88rpx; 
  border-radius: 16rpx; 
  font-size: 30rpx; 
  font-weight: 600; 
  letter-spacing: 1rpx;
}
.btn.primary { 
  background: linear-gradient(135deg, #0A84FF 0%, #4E9EFF 100%);
  color: #fff;
  box-shadow: 0 12rpx 24rpx rgba(10, 132, 255, 0.35);
}
.btn.secondary { 
  background: rgba(255,255,255,0.06); 
  color: #e9edf3; 
  border: 1rpx solid rgba(255,255,255,0.12);
}
.reminder-page.theme-light .btn.secondary {
  background: rgba(255,255,255,0.6);
  color: #1c1c1e;
  border: 1rpx solid rgba(0,0,0,0.08);
}

/* 入场动效 */
@keyframes riseIn {
  from { transform: translateY(16rpx); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
</style>
