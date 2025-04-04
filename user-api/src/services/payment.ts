import { ethers } from 'ethers';
import logger from '../utils/logger';
import { verifyTransaction } from './blockchain';

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

// 平台钱包私钥
const PLATFORM_WALLET_PRIVATE_KEY = process.env.PLATFORM_WALLET_PRIVATE_KEY || '';

// 创建平台钱包
const platformWallet = new ethers.Wallet(PLATFORM_WALLET_PRIVATE_KEY, provider);

/**
 * 转账给商家
 * @param merchantWallet 商家钱包地址
 * @param amount 转账金额
 * @returns 交易哈希
 */
export const transferToMerchant = async (merchantWallet: string, amount: number): Promise<string> => {
  try {
    logger.info(`转账 ${amount} 到商家钱包 ${merchantWallet}`);
    
    // 检查平台钱包余额
    const balance = await provider.getBalance(platformWallet.address);
    const requiredAmount = ethers.parseEther(amount.toString());
    
    if (balance < requiredAmount) {
      throw new Error(`平台钱包余额不足: 需要 ${amount} ETH, 当前余额 ${ethers.formatEther(balance)} ETH`);
    }
    
    // 创建交易
    const tx: ethers.TransactionRequest = {
      to: merchantWallet,
      value: requiredAmount
    };
    
    // 估算 gas 费用
    const gasEstimate = await platformWallet.estimateGas(tx);
    
    // 获取当前 gas 价格
    const gasPrice = await provider.getFeeData();
    
    // 设置 gas 限制和价格
    tx.gasLimit = gasEstimate * BigInt(12) / BigInt(10); // 增加 20% 的 gas 限制
    tx.maxFeePerGas = gasPrice.maxFeePerGas || gasPrice.gasPrice;
    tx.maxPriorityFeePerGas = gasPrice.maxPriorityFeePerGas || gasPrice.gasPrice;
    
    // 发送交易
    const transaction = await platformWallet.sendTransaction(tx);
    
    logger.info(`交易已发送: ${transaction.hash}`);
    
    // 等待交易确认
    const receipt = await transaction.wait();
    
    if (!receipt) {
      throw new Error('交易确认失败');
    }
    
    logger.info(`交易已确认: ${receipt.hash}, 区块: ${receipt.blockNumber}`);
    
    return receipt.hash;
  } catch (error: any) {
    logger.error('转账给商家失败:', error);
    throw new Error(`转账给商家失败: ${error.message}`);
  }
};

/**
 * 转账佣金
 * @param userWallet 用户钱包地址
 * @param amount 转账金额
 * @returns 交易哈希
 */
export const transferCommission = async (userWallet: string, amount: number): Promise<string> => {
  try {
    logger.info(`转账佣金 ${amount} 到用户钱包 ${userWallet}`);
    
    // 检查平台钱包余额
    const balance = await provider.getBalance(platformWallet.address);
    const requiredAmount = ethers.parseEther(amount.toString());
    
    if (balance < requiredAmount) {
      throw new Error(`平台钱包余额不足: 需要 ${amount} ETH, 当前余额 ${ethers.formatEther(balance)} ETH`);
    }
    
    // 创建交易
    const tx: ethers.TransactionRequest = {
      to: userWallet,
      value: requiredAmount
    };
    
    // 估算 gas 费用
    const gasEstimate = await platformWallet.estimateGas(tx);
    
    // 获取当前 gas 价格
    const gasPrice = await provider.getFeeData();
    
    // 设置 gas 限制和价格
    tx.gasLimit = gasEstimate * BigInt(12) / BigInt(10); // 增加 20% 的 gas 限制
    tx.maxFeePerGas = gasPrice.maxFeePerGas || gasPrice.gasPrice;
    tx.maxPriorityFeePerGas = gasPrice.maxPriorityFeePerGas || gasPrice.gasPrice;
    
    // 发送交易
    const transaction = await platformWallet.sendTransaction(tx);
    
    logger.info(`佣金交易已发送: ${transaction.hash}`);
    
    // 等待交易确认
    const receipt = await transaction.wait();
    
    if (!receipt) {
      throw new Error('佣金交易确认失败');
    }
    
    logger.info(`佣金交易已确认: ${receipt.hash}, 区块: ${receipt.blockNumber}`);
    
    return receipt.hash;
  } catch (error: any) {
    logger.error('转账佣金失败:', error);
    throw new Error(`转账佣金失败: ${error.message}`);
  }
};

/**
 * 处理提现请求
 * @param userId 用户ID
 * @param amount 提现金额
 * @param walletAddress 钱包地址
 * @returns 交易哈希
 */
export const processWithdrawal = async (userId: string, amount: number, walletAddress: string): Promise<string> => {
  try {
    logger.info(`处理用户 ${userId} 的提现请求，金额: ${amount}，钱包: ${walletAddress}`);
    
    // 检查平台钱包余额
    const balance = await provider.getBalance(platformWallet.address);
    const requiredAmount = ethers.parseEther(amount.toString());
    
    if (balance < requiredAmount) {
      throw new Error(`平台钱包余额不足: 需要 ${amount} ETH, 当前余额 ${ethers.formatEther(balance)} ETH`);
    }
    
    // 创建交易
    const tx: ethers.TransactionRequest = {
      to: walletAddress,
      value: requiredAmount
    };
    
    // 估算 gas 费用
    const gasEstimate = await platformWallet.estimateGas(tx);
    
    // 获取当前 gas 价格
    const gasPrice = await provider.getFeeData();
    
    // 设置 gas 限制和价格
    tx.gasLimit = gasEstimate * BigInt(12) / BigInt(10); // 增加 20% 的 gas 限制
    tx.maxFeePerGas = gasPrice.maxFeePerGas || gasPrice.gasPrice;
    tx.maxPriorityFeePerGas = gasPrice.maxPriorityFeePerGas || gasPrice.gasPrice;
    
    // 发送交易
    const transaction = await platformWallet.sendTransaction(tx);
    
    logger.info(`提现交易已发送: ${transaction.hash}`);
    
    // 等待交易确认
    const receipt = await transaction.wait();
    
    if (!receipt) {
      throw new Error('提现交易确认失败');
    }
    
    logger.info(`提现交易已确认: ${receipt.hash}, 区块: ${receipt.blockNumber}`);
    
    return receipt.hash;
  } catch (error: any) {
    logger.error('处理提现请求失败:', error);
    throw new Error(`处理提现请求失败: ${error.message}`);
  }
}; 