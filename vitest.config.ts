import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "vitest/config";

const repoRoot = __dirname;
const extensionRoot = path.resolve(repoRoot, "extension");
const extensionTestsDir = path.resolve(repoRoot, "tests/extension");
const extensionTestsNodeModules = path.join(extensionTestsDir, "node_modules");
const extensionNodeModules = path.join(extensionRoot, "node_modules");

/**
 * Extension deps live in `extension/node_modules`. Tests under `tests/extension/`
 * need the same tree so Vite/Node walk from the test file finds one TipTap /
 * ProseMirror instance (avoids "different instances of a keyed plugin").
 */
function ensureExtensionTestsNodeModulesLink(): void {
  if (!fs.existsSync(extensionNodeModules)) {
    return;
  }
  const target = path.relative(extensionTestsDir, extensionNodeModules);
  try {
    const existing = fs.lstatSync(extensionTestsNodeModules);
    if (existing.isSymbolicLink()) {
      if (fs.readlinkSync(extensionTestsNodeModules) === target) {
        return;
      }
      fs.unlinkSync(extensionTestsNodeModules);
    } else {
      return;
    }
  } catch {
    // missing - create below
  }
  fs.symlinkSync(target, extensionTestsNodeModules);
}

ensureExtensionTestsNodeModulesLink();

export default defineConfig({
  test: {
    projects: [
      {
        resolve: {
          alias: {
            "@": path.resolve(extensionRoot, "src"),
            "@shared": path.resolve(repoRoot, "shared"),
          },
        },
        test: {
          name: "extension",
          environment: "happy-dom",
          include: ["tests/extension/**/*.test.ts"],
        },
      },
      {
        resolve: {
          alias: {
            "@": path.resolve(repoRoot, "src"),
            "@shared": path.resolve(repoRoot, "shared"),
          },
        },
        test: {
          name: "landing",
          environment: "happy-dom",
          include: ["tests/landing/**/*.test.ts"],
        },
      },
    ],
    coverage: {
      provider: "v8",
      include: ["extension/src/lib/**", "extension/src/storage/**", "src/lib/**"],
    },
  },
});
