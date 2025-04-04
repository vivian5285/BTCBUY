const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const checkGroupBuyStatus = async () => {
  const now = new Date();

  const expiredGroups = await prisma.groupBuy.findMany({
    where: {
      status: 'active',
      expiresAt: { lt: now },
    },
  });

  for (const group of expiredGroups) {
    // 调用已有逻辑
    console.log(`处理拼团失败：${group.id}`);
    await prisma.groupBuy.update({
      where: { id: group.id },
      data: { status: 'failed' },
    });
    // 后续处理逻辑（退款/发券）留给 service
  }
};

checkGroupBuyStatus().then(() => {
  console.log('拼团检测完成');
  process.exit(0);
}); 