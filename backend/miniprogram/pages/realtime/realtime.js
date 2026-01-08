const { BASE_URL } = require('../../config.js');
Page({
  data: {
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
    // 新增：天气简报
    weather_now: null,
    weather_next2h: [],
    // 新增：加载态与空态
    loading: false,
    // 新增：主题样式类
    themeClass: ''
  },

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

  onLoad() {
    // 主题检测与导航栏颜色
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

    // 进入页面默认加载1号盐湖实时与天气
    this.fetchRealtime();
    this.fetchWeatherBrief();
  },

  onReady() {
    // 初始绘制，以防无数据时显示空环
    this.drawScorePie(this.data.score || 0);
  },

  // 选择湖区
  onSelect(e) {
    const selected = Number(e.detail.value);
    this.setData({ selected });
    this.fetchRealtime();
  },

  fetchWeatherBrief() {
    wx.request({
      url: `${BASE_URL}/api/weather/now2h`,
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200 && res.data) {
          let now = res.data.now || null;
          const next2h = res.data.next2h || [];
          // 兼容能见度字段（visibility/vis），确保数值显示
          if (now) {
            const vis = now.visibility != null ? now.visibility : now.vis;
            now.visibility = typeof vis === 'number' ? vis : (vis ? Number(vis) : 0);
          }
          this.setData({ weather_now: now, weather_next2h: next2h });
        }
      },
      fail: (err) => {
        console.error('天气接口请求失败', err);
        this.setData({ weather_now: null, weather_next2h: [] });
      }
    });
  },

  fetchRealtime() {
    const lakeId = this.data.selected + 1;
    this.setData({ loading: true });
    wx.showLoading({ title: '加载中', mask: true });
    wx.request({
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
        this.setData({
          lake_name: data.lake_name || fallback.lake_name,
          captured_at: data.captured_at || fallback.captured_at,
          score,
          reason: data.reason || fallback.reason,
          image_url: image_url || fallback.image_url,
          sat_pct: sat_pct || fallback.sat_pct,
          red_pct: red_pct || fallback.red_pct,
          pink_pct: pink_pct || fallback.pink_pct
        });

        // 更新圆形进度图
        this.drawScorePie(score);
      },
      fail: (err) => {
        wx.showToast({ title: '请求失败，请检查后端', icon: 'none' });
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
        this.setData(fallback);
        this.drawScorePie(fallback.score);
      },
      complete: () => { wx.hideLoading(); this.setData({ loading: false }); }
    });
  },

  drawScorePie(percent) {
    // percent: 0-100
    const ctx = wx.createCanvasContext('scorePie', this);
    const size = 140; // 与样式宽高保持一致（px）
    const center = size / 2;
    const radius = center - 12;
    const startAngle = -Math.PI / 2; // 从上方开始
    const endAngle = startAngle + (Math.max(0, Math.min(100, percent)) / 100) * 2 * Math.PI;

    // 背景圆
    ctx.setLineWidth(12);
    ctx.setStrokeStyle('#e5e7eb');
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, 2 * Math.PI);
    ctx.stroke();

    // 进度圆
    ctx.setLineCap('round');
    ctx.setStrokeStyle('#0A84FF');
    ctx.beginPath();
    ctx.arc(center, center, radius, startAngle, endAngle);
    ctx.stroke();

    // 中心文字（分数）
    ctx.setFillStyle('#0A84FF');
    ctx.setFontSize(26);
    const text = String(Math.round(percent));
    const textWidth = ctx.measureText ? ctx.measureText(text).width : (text.length * 14);
    ctx.fillText(text, center - textWidth / 2, center + 8);

    ctx.draw();
  }
  ,
  goAttractions() {
    wx.navigateTo({ url: '/pages/attractions/attractions' });
  }
});