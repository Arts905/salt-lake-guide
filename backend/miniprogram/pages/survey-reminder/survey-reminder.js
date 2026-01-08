Page({
  data: {
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
  goSurvey() {
    // 清除暂不提醒标记并跳转到偏好调研页
    try { wx.removeStorageSync('survey_dismissed_until'); } catch (e) {}
    wx.navigateTo({ url: '/pages/survey/survey' });
  },
  dismiss() {
    // 设定暂不提醒（3天）
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
    const until = Date.now() + threeDaysMs;
    try { wx.setStorageSync('survey_dismissed_until', until); } catch (e) {}
    // 返回首页
    wx.navigateBack({ delta: 1 });
  }
});