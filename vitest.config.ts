import { defineVitestProject } from "@nuxt/test-utils/config"
import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "unit",
          include: ["test/unit/**/*.test.ts"],
          environment: "node",
          alias: {
            "~": new URL("./app/", import.meta.url).pathname,
          },
        },
      },
      await defineVitestProject({
        test: {
          name: "nuxt",
          include: ["test/nuxt/**/*.nuxt.test.ts"],
          environment: "nuxt",
          environmentOptions: {
            nuxt: {
              overrides: {
                runtimeConfig: {
                  public: { version: "1.3.2" },
                },
              },
            },
          },
        },
      }),
    ],
  },
})
