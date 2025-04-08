import type * as Cass from "cassidy-userData";
import type {
  Inventory,
  Collectibles,
} from "./CommandFiles/plugins/ut-shop.js";

import type * as CassidyStylerNPM from "cassidy-styler";

import type InputX from "input-cassidy";
import type { ReplySystem, ReactSystem } from "input-cassidy";

import type OutputX from "output-cassidy";
import type {
  OutputForm,
  OutputProps,
  OutputResult,
  StrictOutputForm,
} from "output-cassidy";
import { CassEXP } from "./CommandFiles/modules/cassEXP.js";
import type {
  GameSimulator,
  GameSimulatorProps,
  Item,
} from "./CommandFiles/types/gamesimu.d.ts";
import GlobalUtilsX from "./utils-type";

declare global {
  var package: typeof import("./package.json");
  var logger: (text: any, title?: string, valueOnly?: boolean) => void;
  interface FactoryConfig {
    title: string;
    key: string;
    init: {
      slot: number;
      proc: number;
    };
    upgrades: {
      slot: number;
      proc: number;
    };
    recipes: Recipe[];
  }

  interface Recipe {
    name: string;
    icon: string;
    levelRequirement: number;
    waitingTime: number;
    ingr: IngredientGroup[];
    result: any;
  }

  type IngredientGroup = Ingredient | Ingredient[];

  interface Ingredient {
    name: string;
    icon: string;
    amount: number;
    key: string;
  }
  interface InventoryConstructor extends Inventory {}
  interface GameSimulatorConstructor extends GameSimulator {}

  interface CommandContextOG {
    [key: string]: unknown;
    money: Cass.UserStatsManager;
    Inventory: typeof Inventory;
    Collectibles: typeof Collectibles;
    input: InputX;
    output: OutputProps;
    args: string[];
    cancelCooldown?: Function;
    commandName?: string;
    prefix: string;
    prefixes: string[];
    CassEXP: typeof CassEXP;
    commands: { [key: string]: CassidySpectra.CassidyCommand };
    command?: CassidySpectra.CassidyCommand;
    userDataCache?: UserData;
    GameSimulator: typeof GameSimulator;
    replyStystem?: ReplySystem;
    reactSystem?: ReactSystem;
    threadsDB: UserStatsManager;
    usersDB: UserStatsManager;
    api: any;
    event: any;
    allPlugins: { [key: string]: any };
    queue: any[][];
    origAPI: any;
    hasPrefix: boolean;
    invTime: number;
    icon: string;
    Cassidy: CassidySpectra.GlobalCassidy;
    safeCalls: number;
    discordApi: any;
    pageApi: any;
    awaitStack: { [key: string]: string[] };
    setAwaitStack: (id: string, key: string) => void;
    delAwaitStack: (id: string, key: string) => void;
    hasAwaitStack: (id: string, key: string) => boolean;
    clearCurrStack: () => void;
    allObj: CommandContext;
    userStat: Cass.UserStatsManager;
    next?: () => void;
    styler?: CassidyResponseStylerControl;
    ctx: CommandContext;
    isCommand?: true | undefined;
    ShopClass?: typeof import("@cass-plugins/shopV2.js").ShopClass;
    outputOld?: (body: OutputForm, options: StrictOutputForm) => OutputResult;
    getLang?: ReturnType<LangParser["createGetLang"]>;
    langParser: LangParser;
    // OutputJSX: ReturnType<typeof defineOutputJSX>;
    // UserStatsJSX: ReturnType<typeof defineUserStatsJSX>;
  }

  type CommandContext = CommandContextOG;

  type CommandEntry = (
    ctx: CommandContext,
    ...args: any[]
  ) => any | Promise<any>;

  type UserData = Cass.UserData;

  var utils: typeof GlobalUtilsX;

  var loadSymbols: Map<string, symbol>;

  export namespace CassidySpectra {
    export interface CommandContext extends CommandContextOG {}
    export interface GlobalCassidy {
      config: typeof import("./settings.json");
      uptime: number;
      plugins: Record<string, any>;
      commands: Record<string, CassidySpectra.CassidyCommand>;
      invLimit: number;
      replies: Record<
        string,
        import("input-cassidy").RepliesObj<
          import("input-cassidy").StandardReplyArg
        >
      >;
      presets: Map<any, any>;
      loadCommand: Function;
      loadPlugins: Function;
      loadAllCommands: Function;
      readonly logo: any;
      oldLogo: string;
      accessToken: string | null;
      readonly redux: boolean;
      readonly spectra: boolean;
      readonly highRoll: 10_000_000;
    }

    export type Output = OutputX;
    export type Input = InputX;
    export type InventoryConstructor = typeof Inventory;
    export type CollectiblesConstructor = typeof Collectibles;

    export interface CassidyCommand {
      meta: CommandMeta;
      entry: CommandHandler;
      cooldown?: CommandHandler;
      noWeb?: CommandHandler;
      noPermission?: CommandHandler;
      needPrefix?: CommandHandler;
      banned?: CommandHandler;
      shopLocked?: CommandHandler;
      awaiting?: CommandHandler;
      langs?: Record<string, Record<string, string>>;
      indivMeta?: ConstructorParameters<
        typeof SpectralCMDHome
      >["0"]["entryInfo"];
      middleware?: CommandMiddleware[];
      loaders?: CommandLoader[];
      onError?: ErrorHandler;
      onCooldown?: CooldownHandler;
      duringLoad?: DuringLoadHandler;
      noPrefix?: CommandHandler;
      modLower?: CommandHandler;
      reply?: CommandHandler;
      style?: any;
      event?: CommandHandler;
      [name: string]: any;
    }

    export interface CommandMeta {
      name: string;
      description: string;
      usage?: string;
      category: string;
      version: string;
      permissions?: number[];
      author?: string;
      otherNames?: string[];
      ext_plugins?: Record<string, string>;
      waitingTime?: number;
      botAdmin?: boolean;
      dependencies?: Record<string, string>;
      whiteList?: string[];
      noPrefix?: boolean | "both";
      allowModerators?: boolean;
      icon?: string;
      requirement?: string;
      supported?: string;
      args?: {
        degree: number;
        fallback: null | string;
        response: string | null;
        search: null | string;
        required: boolean;
      }[];
      noWeb?: boolean;
      params?: any[];
      legacyMode?: boolean;
      [name: string]: any;
    }

    export type CommandHandler = (
      context: CommandContext
    ) => Promise<any> | any;

    export type CommandMiddleware = (
      context: CommandContext,
      next: () => Promise<void>
    ) => Promise<void>;

    export type CommandLoader = (
      context: CommandContext
    ) => Promise<void> | void;

    export type ErrorHandler = (
      error: Error,
      context: CommandContext
    ) => Promise<void> | void;

    export type CooldownHandler = (
      context: CommandContext
    ) => Promise<void> | void;

    export type DuringLoadHandler = () => Promise<void> | void;
  }
}

declare global {
  var Cassidy: CassidySpectra.GlobalCassidy;
  var handleStat: UserStatsManager;

  var require: NodeRequire & {
    url(url: string): Promise<any>;
  };

  var cassMongoManager: CassMongoManager | undefined;
}

import type * as FileType from "file-type";

import type { UserStatsManager } from "cassidy-userData";
import { CassMongoManager } from "./handlers/database/cass-mongo";
import type { CassidyResponseStylerControl } from "@cassidy/styler";
import { SpectralCMDHome } from "@cassidy/spectral-home";
import { LangParser } from "@cass-modules/langparser";
import * as GoatFill from "@cassidy/polyfills/goatbot";
import { CassTypes } from "@cass-modules/type-validator";
import { createCallable } from "@cass-modules/callable-obj";
import { VNode } from "@cass/define";
// import { defineOutputJSX, defineUserStatsJSX, VNode } from "@cass/define";
declare global {
  var fileTypePromise: Promise<typeof FileType>;
  /**
   * Custom utility type to mark CassidySpectra-specific extensions
   * @internal
   */
  type WasCustom<T> = T & { readonly _cass_extends?: true };

  /** Falsy values as per JavaScript */
  type Falsy = false | null | undefined | "" | 0;

  interface Object {
    /**
     * Creates a deep clone of the object using JSON serialization.
     * @template T - The type of the object being cloned
     * @returns A deep clone of the original object
     * @custom CassidySpectra - Exclusive to CassidySpectra projects
     * @warning May cause side effects outside CassidySpectra; avoid in other codebases
     * @reusable Safe within CassidySpectra projects
     */
    cloneByJSON<T>(this: T): T;

    /**
     * Returns a random key from the object.
     * @returns A random key from the object
     * @custom CassidySpectra - Exclusive to CassidySpectra projects
     * @warning May cause side effects outside CassidySpectra; avoid in other codebases
     * @reusable Safe within CassidySpectra projects
     */
    randomKey<T extends Record<string, any>>(this: T): string;

    /**
     * Returns a random [key, value] entry from the object.
     * @returns A tuple containing a random key and its value
     * @custom CassidySpectra - Exclusive to CassidySpectra projects
     * @warning May cause side effects outside CassidySpectra; avoid in other codebases
     * @reusable Safe within CassidySpectra projects
     */
    randomEntry<T extends Record<string, any>>(this: T): [string, T[keyof T]];

    /**
     * Returns a random value from the object.
     * @returns A random value from the object
     * @custom CassidySpectra - Exclusive to CassidySpectra projects
     * @warning May cause side effects outside CassidySpectra; avoid in other codebases
     * @reusable Safe within CassidySpectra projects
     */
    randomValue<T extends Record<string, any>>(this: T): T[keyof T];

    /**
     * Converts the object to a JSON string using its toJSON method if available.
     * @returns A JSON string representation of the object
     * @custom CassidySpectra - Exclusive to CassidySpectra projects
     * @warning May cause side effects outside CassidySpectra; avoid in other codebases
     * @reusable Safe within CassidySpectra projects
     */
    toJSONString(this: { toJSON(): any }): string;

    /**
     * Returns the typeof result for the object.
     * @returns The type of the object as a string
     * @custom CassidySpectra - Exclusive to CassidySpectra projects
     * @warning May cause side effects outside CassidySpectra; avoid in other codebases
     * @reusable Safe within CassidySpectra projects
     */
    typeof(this: unknown): string;

    /**
     * Removes falsy values from the object in-place.
     * @custom CassidySpectra - Exclusive to CassidySpectra projects
     * @warning May cause side effects outside CassidySpectra; avoid in other codebases
     * @reusable Safe within CassidySpectra projects
     */
    removeFalsy<T extends Record<string, any>>(this: T): void;

    /**
     * Iterates over each key-value pair in the object.
     * @template T - The type of the object
     * @param callback - Function to execute for each key-value pair
     * @custom CassidySpectra - Exclusive to CassidySpectra projects
     * @warning May cause side effects outside CassidySpectra; avoid in other codebases
     * @reusable Safe within CassidySpectra projects
     */
    forEachKey<T extends Record<string, any>>(
      this: T,
      callback: (key: string, value: T[keyof T]) => void
    ): void;

    /**
     * Asynchronously maps over the object's values.
     * @template T - The type of the object's values
     * @template U - The type of the mapped values
     * @param callback - Async function to transform each value
     * @returns A promise resolving to a new object with transformed values
     * @custom CassidySpectra - Exclusive to CassidySpectra projects
     * @warning May cause side effects outside CassidySpectra; avoid in other codebases
     * @reusable Safe within CassidySpectra projects
     */
    mapAsync<T, U>(
      this: Record<string, T>,
      callback: (value: T, key: string) => Promise<U>
    ): Promise<Record<string, U>>;

    /**
     * Maps over the object's values synchronously.
     * @template T - The type of the object's values
     * @template U - The type of the mapped values
     * @param callback - Function to transform each value
     * @returns A new object with transformed values
     * @custom CassidySpectra - Exclusive to CassidySpectra projects
     * @warning May cause side effects outside CassidySpectra; avoid in other codebases
     * @reusable Safe within CassidySpectra projects
     */
    map<T, U>(
      this: Record<string, T>,
      callback: (value: T, key: string) => U
    ): Record<string, U>;
  }

  interface Array<T> {
    /**
     * Returns a random value from the array.
     * @returns A random element from the array
     * @custom CassidySpectra - Exclusive to CassidySpectra projects
     * @warning May cause side effects outside CassidySpectra; avoid in other codebases
     * @reusable Safe within CassidySpectra projects
     */
    randomValue(this: T[]): T;

    /**
     * Returns a random index from the array.
     * @returns A random index number
     * @custom CassidySpectra - Exclusive to CassidySpectra projects
     * @warning May cause side effects outside CassidySpectra; avoid in other codebases
     * @reusable Safe within CassidySpectra projects
     */
    randomIndex(this: T[]): number;

    /**
     * Returns a new array with unique values.
     * @returns A new array containing only unique elements
     * @custom CassidySpectra - Exclusive to CassidySpectra projects
     * @warning May cause side effects outside CassidySpectra; avoid in other codebases
     * @reusable Safe within CassidySpectra projects
     */
    toUnique(this: T[]): T[];

    /**
     * Returns a new array with falsy values removed.
     * @template U - The non-falsy type
     * @returns A new array containing only truthy elements
     * @custom CassidySpectra - Exclusive to CassidySpectra projects
     * @warning May cause side effects outside CassidySpectra; avoid in other codebases
     * @reusable Safe within CassidySpectra projects
     */
    removeFalsy<U>(this: (U | Falsy)[]): U[];

    /**
     * Removes specified items from the array and returns the new array.
     * @param itemsToRemove - Items to remove from the array
     * @returns A new array with specified items removed
     * @custom CassidySpectra - Exclusive to CassidySpectra projects
     * @warning May cause side effects outside CassidySpectra; avoid in other codebases
     * @reusable Safe within CassidySpectra projects
     */
    remove(this: T[], ...itemsToRemove: T[]): T[];
  }

  interface String {
    /**
     * Applies a font transformation to the string.
     * @param font - The font to apply
     * @returns The transformed string
     * @custom CassidySpectra - Exclusive to CassidySpectra projects
     * @warning May cause side effects outside CassidySpectra; avoid in other codebases
     * @reusable Safe within CassidySpectra projects
     */
    toFonted(this: string, font: string): string;

    /**
     * Converts the string to title case.
     * @returns The string in title case
     * @custom CassidySpectra - Exclusive to CassidySpectra projects
     * @warning May cause side effects outside CassidySpectra; avoid in other codebases
     * @reusable Safe within CassidySpectra projects
     */
    toTitleCase(this: string): string;

    /**
     * Maps over each character in the string.
     * @template U - The type of the mapped values
     * @param callback - Function to transform each character
     * @returns An array of transformed values
     * @custom CassidySpectra - Exclusive to CassidySpectra projects
     * @warning May cause side effects outside CassidySpectra; avoid in other codebases
     * @reusable Safe within CassidySpectra projects
     */
    map<U>(
      this: string,
      callback: (char: string, index: number, array: string[]) => U
    ): U[];

    /**
     * Formats the string by replacing numbered placeholders (%1, %2, etc.) with corresponding values.
     * Placeholders are 1-based and must exactly match the position of the replacer.
     * Unmatched placeholders remain unchanged. Replacers can be strings or functions.
     * @param replacers - The values or functions to replace placeholders with (%1 uses first replacer, %2 uses second, etc.)
     * @returns The formatted string with placeholders replaced where applicable
     * @example
     * "Hello %1, welcome to %2!".formatWith("John", "Earth") // Returns "Hello John, welcome to Earth!"
     * "test%1 and %2test".formatWith(n => n * 2, "b") // Returns "test2 and btest"
     * "Test %123 %12 %1".formatWith("a", "b", "c") // Returns "Test %123 %12 a"
     * @custom CassidySpectra - Exclusive to CassidySpectra projects
     * @warning May cause side effects outside CassidySpectra; avoid in other codebases
     * @reusable Safe within CassidySpectra projects
     */
    formatWith(...replacers: (string | ((position: number) => any))[]): string;
  }

  interface Function {
    /**
     * Converts a class constructor or regular function into a callable wrapper.
     * If the function has a prototype, it instantiates with `new`; otherwise, it invokes normally.
     * @returns A function that can be called with arguments like a factory.
     * @custom CassidySpectra - Exclusive to CassidySpectra projects
     * @reusable Safe within CassidySpectra projects
     */
    toCallable<T extends new (...args: any[]) => any>(
      this: T
    ): (...args: ConstructorParameters<T>) => InstanceType<T>;

    /**
     * Converts a class constructor or regular function into a callable wrapper.
     * If the function has a prototype, it instantiates with `new`; otherwise, it invokes normally.
     * @returns A function that can be called with arguments like a factory.
     * @custom CassidySpectra - Exclusive to CassidySpectra projects
     * @reusable Safe within CassidySpectra projects
     */
    toCallable<T extends (...args: any[]) => any>(
      this: T
    ): (...args: Parameters<T>) => ReturnType<T>;

    /**
     * Caches results of deep-argument function calls using `JSON.stringify` as key.
     * Handles complex arguments including nested objects and functions (serialized by `.toString()`).
     * @returns A memoized version of the function.
     * @custom CassidySpectra - Exclusive to CassidySpectra projects
     * @warning Be cautious of large/deep structures and functions with side effects.
     * @reusable Safe within CassidySpectra projects
     */
    memoizeDeep<T extends (...args: any[]) => any>(this: T): T;

    /**
     * Chains the current function’s output into the next function’s input.
     * Equivalent to `nextFn(fn(...args))`.
     * @param nextFn - A function that takes the output of the current function.
     * @returns A chained function composition.
     * @custom CassidySpectra - Exclusive to CassidySpectra projects
     * @reusable Safe within CassidySpectra projects
     */
    chain<T extends (...args: any[]) => any, U>(
      this: T,
      nextFn: (result: ReturnType<T>) => U
    ): (...args: Parameters<T>) => U;

    /**
     * Logs the duration of the function execution to the console in milliseconds.
     * Useful for profiling or performance tuning.
     * @returns A timed version of the function.
     * @custom CassidySpectra - Exclusive to CassidySpectra projects
     * @reusable Safe within CassidySpectra projects
     */
    time<T extends (...args: any[]) => any>(this: T): T;

    /**
     * Defers the function execution until the next microtask using `Promise.resolve().then()`.
     * Useful for event loop control or async sequencing.
     * @returns A deferred asynchronous version of the function.
     * @custom CassidySpectra - Exclusive to CassidySpectra projects
     * @reusable Safe within CassidySpectra projects
     */
    defer<T extends (...args: any[]) => any>(
      this: T
    ): (...args: Parameters<T>) => Promise<ReturnType<T>>;

    /**
     * Validates the arguments passed into the function using a schema validator.
     * The schema must be compatible with `CassTypes.Validator`.
     * @param config - Schema configuration for validation.
     * @returns A guarded function that throws if inputs do not match schema.
     * @custom CassidySpectra - Exclusive to CassidySpectra projects
     * @warning This assumes global `CassTypes.Validator` is defined and behaves like `zod` or `yup`.
     * @reusable Safe within CassidySpectra projects
     */
    guard<T extends (...args: any[]) => any>(
      this: T,
      config: CassTypes.TypeSchema
    ): T;

    /**
     * Injects a side-effect hook into the function call lifecycle.
     * Useful for debugging, logging, or analytics without modifying the logic.
     * @param callback - Receives the call `args`, `result`, and original `fn`.
     * @returns The function wrapped with an observer hook.
     * @custom CassidySpectra - Exclusive to CassidySpectra projects
     * @reusable Safe within CassidySpectra projects
     */
    observe<T extends (...args: any[]) => any | Function>(
      this: T,
      callback: (info: {
        args: Parameters<T>;
        result: ReturnType<T>;
        fn: T;
      }) => void
    ): T;
  }

  interface Function {
    /**
     * Retries the function if it throws, up to a maximum number of attempts.
     * Useful for transient failures like network requests or flaky operations.
     * @param attempts - Number of retries before giving up
     * @returns A function that automatically retries on failure
     * @custom CassidySpectra - Exclusive to CassidySpectra projects
     * @reusable Safe within CassidySpectra projects
     */
    retry<T extends (...args: any[]) => any>(
      this: T,
      attempts: number
    ): (...args: Parameters<T>) => ReturnType<T>;

    /**
     * Limits function execution to no more than once per `ms` milliseconds.
     * Ignores any extra calls during the cooldown period.
     * @param ms - The time window in milliseconds
     * @returns A throttled version of the function
     * @custom CassidySpectra - Exclusive to CassidySpectra projects
     * @reusable Safe within CassidySpectra projects
     */
    throttle<T extends (...args: any[]) => any>(
      this: T,
      ms: number
    ): (...args: Parameters<T>) => void;

    /**
     * Delays execution of the function until `ms` milliseconds after the last call.
     * Useful for input handling, search boxes, etc.
     * @param ms - Delay duration in milliseconds
     * @returns A debounced version of the function
     * @custom CassidySpectra - Exclusive to CassidySpectra projects
     * @reusable Safe within CassidySpectra projects
     */
    debounce<T extends (...args: any[]) => any>(
      this: T,
      ms: number
    ): (...args: Parameters<T>) => void;

    /**
     * Executes a side-effect function with the same arguments, then proceeds with original execution.
     * Great for debugging, telemetry, or instrumentation.
     * @param callback - Receives the arguments for side-effect
     * @returns The original function with side-effect injection
     * @custom CassidySpectra - Exclusive to CassidySpectra projects
     * @reusable Safe within CassidySpectra projects
     */
    tap<T extends (...args: any[]) => any>(
      this: T,
      callback: (...args: Parameters<T>) => void
    ): T;

    /**
     * Delays the function call by a specified time.
     * Works similarly to `setTimeout` but preserves context and args.
     * @param delay - Time to wait before execution
     * @param unit - Time unit: 'ms', 's', or 'm'
     * @returns A version of the function that executes after the delay
     * @custom CassidySpectra - Exclusive to CassidySpectra projects
     * @warning Timing is approximate; uses `setTimeout` under the hood
     * @reusable Safe within CassidySpectra projects
     */
    after<T extends (...args: any[]) => any>(
      this: T,
      delay: number,
      unit?: "ms" | "s" | "m"
    ): (...args: Parameters<T>) => Promise<ReturnType<T>>;

    /**
     * Assigns a static.
     * @custom CassidySpectra - Exclusive to CassidySpectra projects
     * @warning Timing is approximate; uses `setTimeout` under the hood
     * @reusable Safe within CassidySpectra projects
     */
    assignStatic<
      T extends (...args: any[]) => any,
      M extends Record<string, any>
    >(
      methods: M
    ): ReturnType<typeof createCallable<T, M>>;

    /**
     * Wraps the function with a callback that intercepts its execution.
     * The callback receives the original function and its arguments.
     * @param callback - A function that takes the original function and its arguments.
     * @returns A wrapped version of the function.
     * @custom CassidySpectra - Exclusive to CassidySpectra projects
     * @reusable Safe within CassidySpectra projects
     */
    wrap<T extends (...args: any[]) => any, R>(
      this: T,
      callback: (fn: T, ...args: Parameters<T>) => R
    ): (...args: Parameters<T>) => R;

    /**
     * Invokes the function multiple times, passing the current index as an argument.
     * @param count - The number of times to invoke the function.
     * @returns An array of results from each invocation.
     * @custom CassidySpectra - Exclusive to CassidySpectra projects
     * @reusable Safe within CassidySpectra projects
     */
    invokeMultiple<T extends (...args: any[]) => any>(
      this: T,
      count: number,
      ...args: Parameters<T>
    ): ReturnType<T>[];

    /**
     * Invokes the function multiple times, passing the current index as an argument.
     * Returns an array of objects containing the result or error for each invocation.
     * @param count - The number of times to invoke the function.
     * @returns An array of objects with `returned` and `error` properties.
     * @custom CassidySpectra - Exclusive to CassidySpectra projects
     * @reusable Safe within CassidySpectra projects
     */
    invokeMultipleSettled<T extends (...args: any[]) => any>(
      this: T,
      count: number,
      ...args: Parameters<T>
    ): { returned: ReturnType<T>; error: unknown }[];
  }

  interface NodeRequire {
    url(url: string): Promise<any>;
    ensure(id: string): any;
  }

  interface OutputJSX {
    reply?: boolean;
    send?: boolean;
    reaction?: boolean;
    form?: StrictOutputForm;
  }

  interface UserStatsJSX {
    key: keyof UserData;
  }

  export type FirstArg<T> = T extends (arg1: infer A, ...args: any[]) => any
    ? A
    : never;

  namespace JSX {
    type Element = VNode;

    type ElementFragment = VNode;

    interface IntrinsicElements {
      output: OutputJSX;
      userdata: UserStatsJSX;
    }
  }

  var GoatBot: typeof GoatFill.GoatBot;
  var client: typeof GoatFill.client;
  var db: typeof GoatFill.db;
}
