<template>
	<view class="page" :class="themeClass">
		<view class="hero">
			<image class="hero-img" :src="lake.cover" mode="aspectFill" @error="onImageError" />
			<view class="hero-info">
				<view class="name">{{lake.name}}</view>
				<view class="meta">{{lake.country}} · {{lake.rating}}★</view>
			</view>
		</view>

		<view class="section">
			<view class="sec-title">简介</view>
			<view class="desc">{{lake.desc}}</view>
		</view>

		<view class="section">
			<view class="sec-title">导航</view>
			<button class="btn-nav" @click="navigate">打开地图导航</button>
			<!-- 新增：跳转高德AR导航 -->
			<button class="btn-nav" @click="navigateAMap">跳转高德AR导航</button>
		</view>
	</view>
</template>

<script>
	import { BASE_URL } from '../../common/config.js';

	export default {
		data() {
			return {
				lake: {
					id: 0,
					name: '运城盐湖',
					country: '山西·运城',
					rating: 4.7,
					cover: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
					desc: '暂无详细介绍',
					latitude: 0,
					longitude: 0
				},
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

			const id = Number(options.id || 0);
			if (id) {
				this.fetchAttractionDetail(id);
			} else {
				this.setDefaultLakeData();
			}
		},
		methods: {
			navigate() {
				const { latitude, longitude, name } = this.lake;
				if (!latitude || !longitude) {
					uni.showToast({ title: '缺少坐标信息', icon: 'none' });
					return;
				}
				uni.openLocation({ latitude, longitude, name, scale: 14 });
			},
			navigateAMap() {
				const { latitude, longitude, name } = this.lake;
				if (!latitude || !longitude) {
					uni.showToast({ title: '缺少坐标信息', icon: 'none' });
					return;
				}
				uni.showModal({
					title: '提示',
					content: '即将打开地图选择器，请选择“高德地图”，进入后在高德中开启AR导航。',
					showCancel: false,
					success: (res) => {
						if (res.confirm) {
							uni.openLocation({ latitude, longitude, name, scale: 18 });
						}
					}
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
			fetchAttractionDetail(id) {
				if (!id) {
					this.setDefaultLakeData();
					return;
				}
				
				uni.showLoading({ title: '加载中', mask: true });
				uni.request({
					url: `${BASE_URL}/api/attractions/${id}`,
					method: 'GET',
					success: (res) => {
						if (res.statusCode === 200 && res.data) {
							const attraction = res.data;
							const lake = {
								id: attraction.id,
								name: attraction.name,
								country: '山西·运城',
								rating: attraction.rating,
								cover: this.fullCoverUrl(attraction.cover_image) || 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
								desc: attraction.description || '暂无详细介绍',
								latitude: attraction.latitude || 0,
								longitude: attraction.longitude || 0
							};
							this.lake = lake;
							uni.setNavigationBarTitle({ title: lake.name || '景点详情' });
						} else {
							console.error('获取景点详情失败', res);
							this.setDefaultLakeData(id);
						}
					},
					fail: (err) => {
						console.error('景点详情请求失败', err);
						this.setDefaultLakeData(id);
					},
					complete: () => {
						uni.hideLoading();
					}
				});
			},
			onImageError(e) {
				const src = this.lake && this.lake.cover;
				console.warn('详情页封面加载失败:', { src, err: e.detail });
			},
			setDefaultLakeData(id = 0) {
				const data = this.resolveLake(id);
				this.lake = data;
				uni.setNavigationBarTitle({ title: data.name || '景点详情' });
			},
			resolveLake(id) {
				const LAKES = {
					201: {
						id: 201,
						name: '运城盐湖·主景区',
						country: '山西·运城',
						rating: 4.8,
						cover: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=1200&q=80',
						desc: '运城盐湖历史悠久，盐业文化与湿地生态共生，主景区适合游览拍摄。',
						latitude: 35.02, longitude: 111.0
					},
					202: {
						id: 202,
						name: '运城盐湖·五彩盐湖',
						country: '山西·运城',
						rating: 4.7,
						cover: 'https://images.unsplash.com/photo-1529927066849-6f50a8fd5a0a?auto=format&fit=crop&w=1200&q=80',
						desc: '不同矿物与微生物形成多彩斑块，晴朗少风时色彩更突出，适合航拍与取景。',
						latitude: 35.04, longitude: 111.02
					},
					203: {
						id: 203,
						name: '盐湖博物馆',
						country: '山西·运城',
						rating: 4.6,
						cover: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
						desc: '了解盐湖形成、开采与文化变迁的窗口，适合科普与研学。',
						latitude: 35.03, longitude: 111.01
					}
				};
				return LAKES[id] || {
					id: 0,
					name: '运城盐湖',
					country: '山西·运城',
					rating: 4.7,
					cover: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
					desc: '暂无详细介绍',
					latitude: 0,
					longitude: 0
				};
			}
		}
	}
</script>

<style>
.page { background: #F2F2F7; min-height: 100vh; }
.hero { position: relative; height: 320rpx; }
.hero-img { width: 100%; height: 100%; }
.hero-info { position: absolute; left: 0; right: 0; bottom: 0; padding: 22rpx; color: #fff; background: linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.45) 100%); }
.name { font-size: 34rpx; font-weight: 700; }
.meta { margin-top: 6rpx; font-size: 24rpx; opacity: 0.9; }
.section { padding: 24rpx; }
.sec-title { font-size: 30rpx; font-weight: 700; color: #111; margin-bottom: 12rpx; }
.desc { font-size: 26rpx; color: #333; line-height: 1.6; }
.btn-nav { margin-top: 10rpx; background: #0A84FF; color: #fff; border-radius: 20rpx; }

/* 主题：暗色模式背景与卡片（渐变+毛玻璃） */
.page.theme-dark {
  background: radial-gradient(1200rpx 600rpx at 30% 10%, #1b2330 0%, #0d1117 60%, #0a0d12 100%);
  color: #e9edf3;
}
.page.theme-dark .section { backdrop-filter: blur(10rpx); background: rgba(28,33,43,0.75); border: 1rpx solid rgba(255,255,255,0.08); border-radius: 24rpx; margin: 24rpx; padding: 24rpx; box-shadow: 0 24rpx 60rpx rgba(0,0,0,0.35); }
.page.theme-dark .sec-title { color: #e9edf3; }
.page.theme-dark .desc { color: #c7cbd2; }

/* 主题：浅色模式背景与卡片（渐变+毛玻璃） */
.page.theme-light {
  background: radial-gradient(1200rpx 600rpx at 30% 10%, #f0f5ff 0%, #e9efff 50%, #f7f9fc 100%);
  color: #1c1c1e;
}
.page.theme-light .section { backdrop-filter: blur(10rpx); background: rgba(255,255,255,0.72); border: 1rpx solid rgba(0,0,0,0.08); border-radius: 24rpx; margin: 24rpx; padding: 24rpx; box-shadow: 0 24rpx 60rpx rgba(0,0,0,0.15); }
.page.theme-light .sec-title { color: #1c1c1e; }
.page.theme-light .desc { color: #334155; }
</style>
