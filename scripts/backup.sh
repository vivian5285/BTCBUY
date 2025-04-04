#!/bin/bash

# 设置变量
BACKUP_DIR="/backup"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_NAME="btcbuy"
DB_USER="postgres"
DB_HOST="postgres"
RETENTION_DAYS=7

# 创建备份目录
mkdir -p $BACKUP_DIR

# 执行备份
echo "开始备份数据库..."
PGPASSWORD=$DB_PASSWORD pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME -F c -f "$BACKUP_DIR/backup_$TIMESTAMP.dump"

# 检查备份是否成功
if [ $? -eq 0 ]; then
    echo "数据库备份成功: backup_$TIMESTAMP.dump"
else
    echo "数据库备份失败"
    exit 1
fi

# 删除旧备份
echo "清理旧备份文件..."
find $BACKUP_DIR -name "backup_*.dump" -mtime +$RETENTION_DAYS -delete

# 压缩备份
echo "压缩备份文件..."
gzip "$BACKUP_DIR/backup_$TIMESTAMP.dump"

echo "备份完成" 