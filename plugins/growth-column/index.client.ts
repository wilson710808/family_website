/**
 * 成长专栏 - 客户端导出
 * 只包含安全的、可在浏览器端运行的代码
 */

// 检查插件是否启用
export function isEnabled(): boolean {
  // 客户端默认启用，实际服务端会控制API可用性
  return typeof process !== 'undefined' && process.env 
    ? process.env.PLUGIN_GROWTH_COLUMN !== 'false' && 
      process.env.DISABLE_PLUGIN_GROWTH_COLUMN !== 'true'
    : true;
}
