#!/bin/bash

# 设置变量
LOG_FILE="/var/log/monitor.log"
ALERT_EMAIL="admin@example.com"
THRESHOLD_CPU=80
THRESHOLD_MEMORY=80
THRESHOLD_DISK=80

# 检查 CPU 使用率
check_cpu() {
    CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d. -f1)
    if [ $CPU_USAGE -gt $THRESHOLD_CPU ]; then
        echo "$(date): CPU 使用率过高: ${CPU_USAGE}%" >> $LOG_FILE
        echo "CPU 使用率过高: ${CPU_USAGE}%" | mail -s "系统警告" $ALERT_EMAIL
    fi
}

# 检查内存使用率
check_memory() {
    MEMORY_USAGE=$(free | grep Mem | awk '{print $3/$2 * 100.0}' | cut -d. -f1)
    if [ $MEMORY_USAGE -gt $THRESHOLD_MEMORY ]; then
        echo "$(date): 内存使用率过高: ${MEMORY_USAGE}%" >> $LOG_FILE
        echo "内存使用率过高: ${MEMORY_USAGE}%" | mail -s "系统警告" $ALERT_EMAIL
    fi
}

# 检查磁盘使用率
check_disk() {
    DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | cut -d% -f1)
    if [ $DISK_USAGE -gt $THRESHOLD_DISK ]; then
        echo "$(date): 磁盘使用率过高: ${DISK_USAGE}%" >> $LOG_FILE
        echo "磁盘使用率过高: ${DISK_USAGE}%" | mail -s "系统警告" $ALERT_EMAIL
    fi
}

# 检查服务状态
check_services() {
    SERVICES=("admin-ui" "admin-api" "user-ui" "user-api" "nginx" "redis" "db")
    for service in "${SERVICES[@]}"; do
        if ! docker-compose ps $service | grep -q "Up"; then
            echo "$(date): 服务 $service 未运行" >> $LOG_FILE
            echo "服务 $service 未运行" | mail -s "系统警告" $ALERT_EMAIL
        fi
    done
}

# 主循环
while true; do
    check_cpu
    check_memory
    check_disk
    check_services
    sleep 300  # 每5分钟检查一次
done 