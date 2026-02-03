# Frontend (Next.js)

This is the UI that displays TingleRadar's weekly leaderboards. It fetches ranking data from the backend (FastAPI) using an environment-configurable base URL, so you can switch between **product** (线上) and **test** (本地 localhost) 运行模式。

## 环境变量

前端通过下面几个环境变量来决定请求哪个后端地址：

- `NEXT_PUBLIC_TINGLE_ENV`：环境标识，支持：
  - `product`：线上环境（默认值，如果不设置就当作 product）
  - `test`：本地测试环境，前后端都在 localhost 跑
- `NEXT_PUBLIC_BACKEND_URL`：product 模式下使用的后端基础地址，例如：
  - `https://api.tingleradar.com`
- `NEXT_PUBLIC_BACKEND_URL_TEST`：test 模式下使用的后端基础地址，例如：
  - `http://localhost:8000`

在 `src/app/page.tsx` 中，会根据环境变量选择对应的 URL：

```ts
const env = process.env.NEXT_PUBLIC_TINGLE_ENV ?? "product";

const backendUrl =
  env === "test"
    ? process.env.NEXT_PUBLIC_BACKEND_URL_TEST ?? "http://localhost:8000"
    : process.env.NEXT_PUBLIC_BACKEND_URL;
```

## 本地开发（test 环境，本地前后端一起跑）

1. 在 `backend` 目录下创建 `.env`，按 backend README 配好数据库、Supabase 等配置，然后启动后端：
   ```bash
   cd backend
   uvicorn app.main:app --reload --port 8000
   ```

2. 在 `frontend` 目录下创建 `.env.local`：
   ```env
   NEXT_PUBLIC_TINGLE_ENV=test
   NEXT_PUBLIC_BACKEND_URL_TEST=http://localhost:8000
   ```

3. 在 `frontend` 安装依赖并启动 dev server：
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

此时前端会自动请求 `http://localhost:8000/rankings/weekly` 等后端接口。

## 线上部署（product 环境）

部署到 Vercel 或其它平台时：

1. 构建命令和输出目录保持默认：
   ```bash
   npm run build
   ```
   输出目录：`.next`

2. 在部署平台上配置前端环境变量，例如：
   ```env
   NEXT_PUBLIC_TINGLE_ENV=product
   NEXT_PUBLIC_BACKEND_URL=https://api.tingleradar.com
   ```

3. 部署完成后，前端会请求 `NEXT_PUBLIC_BACKEND_URL` 对应的后端地址。

## 目录与脚本

- 开发：
  ```bash
  npm run dev
  ```
- 构建：
  ```bash
  npm run build
  ```
- 启动生产构建：
  ```bash
  npm run start
  ```

将根目录的架构说明与此 README 结合来看，可以快速搭建本地 test 环境或 product 线上环境。
