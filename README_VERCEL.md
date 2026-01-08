# 如何部署到 Vercel

本项目已经配置好适配 Vercel 的部署环境。请按照以下步骤操作：

## 1. 准备代码仓库
确保你已经把所有代码（包括下载好的图片）提交到了 GitHub。

1. 在 GitHub 上创建一个新仓库（例如 `salt-lake-guide`）。
2. 在本地终端运行以下命令提交代码：
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/你的用户名/salt-lake-guide.git
   git push -u origin main
   ```

## 2. 在 Vercel 导入项目
1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)。
2. 点击 **"Add New..."** -> **"Project"**。
3. 选择 **"Import"** 你刚才创建的 GitHub 仓库。

## 3. 配置项目 (关键步骤)
在导入设置页面：

1. **Framework Preset**: 选择 `Other`。
2. **Root Directory**: 点击 Edit，选择 `backend` 目录（因为 `vercel.json` 和 `requirements.txt` 都在这个目录下）。
   > 注意：如果选了 `backend`，Vercel 会自动以该目录为根进行构建。

3. **Environment Variables** (可选):
   如果你有云数据库（如 Neon Postgres），可以在这里配置 `DATABASE_URL`。如果不配置，系统会默认使用内存数据库（每次重启数据重置，适合演示）。

4. 点击 **"Deploy"**。

## 4. 访问
部署成功后，Vercel 会提供一个类似 `https://salt-lake-guide.vercel.app` 的域名。
直接访问该域名，你应该能看到和本地一模一样的首页。

## 注意事项
* **数据持久化**：默认情况下，Vercel 上的数据在服务休眠后会丢失（因为使用的是临时 SQLite）。如果需要保存用户数据，请连接云数据库。
* **图片上传**：演示环境的图片上传是临时的（存放在 `/tmp`），重启后会消失。生产环境建议配置阿里云 OSS。
