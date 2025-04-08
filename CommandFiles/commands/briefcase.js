// @ts-check
import { UNIRedux } from "@cassidy/unispectra";
import { GearsManage, PetPlayer } from "../plugins/pet-fight.js";
import { Collectibles, Inventory } from "../plugins/ut-shop.js";
import { SpectralCMDHome } from "@cassidy/spectral-home";

export const meta = {
  name: "briefcase",
  description: "Manage your items.",
  author: "Liane Cagara | JenicaDev",
  version: "1.3.1",
  usage: "{prefix}inventory <action> [args]",
  category: "Inventory",
  permissions: [0],
  noPrefix: false,
  waitingTime: 1,
  otherNames: ["case", "brief", "bc"],
  requirement: "2.5.0",
  icon: "🧰",
};

const { invLimit } = global.Cassidy;

export const style = {
  title: "Briefcase 🧰",
  titleFont: "bold",
  contentFont: "fancy",
};
const { parseCurrency: pCy } = global.utils;

/**
 *
 * @param {CommandContext} param0
 * @returns
 */
export async function entry({ ...ctx }) {
  const { input, output, money, args, prefix, generateTreasure, commandName } =
    ctx;
  let userData = await money.get(input.senderID);

  const { inventory, petsData, gearsData, collectibles } = getDatas(userData);

  const userDataCopy = userData;
  function getDatas({ ...data }) {
    const inventory = new Inventory(data.inventory);
    data.petsData ??= [];
    const petsData = new Inventory(data.petsData);
    const gearsData = new GearsManage(data.gearsData);
    const collectibles = new Collectibles(data.collectibles ?? []);
    return { inventory, petsData, gearsData, collectibles };
  }
  const a = UNIRedux.standardLine;

  function getPetList(
    newData = petsData,
    newGear = gearsData,
    targetItem = {},
    index = 0
  ) {
    return newData
      .getAll()
      .map((pet) => {
        const gearData = newGear.getGearData(pet.key);
        const player = new PetPlayer(pet, gearData.toJSON());
        const gearDataAfter = gearData.clone();
        if (targetItem.type === "armor") {
          gearDataAfter.equipArmor(index, targetItem);
        } else if (targetItem.type === "weapon") {
          gearDataAfter.equipWeapon(targetItem);
        }
        const playerAfter = new PetPlayer(pet, gearDataAfter.toJSON());
        const atkDiff = playerAfter.ATK - player.ATK;
        const defDiff = playerAfter.DF - player.DF;
        const magicDiff = playerAfter.MAGIC - player.MAGIC;
        return `${player.getPlayerUI()}\nATK **${player.ATK} -> ${
          player.ATK + atkDiff
        }** (${atkDiff < 0 ? atkDiff : `+${atkDiff}`})\nDEF **${player.DF} -> ${
          player.DF + defDiff
        }** (${defDiff < 0 ? defDiff : `+${defDiff}`})\nMAGIC **${
          player.MAGIC
        } -> ${player.MAGIC + magicDiff}** (${
          magicDiff < 0 ? magicDiff : `+${magicDiff}`
        }) \n${a}\n⚔️ ${gearData.getWeaponUI()}\n🔰 ${gearData.getArmorUI(
          0
        )}\n🔰 ${gearData.getArmorUI(1)}`;
      })
      .join("\n" + a + "\n\n");
  }

  const [, ...actionArgs] = input.arguments;

  const home = new SpectralCMDHome(
    {
      isHypen: false,
    },
    [
      {
        key: "list",
        description: "Displays all items in the user's inventory.",
        aliases: ["-l"],
        args: ["<optional uid>"],
        async handler() {
          let userData = userDataCopy;
          let { inventory, petsData, gearsData, collectibles } =
            getDatas(userData);
          let otherTarget = null;
          if (actionArgs[0]) {
            const allUsers = await money.getAll();
            const target = allUsers[actionArgs[0]];
            if (!target) {
              return output.reply(`User not found.`);
            }
            ({ inventory, petsData, gearsData, collectibles } =
              getDatas(target));
            otherTarget = target;
            userData = target;
          }
          const items = inventory.getAll();
          collectibles.register("money", {
            key: "money",
            name: "Money",
            flavorText: "This is what you have, anytime, anywhere.",
            icon: "💵",
            type: "currencyInv",
          });
          collectibles.register("puzzlePiece", {
            key: "puzzlePiece",
            name: "Puzzle Piece",
            flavorText: "Basically, Idk.",
            icon: "🧩",
            type: "currencyInv",
          });

          collectibles.set("money", userData.money);
          collectibles.set("puzzlePiece", userData.wordGameWins ?? 0);
          collectibles.removeEmpty();

          const categoryMap = new Map();
          for (const item of items) {
            const category = item.type;
            if (!categoryMap.has(category)) {
              categoryMap.set(category, []);
            }
            const map = categoryMap.get(category);
            map.push(item);
          }

          let itemList = ``;
          const sorted = Array.from(categoryMap).sort((a, b) =>
            a[0].localeCompare(b[0])
          );
          let cache1 = [];
          for (const [category, items] of sorted) {
            itemList += ``;

            const itemCounts = new Map();

            items.forEach((item) => {
              const key = item.key;
              if (itemCounts.has(key)) {
                itemCounts.set(key, itemCounts.get(key) + 1);
              } else {
                itemCounts.set(key, 1);
              }
            });

            itemList += Array.from(itemCounts.entries())
              .map(([key, count]) => {
                const item = items.find((item) => item.key === key);
                return `${item.icon} **${item.name}**${
                  count > 1 ? ` (x${count})` : ""
                } [${item.key}]`;
              })
              .join("\n");

            itemList += `\n\n`;
          }

          const cllMap = new Map();
          for (const item of collectibles) {
            const category = item.metadata.type ?? "Uncategorized";
            if (!cllMap.has(category)) {
              cllMap.set(category, []);
            }
            const map = cllMap.get(category);
            map.push(item);
          }
          let cllList = ``;
          const sorted2 = Array.from(cllMap).sort((a, b) =>
            a[0].localeCompare(b[0])
          );
          for (const [category, items] of sorted2) {
            cllList += ``;
            cllList += items
              .map(
                ({ metadata, amount }) =>
                  `${metadata.icon} **${metadata.name}** ${
                    amount > 1 ? `(x${pCy(amount)}) ` : ""
                  }[${metadata.key}]`
              )
              .join("\n");
            cllList += "\n\n";
          }
          const finalRes =
            (otherTarget
              ? `✅ Checking ${otherTarget.name ?? "Unregistered"}\n\n`
              : "") +
            `👤 **${userData.name}** (**${
              inventory.getAll().length
            }/${invLimit}**)\n\n${UNIRedux.arrow} ***Items***\n\n${
              itemList.trim() || "No items available."
            }\n\n${UNIRedux.standardLine}\n${
              UNIRedux.arrow
            } ***Collectibles***\n\n${cllList.trim()}`;

          let newRes = finalRes;

          return output.reply(newRes);
        },
      },
      {
        key: "inspect",
        description: "Shows detailed information about a specific item.",
        aliases: ["examine", "check", "look", "-i"],
        args: ["<item_id | index>"],
        async handler() {
          const keyToCheck = actionArgs[0];
          if (!keyToCheck) {
            return output.reply(
              `👤 **${userData.name || "Unregistered"}** (Inventory)\n\n` +
                `❌ No item specified! Reply with an **item key** to inspect.`
            );
          }
          const altKey = actionArgs
            .map((key, index) => {
              if (index !== 0) {
                return `${key.charAt(0)?.toUpperCase()}${key
                  .slice(1)
                  .toLowerCase()}`;
              } else {
                return key.toLowerCase();
              }
            })
            .join("");
          const lastKey = inventory
            .getAll()
            .find((item) => item.name === actionArgs.join(" "));
          const item =
            inventory.getOne(keyToCheck) ||
            inventory.getOne(altKey) ||
            inventory.getOne(lastKey);
          if (!item) {
            return output.reply(
              `👤 **${userData.name || "Unregistered"}** (Inventory)\n\n` +
                `❌ No treasure with key "**${keyToCheck}**" found in your pack!\n` +
                `Try "${prefix}inv list" to see what’s in your 🎒!`
            );
          }
          return output.reply(
            `👤 **${userData.name || "Unregistered"}** (Inventory)\n\n` +
              `${UNIRedux.arrow} ***Item Details***\n\n` +
              `${item.icon} **${item.name}** (x${inventory.getAmount(
                keyToCheck
              )})\n` +
              `✦ ${
                item.flavorText || "A curious item from your travels."
              }\n\n` +
              `Type: **${item.type}**\n` +
              `Heal: **${item.heal ?? 0} HP**\n` +
              `DEF: **+${item.def ?? 0}**\n` +
              `ATK: **+${item.atk ?? 0}**\n` +
              `Saturation: **${
                (item.saturation ?? 0) / 60 / 1000
              } mins** 🐾\n\n` +
              `Sell Price: **$${item.sellPrice ?? 0}** 💵`
          );
        },
      },
      {
        key: "use",
        description:
          "Uses or activates a specific item for its intended effect.",
        aliases: ["activate", "consume", "equip", "-u"],
        args: ["<item_id | index>"],
        async handler() {
          const [key] = actionArgs;
          const purposed = sortExtensions(
            extensions.filter((i) => i.info.purpose.startsWith("item_use_"))
          );
          if (!key) {
            return output.reply(
              `👤 **${userData.name || "Unregistered"}** (Inventory)\n\n` +
                `❌ No item chosen! Use an **item key** to activate something from your 🎒!`
            );
          }
          const eKey = "--unequip";
          let item = inventory.getOne(key);
          if (!item && !String(key).startsWith(eKey)) {
            return output.reply(
              `👤 **${userData.name || "Unregistered"}** (Inventory)\n\n` +
                `❌ "**${key}**" isn’t in your pack! Check with "${prefix}inv list".`
            );
          }

          item ??= {};
          item.type ??= "generic";
          const targets = purposed.filter((i) =>
            i.info.purpose.endsWith(item.type)
          );

          if (targets.length > 0) {
            let replyString = "";
            for (const ext of targets) {
              try {
                const strRes = await ext.info.hook(ctx, item);
                if (typeof strRes === "string") {
                  replyString = strRes;
                }
              } catch (error) {
                console.error(error);
              }
            }
            return replyString ? output.reply(replyString) : null;
          }

          if (item?.type === "food") {
            return output.reply(
              `👤 **${userData.name || "Unregistered"}** (Inventory)\n\n` +
                `${UNIRedux.arrow} ***Food Item***\n\n` +
                `${item.icon} **${item.name}**\n` +
                `✦ A tasty morsel to **feed your pet**! More healing means more EXP for your loyal friend.\n` +
                `Try "${prefix}pet feed <pet_name> ${item.key}" to share the feast!`
            );
          }
          if (item?.type.endsWith("_food")) {
            const petType = item.type.replaceAll("_food", "");
            const durationMinutes = ((item.saturation ?? 0) / 60000).toFixed(1);
            if (petType === "any") {
              return output.reply(
                `👤 **${userData.name || "Unregistered"}** (Inventory)\n\n` +
                  `${UNIRedux.arrow} ***Food Item***\n\n` +
                  `${item.icon} **${item.name}**\n` +
                  `✦ A versatile treat for **any pet**! Keeps them full for **${durationMinutes} minutes**.\n` +
                  `Use "${prefix}pet feed <pet_name> ${item.key}" to satisfy any companion!`
              );
            } else {
              return output.reply(
                `👤 **${userData.name || "Unregistered"}** (Inventory)\n\n` +
                  `${UNIRedux.arrow} ***Food Item***\n\n` +
                  `${item.icon} **${item.name}**\n` +
                  `✦ Specially crafted for **${petType}** pets! Fills them up for **${durationMinutes} minutes**.\n` +
                  `Feed it with "${prefix}pet feed <pet_name> ${item.key}"—if they match!`
              );
            }
          }

          if (item?.type === "pet") {
            return output.reply(
              `👤 **${userData.name || "Unregistered"}** (Inventory)\n\n` +
                `${UNIRedux.arrow} ***Caged Pet***\n\n` +
                `${item.icon} **${item.name}**\n` +
                `✦ A companion waiting to be free! Try uncaging it with "${prefix}pet uncage".\n` +
                `Who knows what adventures await?`
            );
          }

          if (
            item.type === "armor" ||
            item.type === "weapon" ||
            key.startsWith(eKey)
          ) {
            if (petsData.getAll().length === 0) {
              return output.reply(
                `👤 **${userData.name || "Unregistered"}** (Inventory)\n\n` +
                  `❌ No pets to equip! Find a friend with "${prefix}pet shop" first!`
              );
            }
            const i = await output.reply(
              `👤 **${userData.name || "Unregistered"}** (Inventory)\n\n` +
                `${UNIRedux.arrow} ***Equip to a Pet***\n\n` +
                `✦ Pick a companion for **${item.icon} ${item.name}**!\n` +
                `(For armor, try "<pet_name> <slot_number>")\n\n` +
                `${getPetList(petsData, gearsData, item, 0)}`
            );
            input.setReply(i.messageID, {
              key: commandName,
              callback: handleEquip,
            });
            async function handleEquip(ctx) {
              if (ctx.input.senderID !== input.senderID) return;
              const userData = await ctx.money.get(ctx.input.senderID);
              const { inventory, petsData, gearsData } = getDatas(userData);
              item ??= {};
              if (!key.startsWith(eKey) && !inventory.has(item.key)) {
                return ctx.output.reply(
                  `👤 **${userData.name || "Unregistered"}** (Inventory)\n\n` +
                    `❓ Where’d it go? "**${item.name}**" vanished from your 🎒!`
                );
              }

              const petName = String(ctx.input.words[0]);
              let slot = parseInt(ctx.input.words[1]) - 1;
              if (isNaN(slot)) slot = 0;
              let pet = petsData
                .getAll()
                .find(
                  (i) =>
                    String(i.name).toLowerCase().trim() ===
                    petName.toLowerCase().trim()
                );
              if (!pet) {
                return ctx.output.reply(
                  `👤 **${userData.name || "Unregistered"}** (Inventory)\n\n` +
                    `❌ No pet named "**${petName}**"! Check your crew with "${prefix}pet list".`
                );
              }
              const gearData = gearsData.getGearData(pet.key);
              const [, keyType] = key.split("_");
              item ??= {};

              if (
                item.type === "armor" ||
                (key.startsWith(eKey) && keyType === "armor")
              ) {
                const oldArmor = gearData.equipArmor(
                  slot,
                  item.type === "armor" ? item : null
                );
                if (item.type === "armor") inventory.deleteOne(item.key);
                if (oldArmor) {
                  if (inventory.getAll().length >= invLimit) {
                    return ctx.output.reply(
                      `👤 **${
                        userData.name || "Unregistered"
                      }** (Inventory)\n\n` +
                        `❌ Your 🎒 is stuffed! Make space with "${prefix}inv toss".`
                    );
                  }
                  inventory.addOne(oldArmor);
                }
              } else if (
                item.type === "weapon" ||
                (key.startsWith(eKey) && keyType === "weapon")
              ) {
                const oldWeapon = gearData.equipWeapon(
                  item.type === "weapon" ? item : null
                );
                if (item.type === "weapon") inventory.deleteOne(item.key);
                if (oldWeapon) {
                  if (inventory.getAll().length >= invLimit) {
                    return ctx.output.reply(
                      `👤 **${
                        userData.name || "Unregistered"
                      }** (Inventory)\n\n` +
                        `❌ Your 🎒 is stuffed! Make space with "${prefix}inv toss".`
                    );
                  }
                  inventory.addOne(oldWeapon);
                }
              } else {
                return ctx.output.reply(
                  `👤 **${userData.name || "Unregistered"}** (Inventory)\n\n` +
                    `❌ Weird gear glitch! Use "**${eKey}_armor**" or "**${eKey}_weapon**" correctly.`
                );
              }
              gearsData.setGearData(pet.key, gearData);
              await ctx.money.set(ctx.input.senderID, {
                inventory: Array.from(inventory),
                gearsData: gearsData.toJSON(),
              });
              await ctx.output.replyStyled(
                `👤 **${userData.name || "Unregistered"}** (Inventory)\n\n` +
                  `${UNIRedux.arrow} ***Equipped!***\n\n` +
                  `${item.type !== "generic" ? "✅" : "✦"} ${
                    item.icon || "⚙️"
                  } **${item.name || "Nothing"}** ${
                    item.type === "armor" || keyType === "armor"
                      ? "slipped onto"
                      : "swung by"
                  } **${pet.name}**!\n` +
                  `(Unequip with "${prefix}inv use ${eKey}_${
                    item.type || keyType
                  }")\n\n` +
                  `${getPetList(petsData, gearsData, {}, 0)}`,
                style
              );
            }
            return;
          }
          if (item.type === "cheque") {
            let chequeKey = actionArgs[0];
            if (!String(chequeKey).startsWith("cheque_"))
              chequeKey = `cheque_${chequeKey}`;
            const itemToCash = inventory.getOne(chequeKey);
            if (
              !itemToCash ||
              !chequeKey.startsWith("cheque_") ||
              itemToCash?.type !== "cheque"
            ) {
              return output.reply(
                `👤 **${userData.name || "Unregistered"}** (Inventory)\n\n` +
                  `❌ No valid **cheque** with key "**${chequeKey}**" in your 🎒!`
              );
            }
            const chequeAmount = parseInt(itemToCash.chequeAmount);
            if (isNaN(chequeAmount) || chequeAmount <= 0) {
              return output.reply(
                `👤 **${userData.name || "Unregistered"}** (Inventory)\n\n` +
                  `❌ This cheque’s a dud! No cash to claim.`
              );
            }
            inventory.deleteOne(chequeKey);
            userData.money += chequeAmount;
            await money.set(input.senderID, {
              inventory: Array.from(inventory),
              money: userData.money,
            });
            return output.reply(
              `👤 **${userData.name || "Unregistered"}** (Inventory)\n\n` +
                `${UNIRedux.arrow} ***Cashed Out***\n\n` +
                `✅ Turned ${itemToCash.icon || "💸"} **${
                  itemToCash.name
                }** into **$${chequeAmount}**!\n` +
                `Your pouch now holds **$${userData.money}** 💵.`
            );
          }
          if (item.type === "potion") {
            return output.reply(
              `👤 **${userData.name || "Unregistered"}** (Inventory)\n\n` +
                `${UNIRedux.arrow} ***Mystery Brew***\n\n` +
                `${item.icon || "🧪"} **${item.name}**\n` +
                `${
                  item.useText ||
                  "✦ A bubbling potion! Sip it, splash it, or... inject it? Who knows what magic awaits?"
                }`
            );
          }
          if (item.type !== "treasure") {
            const flavorText =
              item.useText ||
              `You fiddled with ${item.icon} **${item.name}**, but the magic fizzled out.`;
            return output.reply(
              `👤 **${userData.name || "Unregistered"}** (Inventory)\n\n` +
                `✅ ${flavorText}`
            );
          }
          let diaCost = 2;
          let tresCount = item.tresCount || 20;
          const author = input.senderID;
          let chosenNumbers = [];
          async function handleTriple(ctx) {
            const { input, output, money } = ctx;
            if (author !== ctx.input.senderID) return;
            const userData = await ctx.money.get(ctx.input.senderID);
            const { inventory, collectibles } = getDatas(userData);
            const { treasures, paidMode } = ctx.repObj;

            if (paidMode && !collectibles.hasAmount("gems", diaCost)) {
              return output.replyStyled(
                `👤 **${userData.name || "Unregistered"}** (Inventory)\n\n` +
                  `❌ Out of gems! Need **${diaCost} 💎** to retry.`,
                style
              );
            }
            if (paidMode && String(input.words[0]).toLowerCase() !== "retry")
              return;
            if (paidMode) input.words.shift();

            if (!inventory.has(item.key) && !paidMode) {
              return output.replyStyled(
                `👤 **${userData.name || "Unregistered"}** (Inventory)\n\n` +
                  `❌ The treasure’s gone! Did it slip out of your 🎒?`,
                style
              );
            }
            let number = parseInt(input.words[0]);
            if (chosenNumbers.includes(number)) {
              return output.reply(
                `👤 **${userData.name || "Unregistered"}** (Inventory)\n\n` +
                  `❌ Already picked **${number}**! Choose another.`
              );
            }
            if (chosenNumbers.length >= tresCount) {
              return output.reply(
                `👤 **${userData.name || "Unregistered"}** (Inventory)\n\n` +
                  `❌ All treasures claimed! Nothing left to open.`
              );
            }
            if (isNaN(number) || number < 1 || number > tresCount) {
              return output.reply(
                `👤 **${userData.name || "Unregistered"}** (Inventory)\n\n` +
                  `❌ Pick a number between **1** and **${tresCount}**!`
              );
            }
            const treasure = treasures[number - 1];
            if (!treasure) {
              return output.reply(
                `👤 **${userData.name || "Unregistered"}** (Inventory)\n\n` +
                  `❌ Treasure fizzled out! Something’s off...`
              );
            }
            if (inventory.getAll().length >= invLimit) {
              return output.reply(
                `👤 **${userData.name || "Unregistered"}** (Inventory)\n\n` +
                  `❌ Your 🎒 is full! Toss something with "${prefix}inv toss".`
              );
            }
            inventory.addOne(treasure);
            if (paidMode) collectibles.raise("gems", -diaCost);
            const treasureItem = treasure;
            if (!paidMode) inventory.deleteOne(key);
            input.delReply(ctx.detectID);

            await money.set(input.senderID, {
              inventory: Array.from(inventory),
              collectibles: Array.from(collectibles),
            });
            chosenNumbers.push(number);

            const infoDone = await output.replyStyled(
              `👤 **${userData.name || "Unregistered"}** (Inventory)\n\n` +
                `${UNIRedux.arrow} ***Treasure Opened!***\n\n` +
                `${item.icon} Cracked open **${item.name}**!\n\n` +
                ` ${treasures
                  .map((i, index) =>
                    (index + 1) % 5 === 0 ? `${i.icon}\n` : i.icon
                  )
                  .join(" ")
                  .trim()}\n` +
                `${
                  collectibles.hasAmount("gems", diaCost)
                    ? `✦ Retry for **${diaCost} 💎**? Reply "retry <number>"!\n`
                    : ""
                }\n` +
                `${UNIRedux.arrow} ***Reward***\n` +
                `${treasureItem.icon} **${treasureItem.name}**\n` +
                `✦ ${treasureItem.flavorText}\n\n` +
                `Check it out with "${prefix}inv check ${treasureItem.key}"!\n` +
                `Gems: **${pCy(collectibles.getAmount("gems"))} 💎** ${
                  paidMode ? `(-${diaCost})` : ""
                }`,
              style
            );
            treasures[number - 1] = { icon: "✅", isNothing: true };
            input.setReply(infoDone.messageID, {
              key: "inventory",
              callback: handleTriple,
              paidMode: true,
              treasures,
            });
          }

          let treasures = [];
          for (let i = 0; i < tresCount; i++) {
            let newTreasure;
            do {
              newTreasure = generateTreasure(item.treasureKey);
            } while (false);
            treasures.push(newTreasure);
          }
          treasures = treasures.sort(() => Math.random() - 0.5);
          const info = await output.reply(
            `👤 **${userData.name || "Unregistered"}** (Inventory)\n\n` +
              `${UNIRedux.arrow} ***Treasure Hunt***\n\n` +
              `✦ Pick a chest to unlock from **${item.name}**!\n\n` +
              ` ${Array(tresCount)
                .fill(item.icon)
                .map((i, index) => ((index + 1) % 5 === 0 ? `${i}\n` : i))
                .join(" ")
                .trim()}\n\n` +
              `Reply with a number from **1** to **${tresCount}**!`
          );
          input.setReply(info.messageID, {
            key: "inventory",
            callback: handleTriple,
            treasures,
          });
        },
      },
      {
        key: "transfer",
        description: "Sends an item to another user or entity.",
        aliases: ["give", "send", "-t"],
        args: ["<item_id | index>*<num|'all'>", "<uid>"],
        async handler() {
          let [keyTX = "", recipientID] = actionArgs;
          let [keyT, amountItem = "1"] = keyTX.split("*");

          if (recipientID === input.senderID) {
            return output.reply(
              `👤 **${userData.name || "Unregistered"}** (Inventory)\n\n` +
                `❌ Can’t send to yourself! Your 🎒 stays put.`
            );
          }
          if (!inventory.has(keyT)) {
            return output.reply(
              `👤 **${userData.name || "Unregistered"}** (Inventory)\n\n` +
                `❌ No "**${keyT}**" in your pack! Double-check with "${prefix}inv list".`
            );
          }
          if (amountItem === "all") amountItem = inventory.getAmount(keyT);
          amountItem = parseInt(amountItem);
          if (isNaN(amountItem)) amountItem = 1;
          if (!inventory.hasAmount(keyT, amountItem) || amountItem < 1) {
            return output.reply(
              `👤 **${userData.name || "Unregistered"}** (Inventory)\n\n` +
                `❌ Only have **${inventory.getAmount(
                  keyT
                )}** of "**${keyT}**"! Adjust your gift amount.`
            );
          }
          const allUsers = await money.getAll();
          const recipientData = allUsers[recipientID];
          if (!recipientData) {
            return output.reply(
              `👤 **${userData.name || "Unregistered"}** (Inventory)\n\n` +
                `❌ No one with ID "**${recipientID}**" exists! Who’s this mystery friend?`
            );
          }
          if (!recipientData.name) {
            return output.reply(
              `👤 **${userData.name || "Unregistered"}** (Inventory)\n\n` +
                `❌ Recipient’s nameless! Can’t send to a ghost.`
            );
          }
          const rInventory = new Inventory(recipientData.inventory);
          if (rInventory.getAll().length >= invLimit) {
            return output.reply(
              `👤 **${userData.name || "Unregistered"}** (Inventory)\n\n` +
                `❌ **${recipientData.name}**’s 🎒 is stuffed full! They need to toss something.`
            );
          }
          if (rInventory.getAll().length + amountItem > invLimit) {
            return output.reply(
              `👤 **${userData.name || "Unregistered"}** (Inventory)\n\n` +
                `❌ **${recipientData.name}** has **${
                  rInventory.getAll().length
                }/${invLimit}** slots! Can’t fit **${amountItem}** more.`
            );
          }
          let sentItems = [];
          let failItems = [];
          let moneyAdd = 0;
          for (let i = 0; i < amountItem; i++) {
            const itemToSend = inventory.getOne(keyT);
            if (itemToSend?.cannotSend) {
              failItems.push({
                ...itemToSend,
                error: `✦ This item’s stuck with you!`,
              });
              continue;
            }
            if (itemToSend.type === "cheque") {
              const amount = itemToSend.chequeAmount;
              if (isNaN(amount) || amount < 1) {
                failItems.push({
                  ...itemToSend,
                  error: `✦ Cheque’s unreadable! No cash here.`,
                });
                continue;
              }
              moneyAdd += amount;
            } else {
              rInventory.addOne(itemToSend);
              sentItems.push(itemToSend);
            }
            inventory.deleteRef(itemToSend);
          }

          await money.set(input.senderID, {
            inventory: Array.from(inventory),
          });
          await money.set(recipientID, {
            inventory: Array.from(rInventory),
            money: recipientData.money + moneyAdd,
          });

          return output.reply(
            `👤 **${userData.name || "Unregistered"}** (Inventory)\n\n` +
              `${UNIRedux.arrow} ***Transfer Complete***\n\n` +
              `${
                moneyAdd > 0
                  ? `💰 Sent **$${moneyAdd}** 💵 via cheque to **${recipientData.name}**!\n`
                  : ""
              }` +
              `${
                sentItems.length > 0
                  ? `✅ Gifted **${sentItems.length}** treasures to **${recipientData.name}**!\n`
                  : `❌ No items sent to **${recipientData.name}**!\n`
              }` +
              `${[...sentItems, ...failItems]
                .map(
                  (i) =>
                    `${i.icon} **${i.name}**${i.error ? `\n${i.error}` : ""}`
                )
                .join("\n")}`
          );
        },
      },
      {
        key: "toss",
        description: "Discards an item from the user's inventory.",
        aliases: ["discard", "drop", "throw"],
        args: ["<item_id | index>*<num|'all'>"],
        async handler() {
          let [key, amount] = (actionArgs[0] ?? "").split("*");
          if (!amount && actionArgs[1]) amount = actionArgs[1];

          if (!key) {
            return output.reply(
              `👤 **${userData.name || "Unregistered"}** (Inventory)\n\n` +
                `❌ No item picked! Try "**cat*3**" to toss 3 cats—or whatever’s in your 🎒!`
            );
          }

          let items = inventory.get(key);
          if (!items || items.length === 0) {
            return output.reply(
              `👤 **${userData.name || "Unregistered"}** (Inventory)\n\n` +
                `❌ Nothing with key "**${key}**" to toss! Peek with "${prefix}inv list".`
            );
          }

          if (amount === "all") amount = items.length;
          else {
            amount = parseInt(amount, 10);
            if (isNaN(amount) || amount <= 0) {
              return output.reply(
                `👤 **${userData.name || "Unregistered"}** (Inventory)\n\n` +
                  `❌ Bad amount "**${actionArgs[0]}**"! Use a number or "all".`
              );
            }
          }

          items = items.slice(0, amount);
          if (items.length < amount) {
            output.reply(
              `👤 **${userData.name || "Unregistered"}** (Inventory)\n\n` +
                `⚠️ Asked for **${amount}**, but only **${items.length}** "**${key}**" found!`
            );
          }

          const deletable = items.filter((i) => i.cannotToss !== true);
          const cannot = items.filter((i) => i.cannotToss === true);

          inventory.deleteRefs(deletable);
          await money.set(input.senderID, {
            inventory: Array.from(inventory),
          });

          let response =
            `👤 **${userData.name || "Unregistered"}** (Inventory)\n\n` +
            `${UNIRedux.arrow} ***Tossed Away***\n\n`;
          if (deletable.length > 0) {
            response +=
              `✅ Dropped **${deletable.length}** item${
                deletable.length !== 1 ? "s" : ""
              }:\n` +
              `${deletable.map((i) => `${i.icon} **${i.name}**`).join("\n")}\n`;
          }
          if (cannot.length > 0) {
            response +=
              `❌ Couldn’t toss **${cannot.length}** item${
                cannot.length !== 1 ? "s" : ""
              }:\n` +
              `${cannot.map((i) => `${i.icon} **${i.name}**`).join("\n")}\n`;
          }
          response += `Your 🎒 now holds **${
            inventory.getAll().length
          }/${invLimit}** treasures!`;
          return output.reply(response);
        },
      },
      {
        key: "top",
        description: "Check the top items or users with a specific one!",
        aliases: ["-t"],
        args: ["[all | <key>] [page=1]"],
        async handler() {
          const allUsers = await money.getAll();
          const page = parseInt(actionArgs[1] || "1") || 1;
          const perPage = 10;
          if (!isNaN(actionArgs[0])) {
            return output.reply(
              `👤 **${userData?.name || "Unregistered"}** (Inventory)\n\n` +
                `❌ Invalid (buggy) item key! Try "all" or a specific item to check rankings.`
            );
          }

          if (!actionArgs[0] || actionArgs[0].toLowerCase() === "all") {
            const totals = new Map();
            for (const user of Object.values(allUsers)) {
              const userInventory = new Inventory(user.inventory ?? []);
              const unique = [
                ...new Set(userInventory.getAll().map((i) => i.key)),
              ].map((key) => userInventory.getOne(key));
              for (const item of unique) {
                const amount = userInventory.getAmount(item.key);
                if (isNaN(amount)) continue;
                totals.set(item.key, (totals.get(item.key) ?? 0) + amount);
              }
            }

            const sorted = Array.from(totals.entries())
              .map(([key, amount]) => {
                const userWithItem = Object.values(allUsers).find((user) => {
                  const inv = new Inventory(user.inventory ?? []);
                  return inv.has(key);
                });
                const userInventory = userWithItem
                  ? new Inventory(userWithItem.inventory ?? [])
                  : null;
                const item = userInventory?.getOne(key) || {
                  name: key,
                  icon: "🧰",
                  key,
                };
                return { ...item, amount };
              })
              .sort((a, b) => b.amount - a.amount);

            const totalPages = Math.ceil(sorted.length / perPage);
            const paged = sorted.slice((page - 1) * perPage, page * perPage);

            if (!paged.length) {
              return output.reply(
                `👤 **${userData?.name || "Unregistered"}** (Inventory)\n\n` +
                  `No items found across the realm!`
              );
            }

            const list = paged
              .map(
                (item) =>
                  `${item.icon} **${item.name}** (x${pCy(item.amount)}) [${
                    item.key
                  }]`
              )
              .join("\n");

            return output.reply(
              `👤 **${userData?.name || "Unregistered"}** (Inventory)\n\n` +
                `${UNIRedux.arrow} ***Top Items*** [all] [page=${page}/${totalPages}]\n\n` +
                `${list}\n\n` +
                `${UNIRedux.arrowFromT} Flip pages with '${prefix}briefcase top all <page>'\n` +
                `${UNIRedux.arrowFromT} Check specific rankings with '${prefix}briefcase top <key> <page>'`
            );
          } else {
            const key = actionArgs[0];
            const usersWithKey = Object.entries(allUsers)
              .map(([uid, data]) => {
                const userInventory = new Inventory(data.inventory ?? []);
                const amount = userInventory.getAmount(key);
                if (isNaN(amount) || amount <= 0) return null;
                const item = userInventory.getOne(key) || {
                  name: key,
                  icon: "🧰",
                };
                return {
                  uid,
                  name: data.name || "Unregistered",
                  amount,
                  icon: item.icon,
                  metadata: item,
                };
              })
              .filter(Boolean)
              .sort((a, b) => b.amount - a.amount);

            const totalPages = Math.ceil(usersWithKey.length / perPage);
            const paged = usersWithKey.slice(
              (page - 1) * perPage,
              page * perPage
            );

            if (!paged.length) {
              return output.reply(
                `👤 **${userData?.name || "Unregistered"}** (Inventory)\n\n` +
                  `No one’s got **${key}** yet!`
              );
            }

            const list = paged
              .map(
                (user, i) =>
                  `${UNIRedux.arrow} ${i + 1}. ${user.name} ${user.icon}\n` +
                  `${UNIRedux.arrowFromT} **${user.metadata.name}**: ${pCy(
                    user.amount
                  )}`
              )
              .join("\n\n");

            return output.reply(
              `👤 **${userData?.name || "Unregistered"}** (Inventory)\n\n` +
                `${UNIRedux.arrow} ***Top Holders of ${key}*** [page=${page}/${totalPages}]\n\n` +
                `${list}\n\n` +
                `${UNIRedux.arrowFromT} See more with '${prefix}briefcase top ${key} <page>'`
            );
          }
        },
      },
    ]
  );
  return home.runInContext(ctx);
}
