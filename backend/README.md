# PocketLedger API

开发环境启动：

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

当前提供健康检查、流水 CRUD、统计和预算接口。内存存储用于联调；接入 PostgreSQL 时将 `transactions`、`budgets` 替换为 SQLAlchemy Repository，金额字段使用 NUMERIC。
