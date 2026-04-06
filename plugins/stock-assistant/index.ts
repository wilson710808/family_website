/**
 * StockAI 投资助手插件
 * 整合 StockAI 美股分析服务
 */

export function isEnabled(): boolean {
  return process.env.PLUGIN_STOCK_ASSISTANT !== 'false' &&
         process.env.DISABLE_PLUGIN_STOCK_ASSISTANT !== 'true';
}

// StockAI 服务地址配置
export function getStockAIDomain(): string {
  return process.env.STOCKAI_DOMAIN || 'http://192.168.2.72:3001';
}

export default {
  name: 'stock-assistant',
  displayName: '投資助手',
  description: 'StockAI 美股分析服務',
  isEnabled,
  getStockAIDomain,
};
