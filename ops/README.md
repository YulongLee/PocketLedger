# 运维说明

生产目录为 `/srv/apps/pocketledger`。服务由 `pocketledger.service` 托管，环境变量位于 `/srv/apps/pocketledger/.env`，数据库和备份位于 `shared/` 与 `backups/`。

更新代码后执行：

```bash
sudo APP_DIR=/srv/apps/pocketledger ./ops/deploy.sh
```

不要将 `.env`、AppSecret 或百炼密钥提交到 Git。
