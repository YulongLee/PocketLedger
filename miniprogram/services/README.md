本目录是页面与后端之间的服务边界。当前页面默认使用微信本地 Storage，`api.ts` 提供切换到 FastAPI 的请求接口。线上开发后端地址为 `https://api.pocketledger.cn/api/v1`，真机调试时需改为 HTTPS 域名并配置小程序业务域名。
金额在服务边界使用字符串传递，AI 草稿必须先经过业务校验再调用保存。

## 本地联调

先启动本地后端：

```bash
./ops/start-local-backend.sh
```

本地健康检查地址为 `http://127.0.0.1:8000/api/v1/health`，首页聚合接口为 `http://127.0.0.1:8000/api/v1/home?month=2026-09`。

要让微信开发者工具请求本地后端，临时把 `miniprogram/services/api.ts` 的 `API_BASE_URL` 改为 `http://127.0.0.1:8000/api/v1`，并在开发者工具的本地设置中开启“不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书”。联调结束后改回 `https://api.pocketledger.cn/api/v1`。

本地默认使用 `backend/pocketledger.local.db`，不会修改线上数据库。
