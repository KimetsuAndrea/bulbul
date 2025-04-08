import { ReduxCMDHome } from "@cassidy/redux-home";
import { UNIRedux } from "@cassidy/unispectra";

export const meta = {
  name: "vault",
  description:
    "Organize and manage your external inventory with an additional 100 slots.",
  author: "Liane Cagara | JenicaDev",
  version: "1.1.4",
  usage: "{prefix}vault <action> [arguments]",
  category: "Inventory",
  permissions: [0],
  noPrefix: false,
  waitingTime: 1,
  otherNames: ["box", "bx", "vt"],
  shopPrice: 10000,
  requirement: "3.0.0",
  icon: "🗃️",
};

const { invLimit } = global.Cassidy;

export const style = {
  title: "Vault 🗃️",
  titleFont: "bold",
  contentFont: "fancy",
};

export async function entry(ctx) {
  const { input, output, money, args, Inventory, prefix } = ctx;
  const userData = await money.get(input.senderID);
  let userInventory = new Inventory(userData.inventory);

  let [...actionArgs] = args;
  let newActionArgs = [];
  for (let i = 0; i < actionArgs.length; i++) {
    const value = actionArgs[i];
    let [key, amount = "1"] = value.split("*");
    amount = parseInt(amount);
    if (isNaN(amount)) {
      amount = 1;
    }
    if (amount > invLimit) {
      amount = invLimit;
    }
    for (let j = 0; j < amount; j++) {
      newActionArgs.push(key);
    }
  }
  actionArgs = newActionArgs;

  let vaultItems = userData.boxItems || [];
  let vaultInventory = new Inventory(vaultItems, 100);

  async function createList() {
    const vaultItemsList = vaultInventory.getAll();
    const invItemsList = userInventory.getAll();

    let vaultItemList = `${UNIRedux.arrow} ***Vault Items***\n\n`;
    let invItemList = `${UNIRedux.arrow} ***Inventory Items***\n\n`;

    const invCounts = new Map();
    invItemsList.forEach((item) => {
      invCounts.set(item.key, (invCounts.get(item.key) || 0) + 1);
    });
    invItemList +=
      invCounts.size > 0
        ? Array.from(invCounts.entries())
            .map(([key, count]) => {
              const item = invItemsList.find((i) => i.key === key);
              return `${item.icon} **${item.name}**${
                count > 1 ? ` (x${count})` : ""
              } [${item.key}]`;
            })
            .join("\n")
        : "No items available.";

    const vaultCounts = new Map();
    vaultItemsList.forEach((item) => {
      vaultCounts.set(item.key, (vaultCounts.get(item.key) || 0) + 1);
    });
    vaultItemList +=
      vaultCounts.size > 0
        ? Array.from(vaultCounts.entries())
            .map(([key, count]) => {
              const item = vaultItemsList.find((i) => i.key === key);
              return `${item.icon} **${item.name}**${
                count > 1 ? ` (x${count})` : ""
              } [${item.key}]`;
            })
            .join("\n")
        : "No items available.";

    return (
      `👤 **${
        userData.name || "Unregistered"
      }** (**${userInventory.size()}/${invLimit}**)\n\n` +
      `${invItemList}\n\n` +
      `${UNIRedux.standardLine}\n` +
      `🗃️ **Vault** (**${vaultInventory.size()}/100**)\n\n` +
      `${vaultItemList}`
    );
  }

  const home = new ReduxCMDHome(
    {
      isHypen: true,
    },
    [
      {
        key: "list",
        description: "Lists all items in your vault inventory",
        aliases: ["-l"],
        async handler() {
          return output.reply(`${await createList()}`);
        },
      },
      {
        key: "check",
        description: "Check someone's items.",
        args: ["<uid>"],
        aliases: ["-c"],
        async handler() {
          const {
            inventory = [],
            vaultItems = [],
            name = "Unregistered",
          } = await money.get(actionArgs[0]);
          vaultInventory = new Inventory(vaultItems, 100);
          userInventory = new Inventory(inventory);
          return output.reply(`✅ Checking ${name}\n\n${await createList()}`);
        },
      },
      {
        key: "store",
        aliases: ["-s"],
        description: "Store an item from your inventory into the vault.",
        args: ["<key1> <key2> <...etc>"],
        async handler() {
          const keysToStore = actionArgs;
          if (keysToStore.length < 1) {
            return output.reply(
              `❌ Please specify an item key to store.\n\n${await createList()}`
            );
          }
          let str = ``;
          for (const keyToStore of keysToStore) {
            const itemToStore = userInventory.getOne(keyToStore);
            if (!itemToStore) {
              str += `❌ Item with key "${keyToStore}" not found in your inventory.\n`;
              continue;
            }
            if (vaultInventory.getAll().length >= 100) {
              str += `❌ The vault is full.\n`;
              continue;
            }
            if (itemToStore.cannotvault === true) {
              str += `❌ "${keyToStore}" can’t be stored in the vault.\n`;
              continue;
            }
            userInventory.deleteOne(keyToStore);
            vaultInventory.addOne(itemToStore);
            str += `✅ Stored ${itemToStore.icon} **${itemToStore.name}** in the vault.\n`;
          }
          await money.set(input.senderID, {
            inventory: Array.from(userInventory),
            boxItems: Array.from(vaultInventory),
          });
          return output.reply(`${str.trim()}\n\n${await createList()}`);
        },
      },
      {
        key: "retrieve",
        aliases: ["-r"],
        description: "Retrieve an item from the vault into your inventory.",
        args: ["<key1> <key2> <...etc>"],
        async handler() {
          const keysToRetrieve = actionArgs;
          if (keysToRetrieve.length < 1) {
            return output.reply(
              `❌ Please specify an item key to retrieve.\n\n${await createList()}`
            );
          }
          let str = ``;
          for (const keyToRetrieve of keysToRetrieve) {
            const itemToRetrieve = vaultInventory.getOne(keyToRetrieve);
            if (!itemToRetrieve) {
              str += `❌ Item with key "${keyToRetrieve}" not found in the vault.\n`;
              continue;
            }
            if (userInventory.getAll().length >= invLimit) {
              str += `❌ Your inventory is full.\n`;
              continue;
            }
            vaultInventory.deleteOne(keyToRetrieve);
            userInventory.addOne(itemToRetrieve);
            str += `✅ Retrieved ${itemToRetrieve.icon} **${itemToRetrieve.name}** from the vault.\n`;
          }
          await money.set(input.senderID, {
            inventory: Array.from(userInventory),
            boxItems: Array.from(vaultInventory),
          });
          return output.reply(`${str.trim()}\n\n${await createList()}`);
        },
      },
    ]
  );
  home.runInContext(ctx);
}
