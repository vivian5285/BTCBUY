import dotenv from 'dotenv';

dotenv.config();

export const chainConfig = {
  bsc: {
    rpc: process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org',
    apiKey: process.env.BSCSCAN_API_KEY,
    apiUrl: 'https://api.bscscan.com/api',
  },
  trc: {
    apiKey: process.env.TRONGRID_API_KEY,
    apiUrl: 'https://api.trongrid.io',
  },
  erc: {
    rpc: process.env.ETH_RPC_URL || 'https://mainnet.infura.io/v3/your-project-id',
    apiKey: process.env.ETHERSCAN_API_KEY,
    apiUrl: 'https://api.etherscan.io/api',
  },
  op: {
    rpc: process.env.OP_RPC_URL || 'https://mainnet.optimism.io',
    apiKey: process.env.OPTIMISM_API_KEY,
    apiUrl: 'https://api-optimistic.etherscan.io/api',
  },
  arb: {
    rpc: process.env.ARB_RPC_URL || 'https://arb1.arbitrum.io/rpc',
    apiKey: process.env.ARBISCAN_API_KEY,
    apiUrl: 'https://api.arbiscan.io/api',
  },
}; 