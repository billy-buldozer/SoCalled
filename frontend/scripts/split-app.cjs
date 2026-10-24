
/**
 * SoCalled - refaktoryzacja App.tsx
 *
 * Uruchom z folderu frontend:
 * node scripts/split-app.cjs
 *
 * Skrypt:
 * - analizuje aktualny App.tsx
 * - tworzy kopię zapasową
 * - wydziela wspólne deklaracje
 * - przenosi logikę do hooka
 * - wydziela komponenty interfejsu
 * - zachowuje istniejące pliki CSS
 */

const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const root = process.cwd();

const srcDir = path.join(root, "src");

const appPath = path.join(
  srcDir,
  "App.tsx"
);

const hookPath = path.join(
  srcDir,
  "hooks",
  "useSoCalled.tsx"
);

const sharedPath = path.join(
  srcDir,
  "socalled-shared.tsx"
);

const viewPath = path.join(
  srcDir,
  "components",
  "SoCalledView.tsx"
);

const backupPath = path.join(
  root,
  "backups",
  "App.before-refactor.tsx.bak"
);

// ==========================================
// BŁĘDY
// ==========================================

function fail(message) {
  console.error(
    "\nBŁĄD: " + message
  );

  process.exit(1);
}

// ==========================================
// PARSOWANIE TYPESCRIPT
// ==========================================

function parse(
  content,
  filename = "generated.tsx"
) {
  const source = ts.createSourceFile(
    filename,
    content,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );

  if (source.parseDiagnostics.length) {
    const problem =
      source.parseDiagnostics[0];

    fail(
      `${filename}: ` +
      ts.flattenDiagnosticMessageText(
        problem.messageText,
        "\n"
      )
    );
  }

  return source;
}

// ==========================================
// NAZWY ZMIENNYCH
// ==========================================

function namesOfBinding(name) {
  if (ts.isIdentifier(name)) {
    return [name.text];
  }

  if (
    ts.isObjectBindingPattern(name) ||
    ts.isArrayBindingPattern(name)
  ) {
    return name.elements.flatMap(
      (element) => {
        if (
          ts.isOmittedExpression(element)
        ) {
          return [];
        }

        return namesOfBinding(
          element.name
        );
      }
    );
  }

  return [];
}

function declaredNames(statement) {
  if (
    ts.isFunctionDeclaration(statement) ||
    ts.isClassDeclaration(statement) ||
    ts.isInterfaceDeclaration(statement) ||
    ts.isTypeAliasDeclaration(statement) ||
    ts.isEnumDeclaration(statement)
  ) {
    return statement.name
      ? [statement.name.text]
      : [];
  }

  if (
    ts.isVariableStatement(statement)
  ) {
    return statement
      .declarationList
      .declarations
      .flatMap(
        (declaration) =>
          namesOfBinding(declaration.name)
      );
  }

  return [];
}

// ==========================================
// WYKRYWANIE ODWOŁAŃ
// ==========================================

function isReference(node) {
  const parent = node.parent;

  if (!parent) return true;

  if (
    ts.isPropertyAccessExpression(parent) &&
    parent.name === node
  ) {
    return false;
  }

  if (
    ts.isPropertyAssignment(parent) &&
    parent.name === node
  ) {
    return false;
  }

  if (
    ts.isMethodDeclaration(parent) &&
    parent.name === node
  ) {
    return false;
  }

  if (
    ts.isVariableDeclaration(parent) &&
    parent.name === node
  ) {
    return false;
  }

  if (
    ts.isParameter(parent) &&
    parent.name === node
  ) {
    return false;
  }

  if (
    ts.isBindingElement(parent) &&
    parent.name === node
  ) {
    return false;
  }

  if (
    ts.isFunctionDeclaration(parent) &&
    parent.name === node
  ) {
    return false;
  }

  if (
    ts.isTypeAliasDeclaration(parent) &&
    parent.name === node
  ) {
    return false;
  }

  if (
    ts.isInterfaceDeclaration(parent) &&
    parent.name === node
  ) {
    return false;
  }

  if (
    ts.isJsxAttribute(parent) &&
    parent.name === node
  ) {
    return false;
  }

  return true;
}

function referencesIn(node) {
  const result = new Set();

  function visit(child) {
    if (
      ts.isIdentifier(child) &&
      isReference(child)
    ) {
      result.add(child.text);
    }

    ts.forEachChild(
      child,
      visit
    );
  }

  visit(node);

  return result;
}

function referencesInText(content) {
  return referencesIn(
    parse(content)
  );
}

function usedFrom(node, available) {
  const references =
    referencesIn(node);

  return [...available].filter(
    (name) => references.has(name)
  );
}

// ==========================================
// PRZENOSZENIE IMPORTÓW
// ==========================================

function importsFor(
  content,
  originalImports,
  source,
  destination
) {
  const used =
    referencesInText(content);

  const result = [];

  for (
    const statement of originalImports
  ) {
    const clause =
      statement.importClause;

    // Importy CSS zostają w App.tsx.
    if (!clause) continue;

    const specifier =
      statement.moduleSpecifier.text;

    let rebased = specifier;

    // Poprawiamy ścieżki względne,
    // gdy plik trafia do podfolderu.
    if (specifier.startsWith(".")) {
      const absolute = path.resolve(
        path.dirname(appPath),
        specifier
      );

      rebased = path
        .relative(
          path.dirname(destination),
          absolute
        )
        .replaceAll("\\", "/");

      if (!rebased.startsWith(".")) {
        rebased = "./" + rebased;
      }
    }

    const modulePath =
      JSON.stringify(rebased);

    const defaultName =
      clause.name &&
      used.has(clause.name.text)
        ? clause.name.text
        : null;

    let bindings = null;

    if (
      clause.namedBindings
    ) {
      if (
        ts.isNamespaceImport(
          clause.namedBindings
        )
      ) {
        const name =
          clause.namedBindings.name.text;

        if (used.has(name)) {
          bindings = `* as ${name}`;
        }
      } else {
        const matching =
          clause.namedBindings.elements
            .filter(
              (item) =>
                used.has(item.name.text)
            )
            .map(
              (item) =>
                item.getText(source)
            );

        if (matching.length) {
          bindings =
            `{ ${matching.join(", ")} }`;
        }
      }
    }

    if (
      !defaultName &&
      !bindings
    ) {
      continue;
    }

    const specifiers = [
      defaultName,
      bindings,
    ]
      .filter(Boolean)
      .join(", ");

    const typeKeyword =
      clause.isTypeOnly
        ? " type"
        : "";

    result.push(
      `import${typeKeyword} ${specifiers} ` +
      `from ${modulePath};`
    );
  }

  return result.join("\n");
}

function makeImports(
  content,
  originalImports,
  source,
  sharedSymbols,
  sharedModule,
  destination
) {
  const used =
    referencesInText(content);

  const sharedNames =
    [...sharedSymbols].filter(
      (name) => used.has(name)
    );

  let header = importsFor(
    content,
    originalImports,
    source,
    destination
  );

  const types = sharedNames.filter(
    (name) => sharedTypes.has(name)
  );

  const values = sharedNames.filter(
    (name) => !sharedTypes.has(name)
  );

  if (values.length) {
    header +=
      `\nimport { ${values.join(", ")} } ` +
      `from '${sharedModule}';`;
  }

  if (types.length) {
    header +=
      `\nimport type { ${types.join(", ")} } ` +
      `from '${sharedModule}';`;
  }

  return header.trim();
}

// ==========================================
// GENEROWANIE KOMPONENTU
// ==========================================

function renderComponent(
  name,
  expression,
  node,
  modelNames
) {
  const usedModel =
    usedFrom(node, modelNames);

  const unpack = usedModel.length
    ? (
      "  const { " +
      usedModel.join(", ") +
      " } = model;\n"
    )
    : "";

  const body =
    "import type { SoCalledModel } " +
    "from '../hooks/useSoCalled';\n" +
    `export default function ${name}` +
    "({ model }: { model: SoCalledModel }) {\n" +
    unpack +
    "  return (\n" +
    expression +
    "\n  );\n}\n";

  const destination = path.join(
    srcDir,
    "components",
    `${name}.tsx`
  );

  const header = makeImports(
    body,
    imports,
    source,
    sharedSymbols,
    "../socalled-shared",
    destination
  );

  return (
    header +
    "\n\n" +
    body
  );
}

// ==========================================
// WYKRYWANIE CZĘŚCI INTERFEJSU
// ==========================================

function jsxClass(node) {
  if (!ts.isJsxElement(node)) {
    return "";
  }

  const attribute =
    node.openingElement
      .attributes
      .properties
      .find(
        (property) =>
          ts.isJsxAttribute(property) &&
          property.name.text === "className"
      );

  if (
    !attribute ||
    !attribute.initializer
  ) {
    return "";
  }

  return attribute.initializer
    .getText(source);
}

// ==========================================
// SPRAWDZENIE PROJEKTU
// ==========================================

if (!fs.existsSync(appPath)) {
  fail(
    "Brak pliku frontend/src/App.tsx."
  );
}

if (
  fs.existsSync(backupPath)
) {
  fail(
    "Kopia zapasowa już istnieje. " +
    "Skrypt można uruchomić tylko raz."
  );
}

if (
  fs.existsSync(hookPath) ||
  fs.existsSync(sharedPath) ||
  fs.existsSync(viewPath)
) {
  fail(
    "Docelowe pliki już istnieją. " +
    "Nie nadpisuję ich."
  );
}

// ==========================================
// ODCZYT ORYGINALNEGO APP.TSX
// ==========================================

const original = fs.readFileSync(
  appPath,
  "utf8"
);

const source = parse(
  original,
  "App.tsx"
);

const imports =
  source.statements.filter(
    ts.isImportDeclaration
  );

const cssImports = imports
  .filter(
    (item) => !item.importClause
  )
  .map(
    (item) => item.getText(source)
  )
  .join("\n");

// ==========================================
// ODSZUKANIE FUNKCJI APP
// ==========================================

const appStatement =
  source.statements.find(
    (statement) =>
      ts.isFunctionDeclaration(statement) &&
      statement.name?.text === "App"
  );

if (
  !appStatement ||
  !appStatement.body ||
  appStatement.parameters.length
) {
  fail(
    "Oczekiwano funkcji App(). " +
    "Nie wprowadzono zmian."
  );
}

const appBody =
  appStatement.body;

const lastStatement =
  appBody.statements[
    appBody.statements.length - 1
  ];

if (
  !ts.isReturnStatement(lastStatement) ||
  !lastStatement.expression
) {
  fail(
    "Ostatnia instrukcja App() " +
    "musi zwracać JSX."
  );
}

let rootJsx =
  lastStatement.expression;

while (
  ts.isParenthesizedExpression(rootJsx)
) {
  rootJsx = rootJsx.expression;
}

if (
  !ts.isJsxElement(rootJsx) ||
  rootJsx.openingElement
    .tagName.getText(source) !== "div"
) {
  fail(
    "Oczekiwano głównego elementu <div>."
  );
}

// ==========================================
// DEKLARACJE WSPÓŁDZIELONE
// ==========================================

const globals =
  source.statements.filter(
    (statement) =>
      statement !== appStatement &&
      !ts.isImportDeclaration(statement) &&
      declaredNames(statement).length > 0
  );

if (!globals.length) {
  fail(
    "Nie znaleziono deklaracji współdzielonych."
  );
}

const sharedSymbols = new Set(
  globals.flatMap(declaredNames)
);

const sharedTypes = new Set(
  globals
    .filter(
      (statement) =>
        ts.isTypeAliasDeclaration(statement) ||
        ts.isInterfaceDeclaration(statement)
    )
    .flatMap(declaredNames)
);

// ==========================================
// LOGIKA APP
// ==========================================

const logicText = original.slice(
  appBody.getStart(source) + 1,
  lastStatement.getStart(source)
);

const logicStatements =
  appBody.statements.filter(
    (statement) =>
      statement !== lastStatement
  );

const modelNames = new Set(
  logicStatements.flatMap(declaredNames)
);

const neededModelNames = usedFrom(
  rootJsx,
  modelNames
);

if (!neededModelNames.length) {
  fail(
    "Nie znaleziono stanu używanego przez JSX."
  );
}

// ==========================================
// NOWE PLIKI
// ==========================================

const newFiles = new Map();

// ==========================================
// SOCALLED-SHARED.TSX
// ==========================================

const sharedDeclarations = globals
  .map((statement) => {
    const text =
      statement.getText(source);

    return /^export\b/.test(text)
      ? text
      : "export " + text;
  })
  .join("\n\n");

const sharedHeader = makeImports(
  sharedDeclarations,
  imports,
  source,
  new Set(),
  "./socalled-shared",
  sharedPath
);

const sharedFile =
  sharedHeader +
  "\n\n" +
  sharedDeclarations +
  "\n";

newFiles.set(
  sharedPath,
  sharedFile
);

// ==========================================
// HOOK USESOCALLED
// ==========================================

const modelItems =
  neededModelNames
    .map(
      (name) => `    ${name},`
    )
    .join("\n");

const hookBody =
  "export function useSoCalled() {" +
  logicText +
  "\n  return {\n" +
  modelItems +
  "\n  };\n}\n\n" +
  "export type SoCalledModel = " +
  "ReturnType<typeof useSoCalled>;\n";

const hookHeader = makeImports(
  hookBody,
  imports,
  source,
  sharedSymbols,
  "../socalled-shared",
  hookPath
);

newFiles.set(
  hookPath,
  hookHeader +
  "\n\n" +
  hookBody
);

// ==========================================
// ROZDZIELENIE PANELI
// ==========================================

const nodes = rootJsx.children.filter(
  (node) =>
    !ts.isJsxText(node) &&
    !(
      ts.isJsxExpression(node) &&
      !node.expression
    )
);

const sections = new Map();
const dialogs = [];

let unknown = false;

for (const node of nodes) {
  if (ts.isJsxExpression(node)) {
    dialogs.push(node);
    continue;
  }

  const className =
    jsxClass(node);

  if (
    className.includes("desktop-sidebar")
  ) {
    sections.set(
      "DesktopSidebar",
      node
    );
  } else if (
    className.includes("mobile-room-screen")
  ) {
    sections.set(
      "MobileRooms",
      node
    );
  } else if (
    className.includes("chat-panel")
  ) {
    sections.set(
      "ChatPanel",
      node
    );
  } else if (
    className.includes("details-panel")
  ) {
    sections.set(
      "DetailsPanel",
      node
    );
  } else {
    unknown = true;
  }
}

const canSplit =
  !unknown &&
  sections.size === 4 &&
  dialogs.length > 0;

// ==========================================
// KOMPONENTY
// ==========================================

let viewFile;

if (canSplit) {
  for (
    const [name, node] of sections
  ) {
    const destination = path.join(
      srcDir,
      "components",
      `${name}.tsx`
    );

    if (
      fs.existsSync(destination)
    ) {
      fail(
        `Plik już istnieje: ${destination}`
      );
    }

    newFiles.set(
      destination,
      renderComponent(
        name,
        node.getText(source),
        node,
        modelNames
      )
    );
  }

  // ========================================
  // OKNA DIALOGOWE
  // ========================================

  const dialogText =
    "<>\n" +
    dialogs
      .map(
        (node) =>
          node.getText(source)
      )
      .join("\n") +
    "\n</>";

  const dialogReferences =
    new Set();

  for (const node of dialogs) {
    for (
      const name of referencesIn(node)
    ) {
      dialogReferences.add(name);
    }
  }

  const dialogModelNames =
    [...modelNames].filter(
      (name) =>
        dialogReferences.has(name)
    );

  const dialogBody =
    "import type { SoCalledModel } " +
    "from '../hooks/useSoCalled';\n" +
    "export default function Dialogs" +
    "({ model }: { model: SoCalledModel }) {\n" +
    "  const { " +
    dialogModelNames.join(", ") +
    " } = model;\n" +
    "  return (\n" +
    dialogText +
    "\n  );\n}\n";

  const dialogPath = path.join(
    srcDir,
    "components",
    "Dialogs.tsx"
  );

  if (
    fs.existsSync(dialogPath)
  ) {
    fail(
      "Plik components/Dialogs.tsx już istnieje."
    );
  }

  const dialogHeader = makeImports(
    dialogBody,
    imports,
    source,
    sharedSymbols,
    "../socalled-shared",
    dialogPath
  );

  newFiles.set(
    dialogPath,
    dialogHeader +
    "\n\n" +
    dialogBody
  );

  // ========================================
  // SOCALLEDVIEW.TSX
  // ========================================

  const opening =
    rootJsx.openingElement
      .getText(source);

  const closing =
    rootJsx.closingElement
      .getText(source);

  const rootModelNames = usedFrom(
    rootJsx.openingElement,
    modelNames
  );

  const viewBody =
    "import type { SoCalledModel } " +
    "from '../hooks/useSoCalled';\n" +
    "import DesktopSidebar from './DesktopSidebar';\n" +
    "import MobileRooms from './MobileRooms';\n" +
    "import ChatPanel from './ChatPanel';\n" +
    "import DetailsPanel from './DetailsPanel';\n" +
    "import Dialogs from './Dialogs';\n\n" +
    "export default function SoCalledView" +
    "({ model }: { model: SoCalledModel }) {\n" +
    "  const { " +
    rootModelNames.join(", ") +
    " } = model;\n" +
    "  return (\n" +
    opening + "\n" +
    "    <DesktopSidebar model={model} />\n" +
    "    <MobileRooms model={model} />\n" +
    "    <ChatPanel model={model} />\n" +
    "    <DetailsPanel model={model} />\n" +
    "    <Dialogs model={model} />\n" +
    closing +
    "\n  );\n}\n";

  const viewHeader = makeImports(
    viewBody,
    imports,
    source,
    sharedSymbols,
    "../socalled-shared",
    viewPath
  );

  viewFile =
    viewHeader +
    "\n\n" +
    viewBody;

} else {
  // Niestandardowy układ:
  // oddzielamy logikę, ale nie zgadujemy,
  // jak dzielić pozostałe elementy JSX.

  const modelUnpack =
    neededModelNames.join(", ");

  const viewBody =
    "import type { SoCalledModel } " +
    "from '../hooks/useSoCalled';\n" +
    "export default function SoCalledView" +
    "({ model }: { model: SoCalledModel }) {\n" +
    "  const { " +
    modelUnpack +
    " } = model;\n" +
    "  return " +
    lastStatement.expression.getText(source) +
    ";\n}\n";

  const viewHeader = makeImports(
    viewBody,
    imports,
    source,
    sharedSymbols,
    "../socalled-shared",
    viewPath
  );

  viewFile =
    viewHeader +
    "\n\n" +
    viewBody;
}

newFiles.set(
  viewPath,
  viewFile
);

// ==========================================
// NOWY MAŁY APP.TSX
// ==========================================

const smallApp =
  "import { useSoCalled } " +
  "from './hooks/useSoCalled';\n" +
  "import SoCalledView " +
  "from './components/SoCalledView';\n" +
  cssImports +
  "\n\n" +
  "function App() {\n" +
  "  const model = useSoCalled();\n" +
  "  return <SoCalledView model={model} />;\n" +
  "}\n\n" +
  "export default App;\n";

newFiles.set(
  appPath,
  smallApp
);

// ==========================================
// WALIDACJA SKŁADNI
// ==========================================

for (
  const [filename, content] of newFiles
) {
  parse(
    content,
    path.basename(filename)
  );
}

// ==========================================
// KOPIA ZAPASOWA
// ==========================================

fs.mkdirSync(
  path.dirname(backupPath),
  { recursive: true }
);

fs.writeFileSync(
  backupPath,
  original,
  { flag: "wx" }
);

// ==========================================
// ZAPIS NOWYCH PLIKÓW
// ==========================================

for (
  const [filename, content] of newFiles
) {
  fs.mkdirSync(
    path.dirname(filename),
    { recursive: true }
  );

  fs.writeFileSync(
    filename,
    content,
    {
      flag:
        filename === appPath
          ? "w"
          : "wx",
    }
  );
}

// ==========================================
// PODSUMOWANIE
// ==========================================

console.log(
  `\nOK! Utworzono ${newFiles.size} plików.`
);

for (
  const filename of newFiles.keys()
) {
  console.log(
    "  " +
    path.relative(root, filename)
  );
}

console.log(
  "\nKopia zapasowa: " +
  path.relative(root, backupPath)
);

if (canSplit) {
  console.log(
    "Podzielono logikę, cztery panele " +
    "i okna dialogowe."
  );
} else {
  console.log(
    "Podzielono logikę i widok. " +
    "Wykryto niestandardowy układ JSX, " +
    "więc panele pozostały razem."
  );
}

console.log(
  "\nUruchom teraz: npm run build"
);
