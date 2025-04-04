import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { checkRole } from '../../middleware/auth';
import { SecurityAlertService } from '../../services/securityAlertService';

const router = Router();
const prisma = new PrismaClient();
const alertService = new SecurityAlertService(prisma);

// 获取所有告警规则
router.get('/', checkRole('ADMIN'), async (req, res) => {
  try {
    const rules = await alertService.getAlertRules();
    res.json(rules);
  } catch (error) {
    res.status(500).json({ message: '获取告警规则失败' });
  }
});

// 创建告警规则
router.post('/', checkRole('ADMIN'), async (req, res) => {
  try {
    const rule = await alertService.createAlertRule(req.body);
    res.status(201).json(rule);
  } catch (error) {
    res.status(500).json({ message: '创建告警规则失败' });
  }
});

// 更新告警规则
router.put('/:id', checkRole('ADMIN'), async (req, res) => {
  try {
    const rule = await alertService.updateAlertRule(req.params.id, req.body);
    res.json(rule);
  } catch (error) {
    res.status(500).json({ message: '更新告警规则失败' });
  }
});

// 删除告警规则
router.delete('/:id', checkRole('ADMIN'), async (req, res) => {
  try {
    await alertService.deleteAlertRule(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: '删除告警规则失败' });
  }
});

// 获取所有安全告警
router.get('/alerts', checkRole('ADMIN'), async (req, res) => {
  try {
    const alerts = await prisma.securityAlert.findMany({
      include: {
        rule: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ message: '获取安全告警失败' });
  }
});

// 更新告警状态
router.put('/alerts/:id/status', checkRole('ADMIN'), async (req, res) => {
  try {
    const alert = await prisma.securityAlert.update({
      where: { id: req.params.id },
      data: { status: req.body.status }
    });
    res.json(alert);
  } catch (error) {
    res.status(500).json({ message: '更新告警状态失败' });
  }
});

export default router; 