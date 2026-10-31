// Next 16 removed `next lint`; the ESLint CLI runs Next's flat configs directly.
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const config = [
  ...nextVitals,
  ...nextTs,
  // React Compiler hook rules arrived with eslint-config-next 16. Code written
  // before they existed reports them as warnings; community code must pass them.
  {
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/use-memo": "warn",
      "react-hooks/purity": "warn",
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
  {
    files: ["src/**/community/**"],
    rules: {
      "react-hooks/set-state-in-effect": "error",
      "react-hooks/immutability": "error",
      "react-hooks/refs": "error",
      "react-hooks/use-memo": "error",
      "react-hooks/purity": "error",
      "@typescript-eslint/no-unused-vars": "error",
    },
  },
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "public/**",
      "_parked/**",
      "packages/**",
      "reports/**",
      "deploy/**",
      "next-env.d.ts",
    ],
  },
];

export default config;
