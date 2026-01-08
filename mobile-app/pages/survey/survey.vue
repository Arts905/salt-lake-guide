<template>
	<view class="survey-page" :class="themeClass">
		<view class="card">
			<view class="icon-wrapper">🎯</view>
			<view class="title">偏好设置</view>
			<view class="desc">选择你的旅行偏好，我们会为你提供更合心意的推荐。</view>

			<view class="form">
				<checkbox-group @change="onChange">
					<label class="option">
						<checkbox value="quiet"/> 人少的景点
					</label>
					<label class="option">
						<checkbox value="photo"/> 拍照出片
					</label>
					<label class="option">
						<checkbox value="history"/> 了解历史
					</label>
					<label class="option">
						<checkbox value="nature"/> 自然风光
					</label>
					<label class="option">
						<checkbox value="bird"/> 看鸟
					</label>
					<label class="option">
						<checkbox value="relax"/> 休闲
					</label>
					<label class="option">
						<checkbox value="fitness"/> 健身
					</label>
				</checkbox-group>
			</view>

			<view class="actions">
				<button class="btn primary" @click="submitPreferences">提交偏好</button>
			</view>
		</view>
	</view>
</template>

<script>
	import { BASE_URL } from '../../common/config.js';

	export default {
		data() {
			return {
				selected: [],
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
			onChange(e) {
				this.selected = e.detail.value || [];
			},
			submitPreferences() {
				const selected = this.selected || [];
				if (!selected.length) {
					uni.showToast({ title: '请至少选择一项偏好', icon: 'none' });
					return;
				}
				try {
					uni.setStorageSync('survey_completed', true);
					uni.removeStorageSync('survey_dismissed_until');
					uni.setStorageSync('user_prefs', { keywords: selected, updatedAt: Date.now() });
				} catch (e) {}
				uni.showToast({ title: '已保存偏好', icon: 'success', duration: 800 });
				const keywords = encodeURIComponent((selected || []).join(','));
				uni.navigateTo({ url: `/pages/attractions/attractions?keywords=${keywords}` });
			}
		}
	}
</script>

<style>
/* 背景与居中布局（随主题） */
.survey-page {
  min-height: 100vh;
  padding: 64rpx 48rpx;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
}
/* 暗色主题 */
.survey-page.theme-dark {
  background: radial-gradient(1200rpx 600rpx at 30% 10%, #1b2330 0%, #0d1117 60%, #0a0d12 100%);
  color: #e9edf3;
}
/* 浅色主题 */
.survey-page.theme-light {
  background: radial-gradient(1200rpx 600rpx at 30% 10%, #f0f5ff 0%, #e9efff 50%, #f7f9fc 100%);
  color: #1c1c1e;
}

/* 毛玻璃卡片（随主题） */
.survey-page.theme-dark .card {
  backdrop-filter: blur(10rpx);
  background: rgba(28, 33, 43, 0.75);
  border: 1rpx solid rgba(255,255,255,0.08);
  border-radius: 24rpx;
  padding: 40rpx 32rpx;
  box-shadow: 0 24rpx 60rpx rgba(0,0,0,0.35);
  animation: riseIn 420ms ease-out;
  max-width: 680rpx;
  width: 92vw;
}
.survey-page.theme-light .card {
  backdrop-filter: blur(10rpx);
  background: rgba(255, 255, 255, 0.72);
  border: 1rpx solid rgba(0,0,0,0.08);
  border-radius: 24rpx;
  padding: 40rpx 32rpx;
  box-shadow: 0 24rpx 60rpx rgba(0,0,0,0.15);
  animation: riseIn 420ms ease-out;
  max-width: 680rpx;
  width: 92vw;
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
.survey-page.theme-light .desc { color: #334155; }
.form { margin-top: 20rpx; }

/* 选项行 */
.option { 
  display: flex; 
  align-items: center; 
  gap: 16rpx; 
  padding: 18rpx 12rpx; 
  margin-top: 16rpx; 
  background: rgba(255,255,255,0.04); 
  border: 1rpx solid rgba(255,255,255,0.08); 
  border-radius: 14rpx; 
}
.survey-page.theme-light .option {
  background: rgba(255,255,255,0.6);
  border: 1rpx solid rgba(0,0,0,0.08);
}

/* 按钮样式 */
.actions { margin-top: 36rpx; }
.btn { 
  width: 100%; 
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

/* 入场动效 */
@keyframes riseIn {
  from { transform: translateY(16rpx); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
</style>
