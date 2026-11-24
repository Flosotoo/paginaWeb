const fs = require("fs");
const path = require("path");
const webpack = require("webpack");

function detectarNavegadorHeadless() {
  if (process.env.CHROME_BIN && fs.existsSync(process.env.CHROME_BIN)) {
    return;
  }
  const candidatos = [
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/brave",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  ];
  for (const ruta of candidatos) {
    if (fs.existsSync(ruta)) {
      process.env.CHROME_BIN = ruta;
      return;
    }
  }
}

detectarNavegadorHeadless();

module.exports = function (config) {
  config.set({
    basePath: "",
    frameworks: ["jasmine", "webpack"],
    files: [{ pattern: "src/specs/**/*.spec.+(ts|tsx)", watched: false }],
    preprocessors: {
      "src/specs/**/*.spec.+(ts|tsx)": ["webpack"],
    },
    webpack: {
      mode: "development",
      devtool: "inline-source-map",
      resolve: {
        extensions: [".ts", ".tsx", ".js", ".jsx"],
      },
      module: {
        rules: [
          {
            test: /\.(ts|tsx)$/,
            exclude: /node_modules/,
            use: {
              loader: "babel-loader",
              options: {
                presets: [
                  ["@babel/preset-env", { targets: { esmodules: true }, modules: false }],
                  ["@babel/preset-react", { runtime: "automatic" }],
                  "@babel/preset-typescript",
                ],
                plugins: [
                  [
                    "babel-plugin-istanbul",
                    {
                      include: [
                        "src/components/**/*.{ts,tsx}",
                        "src/routes/**/*.{ts,tsx}",
                        "src/context/**/*.{ts,tsx}",
                        "src/hooks/useAccion.ts",
                        "src/services/{api,auth,ordenesCompra,proveedores}.ts",
                        "src/utils/**/*.{ts,tsx}",
                      ],
                      exclude: ["src/specs/**", "src/tests/**"],
                    },
                  ],
                ],
              },
            },
          },
          {
            test: /\.css$/,
            use: ["style-loader", "css-loader"],
          },
        ],
      },
      plugins: [
        new webpack.DefinePlugin({
          "import.meta.env.VITE_API_BASE_URL": JSON.stringify("http://localhost:8090"),
        }),
      ],
    },
    reporters: ["progress", "coverage"],
    coverageReporter: {
      dir: path.join(__dirname, "coverage"),
      reporters: [
        { type: "html", subdir: "html" },
        { type: "lcovonly", subdir: ".", file: "lcov.info" },
        { type: "text-summary" },
      ],
      check: {
        global: {
          statements: 75,
          lines: 75,
          functions: 70,
          branches: 65,
        },
      },
    },
    browsers: ["ChromeHeadlessNoSandbox"],
    customLaunchers: {
      ChromeHeadlessNoSandbox: {
        base: "ChromeHeadless",
        flags: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
      },
    },
    singleRun: true,
    concurrency: 1,
    browserNoActivityTimeout: 30000,
  });
};
