<template>
	<view class="page" :class="themeClass">
		<view class="header">
			<view class="title">推荐景点</view>
			<view class="sub">从后台更新的封面将展示在此</view>
		</view>

		<!-- 第一层：加载中 / 非加载 -->
		<view v-if="loading">
			<view class="grid">
				<view class="card skeleton" v-for="i in 6" :key="i">
					<view class="skeleton-img"></view>
					<view class="skeleton-line w-80"></view>
					<view class="skeleton-line w-60"></view>
				</view>
			</view>
		</view>

		<view v-else>
			<!-- 第二层：有数据 / 无数据 -->
			<view class="grid" v-if="items.length > 0">
				<navigator class="card" v-for="(item, index) in items" :key="item.id" :url="'/pages/lake-detail/lake-detail?id=' + item.id">
					<image class="cover" :src="item._cover" mode="aspectFill" @error="onImageError($event, index)"></image>
					<view class="name">{{item.name}}</view>
					<view class="meta">{{item.category}} · ⭐ {{item.rating}}</view>
				</navigator>
			</view>

			<view class="empty" v-else>暂无景点数据</view>
		</view>
	</view>
</template>

<script>
	import { BASE_URL } from '../../common/config.js';

	export default {
		data() {
			return {
				loading: true,
				items: [],
				keywords: '',
				themeClass: ''
			}
		},
		onLoad(options) {
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

			const keywords = (options && (options.keywords || options.keyword)) ? decodeURIComponent(options.keywords || options.keyword) : '';
			this.keywords = keywords;
			this.fetchAttractions(keywords);
		},
		methods: {
			fullCoverUrl(path) {
				if (!path) return '';
				const p = String(path);
				if (p.startsWith('http://') || p.startsWith('https://')) return p;
				if (p.startsWith('/')) {
					const fixed = p.replace(/^\/static\/attractions/, '/attractions');
					return `${BASE_URL}${fixed}`;
				}
				if (p.includes('/static/')) {
					const idx = p.indexOf('/static/');
					const rel = p.substring(idx);
					const fixed = rel.replace(/^\/static\/attractions/, '/attractions');
					return `${BASE_URL}${fixed}`;
				}
				if (p.includes('storage/attractions')) {
					const key = 'storage/attractions';
					const rel = p.substring(p.indexOf(key) + key.length);
					return `${BASE_URL}/static/attractions${rel}`;
				}
				return '';
			},
			async fetchAttractions(keywords = '') {
				if (!keywords) {
					uni.request({
						url: `${BASE_URL}/api/attractions?page_size=100`,
						method: 'GET',
						success: (res) => {
							const data = res.data || {};
							const items = (data.items || []).map(it => ({
								...it,
								_cover: this.fullCoverUrl(it.cover_image)
							}));
							this.items = items;
						},
						fail: (err) => { console.error('景点接口失败', err); this.items = []; },
						complete: () => { this.loading = false; }
					});
					return;
				}
				
				const keys = keywords.split(',').map(s => s.trim()).filter(Boolean);
				const reqs = keys.map(k => new Promise((resolve) => {
					uni.request({
						url: `${BASE_URL}/api/attractions?page_size=100&keyword=${encodeURIComponent(k)}`,
						method: 'GET',
						success: (res) => {
							const data = res.data || {};
							resolve(data.items || []);
						},
						fail: () => resolve([])
					});
				}));
				
				Promise.all(reqs).then(groups => {
					const mergedMap = new Map();
					groups.flat().forEach(it => {
						if (!mergedMap.has(it.id)) mergedMap.set(it.id, it);
					});
					let items = Array.from(mergedMap.values()).map(it => ({
						...it,
						_cover: this.fullCoverUrl(it.cover_image)
					}));
					
					if (!items.length) {
						uni.showToast({ title: '未匹配到你的偏好，已展示全部', icon: 'none' });
						uni.request({
							url: `${BASE_URL}/api/attractions?page_size=100`,
							method: 'GET',
							success: (res) => {
								const data = res.data || {};
								const allItems = (data.items || []).map(it => ({
									...it,
									_cover: this.fullCoverUrl(it.cover_image)
								}));
								this.items = allItems;
								this.loading = false;
							},
							fail: (err) => {
								console.error('回退到全部景点失败', err);
								this.items = [];
								this.loading = false;
							},
							complete: () => {}
						});
						return;
					}
					this.items = items;
					this.loading = false;
				}).catch(err => {
					console.error('合并偏好推荐失败', err);
					uni.request({
						url: `${BASE_URL}/api/attractions?page_size=100`,
						method: 'GET',
						success: (res) => {
							const data = res.data || {};
							const allItems = (data.items || []).map(it => ({
								...it,
								_cover: this.fullCoverUrl(it.cover_image)
							}));
							this.items = allItems;
							this.loading = false;
						},
						fail: () => { this.loading = false; this.items = []; }
					});
				});
			},
			onImageError(e, index) {
				console.warn('封面加载失败，index=', index, e.detail);
			}
		}
	}
</script>

<style>
.page { padding: 16rpx; background: linear-gradient(180deg, #ffffff 0%, #f7f7fb 100%); min-height: 100vh; }
.header { padding: 16rpx; }
.title { font-size: 34rpx; font-weight: 700; color: #111827; }
.sub { font-size: 26rpx; color: #6b7280; margin-top: 6rpx; }
.grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16rpx; padding: 12rpx; }
.card { background: #fff; border-radius: 16rpx; overflow: hidden; box-shadow: 0 6rpx 16rpx rgba(0,0,0,0.06); }
.cover { width: 100%; height: 280rpx; background: #f3f4f6; }
.name { padding: 12rpx; font-weight: 600; color: #111827; }
.meta { padding: 0 12rpx 12rpx; color: #6b7280; font-size: 24rpx; }

/* 骨架屏 */
.skeleton { padding: 12rpx; }
.skeleton-img { width: 100%; height: 280rpx; background: #e5e7eb; border-radius: 12rpx; }
.skeleton-line { position: relative; height: 28rpx; background: #e5e7eb; border-radius: 10rpx; margin-top: 10rpx; overflow: hidden; }
.skeleton-line::after { content: ""; position: absolute; left: -40%; top: 0; height: 100%; width: 40%; background: linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.6), rgba(255,255,255,0)); animation: shimmer 1.2s infinite; }
.w-80 { width: 80%; }
.w-60 { width: 60%; }
@keyframes shimmer { 0% { left: -40%; } 100% { left: 100%; } }

.empty { color: #9ca3af; text-align: center; margin-top: 40rpx; }

/* 主题：暗色模式背景与毛玻璃卡片 */
.page.theme-dark {
  background: radial-gradient(1200rpx 600rpx at 30% 10%, #1b2330 0%, #0d1117 60%, #0a0d12 100%);
  color: #e9edf3;
}
.page.theme-dark .title { color: #e9edf3; }
.page.theme-dark .sub { color: #c7cbd2; }
.page.theme-dark .card { backdrop-filter: blur(10rpx); background: rgba(28,33,43,0.75); border: 1rpx solid rgba(255,255,255,0.08); box-shadow: 0 24rpx 60rpx rgba(0,0,0,0.35); }
.page.theme-dark .name { color: #e9edf3; }
.page.theme-dark .meta { color: #b8bdc6; }

/* 主题：浅色模式背景与毛玻璃卡片 */
.page.theme-light {
  background: radial-gradient(1200rpx 600rpx at 30% 10%, #f0f5ff 0%, #e9efff 50%, #f7f9fc 100%);
  color: #1c1c1e;
}
.page.theme-light .title { color: #1c1c1e; }
.page.theme-light .sub { color: #64748b; }
.page.theme-light .card { backdrop-filter: blur(10rpx); background: rgba(255,255,255,0.72); border: 1rpx solid rgba(0,0,0,0.08); box-shadow: 0 24rpx 60rpx rgba(0,0,0,0.15); }
.page.theme-light .name { color: #1c1c1e; }
.page.theme-light .meta { color: #6b7280; }
</style>
