// @ts-check
// Check global.d.ts this all has types now lmao.
import { CassTypes } from "@cass-modules/type-validator";
import { fonts } from "./handlers/styler.js/fonts.js";
import { createCallable } from "@cass-modules/callable-obj";
const { ExtendClass, randArrValue, randArrIndex } = global.utils;

function extend() {
  ExtendClass(
    "toCallable",
    function () {
      if (Reflect.ownKeys(this.prototype ?? {}).length > 0) {
        // @ts-ignore
        return (...args) => new this(...args);
      }
      return (...args) => this(...args);
    },
    Function
  );

  ExtendClass(
    "memoizeDeep",
    function () {
      const fn = this;
      const cache = new Map();

      function deepHash(args) {
        return JSON.stringify(args, (_, value) =>
          typeof value === "function" ? value.toString() : value
        );
      }

      return function (...args) {
        const key = deepHash(args);
        if (cache.has(key)) {
          return cache.get(key);
        }
        // @ts-ignore
        const result = fn.apply(this, args);
        cache.set(key, result);
        return result;
      };
    },
    Function
  );

  ExtendClass(
    "retry",
    function (attempts) {
      const fn = this;
      return async function (...args) {
        let lastError;
        for (let i = 0; i < attempts; i++) {
          try {
            // @ts-ignore
            return await fn.apply(this, args);
          } catch (err) {
            lastError = err;
            if (i === attempts - 1) throw lastError;
          }
        }
      };
    },
    Function
  );

  ExtendClass(
    "assignStatic",
    function (record) {
      return createCallable((...args) => this(...args), record);
    },
    Function
  );

  ExtendClass(
    "throttle",
    function (ms) {
      const fn = this;
      let lastExecuted = 0;
      return function (...args) {
        const now = Date.now();
        if (now - lastExecuted >= ms) {
          lastExecuted = now;
          // @ts-ignore
          return fn.apply(this, args);
        }
      };
    },
    Function
  );

  ExtendClass(
    "tap",
    function (callback) {
      const fn = this;
      return function (...args) {
        callback(...args);
        // @ts-ignore
        return fn.apply(this, args);
      };
    },
    Function
  );

  ExtendClass(
    "wrap",
    function (callback) {
      const fn = this;
      return function (...args) {
        // @ts-ignore
        const returnValue = callback(fn, ...args);
      };
    },
    Function
  );

  ExtendClass(
    "invokeMultiple",
    function (count, ...args) {
      const fn = this;
      return Array.from({ length: count }, (_) => fn(...args));
    },
    Function
  );

  ExtendClass(
    "invokeMultipleSettled",
    function (count, ...args) {
      const fn = this;
      return Array.from({ length: count }, (_) => {
        try {
          const returned = fn(...args);
          return { returned, error: null };
        } catch (error) {
          return { returned: null, error };
        }
      });
    },
    Function
  );

  ExtendClass(
    "after",
    function (delay, unit = "ms") {
      const fn = this;
      const units = { ms: 1, s: 1000, m: 60000 };
      const delayInMs = delay * units[unit];

      return function (...args) {
        return new Promise((resolve) => {
          setTimeout(() => {
            // @ts-ignore
            resolve(fn.apply(this, args));
          }, delayInMs);
        });
      };
    },
    Function
  );

  ExtendClass(
    "chain",
    function (nextFn) {
      const fn = this;
      return function (...args) {
        // @ts-ignore
        return nextFn(fn.apply(this, args));
      };
    },
    Function
  );

  ExtendClass(
    "time",
    function () {
      const fn = this;
      return function (...args) {
        const start = performance.now?.() ?? Date.now();
        // @ts-ignore
        const result = fn.apply(this, args);
        const end = performance.now?.() ?? Date.now();
        console.log(`Execution time: ${(end - start).toFixed(2)}ms`);
        return result;
      };
    },
    Function
  );

  ExtendClass(
    "defer",
    function () {
      const fn = this;
      return function (...args) {
        // @ts-ignore
        return Promise.resolve().then(() => fn.apply(this, args));
      };
    },
    Function
  );

  ExtendClass(
    "guard",
    function (config) {
      const fn = this;
      const schema = new CassTypes.Validator(config);
      return function (...args) {
        // @ts-ignore
        schema.validate(args);
        // @ts-ignore
        return fn.apply(this, args);
      };
    },
    Function
  );

  ExtendClass(
    "observe",
    function (callback) {
      const fn = this;
      return function (...args) {
        // @ts-ignore
        const result = fn.apply(this, args);
        // @ts-ignore
        callback({ args, result, fn });
        return result;
      };
    },
    Function
  );

  ExtendClass("cloneByJSON", function () {
    return JSON.parse(JSON.stringify(this));
  });

  ExtendClass("randomKey", function () {
    return Object.keys(
      this
    )[Math.floor(Math.random() * Object.keys(this).length)];
  });

  ExtendClass("randomEntry", function () {
    return Object.entries(
      this
    )[Math.floor(Math.random() * Object.keys(this).length)];
  });

  ExtendClass(
    "remove",
    function (...itemsToRemove) {
      const arr = this;
      itemsToRemove.forEach((item) => {
        const index = arr.indexOf(item);
        if (index !== -1) {
          arr.splice(index, 1);
        }
      });
      return arr;
    },
    Array
  );

  ExtendClass("randomValue", function () {
    return this[this.randomKey()];
  });

  ExtendClass(
    "randomValue",
    function () {
      return randArrValue(this);
    },
    Array
  );

  ExtendClass(
    "formatWith",
    function (...replacers) {
      let result = this.toString();
      for (let i = replacers.length; i >= 1; i--) {
        const placeholder = `%${i}`;
        const replacer = replacers[i - 1];
        if (replacer !== undefined) {
          let replacement;
          if (typeof replacer === "function") {
            // @ts-ignore
            replacement = String(replacer(i));
          } else {
            replacement = String(replacer);
          }
          result = result.replaceAll(placeholder, replacement);
        }
      }
      return result;
    },
    String
  );

  ExtendClass(
    "randomIndex",
    function () {
      return randArrIndex(this);
    },
    Array
  );

  ExtendClass("toJSONString", function () {
    // @ts-ignore
    return JSON.stringify(this.toJSON());
  });

  ExtendClass("typeof", function () {
    return typeof this;
  });

  ExtendClass(
    "toUnique",
    function () {
      return [...new Set(this)];
    },
    Array
  );

  ExtendClass("removeFalsy", function () {
    for (const key in this) {
      if (!this[key]) {
        delete this[key];
      }
    }
  });

  ExtendClass(
    "removeFalsy",
    function () {
      return this.filter((i) => !!i);
    },
    Array
  );

  ExtendClass(
    "toFonted",
    function (font) {
      // @ts-ignore
      return fonts[font](this);
    },
    String
  );

  ExtendClass(
    "toTitleCase",
    function () {
      return this.charAt(0).toUpperCase() + this.slice(1).toLowerCase();
    },
    String
  );

  ExtendClass(
    "map",
    function (callback) {
      // @ts-ignore
      const string = this.split("");
      return string.map(callback);
    },
    String
  );

  ExtendClass("forEachKey", function (callback) {
    // @ts-ignore
    return Object.keys(this).forEach((key) => callback(key, this[key]));
  });

  ExtendClass("mapAsync", async function (callback) {
    // @ts-ignore
    const deep = { ...this };
    for (const item in deep) {
      // @ts-ignore
      deep[item] = await callback(deep[item]);
    }
    return deep;
  });

  ExtendClass("map", function (callback) {
    // @ts-ignore
    const deep = { ...this };
    for (const item in deep) {
      // @ts-ignore
      deep[item] = callback(deep[item]);
    }
    return deep;
  });
}

export default extend;
