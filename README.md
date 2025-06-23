# @compass-aiden/migrate-cli

> 数据库迁移工具 - 支持多种数据库的版本管理CLI工具

## 功能特性

- 🚀 支持PostgreSQL、MySQL等多种数据库迁移（更多数据库正在逐步支持）
- 📝 自动生成迁移文件和回滚脚本
- 🔄 支持迁移任务执行和回滚
- 📊 自动记录迁移历史
- 🔧 支持自定义配置文件
- 🔄 CLI自动更新检查

## 安装

### 全局安装

```bash
npm install -g @compass-aiden/migrate-cli
```

### 临时使用

```bash
# npm
npx @compass-aiden/migrate-cli <command>

# pnpm
pnpm dlx @compass-aiden/migrate-cli <command>

# yarn
yarn dlx @compass-aiden/migrate-cli <command>
```

## 快速开始

### 1. 获取帮助信息

```bash
migrate --help
migrate -h
migrate <command> -h
```

### 2. 准备配置文件

在项目根目录创建 `.migrate.json` 配置文件：

```json
{
  "dir": "migrations", // 迁移文件所在目录，默认为 migrations
  "dbType": "postgres", // 数据库类型，默认为 postgres，目前支持 postgres,mysql
  "envFilePath": ".env" // 环境文件位置，默认为 .env
}
```

### 3. 配置环境变量

在项目根目录创建 `.env` 文件：

```env
# 数据库连接字符串
MIGRATION_DB_CONNECTION=postgresql://username:password@localhost:5432/database_name
```

连接字符串格式说明：

- `username`: 数据库用户名
- `password`: 数据库密码
- `localhost`: 数据库主机地址
- `5432`: 数据库端口
- `database_name`: 数据库名称

### 4. 创建迁移任务

```bash
migrate create --name <task-name>
```

**参数说明：**

- `--name, -n`: 迁移任务名称（必填）
- `--config, -c`: 自定义配置文件路径（可选）

**命名规范：**

- 只能使用小写字母
- 多个单词用 `-` 连接
- 示例：`create-users-table`、`add-user-email-index`

**生成的文件结构：**

```
migrations/
└── 1750581208445_create-users-table/
    ├── main.sql      # 迁移脚本
    └── rollback.sql  # 回滚脚本
```

### 5. 编写迁移脚本

在生成的 `main.sql` 中编写数据库变更脚本：

```sql
-- 示例：创建用户表
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_users_email ON users(email);
```

在 `rollback.sql` 中编写回滚脚本：

```sql
-- 示例：删除用户表
DROP TABLE IF EXISTS users;
```

### 6. 执行迁移任务

```bash
migrate up
```

**参数说明：**

- `--config, -c`: 自定义配置文件路径（可选）

**执行流程：**

1. 连接到数据库
2. 自动创建 `migrations` 表（如果不存在）
3. 按时间顺序执行未执行的迁移任务
4. 记录执行历史到 `migrations` 表

### 7. 回滚迁移任务

```bash
# 回滚最后一个迁移任务
migrate rollback

# 回滚所有迁移任务
migrate rollback --all
```

**参数说明：**

- `--config, -c`: 自定义配置文件路径（可选）
- `--all, -A`: 回滚所有迁移任务（可选）

## 命令详解

### migrate create

创建新的迁移任务。

```bash
migrate create --name <task-name> [--config <config-path>]
```

**示例：**

```bash
migrate create --name add-user-roles
migrate create -n create-products-table -c ./custom-config.json
```

### migrate up

执行所有未执行的迁移任务。

```bash
migrate up [--config <config-path>]
```

**示例：**

```bash
migrate up
migrate up --config ./migration-config.json
```

### migrate rollback

回滚迁移任务。

```bash
migrate rollback [--config <config-path>] [--all]
```

**示例：**

```bash
# 回滚最后一个任务
migrate rollback

# 回滚所有任务
migrate rollback --all

# 使用自定义配置
migrate rollback --config ./config.json --all
```

### migrate update

检查并更新CLI工具。

```bash
migrate update
```

**功能：**

- 检查是否有新版本可用
- 支持npm、yarn、pnpm包管理器
- 交互式更新确认

## 配置文件说明

### .migrate.json

```json
{
  "dir": "migrations", // 迁移文件目录
  "dbType": "postgres", // 数据库类型
  "envFilePath": ".env" // 环境变量文件路径
}
```

### .env

```env
# 数据库连接字符串
MIGRATION_DB_CONNECTION=postgresql://username:password@localhost:5432/database_name
```

## 迁移文件结构

```
migrations/
├── 1750581208445_init/              # 时间戳_任务名
│   ├── main.sql                     # 迁移脚本
│   └── rollback.sql                 # 回滚脚本
├── 1750581300000_add-users-table/
│   ├── main.sql
│   └── rollback.sql
└── 1750581400000_add-indexes/
    ├── main.sql
    └── rollback.sql
```

## 数据库表结构

工具会自动创建 `migrations` 表来记录迁移历史：

```sql
CREATE TABLE migrations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 最佳实践

### 1. 迁移脚本编写

- **原子性**: 每个迁移任务应该是原子的，要么全部成功，要么全部失败
- **幂等性**: 迁移脚本应该可以重复执行而不产生副作用
- **回滚性**: 每个迁移都应该有对应的回滚脚本
- **测试**: 在生产环境执行前，先在测试环境验证

### 2. 命名规范

- 使用描述性的任务名称
- 使用小写字母和连字符
- 示例：`create-users-table`、`add-email-index`、`update-user-schema`

### 3. 版本控制

- 将迁移文件纳入版本控制
- 不要修改已提交的迁移文件
- 使用新的迁移任务来修复问题

### 4. 团队协作

- 团队成员应该按时间顺序执行迁移
- 避免同时创建相同名称的迁移任务
- 定期同步迁移状态

## 故障排除

### 常见问题

1. **数据库连接失败**

   - 检查连接字符串格式
   - 确认数据库服务是否运行
   - 验证用户名和密码

2. **迁移任务执行失败**

   - 检查SQL语法
   - 确认数据库权限
   - 查看错误日志

3. **配置文件找不到**

   - 确认 `.migrate.json` 文件存在
   - 检查文件路径是否正确

4. **权限问题**
   - 确认数据库用户有足够权限
   - 检查文件读写权限

### 调试模式

可以通过查看控制台输出来调试问题：

```bash
# 查看详细日志
migrate up --verbose
```
