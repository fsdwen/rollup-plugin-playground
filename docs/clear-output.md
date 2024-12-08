# Developing a Rollup Plugin: Cleaning the Build Output Directory

Maintaining a clean and organized output directory is crucial during the project build process. As the number of builds increases, especially during incremental builds, old files may not be cleaned up promptly, leading to conflicts or interference with newly generated files. This can cause build errors, file redundancy, or unexpected behaviors. Therefore, a mechanism is needed to ensure that the output directory is clean before each build.

This article will guide you through developing a Rollup plugin for cleaning the build output directory through a step-by-step tutorial.

## 1. Plugin Objective

The plugin we will develop will automatically clear all files in the build output directory before each build starts. This ensures that the output directory remains clean with every build, preventing build issues caused by leftover files.

> **Note**: This plugin only supports directory cleaning and does not support the deletion of individual files.

### Functional Requirements

- Automatically clean all files in the output directory at the start of the build.
- Automatically retrieve the output directory from the Rollup configuration without additional configuration.

## 2. Starting Plugin Development

### 2.1 Installing Dependencies

We will use the `rimraf` Node.js module to recursively delete files and directories, similar to the `rm -rf` command in Unix/Linux. `rimraf` supports both asynchronous and synchronous operations, is cross-platform compatible, and is commonly used for cleaning build directories, temporary files, and caches.

Use the following command to install `rimraf`:

```bash
npm install rimraf --save-dev
```

### 2.2 Creating the Plugin Structure

First, create a plugin file named `rollup-plugin-clear-output.js`. Below is the basic structure of the plugin:

```javascript
import fs from "fs";
import path from "path";
import * as rimraf from "rimraf";

/**
 * Rollup plugin to clean the build output directory
 * @returns {import('rollup').Plugin} Rollup plugin object
 */
export default function clearOutputPlugin() {
  let outputDirs = [];
  const workspace = process.cwd();

  return {
    name: "clear-output", // Plugin name

    /**
     * Capture Rollup configuration options and extract output directories
     * @param {import('rollup').RollupOptions} options Rollup configuration options
     * @returns {null | import('rollup').RollupOptions} Returns modified configuration or null
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
      return null; // Do not modify configuration
    },

    /**
     * Clean the output directories before the build starts
     * @param {import('rollup').BuildStartOptions} options Build start options
     */
    async buildStart() {
      for (const dir of outputDirs) {
        const targetPath = path.resolve(workspace, dir);
        try {
          if (fs.existsSync(targetPath)) {
            rimraf.sync(targetPath);
            console.log(`[clear-output] Cleaned directory: ${targetPath}`);
          }
        } catch (error) {
          this.error(`Failed to clean directory (${targetPath}): ${error.message}`);
        }
      }
    },
  };
}
```

### 2.3 Understanding Plugin Hooks

In Rollup plugins, **hooks** are interfaces that allow plugins to interact with the Rollup build process. In this plugin, we use two primary hooks: `options` and `buildStart`. Below is a detailed explanation of these two hooks:

#### 2.3.1 `options` Hook

- **Trigger Timing**: Triggered when Rollup parses the configuration options.
- **Purpose**: Allows the plugin to read or modify Rollup's configuration options. In this plugin, we use the `options` hook to extract information about the output directories.
- **Implementation Details**:
  - Check if `options.output` exists.
  - Convert `options.output` to an array format to support multiple output configurations.
  - Extract the `dir` (output directory) from each output configuration or obtain the output directory using `path.dirname(output.file)`.
  - Store the valid output directories in the `outputDirs` array.
  - Return `null` to indicate that the plugin does not modify the configuration.

#### 2.3.2 `buildStart` Hook

- **Trigger Timing**: Triggered before the build starts.
- **Purpose**: Allows the plugin to perform custom operations before the build process begins. In this plugin, we use the `buildStart` hook to clean the output directories.
- **Implementation Details**:
  - Iterate through the `outputDirs` array to get the absolute path of each output directory.
  - Check if the target directory exists.
  - If the directory exists, use `rimraf.sync` to synchronously delete the directory and its contents.
  - Output log information indicating that the directory has been cleaned or does not need cleaning.
  - If an error occurs during the cleaning process, call `this.error` to throw a build error, preventing the build from continuing and ensuring that the issue is promptly identified and resolved.

### 2.4 Configuring and Using the Plugin

Integrate the custom plugin into the `rollup.config.mjs` configuration file:

```javascript
import clearOutputPlugin from './rollup-plugin-clear-output'; // Import the custom plugin

export default {
  input: 'src/index.js',
  output: {
    dir: 'dist', // Output directory
    format: 'esm',
  },
  plugins: [
    clearOutputPlugin(), // Use the clear-output plugin
    // Other plugins...
  ],
};
```

### 2.5 Running the Build

Each time you run the Rollup build, the `clear-output` plugin will automatically clean the `dist` directory before the build starts, ensuring that the directory is empty:

```bash
npx rollup -c
```

After executing the above command, the console will display log information about the directory cleaning, for example:

```bash
[clear-output] Cleaned directory: /path/to/project/dist
```

## 3. Conclusion

Through this tutorial, we have implemented a Rollup plugin for cleaning the build output directory, ensuring that the output directory remains clean and organized with each build. Below are the key features of the plugin:

- **Automatic Cleaning**: Automatically cleans the specified output directory before each build starts, preventing issues caused by leftover files.
- **Automated Configuration**: The plugin automatically retrieves the output directory from the Rollup configuration without requiring additional setup, simplifying the usage process.
- **Error Handling**: If any issues occur during the cleaning process, the plugin throws detailed error messages to prevent the build from continuing, ensuring that problems are promptly identified and addressed.
- **Log Feedback**: The plugin provides log information about the cleaning operations, allowing developers to monitor the plugin's execution status.

Such a plugin is especially useful for projects that require frequent builds or perform incremental builds, particularly in continuous integration (CI) environments. It helps developers maintain the stability of the build process by avoiding issues caused by old files, thereby enhancing overall development efficiency.
