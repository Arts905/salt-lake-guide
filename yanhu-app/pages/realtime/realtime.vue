<template>
	<view class="page" :class="themeClass">
		<view class="picker-wrap">
			<picker mode="selector" :range="lakes" @change="onSelect">
				<view class="card">选择盐湖：{{lakes[selected]}}</view>
			</picker>
		</view>

		<!-- 骨架屏：加载中展示 -->
		<view v-if="loading" class="hero skeleton-hero">
			<view class="skeleton-img"></view>
			<view class="floating-card">
				<view class="skeleton-line w-40"></view>
				<view class="skeleton-line w-60"></view>
				<view class="skeleton-line w-80"></view>
			</view>
		</view>

		<!-- 正常内容：加载完成展示 -->
		<view v-else class="hero">
			<block v-if="image_url">
				<image class="hero-img" :src="image_url" mode="aspectFill" />
			</block>
			<block v-else>
				<view class="hero-placeholder">暂无实时图片</view>
			</block>
			<view class="floating-card">
				<view class="fc-row">
					<view class="fc-left">
						<view class="fc-score">{{score}}</view>
						<view class="fc-sub">今日出片指数：{{score}}%</view>
					</view>
					<canvas class="score-pie" canvas-id="scorePie" style="width: 140px; height: 140px;"></canvas>
				</view>
				<view class="fc-meta">{{lake_name}} · {{captured_at}}</view>
				<view class="fc-reason">{{reason}}</view>
			</view>
		</view>

		<view class="section">
			<view class="factor">
				<view class="factor-header">
					<view class="title">饱和度</view>
					<view class="value">{{sat_pct}}%</view>
				</view>
				<view class="bar">
					<view class="bar-inner bar--sat" :style="{width: sat_pct + '%'}"></view>
				</view>
			</view>
			<view class="factor">
				<view class="factor-header">
					<view class="title">红色占比</view>
					<view class="value">{{red_pct}}%</view>
				</view>
				<view class="bar">
					<view class="bar-inner bar--red" :style="{width: red_pct + '%'}"></view>
				</view>
			</view>
			<view class="factor">
				<view class="factor-header">
					<view class="title">粉色占比</view>
					<view class="value">{{pink_pct}}%</view>
				</view>
				<view class="bar">
					<view class="bar-inner bar--pink" :style="{width: pink_pct + '%'}"></view>
				</view>
			</view>
		</view>

		<!-- 天气简报 -->
		<view class="section weather">
			<view class="title">当前天气（运城盐湖）</view>
			<view v-if="weather_now" class="weather-now">
				<view class="row">温度：{{weather_now.temp}}°C</view>
				<view class="row">云量：{{weather_now.cloud}}%</view>
				<view class="row">风速：{{weather_now.windSpeed}} m/s</view>
				<view class="row">湿度：{{weather_now.humidity}}%</view>
				<view class="row">UV：{{weather_now.uvIndex}}</view>
				<view class="row">降水：{{weather_now.precip}} mm</view>
				<view class="row">能见度：{{weather_now.visibility}} km</view>
			</view>
			<view v-else class="weather-now">暂无数据</view>

			<view class="hour-list" v-if="weather_next2h.length > 0">
				<view class="hour-card" v-for="item in weather_next2h" :key="item.time">
					<view class="time">{{item.time}}</view>
					<view class="meta">{{item.temp}}°C · 云{{item.cloud}}% · 风{{item.windSpeed}}</view>
				</view>
			</view>
			<view v-else class="hour-empty">暂无预测</view>
		</view>

		<button class="btn" @click="fetchRealtime">刷新实时</button>
		<button class="btn" @click="goAttractions">查看景点</button>
	</view>
</template>

<script>
	import { BASE_URL } from '../../common/config.js';

	export default {
		data() {
			return {
				lakes: ['1号盐湖', '2号盐湖', '3号盐湖'],
				selected: 0,
				lake_name: '',
				captured_at: '',
				score: 0,
				reason: '',
				image_url: '',
				sat_pct: 0,
				red_pct: 0,
				pink_pct: 0,
				weather_now: null,
				weather_next2h: [],
				loading: false,
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

			this.fetchRealtime();
			this.fetchWeatherBrief();
		},
		onReady() {
			this.drawScorePie(this.score || 0);
		},
		methods: {
			toSnapshotUrl(imagePath) {
				if (!imagePath) return '';
				const norm = imagePath.replace(/\\/g, '/');
				const idx = norm.indexOf('storage/snapshots');
				if (idx >= 0) {
					const rel = norm.substring(idx + 'storage/snapshots'.length);
					return `${BASE_URL}/snapshots${rel}`;
				}
				if (/^https?:\/\//.test(norm) || norm.startsWith('/snapshots')) return `${BASE_URL}${norm.replace(/^\//, '/')}`;
				return '';
			},
			onSelect(e) {
				const selected = Number(e.detail.value);
				this.selected = selected;
				this.fetchRealtime();
			},
			fetchWeatherBrief() {
				uni.request({
					url: `${BASE_URL}/api/weather/now2h`,
					method: 'GET',
					success: (res) => {
						if (res.statusCode === 200 && res.data) {
							let now = res.data.now || null;
							const next2h = res.data.next2h || [];
							if (now) {
								const vis = now.visibility != null ? now.visibility : now.vis;
								now.visibility = typeof vis === 'number' ? vis : (vis ? Number(vis) : 0);
							}
							this.weather_now = now;
							this.weather_next2h = next2h;
						}
					},
					fail: (err) => {
						console.error('天气接口请求失败', err);
						this.weather_now = null;
						this.weather_next2h = [];
					}
				});
			},
			fetchRealtime() {
				const lakeId = this.selected + 1;
				this.loading = true;
				uni.showLoading({ title: '加载中', mask: true });
				uni.request({
					url: `${BASE_URL}/api/prediction/realtime/${lakeId}`,
					method: 'GET',
					success: (res) => {
						const data = res.data || {};
						const image_url = this.toSnapshotUrl(data.image_path);
						const ia = (data.factors && data.factors.image_analysis) || {};
						const sat_pct = Math.round(((ia.avg_saturation || ia.saturation_mean || 0) * 100));
						const red_pct = Math.round(((ia.red_ratio || 0) * 100));
						const pink_pct = Math.round(((ia.pink_ratio || 0) * 100));
						const fallback = {
							lake_name: '1号盐湖',
							captured_at: new Date().toISOString(),
							score: 88,
							reason: '离线示例：饱和度较高，红/粉色占比较大',
							image_url: '',
							sat_pct: 80,
							red_pct: 40,
							pink_pct: 20
						};
						const score = data.score || fallback.score;
						
						this.lake_name = data.lake_name || fallback.lake_name;
						this.captured_at = data.captured_at || fallback.captured_at;
						this.score = score;
						this.reason = data.reason || fallback.reason;
						this.image_url = image_url || fallback.image_url;
						this.sat_pct = sat_pct || fallback.sat_pct;
						this.red_pct = red_pct || fallback.red_pct;
						this.pink_pct = pink_pct || fallback.pink_pct;

						this.drawScorePie(score);
					},
					fail: (err) => {
						uni.showToast({ title: '请求失败，请检查后端', icon: 'none' });
						console.error('实时请求失败', err);
						const fallback = {
							lake_name: '1号盐湖',
							captured_at: new Date().toISOString(),
							score: 88,
							reason: '网络不可达，展示离线示例数据',
							image_url: '',
							sat_pct: 80,
							red_pct: 40,
							pink_pct: 20
						};
						this.lake_name = fallback.lake_name;
						this.captured_at = fallback.captured_at;
						this.score = fallback.score;
						this.reason = fallback.reason;
						this.image_url = fallback.image_url;
						this.sat_pct = fallback.sat_pct;
						this.red_pct = fallback.red_pct;
						this.pink_pct = fallback.pink_pct;

						this.drawScorePie(fallback.score);
					},
					complete: () => { uni.hideLoading(); this.loading = false; }
				});
			},
			drawScorePie(percent) {
				const ctx = uni.createCanvasContext('scorePie', this);
				const size = 140; 
				const center = size / 2;
				const radius = center - 12;
				const startAngle = -Math.PI / 2;
				const endAngle = startAngle + (Math.max(0, Math.min(100, percent)) / 100) * 2 * Math.PI;

				ctx.setLineWidth(12);
				ctx.setStrokeStyle('#e5e7eb');
				ctx.beginPath();
				ctx.arc(center, center, radius, 0, 2 * Math.PI);
				ctx.stroke();

				ctx.setLineCap('round');
				ctx.setStrokeStyle('#0A84FF');
				ctx.beginPath();
				ctx.arc(center, center, radius, startAngle, endAngle);
				ctx.stroke();

				ctx.setFillStyle('#0A84FF');
				ctx.setFontSize(26);
				const text = String(Math.round(percent));
				// measureText might differ in environments, simple fallback
				const textWidth = text.length * 14; 
				ctx.fillText(text, center - textWidth / 2, center + 8);

				ctx.draw();
			},
			goAttractions() {
				uni.navigateTo({ url: '/pages/attractions/attractions' });
			}
		}
	}
</script>

<style>
.page { padding: 0; background: linear-gradient(180deg, #ffffff 0%, #f2f2f7 100%); }
.picker-wrap { padding: 16rpx 24rpx; }
.hero { position: relative; width: 100%; height: 420rpx; background: #000; }
.hero-img { width: 100%; height: 100%; filter: saturate(1.05) contrast(1.02); }
.hero-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #6b7280; background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); }
.floating-card { position: absolute; left: 24rpx; right: 24rpx; bottom: 24rpx; padding: 24rpx; background: rgba(255,255,255,0.92); backdrop-filter: blur(10rpx); border-radius: 22rpx; box-shadow: 0 10rpx 24rpx rgba(0,0,0,0.10); }
.fc-row { display: flex; justify-content: space-between; align-items: center; }
.fc-left { display: flex; flex-direction: column; gap: 8rpx; }
.fc-score { font-size: 56rpx; font-weight: 800; color: #0A84FF; }
.fc-sub { font-size: 26rpx; color: #374151; }
.fc-meta { color: #6B7280; margin-top: 8rpx; }
.fc-reason { margin-top: 12rpx; color: #1C1C1E; font-size: 26rpx; line-height: 1.5; }
.score-pie { width: 140px; height: 140px; }
.section { padding: 16rpx; }
.factor { margin-bottom: 24rpx; }
.factor-header { display: flex; justify-content: space-between; align-items: center; }
.factor .title { font-size: 28rpx; color: #333; }
.factor .value { font-size: 26rpx; color: #111; }
.bar { height: 22rpx; background: #eef2ff; border-radius: 11rpx; overflow: hidden; }
.bar-inner { height: 100%; border-radius: 11rpx; }
.bar--sat { background: linear-gradient(90deg, #93c5fd, #60a5fa); }
.bar--red { background: linear-gradient(90deg, #fca5a5, #ef4444); }
.bar--pink { background: linear-gradient(90deg, #f9a8d4, #ec4899); }

/* 天气卡片样式 */
.weather { background: #fff; border-radius: 16rpx; padding: 16rpx; margin: 12rpx; box-shadow: 0 6rpx 16rpx rgba(0,0,0,0.06); }
.weather-now .row { font-size: 26rpx; color: #374151; line-height: 40rpx; }
.title.sub { font-size: 26rpx; color: #6b7280; margin-top: 8rpx; }
.hour-list { display: flex; flex-direction: row; gap: 12rpx; overflow-x: auto; padding-bottom: 8rpx; }
.hour-card { min-width: 220rpx; background: #fff; border-radius: 14rpx; box-shadow: 0 2rpx 10rpx rgba(0,0,0,0.08); padding: 12rpx; }
.hour-card .time { font-weight: 600; color: #111827; margin-bottom: 4rpx; }
.hour-card .meta { color: #6b7280; font-size: 24rpx; }
.hour-empty { color: #9ca3af; font-size: 24rpx; padding: 8rpx 0; }

.btn { margin: 24rpx; padding: 20rpx; background: linear-gradient(90deg, #16a34a, #22c55e); color: #fff; border-radius: 12rpx; box-shadow: 0 6rpx 14rpx rgba(22,163,74,0.25); }

/* 骨架屏样式 */
.skeleton-hero { position: relative; }
.skeleton-img { width: 100%; height: 100%; background: #e5e7eb; }
.skeleton-line { height: 24rpx; background: #e5e7eb; border-radius: 12rpx; margin: 12rpx 0; overflow: hidden; position: relative; }
.skeleton-line::after { content: ""; position: absolute; left: -40%; top: 0; height: 100%; width: 40%; background: linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.6), rgba(255,255,255,0)); animation: shimmer 1.2s infinite; }
.w-40 { width: 40%; }
.w-60 { width: 60%; }
.w-80 { width: 80%; }
@keyframes shimmer { 0% { left: -40%; } 100% { left: 100%; } }

/* 主题：暗色模式背景与卡片（渐变+毛玻璃） */
.page.theme-dark { 
  background: radial-gradient(1200rpx 600rpx at 30% 10%, #1b2330 0%, #0d1117 60%, #0a0d12 100%);
  color: #e9edf3;
}
.page.theme-dark .hero-placeholder { color: #c7cbd2; background: linear-gradient(135deg, #1f2937 0%, #111827 100%); }
.page.theme-dark .floating-card { background: rgba(28,33,43,0.75); backdrop-filter: blur(10rpx); border: 1rpx solid rgba(255,255,255,0.08); box-shadow: 0 24rpx 60rpx rgba(0,0,0,0.35); }
.page.theme-dark .fc-sub { color: #c7cbd2; }
.page.theme-dark .fc-meta { color: #b8bdc6; }
.page.theme-dark .fc-reason { color: #e9edf3; }
.page.theme-dark .weather { background: rgba(28,33,43,0.75); border: 1rpx solid rgba(255,255,255,0.08); backdrop-filter: blur(10rpx); }
.page.theme-dark .hour-card { background: rgba(28,33,43,0.7); border: 1rpx solid rgba(255,255,255,0.08); }

/* 主题：浅色模式背景与卡片（渐变+毛玻璃） */
.page.theme-light { 
  background: radial-gradient(1200rpx 600rpx at 30% 10%, #f0f5ff 0%, #e9efff 50%, #f7f9fc 100%);
  color: #1c1c1e;
}
.page.theme-light .floating-card { background: rgba(255,255,255,0.72); backdrop-filter: blur(10rpx); border: 1rpx solid rgba(0,0,0,0.08); box-shadow: 0 24rpx 60rpx rgba(0,0,0,0.15); }
.page.theme-light .fc-sub { color: #64748b; }
.page.theme-light .fc-meta { color: #64748b; }
.page.theme-light .fc-reason { color: #1c1c1e; }
.page.theme-light .weather { background: rgba(255,255,255,0.72); border: 1rpx solid rgba(0,0,0,0.08); backdrop-filter: blur(10rpx); }
.page.theme-light .hour-card { background: rgba(255,255,255,0.72); border: 1rpx solid rgba(0,0,0,0.08); }
</style>
