// 获取安全指标
router.get('/metrics', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [
      totalLoginAttempts,
      failedLoginAttempts,
      blockedIPs,
      blockedDevices,
      activeSessions,
      pendingVerifications
    ] = await Promise.all([
      prisma.securityLog.count({
        where: {
          action: 'login_attempt'
        }
      }),
      prisma.securityLog.count({
        where: {
          action: 'login_attempt',
          status: 'failed'
        }
      }),
      prisma.iPBlacklist.count(),
      prisma.deviceBlacklist.count(),
      prisma.session.count({
        where: {
          expiresAt: {
            gt: new Date()
          }
        }
      }),
      prisma.sensitiveOperation.count({
        where: {
          verified: false,
          expiresAt: {
            gt: new Date()
          }
        }
      })
    ]);

    res.json({
      totalLoginAttempts,
      failedLoginAttempts,
      blockedIPs,
      blockedDevices,
      activeSessions,
      pendingVerifications
    });
  } catch (error) {
    console.error('获取安全指标失败:', error);
    res.status(500).json({ error: '获取安全指标失败' });
  }
});

// 获取安全事件
router.get('/events', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const events = await prisma.securityLog.findMany({
      where: {
        action: {
          in: ['login_attempt', 'sensitive_operation', 'device_verification']
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 100
    });

    const formattedEvents = events.map(event => ({
      id: event.id,
      type: event.action,
      timestamp: event.createdAt,
      details: event.details,
      severity: event.status === 'failed' ? 'high' : 'low',
      status: 'pending'
    }));

    res.json(formattedEvents);
  } catch (error) {
    console.error('获取安全事件失败:', error);
    res.status(500).json({ error: '获取安全事件失败' });
  }
});

// 更新安全事件状态
router.put('/events/:id/status', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    await prisma.securityLog.update({
      where: { id: req.params.id },
      data: { status }
    });
    res.json({ message: '更新事件状态成功' });
  } catch (error) {
    console.error('更新事件状态失败:', error);
    res.status(500).json({ error: '更新事件状态失败' });
  }
});

// 获取图表数据
router.get('/chart-data', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    const logs = await prisma.securityLog.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // 按小时聚合数据
    const hourlyData = logs.reduce((acc: any[], log) => {
      const hour = new Date(log.createdAt).toISOString().slice(0, 13);
      const existingHour = acc.find(h => h.timestamp === hour);

      if (existingHour) {
        if (log.action === 'login_attempt') {
          existingHour.loginAttempts++;
          if (log.status === 'failed') {
            existingHour.failedAttempts++;
          }
        } else if (log.action === 'ip_blocked') {
          existingHour.blockedIPs++;
        }
      } else {
        acc.push({
          timestamp: hour,
          loginAttempts: log.action === 'login_attempt' ? 1 : 0,
          failedAttempts: log.action === 'login_attempt' && log.status === 'failed' ? 1 : 0,
          blockedIPs: log.action === 'ip_blocked' ? 1 : 0
        });
      }

      return acc;
    }, []);

    res.json(hourlyData);
  } catch (error) {
    console.error('获取图表数据失败:', error);
    res.status(500).json({ error: '获取图表数据失败' });
  }
}); 