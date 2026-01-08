# 微信小程序原型（联调版）

- 页面：
  - `pages/index`：展示 `GET /api/prediction/today` 的预测卡片
  - `pages/realtime`：展示 `GET /api/prediction/realtime/{lake_id}` 的实时指数
- 开发配置：
  - 推荐使用微信开发者工具导入本目录。
  - 在开发设置中：关闭“域名合法校验”（或在“业务域名”添加本地后端地址），以便测试阶段直接访问 `http://127.0.0.1:8000/`。
- 后端跨域：
  - 后端已开启 CORS `allow_origins: *`，可直接联调。
- 注意：
  - 上线前需将本地地址替换为生产域名并完成微信域名备案配置。