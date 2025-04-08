// @ts-check
import crypto from "crypto";

/**
 * Generates a highly secure random number in the range [0, 1).
 *
 * @returns {number} A cryptographically secure pseudo-random number in the range [0, 1).
 */
export function secureRandom() {
  const randomInt = crypto.randomBytes(4).readUInt32BE(0);

  // const bias = crypto.randomBytes(4).readUInt32BE(0) / 0xffffffff - 0.5;
  // const shiftedRandom = randomInt / 0xffffffff + bias * 0.3;
  // return Math.min(Math.max(shiftedRandom, 0), 1);
  return randomInt / 0xffffffff;
}

export function emojiEnd(str) {
  const { emojiRegex } = UNISpectra;

  let emojis = [...str].filter((char) => emojiRegex.test(char)).join("");
  let nonEmojis = [...str]
    .filter((char) => !emojiRegex.test(char))
    .join("")
    .trim()
    .replaceAll("|", "");

  const resIdk =
    nonEmojis +
    " " +
    UNISpectra.nextArrow.repeat(2) +
    "" +
    (emojis ? " " + emojis : "");
  const res = (
    UNISpectra.nextArrow.repeat(1) +
    "  " +
    (emojis ? UNISpectra.wrapEmoji(emojis) + "  " : "") +
    nonEmojis
      .split(" ")
      .map((i, j) => {
        if (j === 0) {
          return `**${i}**`;
        }
        return i;
      })
      .join(" ")
  ).trim();
  console.log(str, " => ", res);
  return res;
}

export class UNIRedux {
  static specialSpace = "ᅠ";
  static burger = "☰"; // burger menu
  static standardLine = "━━━━━━━━━━━━━━━"; // Line
  static section = "§"; // Section sign
  static paragraph = "¶"; // Pilcrow sign
  static registered = "®"; // Registered trademark sign
  static trademark = "™"; // Trademark sign
  static copyright = "©"; // Copyright sign
  static degree = "°"; // Degree sign
  static micro = "µ"; // Micro sign
  static bullet = "•"; // Bullet
  static enDash = "–"; // En dash
  static emDash = "—"; // Em dash
  static prime = "′"; // Prime
  static doublePrime = "″"; // Double prime
  static daggers = "†"; // Dagger
  static doubleDagger = "‡"; // Double dagger
  static ellipsis = "…"; // Ellipsis
  static infinity = "∞"; // Infinity symbol
  static currency = "¤"; // Generic currency sign
  static yen = "¥"; // Yen sign
  static euro = "€"; // Euro sign
  static pound = "£"; // Pound sign
  static plusMinus = "±"; // Plus-minus sign
  static approximately = "≈"; // Approximately equal to
  static notEqual = "≠"; // Not equal to
  static lessThanOrEqual = "≤"; // Less than or equal to
  static greaterThanOrEqual = "≥"; // Greater than or equal to
  static summation = "∑"; // Summation sign
  static integral = "∫"; // Integral sign
  static squareRoot = "√"; // Square root sign
  static partialDifferential = "∂"; // Partial differential
  static angle = "∠"; // Angle
  static degreeFahrenheit = "℉"; // Degree Fahrenheit
  static degreeCelsius = "℃"; // Degree Celsius

  // Decorative Symbols
  static floralHeart = "❧"; // Floral Heart
  static starFlower = "✻"; // Star Flower
  static heavyStar = "★"; // Heavy Star
  static sparkle = "✦"; // Sparkle
  static asterisk = "✱"; // Asterisk
  static heavyCheckMark = "✔"; // Heavy Check Mark
  static heavyBallotX = "✖"; // Heavy Ballot X
  static heart = "♥"; // Heart
  static diamond = "♦"; // Diamond
  static club = "♣"; // Club
  static spade = "♠"; // Spade
  static musicalNote = "♪"; // Musical Note
  static doubleMusicalNote = "♫"; // Double Musical Note
  static snowflake = "❄"; // Snowflake
  static sparkleStar = "✨"; // Sparkle Star
  static anchor = "⚓"; // Anchor
  static umbrella = "☔"; // Umbrella
  static hourglass = "⌛"; // Hourglass
  static hourglassNotDone = "⏳"; // Hourglass Not Done

  static charm = "✦";
  static disc = "⦿";

  static arrow = "➤";
  static arrowBW = "➣";
  static arrowFromT = "➥";
  static arrowFromB = "➦";
  static restart = "⟳";
  static arrowOutline = "➩";

  static reduxMark = `🌌 [OLD] **Cassidy**[font=double_struck]Redux[:font=double_struck]  ${this.charm}\n[font=fancy_italic]Not React, Just Smart Chat![:font=fancy_italic]`;
  static redux = `🌌 [OLD] **Cassidy**[font=double_struck]Redux[:font=double_struck] ${this.charm}`;
}

export class UNISpectra {
  static specialSpace = "ᅠ";
  static wrapEmoji(emoji) {
    return `${this.wrapA} ${emoji} ${this.wrapB}`;
  }
  static standardizeLines(text) {
    const lines = String(text).split("\n");
    let result = lines
      .map((i) => {
        if (i.trim().startsWith(this.standardLineStart)) {
          return this.standardLine;
        }
        if (i.trim().startsWith(this.standardBottomStart)) {
          return this.standardBottom;
        }
        return i;
      })
      .join("\n");
    return result;
  }
  static wrapA = "❲";
  static wrapB = "❳";
  static burger = "☰"; // burger menu
  static standardLineOld = "━━━━━━━━━━━━━━━"; // Line
  static standardLineStart = "━━━━━━━━━━━━━━━"; // Line
  static standardBottomStart = "━━━━━━━ ✕ ━━━━━━"; // Line
  static standardBottom = "•────── ✕ ──────•"; // Line
  static standardLine = "•───────────────•"; // Line
  static section = "§"; // Section sign
  static paragraph = "¶"; // Pilcrow sign
  static registered = "®"; // Registered trademark sign
  static trademark = "™"; // Trademark sign
  static copyright = "©"; // Copyright sign
  static degree = "°"; // Degree sign
  static micro = "µ"; // Micro sign
  static bullet = "•"; // Bullet
  static enDash = "–"; // En dash
  static emDash = "—"; // Em dash
  static prime = "′"; // Prime
  static doublePrime = "″"; // Double prime
  static daggers = "†"; // Dagger
  static doubleDagger = "‡"; // Double dagger
  static ellipsis = "…"; // Ellipsis
  static infinity = "∞"; // Infinity symbol
  static currency = "¤"; // Generic currency sign
  static yen = "¥"; // Yen sign
  static euro = "€"; // Euro sign
  static pound = "£"; // Pound sign
  static plusMinus = "±"; // Plus-minus sign
  static approximately = "≈"; // Approximately equal to
  static notEqual = "≠"; // Not equal to
  static lessThanOrEqual = "≤"; // Less than or equal to
  static greaterThanOrEqual = "≥"; // Greater than or equal to
  static summation = "∑"; // Summation sign
  static integral = "∫"; // Integral sign
  static squareRoot = "√"; // Square root sign
  static partialDifferential = "∂"; // Partial differential
  static angle = "∠"; // Angle
  static degreeFahrenheit = "℉"; // Degree Fahrenheit
  static degreeCelsius = "℃"; // Degree Celsius

  // Decorative Symbols
  static floralHeart = "❧"; // Floral Heart
  static starFlower = "✻"; // Star Flower
  static heavyStar = "★"; // Heavy Star
  static sparkle = "✦"; // Sparkle
  static asterisk = "✱"; // Asterisk
  static heavyCheckMark = "✔"; // Heavy Check Mark
  static heavyBallotX = "✖"; // Heavy Ballot X
  static heart = "♥"; // Heart
  static diamond = "♦"; // Diamond
  static club = "♣"; // Club
  static spade = "♠"; // Spade
  static musicalNote = "♪"; // Musical Note
  static doubleMusicalNote = "♫"; // Double Musical Note
  static snowflake = "❄"; // Snowflake
  static sparkleStar = "✨"; // Sparkle Star
  static anchor = "⚓"; // Anchor
  static umbrella = "☔"; // Umbrella
  static hourglass = "⌛"; // Hourglass
  static hourglassNotDone = "⏳"; // Hourglass Not Done

  static charm = "✦";
  static disc = "⦿";

  static nextArrow = "❯";

  static arrow = "➤";
  static arrowBW = "➣";
  static arrowFromT = "➥";
  static arrowFromB = "➦";
  static restart = "⟳";
  static arrowOutline = "➩";

  static get spectraMark() {
    return `${this.spectra} ${this.charm}\n[font=fancy_italic]Simplicity, and Innovation.[:font=fancy_italic]`;
  }
  static spectra = `☄️🪐 [font=redux]Cass${this.nextArrow}dy[:font=redux][font=bold]Spectra[:font=bold]`;

  static emojiRegex = /\p{Emoji}/gu;
}

/**
 * @type {Record<string, (value: string) => string>}
 */
export const fontMarkups = new Proxy(
  {},
  {
    get(_, fontName) {
      return (value) =>
        `[font=${String(fontName)}]${value}[:font=${String(fontName)}]`;
    },
  }
);

export function abbreviateNumber(value, places = 2, isFull = false) {
  let num = Number(value);
  if (isNaN(num)) return "Invalid input";
  if (num < 1000) {
    return num.toFixed(places).replace(/\.?0+$/, "");
  }

  const suffixes = ["", "K", "M", "B", "T", "P", "E"];
  const fullSuffixes = [
    "",
    "Thousand",
    "Million",
    "Billion",
    "Trillion",
    "Quadrillion",
    "Quintillion",
  ];

  const magnitude = Math.floor(Math.log10(num) / 3);

  if (magnitude === 0) {
    return num % 1 === 0
      ? num.toString()
      : num.toFixed(places).replace(/\.?0+$/, "");
  }

  const abbreviatedValue = num / Math.pow(1000, magnitude);
  const suffix = isFull ? fullSuffixes[magnitude] : suffixes[magnitude];

  if (abbreviatedValue % 1 === 0) {
    return `${Math.round(abbreviatedValue)}${isFull ? ` ${suffix}` : suffix}`;
  }

  const formattedValue = abbreviatedValue.toFixed(places).replace(/\.?0+$/, "");

  return `${formattedValue}${isFull ? ` ${suffix}` : suffix}`;
}

const fsp = require("fs").promises;
const path = require("path");

export async function getLatestCommands(directoryPath) {
  try {
    const fileNames = await fsp.readdir(directoryPath);
    const fileModTimes = {};

    for (const file of fileNames) {
      const filePath = path.join(directoryPath, file);
      const stats = await fsp.stat(filePath);
      fileModTimes[file] = stats.ctimeMs;
    }

    const sortedFiles = Object.entries(fileModTimes)
      .sort(([file1, time1], [file2, time2]) => time2 - time1)
      .map(([file]) => file);

    return sortedFiles;
  } catch (err) {
    console.error("Error reading files:", err);
  }
}

export function getCommandByFileName(fileName, commands) {
  const normalizedFileName = fileName.toLowerCase().replace(".js", "");

  const command = Object.entries(commands).find(([key, value]) => {
    const commandFileName = value.fileName.toLowerCase().replace(".js", "");
    return commandFileName === normalizedFileName;
  });

  return command ? command[1] : null;
}

export function isAdminCommand(command) {
  if (!command) return false;

  const { meta = {} } = command;
  const { permissions = [], adminOnly, botAdmin } = meta;

  return (
    (permissions.length > 0 && !permissions.includes(0)) ||
    adminOnly === true ||
    botAdmin === true
  );
}

/**
 * @template {Record<string, CassidySpectra.CassidyCommand>} T
 * @param {T} commands
 * @returns {T}
 */
export function removeCommandAliases(commands) {
  const keys = [
    ...new Set(Object.entries(commands).map((i) => i[1]?.meta?.name)),
  ];
  return Object.fromEntries(keys.map((key) => [key, commands[key]]));
}

export class ObjectX {
  /**
   * Maps the values of an object using a callback function.
   * @param {Object} obj - The object to map.
   * @param {(value: *, key: string, obj: Object) => *} callback - The function to apply to each value.
   * @returns {Object} - A new object with mapped values.
   */
  static mapValue(obj, callback) {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [
        key,
        callback(value, key, obj),
      ])
    );
  }

  /**
   * Maps the keys of an object using a callback function.
   * @param {Object} obj - The object to map.
   * @param {(key: string, value: *, obj: Object) => string} callback - The function to apply to each key.
   * @returns {Object} - A new object with mapped keys.
   */
  static mapKey(obj, callback) {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [
        callback(key, value, obj),
        value,
      ])
    );
  }

  /**
   * Filters the entries of an object based on a callback function.
   * @param {Object} obj - The object to filter.
   * @param {(value: *, key: string, obj: Object) => boolean} callback - The function to decide inclusion.
   * @returns {Object} - A new object with filtered entries.
   */
  static filter(obj, callback) {
    return Object.fromEntries(
      Object.entries(obj).filter(([key, value]) => callback(value, key, obj))
    );
  }

  /**
   * Finds the first value that satisfies the callback function.
   * @param {Object} obj - The object to search.
   * @param {(value: *, key: string, obj: Object) => boolean} callback - The function to test each value.
   * @returns {*} - The first value that satisfies the callback, or undefined.
   */
  static findValue(obj, callback) {
    for (const [key, value] of Object.entries(obj)) {
      if (callback(value, key, obj)) return value;
    }
    return undefined;
  }

  /**
   * Finds the key of the first entry that satisfies the callback function.
   * @param {Object} obj - The object to search.
   * @param {(value: *, key: string, obj: Object) => boolean} callback - The function to test each entry.
   * @returns {string|undefined} - The key of the first matching entry, or undefined.
   */
  static findKey(obj, callback) {
    for (const [key, value] of Object.entries(obj)) {
      if (callback(value, key, obj)) return key;
    }
    return undefined;
  }

  /**
   * Finds all values that satisfy the callback function.
   * @param {Object} obj - The object to search.
   * @param {(value: *, key: string, obj: Object) => boolean} callback - The function to test each value.
   * @returns {Array} - An array of all matching values.
   */
  static findAllValues(obj, callback) {
    return Object.entries(obj)
      .filter(([key, value]) => callback(value, key, obj))
      .map(([, value]) => value);
  }

  /**
   * Finds all keys that satisfy the callback function.
   * @param {Object} obj - The object to search.
   * @param {(value: *, key: string, obj: Object) => boolean} callback - The function to test each key.
   * @returns {Array} - An array of all matching keys.
   */
  static findAllKeys(obj, callback) {
    return Object.entries(obj)
      .filter(([key, value]) => callback(value, key, obj))
      .map(([key]) => key);
  }

  /**
   * Checks if every entry in the object satisfies the callback function.
   * @param {Object} obj - The object to check.
   * @param {(value: *, key: string, obj: Object) => boolean} callback - The function to test each entry.
   * @returns {boolean} - True if all entries satisfy the condition, otherwise false.
   */
  static every(obj, callback) {
    return Object.entries(obj).every(([key, value]) =>
      callback(value, key, obj)
    );
  }

  /**
   * Checks if at least one entry in the object satisfies the callback function.
   * @param {Object} obj - The object to check.
   * @param {(value: *, key: string, obj: Object) => boolean} callback - The function to test each entry.
   * @returns {boolean} - True if at least one entry satisfies the condition, otherwise false.
   */
  static some(obj, callback) {
    return Object.entries(obj).some(([key, value]) =>
      callback(value, key, obj)
    );
  }

  /**
   * Returns the entries of the object sorted by the given compare function.
   * @param {Object} obj - The object to sort.
   * @param {(a: [string, *], b: [string, *]) => number} compareFn - The function to define the sort order.
   * @returns {Object} - A new object with sorted entries.
   */
  static toSorted(obj, compareFn) {
    return Object.fromEntries(
      Object.entries(obj).sort((a, b) => compareFn(a, b))
    );
  }

  /**
   * Returns the entries of the object in reverse order.
   * @param {Object} obj - The object to reverse.
   * @returns {Object} - A new object with reversed entries.
   */
  static toReversed(obj) {
    return Object.fromEntries(Object.entries(obj).reverse());
  }
  /**
   * Flattens nested objects into a single level object.
   * @param {Object} obj - The object to flatten.
   * @param {string} [prefix] - The prefix for nested keys.
   * @returns {Object} - A flattened object.
   */
  static flat(obj, prefix = "") {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        Object.assign(result, this.flat(value, newKey));
      } else {
        result[newKey] = value;
      }
    }
    return result;
  }

  /**
   * Slices a flattened object based on index range.
   * @param {Object} obj - The object to slice.
   * @param {number} startIndex - The index to start the slice (inclusive).
   * @param {number} endIndex - The index to end the slice (exclusive).
   * @returns {Object} - The sliced portion of the object.
   */
  static slice(obj, startIndex, endIndex) {
    const keys = Object.keys(obj);

    if (
      startIndex < 0 ||
      startIndex >= keys.length ||
      endIndex <= startIndex ||
      endIndex > keys.length
    ) {
      return {};
    }

    const slicedKeys = keys.slice(startIndex, endIndex);

    const result = {};
    slicedKeys.forEach((key) => {
      result[key] = obj[key];
    });

    return result;
  }

  /**
   * Returns the key at a specific index in the flattened object.
   * @param {Object} obj - The object to query.
   * @param {number} index - The index to access.
   * @returns {string|undefined} - The key at the specified index, or undefined if out of bounds.
   */
  static keyOfIndex(obj, index) {
    const keys = Object.keys(obj);

    if (index < 0 || index >= keys.length) {
      return undefined;
    }

    return keys[index];
  }

  /**
   * Returns the index of a specific key in the flattened object.
   * @param {Object} obj - The object to query.
   * @param {string} key - The key to search for.
   * @returns {number} - The index of the key, or -1 if the key does not exist.
   */
  static indexOfKey(obj, key) {
    const keys = Object.keys(obj);

    return keys.indexOf(key);
  }

  /**
   * Returns the index of a specific value in the flattened object.
   * @param {Object} obj - The object to query.
   * @param {*} value - The value to search for.
   * @returns {number} - The index of the value, or -1 if the value is not found.
   */
  static indexOf(obj, value) {
    const keys = Object.keys(obj);

    for (let i = 0; i < keys.length; i++) {
      if (obj[keys[i]] === value) {
        return i;
      }
    }

    return -1;
  }

  /**
   * Returns the key of a specific value in the flattened object.
   * @param {Object} obj - The object to query.
   * @param {*} value - The value to search for.
   * @returns {string|undefined} - The key of the first occurrence of the value, or undefined if not found.
   */
  static keyOf(obj, value) {
    const keys = Object.keys(obj);

    for (const key of keys) {
      if (obj[key] === value) {
        return key;
      }
    }

    return undefined;
  }

  /**
   * Returns the value at a specific key in the flattened object.
   * @param {Object} obj - The object to query.
   * @param {string} key - The key to access.
   * @returns {*} - The value at the specified key, or undefined if the key doesn't exist.
   */
  static atKey(obj, key) {
    const flattened = this.flat(obj);
    return flattened[key];
  }

  /**
   * Returns the keys corresponding to a specific value in the flattened object.
   * @param {Object} obj - The object to query.
   * @param {*} value - The value to search for.
   * @returns {Array} - An array of keys that correspond to the given value.
   */
  static atValue(obj, value) {
    return Object.keys(obj).filter((key) => obj[key] === value);
  }

  /**
   * Returns the key-value pair at a specific index in the object (without flattening).
   * @param {Object} obj - The object to query.
   * @param {number} index - The index to access.
   * @returns {Array|undefined} - The key-value pair entry as an array [key, value], or undefined if out of bounds.
   */
  static atIndex(obj, index) {
    const keys = Object.keys(obj);

    if (index < 0 || index >= keys.length) {
      return undefined;
    }

    const key = keys[index];
    const value = obj[key];
    return [key, value];
  }
}

export function toTitleCase(str) {
  return str
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function listIcons(array) {
  let result = "";
  const maxColumns = 2;
  const columnWidth = 20;
  const emojiWidth = 5;

  array.forEach((item, index) => {
    const iconPadding = 4 + Math.floor(item.name.length / 2) - 2;
    const centeredIcon =
      " ".repeat(iconPadding) +
      item.icon +
      " ".repeat(columnWidth - emojiWidth - iconPadding);

    const centeredName = " ".repeat(4) + `**${toTitleCase(item.name)}**`;

    result += centeredIcon + "\n";
    result += centeredName + "\n";

    if (index % maxColumns === 1) {
      result += "\n";
    }
  });

  return result;
}

export class PrizePool {
  constructor(pool) {
    this.pool = pool || 0;
  }

  /**
   * Adjusts the prize pool by adding or subtracting an amount.
   * @param {number} amount - The amount to adjust the pool by. Can be positive or negative.
   * @throws {Error} If the resulting pool would be negative.
   */
  addLost(amount) {
    const newPool = this.pool + amount;
    if (newPool < 0) {
      throw new Error("Prize pool cannot be negative.");
    }
    this.pool = newPool;
  }

  /**
   * Determines if the player wins based on their bet, the prize pool, and chance.
   * If the prize pool cannot cover the bet, the player automatically loses.
   * @param {number} bet - The player's bet amount.
   * @param {number} [chance=0.5] - The base winning chance (default is 0.5).
   * @returns {boolean} True if the player wins, false otherwise.
   */
  getOdds(bet, chance = 0.5) {
    if (bet > this.pool) return false;
    return Math.random() < chance;
  }

  /**
   * Determines if the player wins based solely on chance, ignoring the prize pool.
   * @param {number} [chance=0.5] - The base winning chance (default is 0.5).
   * @returns {boolean} True if the player wins, false otherwise.
   */
  getOddsNoPool(chance = 0.5) {
    return Math.random() < chance;
  }

  /**
   * Returns the current prize pool amount.
   * @returns {number} The current prize pool amount.
   */
  getPoolAmount() {
    return this.pool;
  }

  /**
   * Clears the prize pool, resetting it to zero.
   */
  clearPool() {
    this.pool = 0;
  }
}

/**
 * Clamps a value to ensure it is within the specified range.
 *
 * @param {number} min - The minimum allowable value.
 * @param {number} desired - The value to clamp.
 * @param {number} max - The maximum allowable value.
 * @returns {number} The clamped value.
 * @throws {TypeError} If any of the arguments are not numbers.
 * @throws {RangeError} If `min` is greater than `max`.
 */
export function clamp(min, desired, max) {
  if (
    typeof min !== "number" ||
    typeof desired !== "number" ||
    typeof max !== "number"
  ) {
    throw new TypeError("All arguments must be numbers.");
  }
  if (min > max) {
    throw new RangeError(
      "The minimum value cannot be greater than the maximum value."
    );
  }
  return Math.min(Math.max(desired, min), max);
}
