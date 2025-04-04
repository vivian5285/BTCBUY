import { ethers } from 'ethers';
import logger from '../utils/logger';

// 以太坊网络配置
const NETWORK_CONFIG = {
  mainnet: {
    rpcUrl: process.env.ETH_MAINNET_RPC_URL || 'https://mainnet.infura.io/v3/your-project-id',
    chainId: 1
  },
  testnet: {
    rpcUrl: process.env.ETH_TESTNET_RPC_URL || 'https://goerli.infura.io/v3/your-project-id',
    chainId: 5
  }
};

// 根据环境选择网络
const network = process.env.NODE_ENV === 'production' ? NETWORK_CONFIG.mainnet : NETWORK_CONFIG.testnet;

// 创建提供者
const provider = new ethers.JsonRpcProvider(network.rpcUrl);

/**
 * 验证区块链交易
 * @param txHash 交易哈希
 * @param amount 预期金额
 * @returns 验证结果
 */
export const verifyTransaction = async (txHash: string, amount: number): Promise<boolean> => {
  try {
    logger.info(`验证交易 ${txHash}，预期金额: ${amount}`);
    
    // 获取交易收据
    const receipt = await provider.getTransactionReceipt(txHash);
    
    if (!receipt) {
      logger.warn(`交易 ${txHash} 未找到`);
      return false;
    }
    
    // 检查交易状态
    if (receipt.status !== 1) {
      logger.warn(`交易 ${txHash} 失败`);
      return false;
    }
    
    // 获取交易详情
    const tx = await provider.getTransaction(txHash);
    
    if (!tx) {
      logger.warn(`交易 ${txHash} 详情未找到`);
      return false;
    }
    
    // 检查交易金额
    const txAmount = parseFloat(ethers.formatEther(tx.value));
    const expectedAmount = amount;
    
    // 允许0.1%的误差
    const tolerance = 0.001;
    const minAmount = expectedAmount * (1 - tolerance);
    const maxAmount = expectedAmount * (1 + tolerance);
    
    if (txAmount < minAmount || txAmount > maxAmount) {
      logger.warn(`交易 ${txHash} 金额不匹配: 预期 ${expectedAmount}, 实际 ${txAmount}`);
      return false;
    }
    
    logger.info(`交易 ${txHash} 验证成功`);
    return true;
  } catch (error) {
    logger.error('验证交易失败:', error);
    return false;
  }
};

/**
 * 获取交易详情
 * @param txHash 交易哈希
 * @returns 交易详情
 */
export const getTransactionDetails = async (txHash: string) => {
  try {
    logger.info(`获取交易详情: ${txHash}`);
    
    // 获取交易
    const tx = await provider.getTransaction(txHash);
    
    if (!tx) {
      throw new Error(`交易 ${txHash} 未找到`);
    }
    
    // 获取交易收据
    const receipt = await provider.getTransactionReceipt(txHash);
    
    if (!receipt) {
      throw new Error(`交易 ${txHash} 收据未找到`);
    }
    
    // 获取区块信息
    const block = await provider.getBlock(receipt.blockNumber);
    
    // 格式化交易详情
    return {
      hash: txHash,
      from: tx.from,
      to: tx.to,
      value: ethers.formatEther(tx.value),
      gasUsed: receipt.gasUsed.toString(),
      gasPrice: ethers.formatUnits(tx.gasPrice || 0, 'gwei'),
      status: receipt.status === 1 ? '成功' : '失败',
      blockNumber: receipt.blockNumber,
      timestamp: block ? new Date(block.timestamp * 1000).toISOString() : null
    };
  } catch (error) {
    logger.error('获取交易详情失败:', error);
    throw new Error('获取交易详情失败');
  }
}; 