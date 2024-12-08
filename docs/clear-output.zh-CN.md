# 开发 Rollup 插件：清理构建输出目录

在项目构建过程中，保持输出目录的干净整洁至关重要。随着构建次数的增加，尤其是在进行增量构建时，旧文件可能未能及时清理，导致这些遗留文件与新生成的文件发生冲突或干扰。这可能引发构建错误、文件冗余或不可预期的行为。因此，我们需要一种机制，确保每次构建前输出目录都是干净的。

本文将通过逐步教程，指导你开发一个用于清理构建输出目录的 Rollup 插件。

## 1. 插件目标

我们将开发的插件将在每次构建开始之前，自动清空构建输出目录中的所有文件。该插件确保每次构建时，输出目录始终保持干净，避免因文件残留导致的构建问题。

> **注意**：本插件仅支持目录清理，不支持单个文件的删除。

### 功能要求

- 在构建开始时，自动清理输出目录中的所有文件。
- 从 Rollup 配置中自动获取输出目录，无需额外配置。

## 2. 开始开发插件

### 2.1 安装依赖

我们将使用 `rimraf` 这个 Node.js 模块来递归删除文件和目录，类似于 Unix/Linux 中的 `rm -rf` 命令。`rimraf` 支持异步和同步操作，跨平台兼容，常用于清理构建目录、临时文件和缓存。

使用以下命令安装 `rimraf`：

```bash
npm install rimraf --save-dev
```

### 2.2 创建插件结构

首先，创建一个插件文件，命名为 `rollup-plugin-clear-output.js`。以下是插件的基本结构：

```javascript
import fs from "fs";
import path from "path";
import * as rimraf from "rimraf";

/**import fs from "fs";
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
        outputDirs = outputs
          .map((output) => output.dir)
          .filter(Boolean);
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
```

### 2.3 插件钩子解析

在 Rollup 插件中，**钩子（Hooks）** 是插件与 Rollup 构建流程交互的接口。我们在本插件中使用了两个主要钩子：`options` 和 `buildStart`。以下是对这两个钩子的详细说明：

#### 2.3.1 `options` 钩子

- **触发时机**：在 Rollup 解析配置选项时触发。
- **作用**：允许插件读取或修改 Rollup 的配置选项。在本插件中，我们使用 `options` 钩子来提取输出目录的信息。
- **实现细节**：
  - 检查 `options.output` 是否存在。
  - 将 `options.output` 统一转换为数组形式，以支持多输出配置。
  - 提取每个输出配置中的 `dir`（输出目录）或通过 `path.dirname(output.file)` 获取输出目录。
  - 将有效的输出目录存储在 `outputDirs` 数组中。
  - 返回 `null`，表示插件不对配置进行任何修改。


#### 2.3.2 `buildStart` 钩子

- **触发时机**：在构建开始之前触发。
- **作用**：允许插件在构建过程开始前执行自定义操作。在本插件中，我们使用 `buildStart` 钩子来清理输出目录。
- **实现细节**：
  - 遍历 `outputDirs` 数组，获取每个输出目录的绝对路径。
  - 检查目标目录是否存在。
  - 如果目录存在，使用 `rimraf.sync` 同步删除目录及其内容。
  - 输出日志信息，指示目录已被清理或无需清理。
  - 如果在清理过程中发生错误，调用 `this.error` 抛出构建错误，阻止构建继续进行。


### 2.4 配置和使用插件

将自定义插件集成到 `rollup.config.mjs` 配置文件中：

```javascript
import clearOutputPlugin from './rollup-plugin-clear-output'; // 引入自定义插件

export default {
  input: 'src/index.js',
  output: {
    dir: 'dist', // 输出目录
    format: 'esm',
  },
  plugins: [
    clearOutputPlugin(), // 使用清理插件
    // 其他插件...
  ],
};
```

### 2.5 运行构建

每次运行 Rollup 构建时，`clear-output` 插件将在构建开始前自动清理 `dist` 目录，确保目录是空的：

```bash
npx rollup -c
```

执行上述命令后，控制台将显示清理目录的日志信息，例如：

```bash
[clear-output] 已清理目录: /path/to/project/dist
```

## 3. 总结

通过本教程，我们实现了一个用于清理构建输出目录的 Rollup 插件，确保每次构建时输出目录的干净整洁。以下是插件的关键特点：

- **自动清理**：在每次构建开始前自动清理指定的输出目录，避免文件残留引发的问题。
- **配置自动化**：插件自动从 Rollup 配置中获取输出目录，无需额外配置，简化使用流程。
- **错误处理**：在清理过程中，如果遇到任何问题，插件会抛出详细的错误信息，防止构建过程继续，确保问题被及时发现和修复。
- **日志反馈**：插件提供清理操作的日志信息，便于开发者了解插件的执行状态。

这样的插件特别适用于需要频繁构建或进行增量构建的项目，尤其是在持续集成（CI）环境中。它帮助开发者保持构建过程的稳定性，避免因旧文件干扰而引发的问题，从而提升整体开发效率。
