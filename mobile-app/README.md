# 盐湖检测移动端 App (Uni-app)

这是一个基于 Uni-app 开发的移动端应用项目，由微信小程序转换而来。支持编译打包为 Android 和 iOS 原生 App。

## 🛠️ 开发环境安装

**HBuilderX 是安装在电脑（Windows/Mac）上的开发工具**，用于编写代码和编译项目。

1. **下载 HBuilderX**
   - 访问 DCloud 官网下载：https://www.dcloud.io/hbuilderx.html
   - 推荐下载 "App开发版" (内置相关插件)。

2. **安装与启动**
   - 解压下载的压缩包。
   - 双击 `HBuilderX.exe` 启动。

## 🚀 如何运行项目

1. **导入项目**
   - 在 HBuilderX 中点击菜单栏 `文件` -> `打开目录`。
   - 选择本文件夹 `mobile-app`。

2. **连接手机或模拟器**
   - **真机调试**：使用 USB 数据线将手机连接到电脑，并开启手机的 "USB调试" 模式（在开发者选项中）。
   - **模拟器**：也可以安装 Android 模拟器（如 MuMu、夜神）或使用 Xcode Simulator (Mac)。

3. **开始运行**
   - 点击 HBuilderX 顶部菜单栏的 `运行` -> `运行到手机或模拟器`。
   - 选择检测到的设备。
   - 等待编译完成，App 将自动安装到你的手机上。

## 📁 目录结构

- `pages/` - 页面文件 (.vue)
  - `index/` - 首页
  - `realtime/` - 实时指数
  - `lake-detail/` - 景点详情
  - `attractions/` - 景点列表
  - `survey/` - 偏好调研
- `common/` - 公共工具 (如 config.js)
- `static/` - 静态资源 (图片等)
- `App.vue` - 应用入口与全局样式
- `main.js` - Vue 初始化入口
- `manifest.json` - App 配置 (应用名称、图标、权限等)
- `pages.json` - 路由与导航栏配置

## 📱 打包发布

当开发完成后，生成安装包：
- 点击菜单栏 `发行` -> `原生App-云打包`。
- 按照提示配置证书（测试可使用公共测试证书）。
- 打包完成后会生成 `.apk` (Android) 或 `.ipa` (iOS) 文件。
