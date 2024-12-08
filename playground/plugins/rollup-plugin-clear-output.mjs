import fs from "fs";
import path from "path";
import * as rimraf from "rimraf";

/**
 * 清理构建输出目录的 Rollup 插件
 * @returns {import('rollup').Plugin} Rollup 插件对象
 */
export default function clearOutputPlugin() {
  let outputDirs = [];
  const workspace = process.cwd();

  return {
    name: "clear-output", // 插件名称

    /**
     * 捕获 Rollup 配置选项，提取输出目录
     * @param {import('rollup').RollupOptions} options Rollup 配置选项
     * @returns {null | import('rollup').RollupOptions} 返回修改后的配置或 null
     */
    options(options) {
      if (options.output) {
        const outputs = Array.isArray(options.output)
          ? options.output
          : [options.output];
        outputDirs = outputs.map((output) => output.dir).filter(Boolean);
      }
      return null; // 不修改配置
    },

    /**
     * 在构建开始前清理输出目录
     * @param {import('rollup').BuildStartOptions} options 构建开始选项
     */
    async buildStart() {
      for (const dir of outputDirs) {
        const targetPath = path.resolve(workspace, dir);
        try {
          if (fs.existsSync(targetPath)) {
            rimraf.sync(targetPath);
            console.log(`[clear-output] 已清理目录: ${targetPath}`);
          }
        } catch (error) {
          this.error(`清理目录失败 (${targetPath}): ${error.message}`);
        }
      }
    },
  };
}
