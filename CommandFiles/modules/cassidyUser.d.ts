// import type { Inventory, Collectibles } from "../plugins/ut-shop.js";
// import type { CassEXP } from "./cassEXP.js";

declare module "cassidy-userData" {
  type InventoryTypes =
    | "generic"
    | "weapon"
    | "armor"
    | "key"
    | "food"
    | "anypet_food"
    | "cheque"
    | `${string}_food`
    | `${string}`;

  interface UserStatsManagerOld {
    filePath: string;
    defaults: { money: number; exp: number };

    isMongo: boolean;

    process(data: Partial<UserData>): UserData;

    calcMaxBalance(users: Record<string, UserData>, specificID: string): number;

    connect(): Promise<void>;

    extractMoney(userData: UserData): {
      money: number;
      total: number;
      bank: number;
      lendAmount: number;
      cheques: number;
    };

    get(key: string): Promise<UserData>;
    getCache(key: string): Promise<UserData>;

    deleteUser(key: string): Promise<void>;

    remove(
      key: string,
      removedProperties: string[]
    ): Promise<Record<string, UserData>>;

    set(key: string, updatedProperties?: Partial<UserData>): Promise<void>;

    getAll(): Promise<Record<string, UserData>>;

    readMoneyFile(): Record<string, UserData>;

    writeMoneyFile(data: Record<string, UserData>): void;

    toLeanObject(): Promise<Record<string, UserData>>;
  }

  type BaseInventoryItem = {
    key: string;
    name: string;
    flavorText: string;
    icon: string;
    sellPrice?: number;
    type: InventoryTypes;
    /**
     * @deprecated
     */
    index: number;
  };

  type WeaponInventoryItem = {
    atk: number;
    def?: number;
    magic?: number;
    type: "weapon";
  };

  type ArmorInventoryItem = {
    atk?: number;
    def: number;
    magic?: number;
    type: "armor";
  };

  type ChequeItem = {
    chequeAmount: number;
    type: "cheque";
  };

  type PetUncaged = {
    name: string;
    key: string;
    flavorText: string;
    icon: string;
    type: "pet";
    sellPrice: number;
    cannotToss: false;
    petType: string;
    level: number;
    lastFeed: number;
    lastExp: number;
    lastSaturation: number;
    lastFoodEaten: string;
  };

  type InventoryItem =
    | (BaseInventoryItem & WeaponInventoryItem)
    | (BaseInventoryItem & ArmorInventoryItem)
    | (BaseInventoryItem & ChequeItem)
    | BaseInventoryItem;

  type UserData = {
    nameMeta?:
      | undefined
      | {
          name: string;
          nonEmojis: string;
          emojis: string;
          finalName: string;
        };
    money: number;
    userID?: string;
    inventory?: InventoryItem[];
    petsData?: InventoryItem & PetUncaged;
    /**
     * @deprecated
     */
    exp: number;
    name?: string | "Unregistered";
    lastModified?: number;
    cassEXP?: any;
    tilesKeys?: string[];
    shopInv?: { [key: string]: boolean };
    boxItems?: InventoryItem[];
    battlePoints: number;
    extensionIDs?: string[];
    [key: string]: any;
    threadInfo?: {
      threadID: string;
      threadName: string;
      emoji: string;
      adminIDs: { id: string }[];
      participantIDs: string[];
      isGroup: boolean;
    };
    tdCreateTime?: {
      timestamp: number;
    };
    userMeta?: {
      name: string;
      image: string;
      url: string;
      desc: string;
    };
  };

  type NullableUserData = {
    [K in keyof UserData]?: UserData[K] | null;
  };

  // type TypedUserData = UserData & {
  //   inventory: Inventory;
  //   collectibles: Collectibles;
  //   cassEXP: CassEXP;
  //   petsData: Inventory;
  // };

  type UserStatsManager = import("../../handlers/database/handleStat").default;

  export {
    UserData,
    InventoryItem,
    BaseInventoryItem,
    ArmorInventoryItem,
    WeaponInventoryItem,
    InventoryTypes,
    NullableUserData,
    UserStatsManager,
    // TypedUserData,
  };
}
