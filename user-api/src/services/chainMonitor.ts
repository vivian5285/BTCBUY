import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { ethers } from 'ethers';
import TronWeb from '@tronweb/tronweb';
import { chainConfig } from '../config/chain';
import cron from 'node-cron';

const prisma = new PrismaClient();

// USDT 合约地址
const USDT_CONTRACTS = {
  bsc: '0x55d398326f99059fF775485246999027B3197955',
  erc: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  op: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
  arb: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
};

// 初始化链上客户端
const providers = {
  bsc: new ethers.JsonRpcProvider(chainConfig.bsc.rpc),
  erc: new ethers.JsonRpcProvider(chainConfig.erc.rpc),
  op: new ethers.JsonRpcProvider(chainConfig.op.rpc),
  arb: new ethers.JsonRpcProvider(chainConfig.arb.rpc),
};

const tronWeb = new TronWeb({
  fullHost: chainConfig.trc.apiUrl,
  headers: { 'TRON-PRO-API-KEY': chainConfig.trc.apiKey },
});

// 获取 BSC 链上的 USDT 转账记录
async function checkBSCTransfers(address: string) {
  try {
    const response = await axios.get(chainConfig.bsc.apiUrl, {
      params: {
        module: 'account',
        action: 'tokentx',
        contractaddress: USDT_CONTRACTS.bsc,
        address,
        sort: 'desc',
        apikey: chainConfig.bsc.apiKey,
      },
    });

    if (response.data.status === '1') {
      return response.data.result.map((tx: any) => ({
        hash: tx.hash,
        amount: parseFloat(tx.value) / 1e18,
        from: tx.from,
        to: tx.to,
        timestamp: parseInt(tx.timeStamp),
      }));
    }
    return [];
  } catch (error) {
    console.error('Error checking BSC transfers:', error);
    return [];
  }
}

// 获取 TRC20 链上的 USDT 转账记录
async function checkTRCTransfers(address: string) {
  try {
    const response = await axios.get(`${chainConfig.trc.apiUrl}/v1/accounts/${address}/transactions/trc20`, {
      headers: {
        'TRON-PRO-API-KEY': chainConfig.trc.apiKey,
      },
    });

    return response.data.data.map((tx: any) => ({
      hash: tx.transaction_id,
      amount: parseFloat(tx.value) / 1e6,
      from: tx.from,
      to: tx.to,
      timestamp: tx.block_timestamp,
    }));
  } catch (error) {
    console.error('Error checking TRC transfers:', error);
    return [];
  }
}

// 获取 ERC20 链上的 USDT 转账记录
async function checkERCTransfers(address: string) {
  try {
    const response = await axios.get(chainConfig.erc.apiUrl, {
      params: {
        module: 'account',
        action: 'tokentx',
        contractaddress: USDT_CONTRACTS.erc,
        address,
        sort: 'desc',
        apikey: chainConfig.erc.apiKey,
      },
    });

    if (response.data.status === '1') {
      return response.data.result.map((tx: any) => ({
        hash: tx.hash,
        amount: parseFloat(tx.value) / 1e6,
        from: tx.from,
        to: tx.to,
        timestamp: parseInt(tx.timeStamp),
      }));
    }
    return [];
  } catch (error) {
    console.error('Error checking ERC transfers:', error);
    return [];
  }
}

// 检查并记录充值
async function checkAndRecordDeposits(userId: string, chain: string, address: string) {
  let transfers: any[] = [];

  switch (chain) {
    case 'bsc':
      transfers = await checkBSCTransfers(address);
      break;
    case 'trc':
      transfers = await checkTRCTransfers(address);
      break;
    case 'erc':
      transfers = await checkERCTransfers(address);
      break;
    // 其他链的检查逻辑可以类似实现
  }

  for (const tx of transfers) {
    // 检查是否已存在该交易记录
    const exists = await prisma.deposit.findUnique({
      where: { txHash: tx.hash },
    });

    if (!exists) {
      // 创建新的充值记录
      await prisma.deposit.create({
        data: {
          userId,
          chain,
          amount: tx.amount,
          txHash: tx.hash,
          confirmed: true,
        },
      });

      // 更新用户余额
      await prisma.user.update({
        where: { id: userId },
        data: {
          balance: {
            increment: tx.amount,
          },
        },
      });

      console.log(`New deposit recorded: ${tx.hash}`);
    }
  }
}

// 启动链上监听服务
export function startChainMonitor() {
  // 每5分钟执行一次检查
  cron.schedule('*/5 * * * *', async () => {
    try {
      console.log('Starting chain monitoring...');

      // 获取所有有绑定钱包的用户
      const users = await prisma.user.findMany({
        where: {
          OR: [
            { wallet_bsc: { not: null } },
            { wallet_trc: { not: null } },
            { wallet_erc: { not: null } },
            { wallet_op: { not: null } },
            { wallet_arb: { not: null } },
          ],
        },
      });

      // 检查每个用户的每个链上的充值
      for (const user of users) {
        if (user.wallet_bsc) {
          await checkAndRecordDeposits(user.id, 'bsc', user.wallet_bsc);
        }
        if (user.wallet_trc) {
          await checkAndRecordDeposits(user.id, 'trc', user.wallet_trc);
        }
        if (user.wallet_erc) {
          await checkAndRecordDeposits(user.id, 'erc', user.wallet_erc);
        }
        if (user.wallet_op) {
          await checkAndRecordDeposits(user.id, 'op', user.wallet_op);
        }
        if (user.wallet_arb) {
          await checkAndRecordDeposits(user.id, 'arb', user.wallet_arb);
        }
      }

      console.log('Chain monitoring completed');
    } catch (error) {
      console.error('Error in chain monitoring:', error);
    }
  });
} 