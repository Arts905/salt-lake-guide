# 500错误诊断与修复计划

**问题根源分析：**
尽管我们已经修复了大部分 `cv2` 导入问题，但 `app/tasks/scheduler.py` 文件中仍潜藏着一个风险。该文件在模块顶层（Top-level）直接导入了 `app.services.realtime_index`，而 `realtime_index.py` 虽然已经做了防护，但 `scheduler.py` 还导入了 `app.services.prediction_model` 等模块。
更关键的是，`scheduler.py` 可能会因为 `apscheduler` 的后台线程机制在 Serverless 环境下引发不兼容问题（即使没有调用 start），或者因为某些隐蔽的依赖（如 `sqlite3` 在某些极端的只读文件系统下初始化失败）导致崩溃。

为了彻底解决“到底是为什么”的 500 错误，我们将采取“防御性编程”策略，对所有可能的风险点进行加固。

## 实施步骤

### 1. 全局依赖清理与防护
- **`app/tasks/scheduler.py`**:
  - 将所有业务逻辑导入（如 `predict_for_lakes`, `compute_and_store_realtime_index`）移到函数内部（Lazy Import）。
  - 确保顶层只保留最基础的库导入，防止模块加载时触发任何数据库或文件操作。

### 2. `main.py` 启动逻辑再简化
- 在 `app/main.py` 中，将 `start_scheduler()` 的调用逻辑完全隔离。
- 增加更多的 `try-except` 块包裹路由导入，确保即使某个模块坏了，API 主体还能启动（至少 `/health` 接口能通）。

### 3. 配置文件优化
- 检查 `vercel.json`，确保 `maxDuration` 和 `memory` 设置正确生效。

### 4. 最终验证
- 推送代码后，通过访问 `/health` 接口确认服务是否存活。
- 如果 `/health` 能通但其他接口崩，说明是特定业务逻辑问题；如果 `/health` 都崩，说明是核心依赖问题。

## 预期结果
- 服务将能够成功启动，不再报 `FUNCTION_INVOCATION_FAILED`。
- 即使缺少某些依赖（如 OpenCV），核心 API 也能正常响应。
