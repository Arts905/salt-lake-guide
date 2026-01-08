<script>
	export default {
		onLaunch: function() {
			console.log('App Launch')
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
		}
	}
</script>

<style>
	/*每个页面公共css */
	page { background: #F2F2F7; font-family: system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, "PingFang SC", "Microsoft YaHei", sans-serif; }
	.card { background: #FFFFFF; border-radius: 20rpx; padding: 20rpx; margin: 16rpx; box-shadow: 0 6rpx 16rpx rgba(0,0,0,0.06); }
	.lake { font-weight: 600; color: #111827; }
	.score { color: #0A84FF; }
	.time { color: #6B7280; }
	.btn { background: #0A84FF; color: #fff; border: none; padding: 18rpx 22rpx; border-radius: 20rpx; font-weight: 600; }
	/* Global utility classes for iOS style */
	.ui-title { font-size: 32rpx; font-weight: 700; color: #111; }
	.ui-subtitle { font-size: 26rpx; color: #666; }
	.ui-caption { font-size: 24rpx; color: #8A8A8E; }
	.ui-divider { height: 1rpx; background: #E5E5EA; margin: 12rpx 0; }
	.ui-badge { padding: 8rpx 14rpx; border-radius: 18rpx; background: #EEF2FF; color: #0A84FF; font-weight: 600; }
</style>
