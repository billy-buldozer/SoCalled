
/**
 * SoCalled — podłączenie routera postów.
 *
 * Uruchom z folderu frontend:
 * node scripts/connect-posts-router.cjs
 */

const fs = require("node:fs");
const path = require("node:path");

const mainPath = path.resolve(
  __dirname,
  "../../backend/app/main.py"
);

const routerPath = path.resolve(
  __dirname,
  "../../backend/app/posts.py"
);

if (
  !fs.existsSync(mainPath) ||
  !fs.existsSync(routerPath)
) {
  console.error(
    "Brakuje backend/app/main.py " +
    "lub backend/app/posts.py."
  );

  process.exit(1);
}

const original = fs.readFileSync(
  mainPath,
  "utf8"
);

if (
  original.includes("backend.app.posts import") ||
  original.includes("include_router(posts_router)")
) {
  console.log(
    "Router postów jest już zarejestrowany."
  );

  process.exit(0);
}

const lines = original.split(/\r?\n/);

const appLine = lines.findIndex(
  (line) =>
    /^app\s*=\s*FastAPI\s*\(.*\)\s*(?:#.*)?$/.test(line)
);

if (appLine < 0) {
  console.error(
    "Nie znalazłem 'app = FastAPI(...)'. " +
    "main.py pozostawiony bez zmian."
  );

  process.exit(1);
}

lines.splice(
  appLine + 1,
  0,
  "app.include_router(posts_router)"
);

const futureLines = lines
  .map(
    (line, index) =>
      /^from __future__ import /.test(line)
        ? index
        : -1
  )
  .filter((index) => index >= 0);

const importAt = futureLines.length
  ? futureLines[futureLines.length - 1] + 1
  : 0;

lines.splice(
  importAt,
  0,
  "from backend.app.posts import router as posts_router"
);

const backup =
  mainPath + ".before-posts.bak";

if (fs.existsSync(backup)) {
  console.error(
    "Kopia zapasowa już istnieje. " +
    "Nie zmieniam main.py."
  );

  process.exit(1);
}

fs.writeFileSync(
  backup,
  original,
  { flag: "wx" }
);

fs.writeFileSync(
  mainPath,
  lines.join("\n"),
  "utf8"
);

console.log(
  "Połączono posty z FastAPI."
);

console.log(
  "Kopia: " +
  path.relative(process.cwd(), backup)
);
