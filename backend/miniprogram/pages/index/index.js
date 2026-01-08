const { BASE_URL } = require('../../config.js');
Page({
  data: {
    hotLakes: [],
    list: [],
    // 新增：提醒只弹一次的标记
    reminderShownOnce: false,
    // 新增：主题样式类（light/dark）
    themeClass: '',
    searchQuery: '',
    activeSeg: 'popular'
  },
  onLoad() {
    // 新增：根据系统主题设置页面主题，并监听主题变化
    try {
      const info = wx.getSystemInfoSync();
      const theme = info.theme || 'light';
      const themeClass = theme === 'dark' ? 'theme-dark' : 'theme-light';
      this.setData({ themeClass });
      // 同步更新导航栏颜色
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

    this.fetchPredictions();
    // 新增：优先拉取个性化推荐
    this.fetchPersonalizedAttractionsOrFallback();
    // 新增：在首屏渲染后延迟检查是否需要弹提醒
    this.scheduleSurveyReminderCheck();
  },
  onShow() {
    // 仍保留 onShow 检查，结合一次性标记避免重复
    this.maybeShowSurveyReminder();
    // 新增：返回首页时根据最新偏好刷新推荐
    this.fetchPersonalizedAttractionsOrFallback();
  },

  // 跳转详情页
  openDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/lake-detail/lake-detail?id=${id}` });
  },
  // 新增：跳转偏好调研页
  openSurvey() {
    wx.navigateTo({ url: '/pages/survey/survey' });
  },
  // 首次打开提醒逻辑：未完成调研且未暂不提醒时弹出提醒页
  maybeShowSurveyReminder() {
    if (this.data.reminderShownOnce) return;
    try {
      const completed = !!wx.getStorageSync('survey_completed');
      const dismissedUntil = wx.getStorageSync('survey_dismissed_until');
      const now = Date.now();
      const dismissedActive = typeof dismissedUntil === 'number' && dismissedUntil > now;
      console.log('[survey-reminder:onShow]', { completed, dismissedUntil, now });
      if (!completed && !dismissedActive) {
        this.setData({ reminderShownOnce: true });
        wx.navigateTo({ url: '/pages/survey-reminder/survey-reminder' });
      }
    } catch (e) {
      console.warn('[survey-reminder:onShow] read storage failed', e);
      this.setData({ reminderShownOnce: true });
      wx.navigateTo({ url: '/pages/survey-reminder/survey-reminder' });
    }
  },
  // 新增：在页面首次渲染后触发，避免过早跳转失败
  scheduleSurveyReminderCheck() {
    try {
      wx.nextTick(() => {
        setTimeout(() => {
          if (this.data.reminderShownOnce) return;
          const completed = !!wx.getStorageSync('survey_completed');
          const dismissedUntil = wx.getStorageSync('survey_dismissed_until');
          const now = Date.now();
          const dismissedActive = typeof dismissedUntil === 'number' && dismissedUntil > now;
          console.log('[survey-reminder:onLoad-delay]', { completed, dismissedUntil, now });
          if (!completed && !dismissedActive) {
            this.setData({ reminderShownOnce: true });
            wx.navigateTo({ url: '/pages/survey-reminder/survey-reminder' });
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
    this.setData({ searchQuery: e.detail.value || '' });
  },
  onSearchConfirm() {
    const q = (this.data.searchQuery || '').trim();
    const url = q ? `/pages/attractions/attractions?keywords=${encodeURIComponent(q)}` : '/pages/attractions/attractions';
    wx.navigateTo({ url });
  },
  
  onSwitchSeg(e) {
    const key = e.currentTarget.dataset.key || 'all';
    this.setData({ activeSeg: key });
    if (key === 'recommended') {
      this.fetchRecommendedAttractions();
      return;
    }
    if (key === 'popular') {
      const list = (this.data.hotLakes || []).slice().sort((a,b) => (b.rating||0) - (a.rating||0));
      this.setData({ hotLakes: list });
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
    wx.showLoading({ title: '加载中', mask: true });
    wx.request({
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
        this.setData({ list });
      },
      fail: (err) => {
        wx.showToast({ title: '请求失败，请检查后端', icon: 'none' });
        console.error('预测请求失败', err);
        const list = [{
          lake_id: 1,
          lake_name: '运城盐湖',
          score: 85,
          best_time: { start: '14:00', end: '16:00' },
          reason: '离线示例：少云、微风，色彩条件较好',
          cardClass: this.mapScoreToClass(85)
        }];
        this.setData({ list });
      },
      complete: () => { wx.hideLoading(); }
    });
  },

  // 将后端返回的封面路径转为可访问 URL
  fullCoverUrl(cover) {
    if (cover === undefined || cover === null) return '';
    let val = String(cover).trim();
    // 过滤明显无效值（例如后端占位或错误字符串）
    if (!val || /^(string|null|undefined)$/i.test(val)) return '';
    if (/^https?:\/\//i.test(val)) return val;
    // 去掉错误地拼入的 BASE_URL 前缀
    val = val.replace(/^https?:\/\/[^/]+/, '');
    // storage 路径转为 /attractions
    val = val.replace(/^\/?storage\/attractions\/?/i, '/attractions/');
    // /static/attractions -> /attractions
    val = val.replace(/^\/?static\/attractions\/?/i, '/attractions/');
    // 裸文件名允许（必须带图片扩展名）
    if (!val.startsWith('/') && /\.(png|jpg|jpeg|webp|gif)$/i.test(val)) {
      return `${BASE_URL}/attractions/${val}`;
    }
    // 其它以 / 开头的静态路径按 BASE_URL 拼接
    if (val.startsWith('/')) return `${BASE_URL}${val}`;
    // 其它情况视为无效
    return '';
  },
  
  // 新增：读取偏好并拉取个性化或回退推荐
  fetchPersonalizedAttractionsOrFallback() {
    try {
      const prefs = wx.getStorageSync('user_prefs');
      const keywords = prefs && Array.isArray(prefs.keywords) ? prefs.keywords : [];
      if (keywords.length) {
        return this.fetchAttractionsByKeywords(keywords);
      }
    } catch (e) {
      console.warn('读取偏好失败，将使用后端推荐', e);
    }
    this.fetchRecommendedAttractions();
  },

  // 新增：按关键词合并拉取景点（与 attractions 页逻辑对齐）
  fetchAttractionsByKeywords(keywords) {
    const keys = (keywords || []).map(k => String(k).trim()).filter(Boolean);
    if (!keys.length) return this.fetchRecommendedAttractions();
    const reqs = keys.map(k => new Promise((resolve) => {
      wx.request({
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
      // 若按偏好合并后无结果，回退到后端通用推荐
      if (!hotLakes.length) {
        wx.showToast({ title: '偏好无匹配，已回退推荐', icon: 'none' });
        this.fetchRecommendedAttractions();
        return;
      }
      this.setData({ hotLakes });
    }).catch(err => {
      console.error('合并偏好推荐失败', err);
      this.setDefaultAttractions();
    });
  },
  
  // 获取推荐景点列表（后端通用推荐）
  fetchRecommendedAttractions() {
    wx.request({
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
          this.setData({ hotLakes });
        } else {
          console.error('获取推荐景点失败', res);
          // 使用默认数据作为后备
          this.setDefaultAttractions();
        }
      },
      fail: (err) => {
        console.error('推荐景点请求失败', err);
        // 使用默认数据作为后备
        this.setDefaultAttractions();
      }
    });
  },

  // 图片加载失败日志
  onImageError(e) {
    const idx = e.currentTarget.dataset.index;
    const item = this.data.hotLakes[idx];
    console.warn('首页封面加载失败:', { index: idx, id: item && item.id, src: item && item.cover, err: e.detail });
  },
  
  // 设置默认景点数据（后备方案）
  setDefaultAttractions() {
    const hotLakes = [
      { id: 1, name: '运城盐湖·主景区', country: '山西·运城', rating: 4.8, distance: '市区内', cover: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=1200&q=80' },
      { id: 2, name: '运城盐湖·五彩盐湖', country: '山西·运城', rating: 4.7, distance: '2.5 km', cover: 'https://images.unsplash.com/photo-1529927066849-6f50a8fd5a0a?auto=format&fit=crop&w=1200&q=80' },
      { id: 3, name: '盐湖博物馆', country: '山西·运城', rating: 4.6, distance: '1.8 km', cover: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80' }
    ];
    this.setData({ hotLakes });
  }
});
