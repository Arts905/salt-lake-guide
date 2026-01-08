# 盐湖检测 React Native (Expo) 版本

## 运行步骤（Windows）

1. 安装 Node.js LTS 与 Git
2. 安装 Expo 工具：`npm i -g expo-cli`
3. 创建项目：`npx create-expo-app yanhu-rn`
4. 进入项目：`cd yanhu-rn`
5. 安装依赖：`npm i expo-router @react-native-async-storage/async-storage`
6. 在项目根创建 `app/` 目录，将本仓库 `rn-expo/app` 复制到 `yanhu-rn/app`
7. 将 `rn-expo/lib` 复制到 `yanhu-rn/lib`
8. 更新 `package.json`：添加 `"expo": { "plugins": ["expo-router"] }` 并在入口启用 expo-router
9. 启动：`npm run start`，按 `a` 打开 Android 或用 Expo Go 扫码

后端地址在 `lib/config.ts` 的 `BASE_URL`。
