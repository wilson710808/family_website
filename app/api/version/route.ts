/**
 * 版本信息 API
 * 返回當前系統版本和構建信息
 */
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// 從 package.json 讀取版本
function getVersion(): { version: string; buildTime: string; commit: string } {
  try {
    const packagePath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    // 嘗試讀取 git commit hash
    let commit = 'unknown';
    try {
      const headPath = path.join(process.cwd(), '.git', 'HEAD');
      if (fs.existsSync(headPath)) {
        const headContent = fs.readFileSync(headPath, 'utf8').trim();
        if (headContent.startsWith('ref:')) {
          const refPath = path.join(process.cwd(), '.git', headContent.replace('ref: ', ''));
          if (fs.existsSync(refPath)) {
            commit = fs.readFileSync(refPath, 'utf8').trim().substring(0, 7);
          }
        } else {
          commit = headContent.substring(0, 7);
        }
      }
    } catch {
      commit = 'unknown';
    }

    return {
      version: packageJson.version || '1.0.0',
      buildTime: new Date().toISOString(),
      commit,
    };
  } catch (error) {
    return {
      version: '1.0.0',
      buildTime: new Date().toISOString(),
      commit: 'unknown',
    };
  }
}

export async function GET() {
  const versionInfo = getVersion();
  return NextResponse.json({
    success: true,
    data: versionInfo,
  });
}
