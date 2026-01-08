const { BASE_URL } = require('../../config.js');
Page({
  data: {
    loading: true,
    items: [],
    keywords: '',
    // 主题样式类（dark/light）
    themeClass: ''
  },

  onLoad(options) {
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

    const keywords = (options && (options.keywords || options.keyword)) ? decodeURIComponent(options.keywords || options.keyword) : '';
    this.setData({ keywords });
    this.fetchAttractions(keywords);
  },

  fullCoverUrl(path) {
    if (!path) return '';
    const p = String(path);
    if (p.startsWith('http://') || p.startsWith('https://')) return p;
    if (p.startsWith('/')) {
      // 兼容 /static/attractions -> /attractions
      const fixed = p.replace(/^\/static\/attractions/, '/attractions');
      return `${BASE_URL}${fixed}`;
    }
    // 兼容可能返回的相对静态路径
    if (p.includes('/static/')) {
      const idx = p.indexOf('/static/');
      const rel = p.substring(idx);
      const fixed = rel.replace(/^\/static\/attractions/, '/attractions');
      return `${BASE_URL}${fixed}`;
    }
    // 兼容后端可能返回的存储路径
    if (p.includes('storage/attractions')) {
      const key = 'storage/attractions';
      const rel = p.substring(p.indexOf(key) + key.length);
      return `${BASE_URL}/static/attractions${rel}`;
    }
    return '';
  },

  async fetchAttractions(keywords = '') {
    if (!keywords) {
      wx.request({
        url: `${BASE_URL}/api/attractions?page_size=100`, // 显示全部，避免推荐为空
        method: 'GET',
        success: (res) => {
          const data = res.data || {};
          const items = (data.items || []).map(it => ({
            ...it,
            _cover: this.fullCoverUrl(it.cover_image)
          }));
          this.setData({ items });
        },
        fail: (err) => { console.error('景点接口失败', err); this.setData({ items: [] }); },
        complete: () => { this.setData({ loading: false }); }
      });
      return;
    }
    // 多关键词合并结果
    const keys = keywords.split(',').map(s => s.trim()).filter(Boolean);
    const reqs = keys.map(k => new Promise((resolve) => {
      wx.request({
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
      // 当偏好关键词没有匹配到任何景点时，回退到全部景点列表
      if (!items.length) {
        wx.showToast({ title: '未匹配到你的偏好，已展示全部', icon: 'none' });
        wx.request({
          url: `${BASE_URL}/api/attractions?page_size=100`,
          method: 'GET',
          success: (res) => {
            const data = res.data || {};
            const allItems = (data.items || []).map(it => ({
              ...it,
              _cover: this.fullCoverUrl(it.cover_image)
            }));
            this.setData({ items: allItems, loading: false });
          },
          fail: (err) => {
            console.error('回退到全部景点失败', err);
            this.setData({ items: [], loading: false });
          },
          complete: () => {}
        });
        return;
      }
      this.setData({ items, loading: false });
    }).catch(err => {
      console.error('合并偏好推荐失败', err);
      // 请求失败时也回退到全部景点
      wx.request({
        url: `${BASE_URL}/api/attractions?page_size=100`,
        method: 'GET',
        success: (res) => {
          const data = res.data || {};
          const allItems = (data.items || []).map(it => ({
            ...it,
            _cover: this.fullCoverUrl(it.cover_image)
          }));
          this.setData({ items: allItems, loading: false });
        },
        fail: () => { this.setData({ loading: false, items: [] }); }
      });
    });
  },

  onImageError(e) {
    const idx = e.currentTarget.dataset.index;
    console.warn('封面加载失败，index=', idx, e.detail);
  }
});