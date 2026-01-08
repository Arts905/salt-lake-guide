<template>
	<view class="page" :class="themeClass">
		<view class="hero">
			<view class="hero-title">Let's Discover</view>
			<view class="hero-sub">探索盐湖与周边的精彩</view>
			<button class="hero-cta" @click="openSurvey">开始探索</button>
		</view>

		<view class="search-bar">
			<text class="search-icon">🔍</text>
			<input class="search-input" placeholder="搜索目的地或景点" :value="searchQuery" @input="onSearchInput" @confirm="onSearchConfirm" confirm-type="search" />
		</view>

		<!-- 热门湖泊推荐 -->
		<view class="section-title">热门湖泊推荐</view>
		<view v-if="hotLakes.length > 0">
			<view class="lake-list">
				<view class="lake-card" v-for="(item, index) in hotLakes" :key="item.id" @click="openDetail(item.id)">
					<image class="lake-cover" :src="item.cover" mode="aspectFill" @error="onImageError($event, index)" />
					<view class="lake-overlay">
						<view class="lake-name">{{item.name}}</view>
						<view class="lake-meta">{{item.country}} · {{item.rating}}★ · {{item.distance}}</view>
					</view>
				</view>
			</view>
		</view>

		<!-- 今日预测（保留原有功能） -->
		<view class="section-title section-title--sub">今日观测条件预测</view>
		<view v-if="list.length > 0">
			<view class="card" :class="item.cardClass" v-for="item in list" :key="item.lake_id">
				<view class="card__header">
					<view class="lake">{{item.lake_name}}</view>
					<view class="time">☀️ 最佳时间：{{item.best_time.start}} ~ {{item.best_time.end}}</view>
				</view>
				<view class="card__body">
					<view class="score">{{item.score}}</view>
					<view class="reason">{{item.reason}}</view>
				</view>
			</view>
		</view>
		<view v-else class="empty">
			<view class="empty-title">暂无预测数据</view>
			<view class="empty-desc">请点击下方按钮刷新，或检查后端服务是否运行</view>
		</view>

		<button class="btn" @click="refresh">刷新预测</button>
		<button class="btn" style="margin-top: 16rpx;" @click="openSurvey">偏好调研</button>
	</view>
</template>

<script>
	import { BASE_URL } from '../../common/config.js';

	export default {
		data() {
			return {
				hotLakes: [],
				list: [],
				reminderShownOnce: false,
				themeClass: '',
				searchQuery: '',
				activeSeg: 'popular'
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
				// uni.onThemeChange && uni.onThemeChange(...) 
			} catch (e) {}

			this.fetchPredictions();
			this.fetchPersonalizedAttractionsOrFallback();
			this.scheduleSurveyReminderCheck();
		},
		onShow() {
			this.maybeShowSurveyReminder();
			this.fetchPersonalizedAttractionsOrFallback();
		},
		methods: {
			openDetail(id) {
				uni.navigateTo({ url: `/pages/lake-detail/lake-detail?id=${id}` });
			},
			openSurvey() {
				uni.navigateTo({ url: '/pages/survey/survey' });
			},
			maybeShowSurveyReminder() {
				if (this.reminderShownOnce) return;
				try {
					const completed = !!uni.getStorageSync('survey_completed');
					const dismissedUntil = uni.getStorageSync('survey_dismissed_until');
					const now = Date.now();
					const dismissedActive = typeof dismissedUntil === 'number' && dismissedUntil > now;
					console.log('[survey-reminder:onShow]', { completed, dismissedUntil, now });
					if (!completed && !dismissedActive) {
						this.reminderShownOnce = true;
						uni.navigateTo({ url: '/pages/survey-reminder/survey-reminder' });
					}
				} catch (e) {
					console.warn('[survey-reminder:onShow] read storage failed', e);
					this.reminderShownOnce = true;
					uni.navigateTo({ url: '/pages/survey-reminder/survey-reminder' });
				}
			},
			scheduleSurveyReminderCheck() {
				try {
					this.$nextTick(() => {
						setTimeout(() => {
							if (this.reminderShownOnce) return;
							const completed = !!uni.getStorageSync('survey_completed');
							const dismissedUntil = uni.getStorageSync('survey_dismissed_until');
							const now = Date.now();
							const dismissedActive = typeof dismissedUntil === 'number' && dismissedUntil > now;
							console.log('[survey-reminder:onLoad-delay]', { completed, dismissedUntil, now });
							if (!completed && !dismissedActive) {
								this.reminderShownOnce = true;
								uni.navigateTo({ url: '/pages/survey-reminder/survey-reminder' });
							}
						}, 0);
					});
				} catch (e) {
					console.warn('[survey-reminder:onLoad-delay] failed', e);
				}
			},
			refresh() {
				this.fetchPredictions();
				this.fetchPersonalizedAttractionsOrFallback();
			},
			onSearchInput(e) {
				this.searchQuery = e.detail.value || '';
			},
			onSearchConfirm() {
				const q = (this.searchQuery || '').trim();
				const url = q ? `/pages/attractions/attractions?keywords=${encodeURIComponent(q)}` : '/pages/attractions/attractions';
				uni.navigateTo({ url });
			},
			onSwitchSeg(e) {
				// dataset in uni-app/vue is accessed differently usually, but let's assume standard event binding if we kept dataset
				// Better: @click="onSwitchSeg('popular')"
				const key = e.currentTarget.dataset.key || 'all'; // keeping compatibility
				this.activeSeg = key;
				if (key === 'recommended') {
					this.fetchRecommendedAttractions();
					return;
				}
				if (key === 'popular') {
					const list = (this.hotLakes || []).slice().sort((a,b) => (b.rating||0) - (a.rating||0));
					this.hotLakes = list;
					return;
				}
				this.fetchPersonalizedAttractionsOrFallback();
			},
			mapScoreToClass(score) {
				if (score >= 90) return 'grad-high';
				if (score >= 60) return 'grad-mid';
				return 'grad-low';
			},
			fetchPredictions() {
				uni.showLoading({ title: '加载中', mask: true });
				uni.request({
					url: `${BASE_URL}/api/prediction/today`,
					method: 'GET',
					success: (res) => {
						const raw = res.data || [];
						let list = raw.map(item => ({
							...item,
							cardClass: this.mapScoreToClass(item.score)
						}));
						if (list.length === 0) {
							list = [{
								lake_id: 1,
								lake_name: '运城盐湖',
								score: 92,
								best_time: { start: '15:00', end: '17:00' },
								reason: '样例：云量低、光照强，利于盐藻显色',
								cardClass: this.mapScoreToClass(92)
							}];
						}
						this.list = list;
					},
					fail: (err) => {
						uni.showToast({ title: '请求失败，请检查后端', icon: 'none' });
						console.error('预测请求失败', err);
						const list = [{
							lake_id: 1,
							lake_name: '运城盐湖',
							score: 85,
							best_time: { start: '14:00', end: '16:00' },
							reason: '离线示例：少云、微风，色彩条件较好',
							cardClass: this.mapScoreToClass(85)
						}];
						this.list = list;
					},
					complete: () => { uni.hideLoading(); }
				});
			},
			fullCoverUrl(cover) {
				if (cover === undefined || cover === null) return '';
				let val = String(cover).trim();
				if (!val || /^(string|null|undefined)$/i.test(val)) return '';
				if (/^https?:\/\//i.test(val)) return val;
				val = val.replace(/^https?:\/\/[^/]+/, '');
				val = val.replace(/^\/?storage\/attractions\/?/i, '/attractions/');
				val = val.replace(/^\/?static\/attractions\/?/i, '/attractions/');
				if (!val.startsWith('/') && /\.(png|jpg|jpeg|webp|gif)$/i.test(val)) {
					return `${BASE_URL}/attractions/${val}`;
				}
				if (val.startsWith('/')) return `${BASE_URL}${val}`;
				return '';
			},
			fetchPersonalizedAttractionsOrFallback() {
				try {
					const prefs = uni.getStorageSync('user_prefs');
					const keywords = prefs && Array.isArray(prefs.keywords) ? prefs.keywords : [];
					if (keywords.length) {
						return this.fetchAttractionsByKeywords(keywords);
					}
				} catch (e) {
					console.warn('读取偏好失败，将使用后端推荐', e);
				}
				this.fetchRecommendedAttractions();
			},
			fetchAttractionsByKeywords(keywords) {
				const keys = (keywords || []).map(k => String(k).trim()).filter(Boolean);
				if (!keys.length) return this.fetchRecommendedAttractions();
				const reqs = keys.map(k => new Promise((resolve) => {
					uni.request({
						url: `${BASE_URL}/api/attractions?page_size=50&keyword=${encodeURIComponent(k)}`,
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
					const hotLakes = Array.from(mergedMap.values()).map(item => ({
						id: item.id,
						name: item.name,
						country: '山西·运城',
						rating: item.rating,
						distance: item.distance || '未知距离',
						cover: this.fullCoverUrl(item.cover_image) || 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=1200&q=80'
					}));
					if (!hotLakes.length) {
						uni.showToast({ title: '偏好无匹配，已回退推荐', icon: 'none' });
						this.fetchRecommendedAttractions();
						return;
					}
					this.hotLakes = hotLakes;
				}).catch(err => {
					console.error('合并偏好推荐失败', err);
					this.setDefaultAttractions();
				});
			},
			fetchRecommendedAttractions() {
				uni.request({
					url: `${BASE_URL}/api/attractions/recommend?limit=10`,
					method: 'GET',
					success: (res) => {
						if (res.statusCode === 200 && res.data) {
							const hotLakes = res.data.map(item => {
								const cover = this.fullCoverUrl(item.cover_image);
								return {
									id: item.id,
									name: item.name,
									country: '山西·运城',
									rating: item.rating,
									distance: item.distance || '未知距离',
									cover: cover || 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=1200&q=80'
								};
							});
							this.hotLakes = hotLakes;
						} else {
							console.error('获取推荐景点失败', res);
							this.setDefaultAttractions();
						}
					},
					fail: (err) => {
						console.error('推荐景点请求失败', err);
						this.setDefaultAttractions();
					}
				});
			},
			onImageError(e, index) {
				const item = this.hotLakes[index];
				console.warn('首页封面加载失败:', { index: index, id: item && item.id, src: item && item.cover, err: e.detail });
			},
			setDefaultAttractions() {
				const hotLakes = [
					{ id: 1, name: '运城盐湖·主景区', country: '山西·运城', rating: 4.8, distance: '市区内', cover: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=1200&q=80' },
					{ id: 2, name: '运城盐湖·五彩盐湖', country: '山西·运城', rating: 4.7, distance: '2.5 km', cover: 'https://images.unsplash.com/photo-1529927066849-6f50a8fd5a0a?auto=format&fit=crop&w=1200&q=80' },
					{ id: 3, name: '盐湖博物馆', country: '山西·运城', rating: 4.6, distance: '1.8 km', cover: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80' }
				];
				this.hotLakes = hotLakes;
			}
		}
	}
</script>

<style>
.page { padding: 24rpx; background: #F2F2F7; }
.section-title { font-size: 32rpx; font-weight: 700; color: #111; margin: 12rpx 8rpx 20rpx 8rpx; }
.section-title--sub { margin-top: 28rpx; }

/* 英雄区域 */
.hero { position: relative; margin: 0 8rpx 24rpx; padding: 40rpx 28rpx; border-radius: 28rpx; overflow: hidden; background: linear-gradient(180deg, #97C5FF 0%, #7AA8FF 50%, #4F7BFF 100%); color: #fff; box-shadow: 0 20rpx 60rpx rgba(79,123,255,0.35); }
.hero-title { font-size: 40rpx; font-weight: 800; }
.hero-sub { margin-top: 8rpx; font-size: 26rpx; opacity: 0.9; }
.hero-cta { margin-top: 20rpx; background: #FF7A59; color: #fff; border-radius: 24rpx; font-weight: 700; }

/* 搜索栏 */
.search-bar { display: flex; align-items: center; gap: 16rpx; margin: 0 8rpx 20rpx; padding: 18rpx 22rpx; background: #fff; border-radius: 24rpx; box-shadow: 0 12rpx 30rpx rgba(0,0,0,0.06); }
.search-icon { font-size: 30rpx; }
.search-input { flex: 1; font-size: 28rpx; }

/* 推荐列表 */
.lake-list { display: flex; flex-direction: column; gap: 20rpx; }
.lake-scroll { white-space: nowrap; padding: 0 8rpx; }
.lake-scroll .lake-card { display: inline-block; width: 520rpx; margin-right: 20rpx; }
.lake-card { position: relative; height: 280rpx; border-radius: 20rpx; overflow: hidden; box-shadow: 0 6rpx 16rpx rgba(0,0,0,0.08); }
.lake-cover { width: 100%; height: 100%; }
.lake-overlay { position: absolute; left: 0; right: 0; bottom: 0; padding: 20rpx; background: linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.35) 100%); color: #fff; }
.lake-name { font-size: 30rpx; font-weight: 700; }
.lake-meta { margin-top: 6rpx; font-size: 24rpx; opacity: 0.9; }

/* 预测卡片保留 */
.card { margin-bottom: 24rpx; border-radius: 20rpx; overflow: hidden; box-shadow: 0 6rpx 16rpx rgba(0,0,0,0.06); color: #111; background: #FFFFFF; }
.card__header { display: flex; justify-content: space-between; align-items: center; padding: 24rpx 28rpx 0 28rpx; }
.card__body { padding: 16rpx 28rpx 24rpx 28rpx; }
.lake { font-size: 32rpx; font-weight: 700; color: #111; }
.time { font-size: 26rpx; color: #8A8A8E; }
.score { font-size: 64rpx; font-weight: 800; letter-spacing: 1rpx; color: #0A84FF; }
.reason { margin-top: 12rpx; font-size: 26rpx; line-height: 1.5; color: #333; }
.btn { margin-top: 20rpx; background: #0A84FF; color: #fff; border-radius: 20rpx; font-weight: 600; }
.empty { padding: 60rpx 28rpx; text-align: center; color: #64748b; }
.empty-title { font-size: 30rpx; font-weight: 700; color: #1C1C1E; }
.empty-desc { margin-top: 12rpx; font-size: 26rpx; color: #8A8A8E; }
/* iOS-style accents */
.grad-high { background: #FFFFFF; border-left: 8rpx solid #FF3B30; }
.grad-mid { background: #FFFFFF; border-left: 8rpx solid #FF9F0A; }
.grad-low { background: #FFFFFF; border-left: 8rpx solid #34C759; }

/* 主题：暗色模式背景与卡片（渐变+毛玻璃） */
.page.theme-dark { 
  background: radial-gradient(1200rpx 600rpx at 30% 10%, #1b2330 0%, #0d1117 60%, #0a0d12 100%);
  color: #e9edf3;
}
.page.theme-dark .section-title { color: #e9edf3; }
.page.theme-dark .card { 
  backdrop-filter: blur(10rpx);
  background: rgba(28,33,43,0.72);
  border: 1rpx solid rgba(255,255,255,0.08);
  color: #e9edf3;
}
.page.theme-dark .time { color: #c7cbd2; }
.page.theme-dark .reason { color: #c7cbd2; }

/* 主题：浅色模式背景与卡片（渐变+毛玻璃） */
.page.theme-light { 
  background: radial-gradient(1200rpx 600rpx at 30% 10%, #f0f5ff 0%, #e9efff 50%, #f7f9fc 100%);
  color: #1c1c1e;
}
.page.theme-light .section-title { color: #1c1c1e; }
.page.theme-light .card { 
  backdrop-filter: blur(10rpx);
  background: rgba(255,255,255,0.72);
  border: 1rpx solid rgba(0,0,0,0.06);
  color: #1c1c1e;
}
.page.theme-light .time { color: #64748b; }
.page.theme-light .reason { color: #334155; }
</style>
