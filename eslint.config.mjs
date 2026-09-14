import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      // mdBook 构建产物：由外部工具生成，不参与官网源码检查
      "public/handbook/**",
      // tools/inspect.mjs 的本地 Chrome 配置与扩展缓存
      ".chrome-profile/**",
      "next-env.d.ts",
      // 设计基准 Demo：只读参考，不参与正式工程质量检查
      "zafu-pchospital-site/**",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
