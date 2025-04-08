/*
  WARNING: This source code is created by Liane Cagara.
  Any unauthorized modifications or attempts to tamper with this code 
  can result in severe consequences, including a global ban from my server.
  Proceed with extreme caution and refrain from any unauthorized actions.
*/
require("dotenv").config();

const MEMORY_THRESHOLD = 500;
const WARNING_THRESHOLD = MEMORY_THRESHOLD * 0.75;
import { registeredExtensions } from "./CommandFiles/modules/cassXTensions";
import { fontTag } from "./handlers/styler.js/main";
import cors from "cors";

const checkMemoryUsage = (normal) => {
  const memoryUsage = process.memoryUsage();
  const usedMemoryMB = memoryUsage.heapUsed / 1024 / 1024;
  if (usedMemoryMB > MEMORY_THRESHOLD) {
    console.warn(`High memory usage detected: ${usedMemoryMB.toFixed(2)} MB`);
  } else if (usedMemoryMB > WARNING_THRESHOLD) {
    console.warn(
      `Warning: Memory usage is at 75% of the threshold: ${usedMemoryMB.toFixed(
        2
      )} MB`
    );
  } else if (normal) {
    console.log(
      `Memory usage is within the threshold: ${usedMemoryMB.toFixed(2)} MB`
    );
  }
};
setInterval(() => checkMemoryUsage(false), 1000);
global.checkMemoryUsage = checkMemoryUsage;

import { createRequire } from "module";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
process.on("unhandledRejection", (err) => {
  console.log(err);
});
process.on("uncaughtException", (err) => {
  console.log(err);
});
global.items = [];
import utils from "./utils.js";
global.utils = new Proxy(utils, {
  get(target, prop) {
    if (!(prop in target)) {
      throw new Error(
        `The "global.utils.${prop}" property does not exist in Cassidy!`
      );
    }
    return target[prop];
  },
  set() {
    throw new Error(`The "global.utils" cannot be modified!`);
  },
});
// global.lia = `https://liaspark.chatbotcommunity.ltd`;
global.lia = "https://lianetheultimateserver.onrender.com";
global.webQuery = new Proxy(
  {},
  {
    get(target, prop) {
      if (prop in target) {
        return target[prop];
      }
    },
    set(target, prop, value) {
      if (Object.keys(target).length > 30) {
        delete target[Object.keys(target)[0]];
      }
      target[prop] = value;
      setTimeout(() => {
        delete target[prop];
      }, 30 * 1000);
      return true;
    },
  }
);
const upt = Date.now();
// Even __dirname needs a freaking fix
/*const __dirname = path.dirname(fileURLToPath(import.meta.url));*/
/*const require = createRequire(import.meta.url);*/

//Bro it's cheating! Talino mo talaga liyannnn
/*require.extensions['.js'] = (module, filename) => {
    const content = require('fs').readFileSync(filename, 'utf8');
    module._compile(content, filename);
};*/
global.require = require;

global.import = (m) => {
  return require("./" + m);
};

const __pkg = require("./package.json");
global.package = __pkg;
global.logger = logger;
// For future ts files.
//require('ts-node').register();
import { loadCommand } from "./handlers/loaders/loadCommand.js";
import { loadPlugins } from "./handlers/loaders/loadPlugins.js";
import { middleware } from "./handlers/middleware/middleware.js";
let commands = {};
const allPlugins = {};

import extend from "./extends.js";
extend();
import {
  removeCommandAliases,
  UNIRedux,
  UNISpectra,
} from "./CommandFiles/modules/unisym.js";

/**
 * @global
 */
global.Cassidy = {
  get config() {
    return new Proxy(
      {},
      {
        get(_, prop) {
          const data = loadSettings();
          return data[prop];
        },
        set(_, prop, value) {
          const data = loadSettings();
          data[prop] = value;
          saveSettings(data);
          return true;
        },
      }
    );
  },
  set config(data) {
    saveSettings(data);
  },
  get uptime() {
    return Date.now() - upt;
  },
  plugins: allPlugins,
  get commands() {
    return commands;
  },
  set commands(data) {
    commands = data;
  },
  // invLimit: 36,
  invLimit: 36,
  highRoll: 10_000_000,
  presets: new Map(),
  loadCommand,
  loadPlugins,
  loadAllCommands,
  reduxlogo: `🌌 𝗖𝗮𝘀𝘀𝗶𝗱𝘆ℝ𝕖𝕕𝕦𝕩 ✦`,
  logo: fontTag(UNISpectra.spectra),
  oldLogo: `🔬 𝗖𝗮𝘀𝘀𝗶𝗱𝘆 𝖠𝗌𝗌𝗂𝗌𝗍𝖺𝗇𝖼𝖾`,
  accessToken: null,
  redux: true,
};
const login = require(global.Cassidy.config.FCA.path);

global.allPlugins = allPlugins;
global.commands = commands;
global.clearObj = clearObj;

function clearObj(obj) {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      delete obj[key];
    }
  }
}
const { betterLog } = global.utils;

function logger(text, title = "log", valueOnly = false, log = console.log) {
  const now = new Date();
  const options = { timeZone: "Asia/Manila", hour12: false };
  const time = now.toLocaleTimeString("en-PH", options);
  const message = `${time} [ ${title.toUpperCase()} ] - ${text}`.toFonted(
    "auto"
  );
  if (valueOnly) {
    return message;
  }
  const replaceLog = log(message) || log;
  return function (text, title = "log") {
    return logger(text, title, false, replaceLog);
  };
}

function loginHandler(obj) {
  return new Promise(async (resolve, reject) => {
    try {
      login(obj, (err, api) => {
        if (err) {
          reject(err);
          return;
        } else if (api) {
          resolve(api);
        }
      });
    } catch (err) {
      reject(err);
    }
  });
}
async function loginHelper(obj) {
  try {
    const result = await loginHandler({ appState: obj.appState });
    return result;
  } catch (err) {
    global.logger(err, "FCA");
    global.logger(`Trying credentials instead of cookie...`, "FCA");
    try {
      const result = await loginHandler({
        email: obj.email,
        password: obj.password,
      });
      return result;
    } catch (error) {
      global.logger(error, "FCA");
      global.logger(`Even credentials didn't worked, RIP`, "FCA");
      return null;
    }
  }
}
function loadSettings() {
  try {
    const data = fs.readFileSync("settings.json", "utf8");
    return JSON.parse(data);
  } catch (error) {
    return null;
  }
}
function saveSettings(data) {
  try {
    fs.writeFileSync("settings.json", JSON.stringify(data, null, 2));
    return loadSettings();
  } catch (error) {
    return null;
  }
}

function loadCookie() {
  try {
    try {
      return JSON.parse(process.env.APPSTATE ?? process.env.COOKIE);
    } catch {
      // do nothing lol
    }
    const file = fs.readFileSync("cookie.json", "utf8");
    return JSON.parse(file);
  } catch ({ message, stack }) {
    return null;
  }
}
async function loadAllCommands(callback = async () => {}) {
  commands = {};
  global.Cassidy.commands = {};
  let errs = {};
  const fileNames = (await fs.promises.readdir("CommandFiles/commands")).filter(
    (file) => file.endsWith(".js") || file.endsWith(".ts")
  );

  Object.keys(require.cache).forEach((i) => {
    delete require.cache[i];
  });
  // await registeredExtensions.downloadRemoteExtensions();

  const commandPromises = fileNames.map(async (fileName) => {
    try {
      const e = await loadCommand(fileName, commands);
      await callback(e, fileName);
      checkMemoryUsage(true);
      if (e) {
        errs["command:" + fileName] = e;
      }
    } catch (error) {
      errs["command:" + fileName] = error;
    }
  });

  await Promise.allSettled(commandPromises);

  return Object.keys(errs).length === 0 ? false : errs;
}

async function loadAllCommandsOld(callback = async () => {}) {
  //clearObj(commands);
  commands = {};
  global.Cassidy.commands = {};
  let errs = {};
  const fileNames = fs
    .readdirSync("CommandFiles/commands")
    .filter((file) => file.endsWith(".js") || file.endsWith(".ts"));
  Object.keys(require.cache).forEach((i) => {
    delete require.cache[i];
  });
  for (const fileName of fileNames) {
    const e = await loadCommand(fileName, commands);
    await callback(e, fileName);
    checkMemoryUsage(true);
    if (e) {
      errs["command:" + fileName] = e;
    }
  }
  return Object.keys(errs).length === 0 ? false : errs;
}

function delay(ms = 1000) {
  return new Promise((res) => setTimeout(res, ms));
}

let willAccept = false;
async function main() {
  const interval = 60 * 1000;

  /*cleanRequireCache();

  setInterval(cleanRequireCache, interval);*/
  logger(`Cassidy ${__pkg.version}`, "Info");
  logger(
    `The CassidySpectra is currently in development and is also unstable. Some features might not work as expected.`,
    "WARN"
  );
  const loadLog = logger("Loading settings...", "Info");
  const settings = new Proxy(
    {},
    {
      get(target, prop) {
        return loadSettings()[prop];
      },
    }
  );
  if (!settings) {
    loadLog(
      "No settings found, please check if the settings are properly configured.",
      "Info"
    );
    // process.exit(1);
  }
  loadLog("Loading cookie...", "Cookie");
  const cookie = loadCookie();
  if (!cookie) {
    loadLog("No cookie found.", "Cookie");
    loadLog("Please check if cookie.json exists or a valid json.", "Cookie");
    // process.exit(1);
  }
  loadLog("Found cookie.", "Cookie");
  logger("Logging in...", "FCA");
  let api;
  try {
    let { email = "", password = "" } = settings.credentials || {};
    const { email_asEnvKey, password_asEnvKey } = settings.credentials || {};
    if (email_asEnvKey) {
      email = process.env[email];
    }
    if (password_asEnvKey) {
      password = process.env[password];
    }
    if (
      !(process.env["test"] || settings.noFB) &&
      (cookie || (email && password))
    ) {
      api = await loginHelper({ appState: cookie, email, password });
      delete settings.FCA.path;
      api.setOptions(settings.FCA);
      logger("Logged in successfully.", "FCA");
    } else {
      logger(
        "Skipping facebook login, no cookie or valid credentials found or FB Login was disabled.",
        "FCA"
      );
    }
  } catch (error) {
    logger("Error logging in.", "FCA");
  }
  logger(`Refreshing cookie...`);
  try {
    if (api) {
      const newApp = api.getAppState();
      fs.writeFileSync("cookie.json", JSON.stringify(newApp, null, 2));
      let done = [];
      for (const name in commands) {
        const { meta, onLogin } = commands[name];
        if (done.includes(meta.name)) {
          continue;
        }
        done.push(meta.name);
        if (typeof onLogin === "function") {
          try {
            await onLogin({ api });
          } catch (err) {
            console.log(err);
          }
        }
      }
    }
  } catch (err) {
    console.log(err);
  }
  let awaitedMiddleware;
  const funcListen = async (err, event, extra = {}) => {
    if (!willAccept || !awaitedMiddleware) {
      return;
    }
    if (err || !event) {
      logger(err, "FCA");
      return;
    }

    try {
      awaitedMiddleware({
        api,
        event,
        commands,
        prefix: settings.PREFIX,
        ...(extra.pageApi ? { pageApi: extra.pageApi } : {}),
        ...(extra.discordApi ? { discordApi: extra.discordApi } : {}),
        ...(extra.tphApi
          ? {
              tphApi: extra.tphApi,
            }
          : {}),
        ...(extra.wssApi
          ? {
              wssApi: extra.wssApi,
            }
          : {}),
      });
    } catch (error) {
      logger(error.stack, "FCA");
    }
  };
  web(api, funcListen, settings);
  loadLog("Loading plugins");
  const pPro = loadPlugins(allPlugins);

  await pPro;
  awaitedMiddleware = await middleware({ allPlugins });

  logger("Loading commands");
  const cPro = loadAllCommands();
  await cPro;

  // await Promise.allSettled([pPro, cPro]);

  willAccept = true;
  logger("Listener Started!", "LISTEN");
  setupCommands();
}
import request from "request";

async function setupCommands() {
  const pageAccessToken = global.Cassidy.config.pageAccessToken;
  if (!pageAccessToken) return;

  const commandsData = {
    commands: [
      {
        locale: "default",
        commands: Array.from(
          Object.values(removeCommandAliases(global.Cassidy.commands))
        ).map((command) => ({
          name: String(command.meta.name).slice(0, 32),
          description:
            `${command.meta.description} (by ${command.meta.author})`.slice(
              0,
              64
            ),
        })),
      },
    ],
  };
  console.log(JSON.stringify(commandsData, null, 2));

  return new Promise((resolve, reject) => {
    request(
      {
        uri: `https://graph.facebook.com/v21.0/me/messenger_profile`,
        qs: { access_token: pageAccessToken },
        method: "POST",
        json: commandsData,
      },
      (error, response, body) => {
        if (!error && response.statusCode === 200) {
          console.log("Commands set successfully:", body);
          resolve(body);
        } else {
          console.error("Error setting commands:", error || body.error);
          reject(error || body.error);
        }
      }
    );
  });
}
import {
  Listener,
  genericPage,
  pageParse,
  postEvent,
  aiPage,
  formatIP,
  takeScreenshot,
} from "./webSystem.js";
//import * as handleStat from "./handlers/database/handleStat.js";
import express from "express";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { postState } from "./handlers/appstate/handleGetState.js";
import requestIp from "request-ip";
import bodyParser from "body-parser";
import fetchMeta from "./CommandFiles/modules/fetchMeta.js";

const limit = {
  windowMs: 60 * 1000,
  max: 100,
  keyGenerator(/* req, res */) {
    return "fake502";
  },
  handler(_, res /*, next*/) {
    res.status(502).send(fs.readFileSync("public/502.html", "utf8"));
  },
};

const fake502 = rateLimit(limit);
function web(api, funcListen, settings) {
  let passKey = `${Math.random().toString(36).substring(2, 15)}`;
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "200mb" }));

  const listener = new Listener({ api, app });
  listener.startListen(funcListen);
  //app.use(fake502);
  app.use(bodyParser.json());
  app.use(cookieParser());
  app.use((req, _, next) => {
    req.trueIP = requestIp.getClientIp(req);
    next();
  });
  app.get("/", fake502, (req, res) => {
    const page = genericPage({
      title: "Cassidy Homepage",
      content: "fs:public/home.html",
    });
    res.send(page);
  });
  app.post("/postcred", postState);
  app.use(express.static("public"));
  app.get("/api/usercache", async (req, res) => {
    const { uid, format = "yes" } = req.query;
    const cache = await global.handleStat.getCache(
      format === "yes" ? formatIP(uid) : uid
    );

    const userMeta = await fetchMeta(uid);

    res.json({ ...cache, userMeta });
  });
  app.get("/api/stat", async (req, res) => {
    const { UTYPlayer } = global.utils;
    const data = await global.handleStat.getAll();
    for (const key in data) {
      const value = data[key];
      data[key] = new UTYPlayer({ ...data[key], gold: value.money });
    }
    res.json(data);
  });
  app.get("/api/underpic", async (req, res) => {
    try {
      const imageData = await takeScreenshot(
        req.query?.id,
        req.hostname,
        req.query?.facebook
      );
      res.set("Content-Type", "image/png");
      res.send(imageData);
    } catch (error) {
      res.set("Content-Type", "image/png");

      res.send(error.response.data);
    }
  });
  app.get("/api/commands", (req, res) => res.json(commands));

  const authWare = async (req, res, next) => {
    const { WEB_PASSWORD } = settings;
    const { specilKey } = req.cookies;
    if (specilKey !== passKey) {
      return res.redirect("/f:password");
    } else {
      return next();
    }
  };
  app.get("/api/files", (req, res) => {
    const { ADMINBOT } = global.Cassidy.config;
    if (!ADMINBOT.includes(formatIP(req.trueIP))) {
      return res.json({
        files: [
          {
            name: "Nice Try :)",
            size: "HaHa",
            mtime: "69",
          },
        ],
      });
    }
    if (req.query.fileName) {
      const fileData = fs.readFileSync(
        `CommandFiles/commands/${req.query.fileName}`,
        "utf8"
      );
      const stat = fs.statSync(`CommandFiles/commands/${req.query.fileName}`);
      return res.json({
        file: {
          content: fileData,
          size: global.utils.formatBits(stat.size),
          mtime: stat.mtime,
        },
      });
    }
    let result = [];
    const files = fs.readdirSync("CommandFiles/commands");
    for (const file of files) {
      const stat = fs.statSync(`CommandFiles/commands/${file}`);
      if (!stat.isFile()) {
        continue;
      }
      result.push({
        mtime: stat.mtime,
        size: global.utils.formatBits(stat.size),
        name: file,
      });
    }
    return res.json({ files: result });
  });
  app.get("/ai-site", async (req, res) => {
    return res.send(await aiPage(JSON.stringify(req.query)));
  });
  app.use(async (req, res, next) => {
    const { originalUrl: x = "" } = req;
    const originalUrl = x.split("?")[0];
    if (originalUrl.startsWith("/f:")) {
      const url = originalUrl.replace("/f:", "");
      const page = genericPage({
        title: "Cassidy BoT Page",
        content: fs.existsSync(`public/${url}.html`)
          ? `fs:public/${url}.html`
          : `${await aiPage(fs.readFileSync("public/404.html", "utf8"))}`,
      });
      return res.send(page);
    } else {
      return next();
    }
  });
  /*app.get("/auth", (req, res) => {
    const page = genericPage({
      title: "Login",
      content: "fs:public/password.html"
    });
    res.send(page);
  });*/
  app.post("/chat", async (req, res) => {
    const { body } = req;
    const { method = "sendMessage", args = [] } = body;
    try {
      const result = await api[method](...args);
      res.json({ status: "success", result: result || {} });
    } catch (err) {
      res.json({ status: "error", message: err.message });
    }
  });
  app.get("/poll", async (req, res) => {
    const key = formatIP(req.trueIP);
    const info = await new Promise(async (resolve, reject) => {
      global.webQuery[key] = {
        resolve,
        reject,
      };
      await listener._call(null, {
        ...req.query,
        senderID: formatIP(req.trueIP),
        webQ: key,
        xQ: true,
      });
    });
    res.json(info);
  });
  app.get("/postWReply", async (req, res) => {
    const key = `${Date.now()}`;
    if (!willAccept) {
      const { prefixes = [], body = "" } = req.query || {};
      const idk = [...prefixes, global.Cassidy.config.PREFIX];
      if (!idk.some((i) => body.startsWith(i))) {
        return res.json({
          status: "fail",
        });
      }
      const total = fs
        .readdirSync("CommandFiles/commands")
        .filter((i) => i.endsWith(".js") || i.endsWith(".ts")).length;
      const data = [
        ...new Set(Object.values(commands).map((i) => i?.meta?.name)),
      ];
      const loaded = data.length;
      res.json({
        result: {
          body: `📥 ${
            global.Cassidy.logo
          } is currently loading ${loaded}/${total} (${Math.floor(
            (loaded / total) * 100
          )}%) commands.`,
        },
        status: "success",
      });
      return;
    }
    const info = await new Promise(async (resolve, reject) => {
      global.webQuery[key] = {
        resolve,
        reject,
      };
      if (!req.query.senderID) {
        return resolve({
          result: {
            body: "❌ Please Enter your senderID on query. it allows any idenfitiers, please open your code.",
          },
          status: "success",
        });
      }
      await listener._call(
        null,
        {
          ...req.query,
          senderID: "custom_" + req.query.senderID,
          webQ: key,
        },
        true
      );
    });
    res.json(info);
  });
  app.post("/postNew", async (req, res) => {
    const key = `${Date.now()}`;
    if (!willAccept) {
      const { prefixes = [], body = "" } = req.body || {};
      const idk = [...prefixes, global.Cassidy.config.PREFIX];
      if (!idk.some((i) => body.startsWith(i))) {
        return res.json({
          status: "fail",
        });
      }
      const total = fs
        .readdirSync("CommandFiles/commands")
        .filter((i) => i.endsWith(".js") || i.endsWith(".ts")).length;
      const data = [
        ...new Set(Object.values(commands).map((i) => i?.meta?.name)),
      ];
      const loaded = data.length;
      res.json({
        result: {
          body: `📥 ${
            global.Cassidy.logo
          } is currently loading ${loaded}/${total} (${Math.floor(
            (loaded / total) * 100
          )}%) commands.`,
        },
        status: "success",
      });
      return;
    }
    const info = await new Promise(async (resolve, reject) => {
      global.webQuery[key] = {
        resolve,
        reject,
      };
      if (!req.body.senderID) {
        return resolve({
          result: {
            body: "❌ Please Enter your senderID on query. it allows any idenfitiers, please open your code.",
          },
          status: "success",
        });
      }
      await listener._call(
        null,
        {
          ...req.body,
          senderID: "custom_" + req.body.senderID,
          webQ: key,
        },
        true
      );
    });
    res.json(info);
  });
  app.get("/postEvent", async (req, res) => {
    await listener._call(
      null,
      {
        ...req.query,
        senderID: req.trueIP,
      },
      true
    );
    res.json({ okay: true, req: req.query });
  });
  app.use(fake502);
  app.use((req, res, next) => {
    const page = genericPage({
      title: "Cassidy BoT Page",
      content: "fs:public/404.html",
    });
    res.send(page);
  });
  listener.httpServer.listen(8000, () => {
    logger(`Listening to both Web and Mqtt`, "Listen");
  });
}
main();
async function cleanRequireCache() {
  const keys = Object.keys(require.cache);

  for (const key of keys) {
    delete require.cache[key];
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log("Require cache cleaned at: " + new Date());
}
