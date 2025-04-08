// @ts-check
export const meta = {
  name: "utils-liane",
  author: "Liane Cagara",
  version: "1.0.0",
  description:
    "Helpful but optional utilities that isn't used by default, DO NOT OWN THESE",
  supported: "^1.0.0",
  order: 1,
  type: "plugin",
  expect: [
    "TagParser",
    "Slicer",
    "ArgsHelper",
    "CommandProperty",
    "Attachment",
    "MessageEditor",
    "MsgEditor",
    "Editor",
    "ItemPrompt",
    "GameSimulator",
    "isTimeAvailable",
    "BulkUpdater",
    "ItemLister",
  ],
};
import axios from "axios";
import fs from "fs";
import { ReduxCMDHome } from "@cassidy/redux-home";
import { stoData } from "../modules/stoData.js";
import { CassEXP } from "../modules/cassEXP.js";
import { clamp, UNIRedux } from "@cassidy/unispectra";
import { SpectralCMDHome } from "../modules/spectralCMDHome";
const moment = require("moment-timezone");

/**
 * Checks if the current time falls within a specified range.
 *
 * @param {number} msStart - The start time in milliseconds from midnight.
 * @param {number} msEnd - The end time in milliseconds from midnight.
 * @param {string} [timeZone='Asia/Manila'] - The timezone to use (default is Philippines timezone).
 * @returns {boolean} - Returns true if the current time is within the range, otherwise false.
 */
export function isTimeAvailable(msStart, msEnd, timeZone = "Asia/Manila") {
  const now = moment.tz(timeZone);

  const msCurrent =
    now.hours() * 60 * 60 * 1000 +
    now.minutes() * 60 * 1000 +
    now.seconds() * 1000 +
    now.milliseconds();

  return msCurrent >= msStart && msCurrent <= msEnd;
}

export class ItemLister {
  constructor(inventory) {
    this.inventory = inventory;
  }
  minified(hasKey) {
    return this.raw()
      .map(
        (item) => `${item.icon} ${item.name} ${hasKey ? `(${item.key})` : ""}`
      )
      .join("\n");
  }
  formal(hasKey) {
    return this.raw()
      .map(
        (item) =>
          `${item.icon} **${item.name}** ${hasKey ? `(${item.key})` : ""}`
      )
      .join("\n");
  }
  shopStyle(hasKey, hasPrice, priceKey) {
    return this.raw()
      .map((item) => {
        let isOkay = false;
        const price = item[priceKey] ?? item.price;
        if (!isNaN(price) && price > 0) {
          isOkay = true;
        }
        return `${item.icon} **${item.name}**${
          hasPrice ? ` - ${isOkay ? `$**${item.price}**` : "🚫"}` : ""
        }\n✦ ${item.flavorText}`;
      })
      .join("\n\n");
  }
  raw() {
    return Array.from(this.inventory);
  }
}

class BulkUpdater {
  constructor(allUsers, { Inventory, GearsManage } = {}) {
    this.allUsers = this.serialClone(allUsers);
    this.Inventory = Inventory;
    this.GearsManage = GearsManage;

    if (!Inventory || !GearsManage) {
      throw new Error("Classes missing.");
    }
  }

  async eachUsers(callback) {
    const users = this.raw();
    for (const userID in users) {
      await callback(userID, users[userID]);
    }
  }

  async mapUsers(callback) {
    const result = {};
    const users = this.raw();
    for (const userID in users) {
      result[userID] = await callback(userID, users[userID]);
    }
    return this.newBulk(result);
  }

  async filterUsers(callback) {
    const result = {};
    const users = this.raw();
    for (const userID in users) {
      if (await callback(userID, users[userID])) {
        result[userID] = users[userID];
      }
    }
    return this.newBulk(result);
  }

  async eachInventory(callback) {
    const result = {};
    const users = this.raw();
    for (const userID in users) {
      const value = this.serialClone(users[userID]);
      const inver = new this.Inventory(value.inventory ?? []);
      const boxer = new this.Inventory(value.boxItems ?? [], 100);
      const trades = new this.Inventory(value.tradeVentory ?? []);
      await callback(userID, inver, boxer, trades);
      value.boxItems = Array.from(boxer);
      value.inventory = Array.from(inver);
      value.tradeVentory = Array.from(trades);
      result[userID] = value;
    }
    return this.newBulk(result);
  }

  async editAllItems(itemKey, replaceData) {
    replaceData = this.serialClone(replaceData);

    const bulk = await this.eachInventory(
      async (userID, inventory, boxInventory, tradeVentory) => {
        const items = inventory.get(itemKey);
        for (const item of items) {
          Object.assign(item, replaceData);
        }
        inventory.deleteRefs(items);
        inventory.add(items);

        const boxItems = boxInventory.get(itemKey);
        for (const item of boxItems) {
          Object.assign(item, replaceData);
        }
        boxInventory.deleteRefs(boxItems);
        boxInventory.add(boxItems);

        const tradeItems = tradeVentory.get(itemKey);
        for (const item of tradeItems) {
          Object.assign(item, replaceData);
        }
        tradeVentory.deleteRefs(tradeItems);
        tradeVentory.add(tradeItems);
      }
    );

    const bulk2 = await bulk.mapUsers(async (userID, value) => {
      value = this.serialClone(value);
      const gearsManage = new this.GearsManage(value.gearsData ?? []);
      for (const { key } of gearsManage) {
        const gearData = gearsManage.getGearData(key);
        for (const weapon of gearData.weaponArray) {
          if (weapon?.key !== itemKey) {
            continue;
          }
          Object.assign(weapon, replaceData);
        }
        for (const armor of gearData.armorsArray) {
          if (armor?.key !== itemKey) {
            continue;
          }
          Object.assign(armor, replaceData);
        }
      }
      value.gearsData = Array.from(gearsManage);
      return value;
    });

    return bulk2;
  }

  async set(userID, data) {
    const existing = this.raw()[userID] ?? {};
    this.raw()[userID] = this.serialClone({ ...existing, ...data });
    return this.raw()[userID];
  }

  async replace(userID, data) {
    this.raw()[userID] = this.serialClone(data);
  }

  async getCopy(userID) {
    return this.serialClone(await this.get(userID));
  }

  async get(userID) {
    return this.raw()[userID] ?? {};
  }

  async clone() {
    return this.newBulk(this.serialClone(this.raw()));
  }

  newBulk(data) {
    return new BulkUpdater(data, {
      Inventory: this.Inventory,
      GearsManage: this.GearsManage,
    });
  }

  raw() {
    return this.allUsers;
  }

  toJSON() {
    return this.raw();
  }

  toUsersArray() {
    const users = [];
    const rawUsers = this.raw();
    for (const userID in rawUsers) {
      const value = rawUsers[userID];
      users.push({
        ...value,
        userID,
      });
    }
    return users;
  }

  serialClone(data) {
    return JSON.parse(JSON.stringify(data));
  }

  static fromUsersArray(usersArray) {
    const userMap = {};
    for (const user of usersArray) {
      const { userID, ...value } = user;
      userMap[userID] = value;
    }
    return new BulkUpdater(userMap);
  }
}
export class Slicer {
  constructor(array = [], limit = 10) {
    this.array = Array.from(array);
    this.limit = limit;
  }
  getPage(page) {
    return Slicer.byPageArray(this.array, page, this.limit);
  }
  get pagesLength() {
    return Math.floor(this.array.length / (this.limit || 10));
  }
  static parseNum(page) {
    page = parseInt(page);
    if (isNaN(page)) {
      page = 1;
    }
    return page;
  }

  static byPage(page, limit) {
    page = parseInt(page);
    if (isNaN(page)) {
      page = 1;
    }
    limit = parseInt(limit);
    if (isNaN(limit)) {
      limit = 10;
    }
    const sliceA = (page - 1) * limit;
    const sliceB = page * limit;
    return [sliceA, sliceB];
  }
  static byPageArray(array, page, limit) {
    return array.slice(...this.byPage(page, limit));
  }
}
class CommandProperty {
  constructor(commandName) {
    this.commandName = commandName;

    let [rootCommand, ...nestedProperties] = this.commandName
      .split(".")
      .map((part) => part.trim())
      .filter(Boolean);

    let commandProperty = {};

    nestedProperties.reduce((obj, prop, index) => {
      if (nestedProperties[index + 1]) {
        obj[prop] = {};
        return obj[prop];
      } else {
        obj[prop] = true;
        return obj;
      }
    }, commandProperty);

    this[rootCommand] = commandProperty;
  }

  static reverse(obj) {
    if (!obj || typeof obj !== "object") {
      return "";
    }

    const keys = Object.keys(obj);
    if (keys.length === 0) {
      return "";
    }

    const firstKey = keys[0];
    const value = obj[firstKey];

    if (typeof value === "object") {
      return firstKey + "." + CommandProperty.reverse(value);
    } else {
      return firstKey;
    }
  }
}

class ArgsHelper extends Array {
  constructor({ body, isCommand } = {}) {
    let array = String(body).split(" ").filter(Boolean);
    let commandName = null;
    if (!!isCommand) {
      commandName = array.shift();
    }
    super(...array);
    this.isCommand = () => !!isCommand;
    this.commandName = () => commandName;
  }
  get commandProperties() {
    return new CommandProperty(this.commandName());
  }
  get properties() {
    const self = this;
    return new Proxy(
      {},
      {
        get(_, prop) {
          return new CommandProperty(self[prop] || "");
        },
        set(_, prop, value) {
          self[prop] =
            typeof value === "object"
              ? CommandProperty.reverse(value)
              : String(value);
          return true;
        },
      }
    );
  }
  set properties(values) {
    if (!Array.isArray(values)) {
      return true;
    }
    for (const index in values) {
      this[index] =
        typeof value === "object"
          ? CommandProperty.reverse(value)
          : String(value);
    }
  }
  on(degree, value, callback) {
    const needed = String(this[degree] || "");
    if (
      typeof value === "string" &&
      needed.toLowerCase() === value.toLowerCase()
    ) {
      callback(needed, value);
    } else if (value instanceof RegExp && value.test(needed)) {
      callback(needed, value);
    }
  }
}
class TagParser {
  constructor(event) {
    this.event = event;
  }

  get args() {
    return new ArgsHelper(this.event);
  }

  static mainParser(str) {
    str = String(str);
    const [, str2] = str.split("[").map((i) => i.trim());
    if (!str2) {
      return null;
    }
    const [str3] = str2.split("]").map((i) => i.trim());
    if (!str3) {
      return null;
    }
    const tags = str3
      .split(",")
      .filter(Boolean)
      .map((tag) => tag.trim())
      .map((tagStr) => {
        const [tag = null, value = null] = tagStr
          .split("=")
          .map((i) => i.trim());
        return {
          tag,
          value,
        };
      })
      .filter((i) => i.tag);
    tags.toObject = () => {
      let result = {};
      for (const tag of tags) {
        result[tag.tag] = tag.value;
      }
      return result;
    };
    return tags;
  }

  getByTag(tagName, index = 0) {
    if (index >= this.args.length) {
      throw new Error("Index out of range.");
    }
    const tags = TagParser.mainParser(this.args[index]);
    return tags.filter((tag) => tag.tag === tagName);
  }

  getAllTagNames(index = 0) {
    if (index >= this.args.length) {
      throw new Error("Index out of range.");
    }
    const tags = TagParser.mainParser(this.args[index]);
    const tagNames = tags.map((tag) => tag.tag);
    return [...new Set(tagNames)];
  }

  getValuesByTag(tagName, index = 0) {
    if (index >= this.args.length) {
      throw new Error("Index out of range.");
    }
    const tags = TagParser.mainParser(this.args[index]);
    return tags.filter((tag) => tag.tag === tagName).map((tag) => tag.value);
  }

  formatTags(index = 0) {
    if (index >= this.args.length) {
      throw new Error("Index out of range.");
    }
    const tags = TagParser.mainParser(this.args[index]);
    return tags.map((tag) => `${tag.tag}=${tag.value}`).join(", ");
  }

  get(index = 0) {
    return TagParser.mainParser(this.args[index]);
  }

  addTags(newTags, index = 0) {
    if (index >= this.args.length) {
      throw new Error("Index out of range.");
    }
    const existingTags = TagParser.mainParser(this.args[index]);
    const updatedTags = [...existingTags, ...newTags];
    this.args[index] = `[${updatedTags
      .map((tag) => `${tag.tag}=${tag.value}`)
      .join(", ")}]`;
  }

  removeTagsByName(tagNames, index = 0) {
    if (index >= this.args.length) {
      throw new Error("Index out of range.");
    }
    const existingTags = TagParser.mainParser(this.args[index]);
    const updatedTags = existingTags.filter(
      (tag) => !tagNames.includes(tag.tag)
    );
    this.args[index] = `[${updatedTags
      .map((tag) => `${tag.tag}=${tag.value}`)
      .join(", ")}]`;
  }

  updateTagValue(tagName, newValue, index = 0) {
    if (index >= this.args.length) {
      throw new Error("Index out of range.");
    }
    const existingTags = TagParser.mainParser(this.args[index]);
    const updatedTags = existingTags.map((tag) =>
      tag.tag === tagName ? { ...tag, value: newValue } : tag
    );
    this.args[index] = `[${updatedTags
      .map((tag) => `${tag.tag}=${tag.value}`)
      .join(", ")}]`;
  }
}

export async function use(obj) {
  obj.TagParser = TagParser;
  obj.Slicer = Slicer;
  class MessageEditor {
    constructor(event, api) {
      this.api = api || obj.api;
      this.currentID = null;
      this.edits = 0;
      this.event = event || obj.event;
    }
    async apply(content, delay, isReply) {
      delay = Number(delay || 0);
      content = String(content);
      if (!this.currentID) {
        this.currentID = await new Promise(
          (resolve) => {
            this.api.sendMessage(content, this.event.threadID, (_, info) => {
              resolve(info.messageID);
            });
          },
          isReply ? this.event.messageID : undefined
        );
        return this;
      }
      if (this.edits > 5) {
        return this;
      }
      const self = this;
      await new Promise((resolve) => {
        setTimeout(() => {
          self.api.editMessage(content, self.currentID, () => {
            resolve();
          });
        }, delay);
      });
      return this;
    }
  }

  class Attachment {
    constructor(url, { devLog = false, strictMode = true } = {}) {
      this.url = url;
      this.api = obj.api;
      this.devLog = devLog;
      this.strictMode = strictMode;
      this.stream = null;
      this.event = obj.event;
    }

    async loadUrl(method = "GET", extra = {}) {
      try {
        const response = await axios({
          method: method,
          url: this.url,
          ...extra,
          responseType: "stream",
        });
        this.stream = response.data;
        return this.stream;
      } catch (error) {
        if (this.strictMode) {
          throw error;
        }
        if (this.devLog) {
          console.error(error);
        }
      }
    }
    async send(optionalCaption, optionalThreadID) {
      if (!this.isLoaded()) {
        return api.sendMessage(
          "[Attachment] Image not yet loaded.",
          optionalThreadID || this.event.threadID
        );
      }
      try {
        const payload = {
          attachment: await this.load(),
        };
        if (optionalCaption) {
          payload.body = String(optionalCaption);
        }
        await api.sendMessage(payload, optionalThreadID || this.event.threadID);
        return payload;
      } catch (error) {
        await api.sendMessage(
          `[Attachment] Failed sending attachment.\n${
            error instanceof Error
              ? error.toString()
              : JSON.stringify(error, null, 2)
          }`
        );
        return null;
      }
    }

    async loadFile() {
      try {
        this.stream = await fs.promises.createReadStream(this.url);
        return this.stream;
      } catch (error) {
        if (this.strictMode) {
          throw error;
        }
        if (this.devLog) {
          console.error(error);
        }
      }
    }
    load() {
      if (this.url.startsWith("http")) {
        return this.loadUrl();
      } else {
        return this.loadFile();
      }
    }
    isLoaded() {
      return !!this.stream;
    }

    setDevLog(enabled) {
      this.devLog = enabled;
    }

    setStrictMode(enabled) {
      this.strictMode = enabled;
    }

    isDevLogEnabled() {
      return this.devLog;
    }

    isStrictModeEnabled() {
      return this.strictMode;
    }
  }
  obj.ArgsHelper = ArgsHelper;
  obj.CommandProperty = CommandProperty;
  obj.Attachment = Attachment;
  obj.MessageEditor = MessageEditor;
  obj.MsgEditor = MessageEditor;
  obj.Editor = MessageEditor;

  class GameSimulatorRedux {
    static instances = {};
    constructor({
      key,
      verb = key.charAt(0).toUpperCase() + key.slice(1),
      verbing = verb + "ing",
      pastTense = verb + "ed",
      checkIcon = "✓",
      initialStorage = 30,
      itemData = [],
      actionEmoji = "🔖",
      stoData,
    }) {
      GameSimulatorRedux.instances[key] = this;
      this.key = key;
      this.verb = verb;
      this.verbing = verbing;
      this.pastTense = pastTense;
      this.checkIcon = checkIcon;
      this.actionEmoji = actionEmoji;
      this.storage = initialStorage;
      this.stoData = stoData;
      this.itemData = itemData.map((i) => {
        return {
          ...i,
          priceA: i.priceA * 10,
          priceB: i.priceB * 10,
        };
      });
    }

    /**
     * @type {CommandEntry}
     */
    async simulateAction(context = obj) {
      try {
        const {
          input,
          output,
          money,
          args,
          prefix,
          CassExpress,
          Inventory,
          commandName,
        } = context;
        const self = this;
        const home = new SpectralCMDHome(
          { isHypen: true, globalCooldown: 1, defaultKey: "help" },
          [
            {
              key: "total",
              description:
                "Displays the total number of items earned, along with detailed information such as rarity, processing time, price range, and rankings based on the most frequently earned item types.",
              aliases: ["-t"],
              icon: "📦",

              async handler() {
                const { [self.key + "Total"]: totalItems = {}, name } =
                  await money.get(input.senderID);
                if (!name) {
                  return output.reply(
                    "❌ Please register first using the identity-setname command."
                  );
                }

                let result = `📝 **Total ${self.verb}s Items**:\n\n`;
                const sortedItems = Object.entries(totalItems).sort(
                  (a, b) => b[1] - a[1]
                );
                sortedItems.forEach(([itemName, itemCount]) => {
                  const data = self.itemData.find(
                    (item) => item.name === itemName
                  );
                  result += `${self.checkIcon} ${
                    data.icon
                  } **${itemName}**\nSold Amount: ${itemCount}\nRarity: ${
                    100 - data.chance * 100
                  }%\nProcessing Time: ${
                    data.delay
                  } minutes.\nPrice Range:\nBetween ${data.priceA} and ${
                    data.priceB
                  }.\n\n`;
                });
                const totalHarvest = Object.values(totalItems).reduce(
                  (acc, count) => acc + count,
                  0
                );
                result += `\n**Total**: ${totalHarvest}`;
                return output.reply(result);
              },
            },
            {
              key: "check",
              description:
                "Checks the progress of your tuned items and their remaining collection time.",
              icon: "✅",
              async handler() {
                const {
                  money: userMoney,
                  [self.key + "Stamp"]: actionStamp,
                  [self.key + "MaxZ"]: actionMax = self.storage,
                  [self.key + "Total"]: totalItems = {},
                  [self.key + "Tune"]: actionTune = [],
                  cassEXP: cxp,
                  name,
                } = await money.get(input.senderID);

                function formatDuration(ms) {
                  const seconds = Math.floor(ms / 1000) % 60;
                  const minutes = Math.floor(ms / (1000 * 60)) % 60;
                  const hours = Math.floor(ms / (1000 * 60 * 60)) % 24;
                  const days = Math.floor(ms / (1000 * 60 * 60 * 24));

                  const parts = [];
                  if (days > 0) parts.push(`${days} day${days > 1 ? "s" : ""}`);
                  if (hours > 0)
                    parts.push(`${hours} hour${hours > 1 ? "s" : ""}`);
                  if (minutes > 0)
                    parts.push(`${minutes} minute${minutes > 1 ? "s" : ""}`);
                  if (seconds > 0)
                    parts.push(`${seconds} second${seconds > 1 ? "s" : ""}`);

                  return parts.length > 1
                    ? parts.slice(0, -1).join(", ") + " and " + parts.slice(-1)
                    : parts[0] || "0 seconds";
                }

                const mapped = actionTune.map((itemName, ind) => {
                  const data = self.itemData.find(
                    (item) => item.name === itemName
                  );
                  return `**${ind + 1}**. ${
                    data.icon
                  } **${itemName}**\nRarity: ${
                    100 - data.chance * 100
                  }%\nProcessing Time: ${
                    data.delay
                  } minutes.\nPrice Range:\nBetween ${data.priceA} and ${
                    data.priceB
                  }.`;
                });

                const timeElapsed = actionStamp
                  ? formatDuration(Date.now() - actionStamp)
                  : "❌ Not yet tuned.";

                return output.reply(
                  `🗃️ **Max Storage**:\n${Number(
                    actionMax
                  ).toLocaleString()}\n\n⌛ **Time Since Tuning**:\n${timeElapsed}\n\n🚀 **Tuned Items:**\n\n${
                    mapped.length > 0
                      ? mapped.join("\n\n")
                      : "[ No Tuned Items ]"
                  }\n\nUse +${commandName}-collect to claim your yield or profit at the right time.\n⚠️ Collecting too early will **reduce your earnings** and **require retuning**, while collecting too late may cause **storage overflow**, leading to lost profits.`
                );
              },
            },
            {
              key: "tune",
              description:
                "Tune at least 3 items before collecting—your choices shape the outcome, but you can't repeat the same order!",
              aliases: ["-tu"],
              icon: "🚀",
              async handler() {
                const {
                  money: userMoney,
                  [self.key + "Stamp"]: actionStamp,
                  [self.key + "MaxZ"]: actionMax = self.storage,
                  [self.key + "Total"]: totalItems = {},
                  [self.key + "Tune"]: actionTune = [],
                  cassEXP: cxp,
                  name,
                } = await money.get(input.senderID);

                let sortedItems = Object.entries(totalItems).sort(
                  () => Math.random() - 0.5
                );
                self.itemData.forEach((i) => {
                  const total = Object.keys(totalItems).find(
                    (j) => j === i.name
                  );

                  if (!total) {
                    sortedItems.unshift([i.name, 0]);
                  }
                });
                sortedItems = sortedItems.slice(0, 5);

                const genR = () => Math.floor(Math.random() * 5) + 1;
                // const genR = () =>
                //   Math.floor(
                //     Math.random() * (Object.entries(totalItems).length - 1 + 1)
                //   ) + 1;

                let warn = actionStamp
                  ? `⚠️ **You have already tuned your items!**\n\nTuning again will **reset the timer** and you may **lose your opportunity to collect.**\n\n`
                  : "";

                let result = `${warn}🚀 Choose at least **3 items** to tune. Reply with the corresponding **numbers**.\n\n***Example***: ${genR()} ${genR()} ${genR()}\n\n`;

                sortedItems.forEach(([itemName, itemCount], ind) => {
                  const data = self.itemData.find(
                    (item) => item.name === itemName
                  );
                  result += `**${ind + 1}**. ${
                    data.icon
                  } **${itemName}**\nSold Amount: ${itemCount}\nRarity: ${
                    100 - data.chance * 100
                  }%\nProcessing Time: ${
                    data.delay
                  } minutes.\nPrice Range:\nBetween ${data.priceA} and ${
                    data.priceB
                  }.\n\n`;
                });

                const style = {
                  title: "🚀 Item Tuner",
                  titleFont: "bold",
                  contentFont: "fancy",
                };

                const inf = await output.replyStyled(result, style);

                input.setReply(inf.messageID, {
                  /**
                   *
                   * @param {CommandContext} ctx2
                   */
                  async callback(ctx2) {
                    if (ctx2.input.senderID !== input.senderID) {
                      return;
                    }
                    const nums = ctx2.input.words
                      .map((i) => parseInt(i))
                      .map((i) => sortedItems.at(i - 1))
                      .map((i) => i?.[0])
                      .slice(0, 3);

                    if (nums.length < 3) {
                      return ctx2.output.replyStyled(
                        `❌ You need to provide at least three numbers! You provided only ${nums.length}.`,
                        style
                      );
                    }
                    if (nums.length > 3) {
                      return ctx2.output.replyStyled(
                        `❌ You only need to provide three numbers! You provided too much.`,
                        style
                      );
                    }

                    const invalidNums = nums.filter(
                      (i) => i === null || i === undefined
                    );

                    if (invalidNums.length > 0) {
                      return ctx2.output.replyStyled(
                        `❌ Invalid input detected! The following values are missing: ${invalidNums.join(
                          ", "
                        )}.`,
                        style
                      );
                    }
                    const uniqueNums = new Set(nums);
                    if (uniqueNums.size !== nums.length) {
                      return ctx2.output.replyStyled(
                        `❌ Duplicate numbers are not allowed! Your input contains duplicates.`,
                        style
                      );
                    }

                    await money.set(ctx2.input.senderID, {
                      [self.key + "Tune"]: nums,
                      [self.key + "Stamp"]: Date.now(),
                    });

                    let r2 = "";

                    nums.forEach((itemName) => {
                      const ind = sortedItems.findIndex(
                        (i) => i[0] === itemName
                      );
                      const data = self.itemData.find(
                        (item) => item.name === itemName
                      );
                      r2 += `**${ind + 1}**. ${
                        data.icon
                      } **${itemName}**\nRarity: ${
                        100 - data.chance * 100
                      }%\nProcessing Time: ${
                        data.delay
                      } minutes.\nPrice Range:\nBetween ${data.priceA} and ${
                        data.priceB
                      }.\n\n`;
                    });

                    return ctx2.output.replyStyled(
                      `✅ Tuning successful!\nPlease wait patiently to **collect** your items.\n\nThe following **3 items** will be **prioritized**:\n\n${r2}\n\n⚠️ **Warning:** Tuning **resets the waiting time** for all items.\nAvoid tuning while having many items waiting, or you may lose the opportunity to collect them.`.trim(),
                      style
                    );
                  },
                });
              },
            },
            {
              key: "collect",
              description: "Collect items that have finished processing.",
              aliases: ["-c"],
              icon: "💵",
              async handler() {
                const currentTimestamp = Date.now();
                function formatDuration(ms) {
                  const seconds = Math.floor(ms / 1000) % 60;
                  const minutes = Math.floor(ms / (1000 * 60)) % 60;
                  const hours = Math.floor(ms / (1000 * 60 * 60)) % 24;
                  const days = Math.floor(ms / (1000 * 60 * 60 * 24));

                  const parts = [];
                  if (days > 0) parts.push(`${days} day${days > 1 ? "s" : ""}`);
                  if (hours > 0)
                    parts.push(`${hours} hour${hours > 1 ? "s" : ""}`);
                  if (minutes > 0)
                    parts.push(`${minutes} minute${minutes > 1 ? "s" : ""}`);
                  if (seconds > 0)
                    parts.push(`${seconds} second${seconds > 1 ? "s" : ""}`);

                  return parts.length > 1
                    ? parts.slice(0, -1).join(", ") + " and " + parts.slice(-1)
                    : parts[0] || "0 seconds";
                }

                const {
                  money: userMoney,
                  [self.key + "Stamp"]: actionStamp,
                  [self.key + "MaxZ"]: actionMax = self.storage,
                  [self.key + "Total"]: totalItems = {},
                  [self.key + "Tune"]: actionTune = [],
                  cassEXP: cxp,
                  name,
                } = await money.get(input.senderID);
                const cassEXP = new CassEXP(cxp);
                if (!name) {
                  return output.reply(
                    "❌ Please register first using the identity-setname command."
                  );
                }

                const randTune = () =>
                  self.itemData.map((i) => i.name)[
                    Math.floor(Math.random() * self.itemData.length)
                  ];

                while (actionTune.length < 3) {
                  actionTune.push(randTune());
                }

                const tuneBasedData = [...self.itemData].sort((a, b) => {
                  const indexA = actionTune.indexOf(a.name);
                  const indexB = actionTune.indexOf(b.name);

                  if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                  if (indexA !== -1) return -1;
                  if (indexB !== -1) return 1;

                  return Math.random() - 0.5;
                });

                let text = "";
                let newMoney = userMoney;
                let totalYield = 0;
                let failYield = 0;
                let failData = [];

                if (!actionStamp) {
                  text = `${self.actionEmoji} Cannot perform ${self.verbing} action since no items have been tuned yet. Use the **${prefix}${commandName}-tune** command to set your priorities before collecting!`;
                } else {
                  const elapsedTime =
                    (currentTimestamp - actionStamp) / 1000 / 60;

                  let harvestedItems = [];
                  for (const item of tuneBasedData) {
                    let tuneIndex = [...actionTune].indexOf(item.name);
                    let isTune = tuneIndex !== -1;
                    const chanceMod = [0.5, 0.3, 0.2];
                    let yieldAmount = Math.max(
                      0,
                      Math.floor(elapsedTime / item.delay)
                    );
                    const addChanceMod = (chance) =>
                      chance - chance * (chanceMod[tuneIndex] ?? -0.3);
                    const yieldArray = Array(yieldAmount).fill();
                    yieldAmount = yieldArray.reduce(
                      (acc) =>
                        acc +
                        (addChanceMod(Math.random()) < item.chance ? 1 : 0),
                      0
                    );
                    if (totalYield + yieldAmount > actionMax) {
                      failYield += totalYield + yieldAmount - actionMax;
                      failData.push({
                        ...item,
                        yieldAmount: totalYield + yieldAmount - actionMax,
                      });

                      yieldAmount = actionMax - totalYield;
                    }

                    if (yieldAmount <= 0) {
                      continue;
                    }
                    let price = Math.floor(
                      addChanceMod(Math.random()) *
                        (item.priceB - item.priceA + 1) +
                        item.priceA
                    );
                    price = CassExpress.farmUP(price, totalItems);

                    totalYield += yieldAmount;
                    if (!totalItems[item.name]) {
                      totalItems[item.name] = 0;
                    }
                    totalItems[item.name] += yieldAmount;

                    const total = yieldAmount * price;
                    harvestedItems.push({
                      name: item.name,
                      icon: item.icon,
                      yieldAmount,
                      price,
                      total,
                    });
                    cassEXP.expControls.raise(
                      clamp(0, Math.floor(total / 1000), 10)
                    );
                    newMoney += total;
                  }

                  text = `📝 **Summary**:\n`;
                  let types = 0;
                  harvestedItems = harvestedItems.sort(
                    (a, b) => a.total - b.total
                  );
                  harvestedItems.forEach((item) => {
                    if (item.yieldAmount < 1) {
                      return;
                    }
                    const tunedOrder = actionTune.indexOf(item.name);
                    text += `${
                      tunedOrder !== -1
                        ? `🚀**#${tunedOrder + 1}**`
                        : self.checkIcon
                    } ${item.icon} ${
                      tunedOrder !== -1
                        ? `**x${item.yieldAmount}** **${item.name}(s)**`
                        : `x${item.yieldAmount} ${item.name}(s)`
                    } sold for **${item.price}$** each, total: **${
                      item.total
                    }$**\n`;
                    types++;
                  });
                  failData.forEach((item) => {
                    if (item.yieldAmount < 1) {
                      return;
                    }
                    const tunedOrder = actionTune.indexOf(item.name);
                    text += `${
                      tunedOrder !== -1 ? `❌**#${tunedOrder + 1}**` : "❌"
                    } ${item.icon} ${
                      tunedOrder !== -1
                        ? `**x${item.yieldAmount}** **${item.name}(s)**`
                        : `x${item.yieldAmount} ${item.name}(s)`
                    } failed.\n`;
                    types++;
                  });
                  if (failYield > 0) {
                    text += `\n🥲 **Failed** ${self.verbing} ${failYield} **item(s)** due to full storage.\n`;
                  }
                  if (types === 0) {
                    text += `\n🥲 No items ${self.pastTense}, you should wait for the next action!\n`;
                  } else {
                    text += `\n💗 ${self.pastTense} ${types} type(s) of items.\n`;
                  }
                  cassEXP.expControls.raise(
                    Math.floor((totalYield / actionMax) * 10)
                  );
                  text += `\n🗃️ Storage: `;
                  text += `${totalYield.toLocaleString()}/${Number(
                    actionMax
                  ).toLocaleString()} (${Math.floor(
                    (totalYield / actionMax) * 100
                  )}%)\n✓ You can **upgrade** this storage by using **${prefix}${
                    self.key
                  }-upgrade**.`;
                  text += `\n\n✨ **Total Earnings**: $**${(
                    newMoney - userMoney
                  ).toLocaleString()}💵**\n💰 **Your Balance**: $**${newMoney.toLocaleString()}**💵`;
                  text += `\n⌛ **Time Took**: ${formatDuration(
                    currentTimestamp - actionStamp
                  )}\n\n${self.actionEmoji} To start another ${
                    self.verbing
                  } cycle, use the **${prefix}${commandName}-tune** command to set your priorities before collecting.`;
                  // text += `\n\n`;
                }

                await money.set(input.senderID, {
                  money: newMoney,
                  [self.key + "Stamp"]: null,
                  [self.key + "MaxZ"]: actionMax,
                  [self.key + "Total"]: totalItems,
                  [self.key + "Tune"]: [],
                  cassEXP: cassEXP.raw(),
                });

                output.reply(text);
              },
            },
            {
              key: "upgrade",
              description: "Upgrade your storage.",
              aliases: ["-u"],
              icon: "🛒",
              async handler() {
                const data = self.stoData ?? stoData[self.key];
                if (!data) {
                  return output.reply(
                    `🔍 The upgrade data is **missing**, we cannot determine the price so we cannot upgrade.`
                  );
                }
                data.key ??= `${self.key}MaxZ`;
                data.price ??= 100;
                const {
                  money: userMoney,
                  battlePoints: bp = 0,
                  [self.key + "Stamp"]: actionStamp,
                  [self.key + "MaxZ"]: actionMax = self.storage,
                  [self.key + "Total"]: totalItems = {},
                  [data.key]: storage,
                  [`${data.key}_upgrades`]: upgrades = 0,
                  inventory: inv,
                  name,
                } = await money.get(input.senderID);
                const inventory = new Inventory(inv);

                if (!storage) {
                  return output.reply(
                    `🎀 You cannot upgrade without playing the game.`
                  );
                }

                let hasDiscount = inventory.has("silkRibbon");
                let multiplier = 1;
                if (hasDiscount) {
                  multiplier = 0.75;
                }
                let price = Math.floor(data.price * 2 ** upgrades * multiplier);
                if (isNaN(price)) {
                  return output.wentWrong();
                }
                if (bp < price) {
                  return output.reply(
                    `❌ The price of "${
                      self.key
                    }" **storage** upgrade is **${price.toLocaleString()}**💷 but you only have **${bp.toLocaleString()}**💷.\n\n**Before Upgrading**: ${Number(
                      storage
                    ).toLocaleString()} 🗃️\n**After Upgrading**: ${(
                      storage * 2
                    ).toLocaleString()} 🗃️`
                  );
                }

                const i = await output.reply(
                  `⚠️ Buy "${
                    self.key
                  }" storage upgrade for **${price.toLocaleString()}**💷?\n**Before Upgrading**: ${Number(
                    storage
                  ).toLocaleString()} 🗃️\n**After Upgrading**: ${(
                    storage * 2
                  ).toLocaleString()} 🗃️\n\n**Battle Points**\nBefore - **${bp.toLocaleString()}**💷\nAfter - **${(
                    bp - price
                  ).toLocaleString()}**💷\n\n***Reply anything to confirm***`
                );

                input.setReply(i.messageID, {
                  key: self.key,
                  /**
                   * @type {CommandEntry}
                   */
                  async callback({ output }) {
                    input.delReply(i.messageID);
                    await money.set(input.senderID, {
                      [`${data.key}_upgrades`]: upgrades + 1,
                      battlePoints: bp - price,
                      [data.key]: storage * 2,
                    });
                    await output.replyStyled(
                      `✅ Successfully purchased "${self.key}"${
                        hasDiscount ? "25% OFF! 🎀" : ""
                      } storage upgrade for ${price}💷!\n\n**Old Storage**: ${storage} 🗃️\n**New Storage**: ${
                        storage * 2
                      } 🗃️\n**New Battle Points**: ${bp - price}💷 (-${price})`,
                      context.command?.style ?? {
                        title: "🛒 Upgrader",
                        titleFont: "bold",
                        contentFont: "fancy",
                      }
                    );
                  },
                });
              },
            },
          ]
        );
        return home.runInContext(context);
      } catch (error) {
        output.error(error);
      }
    }
  }
  class ItemPrompt {
    constructor(inventory = []) {
      const { output, money, Inventory } = obj;
      this.inv = new Inventory([...inventory]);
    }
    async selectItem({
      format,
      onItem = async function () {},
      head = "",
      bottom = "",
      onWrong,
    } = {}) {
      const { output, money, Inventory } = obj;
      format ??= (inv) => {
        return [...inv].map(
          (item, n) => `${n + 1} ${item.icon} **${item.name}** (${item.key})\n`
        );
      };
      const self = this;
      return output.waitForReply(
        `${head}\n${await format(this.inv)}\n${bottom}`.trim(),
        async (ctx) => {
          const {
            repObj: { resolve },
          } = ctx;
          let targetItem = self.inv.find(
            (_, i) => String(i) === String(parseInt(ctx.input.words[0]) + 1)
          );
          if (!targetItem) {
            if (onWrong) {
              return await onWrong(ctx);
            }
            return ctx.output.reply(`❌ Item not found.`);
          }
          let { inventory: newInv } = await ctx.money.get(ctx.input.senderID);
          newInv = new Inventory(newInv);
          if (![...newInv].some((i) => i === targetItem)) {
            return ctx.output.reply(`❌ Missing item!`);
          }
          await onItem(ctx, targetItem);
          return resolve(targetItem);
        }
      );
    }
  }
  obj.ItemPrompt = ItemPrompt;

  class GameSimulator {
    static instances = {};

    constructor({
      key,
      verb = key.charAt(0).toUpperCase() + key.slice(1),
      verbing = verb + "ing",
      pastTense = verb + "ed",
      checkIcon = "✅",
      initialStorage = 30,
      itemData = [],
      actionEmoji = "🎉",
      stoData,
    }) {
      GameSimulator.instances[key] = this;
      this.key = key;
      this.verb = verb;
      this.verbing = verbing;
      this.pastTense = pastTense;
      this.checkIcon = checkIcon;
      this.actionEmoji = actionEmoji;
      this.storage = initialStorage;
      this.stoData = stoData;
      this.itemData = itemData.map((i) => ({
        ...i,
        priceA: i.priceA * 10,
        priceB: i.priceB * 10,
        streak: 0,
      }));
    }

    async simulateAction(context = obj) {
      const {
        input,
        output,
        money,
        args,
        prefix,
        CassExpress,
        Inventory,
        commandName,
      } = context;
      const self = this;
      const now = Date.now();

      const {
        [self.key + "Energy"]: currentEnergy = 100,
        [self.key + "EnergyStamp"]: energyStamp = now,
        carsData: rawCarsData = [],
        petsData: rawPetsData = [],
        ...rest
      } = await money.get(input.senderID);

      const carsData = new Inventory(rawCarsData || []);
      const petsData = new Inventory(rawPetsData || []);
      const activeCars = carsData
        .getAll()
        .filter((car) => Array.isArray(car.pets) && car.pets.length > 0)
        .map((car) => updateCarData(car));

      const avgSpeed =
        activeCars.length > 0
          ? activeCars.reduce((sum, car) => sum + car.maxSpeed, 0) /
            activeCars.length
          : 100;
      const baseRegenInterval = 300000;
      const regenInterval = Math.max(
        60000,
        baseRegenInterval - Math.floor((avgSpeed - 100) * 1000)
      );
      const elapsedMs = now - energyStamp;
      const regenAmount = Math.floor(elapsedMs / regenInterval);
      const newEnergy = Math.min(200, currentEnergy + regenAmount);

      if (newEnergy !== currentEnergy || energyStamp === now) {
        await money.set(input.senderID, {
          [self.key + "Energy"]: newEnergy,
          [self.key + "EnergyStamp"]: now,
        });
      }

      const home = new SpectralCMDHome({ isHypen: true, defaultKey: "help" }, [
        {
          key: "total",
          description: "Check your total yields and stats!",
          aliases: ["-t"],
          async handler() {
            const {
              [self.key + "Total"]: totalItems = {},
              name = "Unregistered",
            } = await money.get(input.senderID);
            if (!name) {
              return output.reply(
                `👤 **??** (??)\n\n` +
                  `❌ Yo! Register with "identity-setname" first, fam!`
              );
            }

            let result =
              `👤 **${name}** (${self.key})\n\n` +
              `${UNIRedux.arrow} ***Total ${self.verb}ed Loot***\n\n`;
            const sortedItems = Object.entries(totalItems).sort(
              (a, b) => b[1] - a[1]
            );
            sortedItems.forEach(([itemName, itemCount]) => {
              const data = self.itemData.find((item) => item.name === itemName);
              result +=
                `${self.checkIcon} ${
                  data.icon
                } **${itemName}** (x${itemCount}) [${data.name.toLowerCase()}]\n` +
                `Rarity: ${100 - data.chance * 100}%\n` +
                `Time: ${data.delay} min\n` +
                `Price: ${data.priceA}-${data.priceB}$\n\n`;
            });
            const total = Object.values(totalItems).reduce(
              (acc, count) => acc + count,
              0
            );
            result += total
              ? `Total Haul: ${total}`
              : `❌ Nothing ${self.pastTense} yet!`;
            return output.reply(result);
          },
        },
        {
          key: "check",
          description: "See your tuned items and timers!",
          async handler() {
            const {
              [self.key + "Stamp"]: actionStamp,
              [self.key + "MaxZ"]: actionMax = self.storage,
              [self.key + "Tune"]: actionTune = [],
              [self.key + "Energy"]: energy = 100,
              name = "Unregistered",
              carsData: rawCarsData = [],
              petsData: rawPetsData = [],
            } = await money.get(input.senderID);

            const carsData = new Inventory(rawCarsData || []);
            const petsData = new Inventory(rawPetsData || []);
            const activeCars = carsData
              .getAll()
              .filter((car) => Array.isArray(car.pets) && car.pets.length > 0)
              .map((car) => updateCarData(car));

            const totalSpeed = activeCars.reduce(
              (sum, car) => sum + (car.maxSpeed - 100),
              0
            );
            const totalEfficiency = activeCars.reduce(
              (sum, car) => sum + car.fuelEfficiency,
              0
            );
            const totalDurability = activeCars.reduce(
              (sum, car) => sum + car.durability,
              0
            );
            const totalLevel = activeCars.reduce(
              (sum, car) => sum + car.level,
              0
            );
            const levelMultiplier =
              1 + totalLevel / (activeCars.length || 1) / 10;

            const regenBonus = Math.floor(totalSpeed * 1000);
            const yieldChanceBonus = (totalSpeed / 1000) * levelMultiplier;
            const energyCostReduction = Math.floor(
              totalEfficiency * 10 * levelMultiplier
            );
            const storageBonus = Math.floor(
              totalDurability * 5 * levelMultiplier
            );

            const formatTime = (ms) => {
              const secs = Math.floor(ms / 1000) % 60;
              const mins = Math.floor(ms / (1000 * 60)) % 60;
              const hrs = Math.floor(ms / (1000 * 60 * 60));
              return hrs > 0
                ? `${hrs}h ${mins}m ${secs}s`
                : `${mins}m ${secs}s`;
            };

            let result =
              `👤 **${name}** (${self.key})\n\n` +
              `⚡ Energy: ${energy}/200 (Regen: ~${formatTime(
                regenInterval
              )})\n` +
              `🗃️ Storage: ${
                actionMax + storageBonus
              } (${actionMax} + ${storageBonus} from cars)\n\n`;
            if (!actionStamp) {
              result += `❌ Nothing’s ${self.verbing} yet! Tune some stuff with "${prefix}${commandName}-tune".`;
            } else {
              const elapsed = Date.now() - actionStamp;
              result +=
                `${UNIRedux.arrow} ***Tuned Loot***\n\n` +
                `Running: ${formatTime(elapsed)}\n\n`;
              actionTune.forEach((itemName, ind) => {
                const data = self.itemData.find((i) => i.name === itemName);
                const timeLeft = Math.max(0, data.delay * 60 * 1000 - elapsed);
                result +=
                  `${ind + 1}. ${
                    data.icon
                  } **${itemName}** [${data.name.toLowerCase()}]\n` +
                  `Ready In: ${formatTime(timeLeft)}\n` +
                  `Rarity: ${100 - data.chance * 100}%\n\n`;
              });
              result += `Use "${prefix}${commandName}-collect" to grab your haul!`;
            }

            result += `\n${UNIRedux.arrow} ***Car Boosts***\n`;
            if (activeCars.length === 0) {
              result += `🚗 No cars with pets assigned! Add some with "${prefix}pet-addcar".\n`;
            } else {
              activeCars.forEach((car) => {
                const carYieldBonus =
                  ((car.maxSpeed - 100) / 1000) * (1 + car.level / 10);
                result +=
                  `${car.icon} **${car.name}** (Lvl ${car.level})\n` +
                  `  Speed: +${(carYieldBonus * 100).toFixed(
                    1
                  )}% yield chance\n` +
                  `  Efficiency: -${Math.floor(
                    car.fuelEfficiency * 10 * (1 + car.level / 10)
                  )} energy cost\n` +
                  `  Durability: +${Math.floor(
                    car.durability * 5 * (1 + car.level / 10)
                  )} storage\n`;
              });
              result +=
                `\nTotal:\n` +
                `  Regen: -${formatTime(regenBonus)} faster\n` +
                `  Yield Chance: +${(yieldChanceBonus * 100).toFixed(1)}%\n` +
                `  Energy Cost: -${energyCostReduction}\n` +
                `  Storage: +${storageBonus}`;
            }

            return output.reply(result);
          },
        },
        {
          key: "tune",
          description: "Tune 3 items to start collecting—mix it up!",
          aliases: ["-tu"],
          async handler() {
            const {
              [self.key + "Stamp"]: actionStamp,
              [self.key + "MaxZ"]: actionMax = self.storage,
              [self.key + "Total"]: totalItems = {},
              [self.key + "Tune"]: actionTune = [],
              [self.key + "Energy"]: energy = 100,
              name = "Unregistered",
            } = await money.get(input.senderID);

            if (energy < 20) {
              return output.reply(
                `👤 **${name}** (${self.key})\n\n` +
                  `❌ Outta juice! Need 20⚡ (You’ve got ${energy}). Wait a bit—1⚡ every 5 min!`
              );
            }

            let items = Object.entries(totalItems)
              .sort(() => Math.random() - 0.5)
              .slice(0, 5);
            self.itemData.forEach((i) => {
              if (!items.some(([n]) => n === i.name)) items.push([i.name, 0]);
            });
            items = items.slice(0, 5);

            const warn = actionStamp
              ? `⚠️ Yo, tuning again resets your timer! You might lose stuff if you don’t collect first.\n\n`
              : "";
            let result =
              `👤 **${name}** (${self.key})\n\n` +
              `${warn}` +
              `${UNIRedux.arrow} ***Tune Up!***\n\n` +
              `Pick 3 items (numbers, no repeats)!\n` +
              `Ex: 1 2 3\n\n`;
            items.forEach(([itemName, count], ind) => {
              const data = self.itemData.find((i) => i.name === itemName);
              result +=
                `${ind + 1}. ${
                  data.icon
                } **${itemName}** [${data.name.toLowerCase()}]\n` +
                `Rarity: ${100 - data.chance * 100}%\n` +
                `Time: ${data.delay} min\n\n`;
            });
            const updatedEnergy = Math.max(0, energy - 20);
            await money.set(input.senderID, {
              [self.key + "Energy"]: updatedEnergy,
            });
            result += `⚡ Energy: ${updatedEnergy}/200 (-20)\n`;

            const i = await output.reply(result);
            input.setReply(i.messageID, {
              async callback(ctx2) {
                if (ctx2.input.senderID !== input.senderID) return;
                const nums = ctx2.input.words
                  .map((n) => parseInt(n) - 1)
                  .filter((n) => n >= 0 && n < items.length)
                  .slice(0, 3);
                if (nums.length < 3) {
                  return ctx2.output.reply(
                    `👤 **${name}** (${self.key})\n\n` +
                      `❌ Need 3 numbers, fam! You gave ${nums.length}.`
                  );
                }
                if (new Set(nums).size !== nums.length) {
                  return ctx2.output.reply(
                    `👤 **${name}** (${self.key})\n\n` +
                      `❌ No dupes allowed! Mix it up.`
                  );
                }

                const newTune = nums.map((n) => items[n][0]);
                await money.set(ctx2.input.senderID, {
                  [self.key + "Tune"]: newTune,
                  [self.key + "Stamp"]: Date.now(),
                });

                let tuneList = `${UNIRedux.arrow} ***Tuned Loot***\n\n`;
                newTune.forEach((itemName, ind) => {
                  const data = self.itemData.find((i) => i.name === itemName);
                  tuneList += `${ind + 1}. ${
                    data.icon
                  } **${itemName}** [${data.name.toLowerCase()}]\n`;
                });
                return ctx2.output.reply(
                  `👤 **${name}** (${self.key})\n\n` +
                    `✅ Tuned up!\n\n` +
                    `${tuneList}\n` +
                    `⚡ Energy: ${updatedEnergy}/200 (-20)\n` +
                    `Timer’s ticking—collect when ready!`
                );
              },
            });
          },
        },
        {
          key: "collect",
          description: "Grab your loot—don’t wait too long!",
          aliases: ["-c"],
          async handler() {
            const {
              money: userMoney,
              [self.key + "Stamp"]: actionStamp,
              [self.key + "MaxZ"]: actionMax = self.storage,
              [self.key + "Total"]: totalItems = {},
              [self.key + "Tune"]: actionTune = [],
              [self.key + "Energy"]: energy = 100,
              [self.key + "Buffer"]: buffer = 0,
              [self.key + "Boost"]: boost = 0,
              cassEXP: cxp,
              name = "Unregistered",
              carsData: rawCarsData = [],
              petsData: rawPetsData = [],
            } = await money.get(input.senderID);
            const cassEXP = new CassEXP(cxp);
            const carsData = new Inventory(rawCarsData || []);
            const petsData = new Inventory(rawPetsData || []);

            if (!actionStamp) {
              return output.reply(
                `👤 **${name}** (${self.key})\n\n` +
                  `❌ Nothing’s ${self.verbing}! Tune some items with "${prefix}${commandName}-tune".`
              );
            }

            const activeCars = carsData
              .getAll()
              .filter((car) => Array.isArray(car.pets) && car.pets.length > 0)
              .map((car) => updateCarData(car));

            const totalSpeed = activeCars.reduce(
              (sum, car) => sum + (car.maxSpeed - 100),
              0
            );
            const totalEfficiency = activeCars.reduce(
              (sum, car) => sum + car.fuelEfficiency,
              0
            );
            const totalDurability = activeCars.reduce(
              (sum, car) => sum + car.durability,
              0
            );
            const totalLevel = activeCars.reduce(
              (sum, car) => sum + car.level,
              0
            );
            const levelMultiplier =
              1 + totalLevel / (activeCars.length || 1) / 10;

            const yieldChanceBonus = (totalSpeed / 1000) * levelMultiplier;
            const energyCostReduction = Math.floor(
              totalEfficiency * 10 * levelMultiplier
            );
            const storageBonus = Math.floor(
              totalDurability * 5 * levelMultiplier
            );
            const effectiveMax = actionMax + storageBonus;

            const elapsed = (Date.now() - actionStamp) / 1000 / 60;
            const tuneBasedData = self.itemData
              .map((item) => ({
                ...item,
                chance: actionTune.includes(item.name)
                  ? Math.min(
                      item.chance +
                        (item.streak || 0) * 0.05 +
                        yieldChanceBonus,
                      0.95
                    )
                  : Math.min(item.chance + yieldChanceBonus, 0.95),
              }))
              .sort(
                (a, b) =>
                  actionTune.indexOf(a.name) - actionTune.indexOf(b.name) ||
                  Math.random() - 0.5
              );

            let newMoney = userMoney;
            let totalYield = 0;
            let failYield = 0;
            let harvestedItems = [];
            let boostActive = boost > 0;
            let energyPenalty = energy < 10 ? 0.5 : 1;
            const bufferMax = Math.floor(actionMax * 0.1);

            tuneBasedData.forEach((item) => {
              const yieldAmount =
                Math.max(0, Math.floor(elapsed / item.delay)) *
                (boostActive ? 2 : 1) *
                energyPenalty;
              if (yieldAmount <= 0) return;

              let actualYield = 0;
              for (let i = 0; i < yieldAmount; i++) {
                if (Math.random() < item.chance) actualYield++;
              }

              if (totalYield + actualYield > effectiveMax) {
                const excess = totalYield + actualYield - effectiveMax;
                failYield += excess;
                actualYield = effectiveMax - totalYield;
              }

              if (actualYield > 0) {
                const price = Math.floor(
                  Math.random() * (item.priceB - item.priceA + 1) + item.priceA
                );
                const total = actualYield * price;
                totalYield += actualYield;
                totalItems[item.name] =
                  (totalItems[item.name] || 0) + actualYield;
                harvestedItems.push({
                  name: item.name,
                  icon: item.icon,
                  yieldAmount: actualYield,
                  price,
                  total,
                });
                newMoney += total;
                item.streak = actionTune.includes(item.name)
                  ? (item.streak || 0) + 1
                  : 0;
              }
            });

            const newBuffer = Math.min(buffer + failYield, bufferMax);
            const lostYield = failYield - (newBuffer - buffer);
            const boostTokenChance = Math.random() < 0.05 ? 1 : 0;
            const newBoost = boostTokenChance ? boost + 1 : boost;
            const newEnergy = Math.min(energy + 10 - energyCostReduction, 200);
            cassEXP.expControls.raise(Math.floor(totalYield / 10));

            let result =
              `👤 **${name}** (${self.key})\n\n` +
              `${UNIRedux.arrow} ***Collected Loot***\n\n`;
            harvestedItems.forEach((item) => {
              result += `${item.icon} **${item.name}** (x${
                item.yieldAmount
              }) [${item.name.toLowerCase()}]\n$${item.total} ($${
                item.price
              } each)\n\n`;
            });
            if (failYield > 0) {
              result +=
                `❌ Overflow: ${failYield} items\n` +
                `Saved to Buffer: ${
                  newBuffer - buffer
                } (Buffer: ${newBuffer}/${bufferMax})\n` +
                `Lost: ${lostYield}\n\n`;
            }
            result +=
              `⚡ Energy: ${newEnergy}/200 (+10${
                energyCostReduction > 0
                  ? ` -${energyCostReduction} from cars`
                  : ""
              })\n` +
              `🌟 Boost Tokens: ${newBoost}${
                boostTokenChance ? " (+1)" : ""
              }\n` +
              `Total Haul: ${totalYield}/${effectiveMax} (${Math.floor(
                (totalYield / effectiveMax) * 100
              )}%)\n` +
              `Earnings: $${(newMoney - userMoney).toLocaleString()}💵\n\n` +
              `${
                boostActive ? "Boosted! " : ""
              }Tune again with "${prefix}${commandName} -tune"!`;

            result += `\n${UNIRedux.arrow} ***Car Boosts***\n`;
            if (activeCars.length === 0) {
              result += `🚗 No cars with pets! Assign some with "${prefix}pet-addcar" to boost yield, save energy, and expand storage.\n`;
            } else {
              result +=
                `Yield Chance: +${(yieldChanceBonus * 100).toFixed(
                  1
                )}% (Speed)\n` +
                `Energy Saved: ${energyCostReduction} (Efficiency)\n` +
                `Extra Storage: ${storageBonus} (Durability)\n`;
              activeCars.forEach((car) => {
                const carYieldBonus =
                  ((car.maxSpeed - 100) / 1000) * (1 + car.level / 10);
                result +=
                  `${car.icon} **${car.name}**: +${(
                    carYieldBonus * 100
                  ).toFixed(1)}% chance, ` +
                  `-${Math.floor(
                    car.fuelEfficiency * 10 * (1 + car.level / 10)
                  )} energy, ` +
                  `+${Math.floor(
                    car.durability * 5 * (1 + car.level / 10)
                  )} storage\n`;
              });
            }

            await money.set(input.senderID, {
              money: newMoney,
              [self.key + "Stamp"]: null,
              [self.key + "MaxZ"]: actionMax,
              [self.key + "Total"]: totalItems,
              [self.key + "Tune"]: [],
              [self.key + "Energy"]: newEnergy,
              [self.key + "Buffer"]: newBuffer,
              [self.key + "Boost"]: boostActive ? newBoost - 1 : newBoost,
              cassEXP: cassEXP.raw(),
            });

            return output.reply(result);
          },
        },
        {
          key: "upgrade",
          description: "Boost your storage capacity!",
          aliases: ["-u"],
          async handler() {
            const data = self.stoData || { price: 100, key: `${self.key}MaxZ` };
            const {
              money: userMoney,
              battlePoints: bp = 0,
              [self.key + "MaxZ"]: actionMax = self.storage,
              [`${self.key}_upgrades`]: upgrades = 0,
              inventory: inv,
              name = "Unregistered",
            } = await money.get(input.senderID);
            const inventory = new Inventory(inv);

            const price = Math.floor(data.price * Math.pow(1.5, upgrades));
            if (bp < price) {
              return output.reply(
                `👤 **${name}** (${self.key})\n\n` +
                  `❌ Need $${price}💶 to upgrade! You’ve got $${bp}💶.\n` +
                  `Current: ${actionMax} 🗃️\nNext: ${Math.floor(
                    actionMax * 1.5
                  )} 🗃️`
              );
            }

            const i = await output.reply(
              `👤 **${name}** (${self.key})\n\n` +
                `Upgrade storage for $${price}💶?\n` +
                `Current: ${actionMax} 🗃️\nNext: ${Math.floor(
                  actionMax * 1.5
                )} 🗃️\n` +
                `💶: ${bp} -> ${bp - price}\n\n` +
                `Reply "yes" to confirm!`
            );
            const author = input.senderID;
            input.setReply(i.messageID, {
              key: self.key,
              async callback({ output, input }) {
                if (input.senderID !== author) return;
                if (input.body.toLowerCase() !== "yes") return;
                input.delReply(i.messageID);
                await money.set(input.senderID, {
                  [`${self.key}_upgrades`]: upgrades + 1,
                  battlePoints: bp - price,
                  [self.key + "MaxZ"]: Math.floor(actionMax * 1.5),
                });
                return output.reply(
                  `👤 **${name}** (${self.key})\n\n` +
                    `✅ Storage bumped to ${Math.floor(
                      actionMax * 1.5
                    )} 🗃️!\n` +
                    `💶: ${bp - price} (-${price})`
                );
              },
            });
          },
        },
        {
          key: "boost",
          description: "Use a Boost Token for double yield!",
          aliases: ["-b"],
          async handler() {
            const { [self.key + "Boost"]: boost = 0, name = "Unregistered" } =
              await money.get(input.senderID);
            if (boost < 1) {
              return output.reply(
                `👤 **${name}** (${self.key})\n\n` +
                  `❌ No 🌟 Boost Tokens! Earn ‘em by collecting.`
              );
            }
            return output.reply(
              `👤 **${name}** (${self.key})\n\n` +
                `✅ Next collect will be DOUBLED with a 🌟 Boost Token!\n` +
                `Tokens left: ${boost}`
            );
          },
        },
      ]);

      return home.runInContext(context);
    }
  }

  function updateCarData(carData) {
    const cleanedCarData = {};
    for (const key in carData) {
      if (carData[key] !== null) {
        cleanedCarData[key] = carData[key];
      }
    }

    const defaults = {
      distance: 0,
      level: 1,
      fuel: 100,
      condition: 100,
      maxSpeed: 120,
      fuelEfficiency: 0.5,
      durability: 1.0,
      currentSpeed: 0,
      gear: 0,
      isRunning: false,
      lastAction: null,
      upgrades: [],
      crew: [],
      achievements: [],
      sellPrice: 500,
      carType: cleanedCarData.carType || "unknown",
      icon: cleanedCarData.icon || "🚗",
      name: cleanedCarData.name || "Unnamed",
      key: cleanedCarData.key || `car:unknown_${Date.now()}`,
    };

    const updatedCar = { ...defaults, ...cleanedCarData };
    updatedCar.level =
      updatedCar.distance < 100
        ? 1
        : Math.floor(Math.log2(updatedCar.distance / 100)) + 1;
    return updatedCar;
  }

  obj.GameSimulator = GameSimulator;
  obj.GameSimulatorRedux = GameSimulatorRedux;
  obj.isTimeAvailable = isTimeAvailable;
  obj.BulkUpdater = BulkUpdater;
  obj.ItemLister = ItemLister;
  obj.next();
}
