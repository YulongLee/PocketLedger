# PocketLedger

小账同学（PocketLedger）微信小程序与 FastAPI 后端。

## 项目结构

- `miniprogram/`：微信小程序端
- `backend/`：FastAPI 后端服务
- `openspec/`：产品需求与开发规格

## 本地后端

需要 Python 3.11+。复制 `backend/.env.example` 为 `backend/.env`，安装 `backend/requirements.txt` 后运行：

```bash
uvicorn app.main:app --reload --app-dir backend
```

小程序接口地址在 `miniprogram/services/api.ts` 中配置。
