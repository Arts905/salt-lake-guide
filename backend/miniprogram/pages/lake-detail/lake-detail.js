// 引入统一域名配置（顶层）
const { BASE_URL } = require('../../config.js');
Page({
  data: {
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
    // 新增：主题样式类
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

    const id = Number(options.id || 0);
    if (id) {
      this.fetchAttractionDetail(id);
    } else {
      this.setDefaultLakeData();
    }
  },
  navigate() {
    const { latitude, longitude, name } = this.data.lake;
    if (!latitude || !longitude) {
      wx.showToast({ title: '缺少坐标信息', icon: 'none' });
      return;
    }
    wx.openLocation({ latitude, longitude, name, scale: 14 });
  },

  // 新增：跳转高德地图，提示用户选择高德并开启AR导航
  navigateAMap() {
    const { latitude, longitude, name } = this.data.lake;
    if (!latitude || !longitude) {
      wx.showToast({ title: '缺少坐标信息', icon: 'none' });
      return;
    }
    wx.showModal({
      title: '提示',
      content: '即将打开地图选择器，请选择“高德地图”，进入后在高德中开启AR导航。',
      showCancel: false,
      success: () => {
        wx.openLocation({ latitude, longitude, name, scale: 18 });
      }
    });
  },

  // 将后端返回的封面路径转为可访问 URL（与首页一致）
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
  
  // 从API获取景点详情
  fetchAttractionDetail(id) {
    if (!id) {
      this.setDefaultLakeData();
      return;
    }
    
    wx.showLoading({ title: '加载中', mask: true });
    wx.request({
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
          this.setData({ lake });
          wx.setNavigationBarTitle({ title: lake.name || '景点详情' });
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
        wx.hideLoading();
      }
    });
  },
  
  // 图片加载失败日志
  onImageError(e) {
    const src = this.data.lake && this.data.lake.cover;
    console.warn('详情页封面加载失败:', { src, err: e.detail });
  },
  
  // 设置默认景点数据（后备方案）
  setDefaultLakeData(id = 0) {
     const data = this.resolveLake(id);
     this.setData({ lake: data });
     wx.setNavigationBarTitle({ title: data.name || '景点详情' });
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
  },
});