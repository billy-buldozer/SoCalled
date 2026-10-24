
/**
 * SoCalled v0.10.1
 * Automatyczne dodawanie pobierania MP4.
 *
 * Uruchomienie z folderu frontend:
 *
 * node scripts/add-video-download.cjs
 */

const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const root = process.cwd();
const src = path.join(root, "src");

const downloadComponent = path.join(
  src,
  "components",
  "VideoDownloadButton.tsx"
);

const candidates = [
  path.join(
    src,
    "components",
    "ChatPanel.tsx"
  ),
  path.join(
    src,
    "components",
    "SoCalledView.tsx"
  ),
  path.join(
    src,
    "App.tsx"
  ),
];


// ==========================================
// FUNKCJE POMOCNICZE
// ==========================================

function fail(message) {
  console.error(
    "\nBŁĄD: " + message
  );

  process.exit(1);
}


function parse(filePath, content) {
  const source = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );

  if (source.parseDiagnostics.length) {
    const problem =
      source.parseDiagnostics[0];

    fail(
      "Błąd składni w " +
      path.relative(root, filePath) +
      ": " +
      ts.flattenDiagnosticMessageText(
        problem.messageText,
        "\n"
      )
    );
  }

  return source;
}


// ==========================================
// SPRAWDZENIE KOMPONENTU
// ==========================================

if (!fs.existsSync(downloadComponent)) {
  fail(
    "Brakuje pliku " +
    "src/components/VideoDownloadButton.tsx"
  );
}


// ==========================================
// SZUKANIE ODTWARZACZA
// ==========================================

function findChatVideos(source) {
  const matches = [];

  function visit(node) {
    if (
      ts.isJsxElement(node) &&
      node.openingElement.tagName
        .getText(source) === "video"
    ) {
      const attributes =
        node.openingElement
          .attributes
          .properties;

      const classAttribute =
        attributes.find(
          (attribute) =>
            ts.isJsxAttribute(attribute) &&
            attribute.name.text === "className"
        );

      const classText =
        classAttribute?.initializer
          ?.getText(source) ?? "";

      const videoText =
        node.getText(source);

      if (
        classText.includes(
          "socalled-chat-video"
        ) &&
        videoText.includes(
          "videoUrl("
        ) &&
        videoText.includes(
          "message.videoId"
        )
      ) {
        matches.push(node);
      }
    }

    ts.forEachChild(
      node,
      visit
    );
  }

  visit(source);

  return matches;
}


// ==========================================
// WYBÓR AKTUALNEGO PLIKU
// ==========================================

let target = null;
let original = null;
let source = null;
let video = null;

for (const candidate of candidates) {
  if (!fs.existsSync(candidate)) {
    continue;
  }

  const content = fs.readFileSync(
    candidate,
    "utf8"
  );

  const parsed = parse(
    candidate,
    content
  );

  const videos = findChatVideos(
    parsed
  );

  if (videos.length === 0) {
    continue;
  }

  if (videos.length !== 1) {
    fail(
      "Wykryto więcej niż jeden odtwarzacz " +
      "czatu. Nie zmieniam plików."
    );
  }

  target = candidate;
  original = content;
  source = parsed;
  video = videos[0];

  break;
}

if (
  !target ||
  !original ||
  !source ||
  !video
) {
  fail(
    "Nie odnaleziono odtwarzacza " +
    "socalled-chat-video w aktualnym projekcie."
  );
}


// ==========================================
// KONTROLA POWTÓRNEGO URUCHOMIENIA
// ==========================================

if (
  original.includes(
    "<VideoDownloadButton"
  )
) {
  console.log(
    "\nPrzycisk Pobierz MP4 " +
    "jest już dodany."
  );

  process.exit(0);
}


// ==========================================
// WYZNACZENIE ŚCIEŻKI IMPORTU
// ==========================================

let importPath = path
  .relative(
    path.dirname(target),
    downloadComponent
  )
  .replaceAll("\\", "/")
  .replace(/\.tsx$/, "");

if (!importPath.startsWith(".")) {
  importPath = "./" + importPath;
}


// ==========================================
// DODANIE PRZYCISKU POD FILMEM
// ==========================================

const videoStart = video.getStart(
  source
);

const videoEnd = video.getEnd();

const lineStart =
  original.lastIndexOf(
    "\n",
    videoStart
  ) + 1;

const beforeTag = original.slice(
  lineStart,
  videoStart
);

const indentation =
  beforeTag.match(/^\s*/)?.[0] ?? "";

const buttonCode =
  "\n" +
  indentation +
  "<VideoDownloadButton " +
  "videoId={message.videoId} />";

let modified =
  original.slice(0, videoEnd) +
  buttonCode +
  original.slice(videoEnd);


// ==========================================
// DODANIE IMPORTU
// ==========================================

const importStatements =
  source.statements.filter(
    ts.isImportDeclaration
  );

if (!importStatements.length) {
  fail(
    "Nie znaleziono importów w pliku czatu."
  );
}

const lastImport =
  importStatements[
    importStatements.length - 1
  ];

const importPosition =
  lastImport.getEnd();

const newImport =
  "\nimport VideoDownloadButton " +
  `from "${importPath}";`;

modified =
  modified.slice(0, importPosition) +
  newImport +
  modified.slice(importPosition);


// ==========================================
// SPRAWDZENIE SKŁADNI
// ==========================================

parse(
  target,
  modified
);


// ==========================================
// KOPIA ZAPASOWA
// ==========================================

const backup =
  target + ".before-mp4-download.bak";

if (fs.existsSync(backup)) {
  fail(
    "Kopia zapasowa już istnieje: " +
    path.relative(root, backup)
  );
}

fs.writeFileSync(
  backup,
  original,
  { flag: "wx" }
);


// ==========================================
// ZAPIS
// ==========================================

fs.writeFileSync(
  target,
  modified,
  "utf8"
);

console.log(
  "\nGotowe! 🎬"
);

console.log(
  "Zmieniono: " +
  path.relative(root, target)
);

console.log(
  "Kopia: " +
  path.relative(root, backup)
);

console.log(
  "\nDodano przycisk Pobierz MP4 " +
  "pod odtwarzaczem filmu."
);

console.log(
  "Sprawdź projekt poleceniem: npm run build"
);
