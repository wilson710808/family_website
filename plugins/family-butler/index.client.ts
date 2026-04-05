/**
 * 家族管家插件 - 客戶端導入檢查
 * 用於導航菜單動態顯示
 */

export function isEnabled(): boolean {
  return process.env.NEXT_PUBLIC_PLUGIN_FAMILY_BUTLER !== 'false' &&
         process.env.NEXT_PUBLIC_DISABLE_PLUGIN_FAMILY_BUTLER !== 'true';
}

export default {
  isEnabled,
};
