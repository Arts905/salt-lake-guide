const { BASE_URL } = require('../../config.js');
Page({
  data: {
    selected: [],
    // 新增：主题样式类
    themeClass: ''
  },
  onLoad() {
    // 设置主题并监听变化，同时更新导航栏颜色
    try {
      const info = wx.getSystemInfoSync();
      const theme = info.theme || 'light';
      const themeClass = theme === 'dark' ? 'theme-dark' : 'theme-light';
      this.setData({ themeClass });
      if (theme === 'dark') {
        wx.setNavigationBarColor({ frontColor: '#ffffff', backgroundColor: '#0d1117' });
      } else {
        wx.setNavigationBarColor({ frontColor: '#000000', backgroundColor: '#ffffff' });
      }
      wx.onThemeChange && wx.onThemeChange(({ theme }) => {
        const themeClass = theme === 'dark' ? 'theme-dark' : 'theme-light';
        this.setData({ themeClass });
        if (theme === 'dark') {
          wx.setNavigationBarColor({ frontColor: '#ffffff', backgroundColor: '#0d1117' });
        } else {
          wx.setNavigationBarColor({ frontColor: '#000000', backgroundColor: '#ffffff' });
        }
      });
    } catch (e) {}
  },
  onChange(e) {
    this.setData({ selected: e.detail.value || [] });
  },
  submitPreferences() {
    const selected = this.data.selected || [];
    if (!selected.length) {
      wx.showToast({ title: '请至少选择一项偏好', icon: 'none' });
      return;
    }
    try {
      // 标记完成调查并清理提醒
      wx.setStorageSync('survey_completed', true);
      wx.removeStorageSync('survey_dismissed_until');
      // 新增：持久化偏好，用于首页个性化推荐
      wx.setStorageSync('user_prefs', { keywords: selected, updatedAt: Date.now() });
    } catch (e) {}
    wx.showToast({ title: '已保存偏好', icon: 'success', duration: 800 });
    // 原有跳转逻辑：将关键字传给 attractions 列表
    const keywords = encodeURIComponent((selected || []).join(','));
    wx.navigateTo({ url: `/pages/attractions/attractions?keywords=${keywords}` });
  }
});