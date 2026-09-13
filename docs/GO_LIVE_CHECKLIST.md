# PocketLedger 商业化上线清单

## 已完成

- HTTPS：`https://api.pocketledger.cn`
- Nginx 反向代理
- FastAPI systemd 自动启动
- PostgreSQL 持久化
- 每日数据库压缩备份
- 百炼 AI 文本解析
- Token 签名、过期和无效凭证拒绝
- 流水、预算、统计、导出和删除 API

## 待平台配置

- 腾讯云轻量服务器防火墙放行 TCP 80、443
- 微信公众平台配置 `api.pocketledger.cn` 为 request 合法域名
- 完成小程序备案和隐私政策发布
- 小程序 AppID/AppSecret 已配置到服务器 `/srv/apps/pocketledger/.env`（权限 600）

## 配置示例

```bash
WECHAT_APPID=你的AppID
WECHAT_APP_SECRET=你的AppSecret
DASHSCOPE_API_KEY=百炼密钥
AUTH_SECRET=随机长字符串
DATABASE_URL=postgresql+psycopg://...
```

`.env` 只保存在服务器，不提交到 Git。

## 上线验收

1. 微信开发者工具关闭“不校验合法域名”。
2. 真机完成登录、记账、AI 识别、编辑、删除、统计和预算测试。
3. 使用两个微信账号验证流水和预算互不可见。
4. 验证账号注销、数据导出和数据删除。
5. 提交小程序审核前，确认隐私协议、用户协议和备案信息一致。

## 当前状态

代码已与 GitHub `main` 分支同步。服务器本机健康检查、PostgreSQL 持久化、服务自启动和备份定时任务均正常。剩余验收项只依赖微信开发者工具/公众平台操作：真实 `wx.login` 联调、合法域名校验、双账号隔离验证，以及备案和隐私协议发布。
