/**
 * 成長專欄 - 客戶端導出
 * 只包含安全的、可在瀏覽器端運行的代碼
 */

// 檢查插件是否啟用
export function isEnabled(): boolean {
  // 客戶端默認啟用，實際服務端會控制API可用性
  return typeof process !== 'undefined' && process.env 
    ? process.env.PLUGIN_GROWTH_COLUMN !== 'false' && 
      process.env.DISABLE_PLUGIN_GROWTH_COLUMN !== 'true'
    : true;
}
