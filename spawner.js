global.requireEsm = async function (url) {
  return await import(url);
};

global.discordJS = require("discord.js");

global.fileTypePromise = import("file-type");

const originalExt = { ...require.extensions };
const { createRequire } = require("module");
const originalRequire = createRequire(__filename);
originalRequire.extensions = { ...originalExt };

global.originalRequire = originalRequire;

const fs = require("fs-extra");
const { execSync } = require("child_process");
const path = require("path");
const axios = require("axios").default;

require.extensions[".txt"] = function (module, filename) {
  if (!fs.existsSync(filename)) {
    return "";
  }
  const file = fs.readFileSync(filename, "utf8");
  module.exports = file;
};

require.url = async function (url) {
  try {
    if (typeof url !== "string") {
      throw new TypeError(
        `The first argument (url) must be a string. Received ${typeof url}`
      );
    }
    const response = await axios.get(url);
    let fileContent = `${response.data}`;
    if (
      typeof response.data !== "string" &&
      typeof response.data !== "object"
    ) {
      throw new TypeError(
        `The url ${url} returned a non-string value. Received ${typeof response.data}`
      );
    } else if (typeof response.data === "object") {
      fileContent = JSON.stringify(response.data);
    }
    const filePath = `${__dirname}/require-${Date.now()}-${Math.floor(
      Math.random() * 1000000
    )}`;
    fs.writeFileSync(filePath, fileContent);
    const result = require(filePath);
    fs.unlinkSync(filePath);
    return result;
  } catch (error) {
    throw error;
  }
};

function isPackageInstalled(packageName) {
  try {
    const packagePath = path.join("node_modules", packageName);
    return fs.existsSync(packagePath);
  } catch (err) {
    return false;
  }
}
function ensureNPM(packageName) {
  if (!isPackageInstalled(packageName)) {
    try {
      console.log(`Installing ${packageName}...`);
      execSync(`npm install ${packageName}`, { stdio: "inherit" });

      console.log(`Running npm install to ensure it's audited...`);
      execSync("npm install", { stdio: "inherit" });
    } catch (err) {
      throw new Error(`Failed to install ${packageName}: ${err.message}`);
    }
  } else {
    console.log(`${packageName} is already installed.`);
  }
  return require(packageName);
}

require.ensure = function (moduleName) {
  if (moduleName.startsWith(".") || path.isAbsolute(moduleName)) {
    return require(moduleName);
  } else {
    return ensureNPM(moduleName);
  }
};

require("ts-node").register();

require("tsconfig-paths").register();

const { secureRandom } = require("./CommandFiles/modules/unisym");

Math.randomOriginal = Math.random.bind(Math);
Math.random = secureRandom;

const genericErrReg = [
  {
    regex: /TypeError: (?!null|undefined)(.*) is not a function$/,
    callback: (match) =>
      `ERROR: '${match[1]}' is not a function.\n\nPossible Fix:\n- Ensure '${match[1]}' is correctly defined.\n- Check if it's assigned to a function before calling.\n`,
  },
  {
    regex: /TypeError: (undefined|null) is not a function/,
    callback: (match) =>
      `ERROR: Cannot call a non-existent function (${match[1]} found instead).\n\nPossible Fix:\n- Verify the variable is a function before calling.\n- Check for missing imports or typos.\n`,
  },
  {
    regex: /cannot read propert(y|ies) '.*' of (undefined|null)/,
    callback: (match) =>
      `ERROR: Tried to access a property on ${match[2]} (which has no properties).\n\nPossible Fix:\n- Ensure the object is initialized before use.\n- Use optional chaining (?.) to avoid crashes.\n`,
  },
  {
    regex: /ReferenceError: (.*) is not defined/,
    callback: (match) =>
      `ERROR: '${match[1]}' is not defined.\n\nPossible Fix:\n- Check for typos in variable names.\n- Ensure '${match[1]}' is declared before use.\n`,
  },
];

const getFilePreview = (filePath, lineNo, context = 1) => {
  try {
    if (!fs.existsSync(filePath)) return "[File not found]\n";

    const fileLines = fs.readFileSync(filePath, "utf-8").split("\n");
    const start = Math.max(0, lineNo - 1 - context);
    const end = Math.min(fileLines.length, lineNo + context);

    return (
      `\n[Code Preview]:\n` +
      fileLines
        .slice(start, end)
        .map((line, i) => {
          const currentLine = start + i + 1;
          return currentLine === lineNo
            ? `> ${currentLine}: ${line}`
            : `  ${currentLine}: ${line}`;
        })
        .join("\n") +
      "\n"
    );
  } catch {
    return "[Unable to read file]\n";
  }
};

const stackFrameReg = [
  {
    regex: /^\s*at\s+(?:(.+?)\s+)?(?:\(([^)]*?)(?::(\d+))?(?::(\d+))?\))?$/i,
    callback: (match, index) => {
      let funcName = match[1] || "<anonymous>";
      let fileName = match[2] || "<unknown file>";
      let lineNo = parseInt(match[3], 10) || "???";
      let colNo = parseInt(match[4], 10) || "???";

      if (fileName.startsWith("node:internal")) {
        return `#${
          index + 1
        }  ${funcName}()  [Node.js Internal] [${lineNo}:${colNo}] [No preview available]`;
      }

      let filePreview =
        !isNaN(lineNo) && fileName !== "<unknown file>"
          ? getFilePreview(fileName, lineNo)
          : "[No preview available]\n";

      return `#${index + 1}  ${funcName}()  ${fileName.replace(
        process.cwd(),
        "."
      )} [${lineNo}:${colNo}]${filePreview}`;
    },
  },
  {
    regex:
      /^\s*at eval \(eval at (.+?) \(([^)]+):(\d+):(\d+)\), <anonymous>:(\d+):(\d+)\)$/,
    callback: (match, index) => {
      let entryFunc = match[1];
      let entryFile = match[2];
      let entryLine = parseInt(match[3], 10);
      let entryCol = parseInt(match[4], 10);
      let evalLine = parseInt(match[5], 10);
      let evalCol = parseInt(match[6], 10);

      return `#${
        index + 1
      }  eval()  [Evaluated Code] at ${entryFunc} (${entryFile.replace(
        process.cwd(),
        "."
      )} [${entryLine}:${entryCol}]), <anonymous> [${evalLine}:${evalCol}]`;
    },
  },
];

let origStack = Error.prepareStackTrace;

Error.prepareStackTrace = (error, structuredStack) => {
  const defaultStack = origStack(error, structuredStack);
  const lines = defaultStack.split("\n");

  let errMsg = lines[0];
  for (const { regex, callback } of genericErrReg) {
    const match = errMsg.match(regex);
    if (match) {
      errMsg = callback(match);
      break;
    }
  }

  const transformedStack = lines.slice(1).map((line, index) => {
    let transformed = line;
    for (const { regex, callback } of stackFrameReg) {
      const match = line.match(regex);
      if (match) {
        transformed = callback(match, index);
        break;
      }
    }
    return transformed;
  });

  return `${errMsg}\n[STACK TRACE] (Most Recent Call First):\n\n${transformedStack
    .map((i) => String(i).trimStart().trimEnd())
    .join("\n\n")}\n[TRACE END]\n\nCassidySpectra v${
    require("./package.json").version
  }`;
};

require("./hidestate");

require("./Cassidy");
