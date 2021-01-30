const { startService } = require("esbuild");
const { watch } = require("chokidar");
const path = require('path');

/**
 * Builds the code in no time
 */
const build = async () => {
  //Start build service
  const service = await startService();
  try {
    // Get time before build starts
    const timerStart = Date.now();
    // Build code
    await service.build({
      color: true,
      entryPoints: [path.resolve(__dirname, "src/index.ts")],
      outfile: path.resolve(__dirname, "docs/dist/index.js"),
      // minify: true,
      bundle: true,
      sourcemap: 'external',
      tsconfig: path.resolve(__dirname, "tsconfig.json"),
      platform: "browser",
      logLevel: "error",
      treeShaking: true
    });

    // Get time after build ends
    const timerEnd = Date.now();
    console.log(`Built in ${timerEnd - timerStart}ms.`);
  } catch (e) {
    console.log(e.message);
    // OOPS! ERROR!
  } finally {
    // We command you to stop. Will start again if files change.
    service.stop();
  }
};

const watcher = watch(["src/**/*", "./src/**/*", "../src/**/*"], {
});
console.log("Watching files... \n");

build();
watcher.on("change", () => {
  build();
});