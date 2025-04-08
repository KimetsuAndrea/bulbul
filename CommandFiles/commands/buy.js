import { UNIRedux, toTitleCase } from "../modules/unisym.js";
import { ShopClass } from "../plugins/shopV2.js";
import { Slicer } from "../plugins/utils-liane.js";

export const meta = {
  name: "buy",
  description: "Purchases a command.",
  author: "Jenica",
  version: "1.1.1",
  usage: "{prefix}buy <command>",
  category: "Shop",
  permissions: [0],
  noPrefix: false,
  waitingTime: 0.01,
};

export const style = {
  title: "💵 Buy Command",
  titleFont: "fancy",
  contentFont: "fancy",
};

/**
 *
 * @param {CommandContext} context
 * @returns
 */
export async function entry(context) {
  const { input, output, args, money, prefix } = context;
  if (isNaN(args[0])) {
    const {
      shopInv = {},
      money: userMoney,
      name,
    } = await money.get(input.senderID);
    const shop = new ShopClass(shopInv);

    async function buyReply(item, price) {
      return output.reply(
        `📦 Purchase Complete!\n${UNIRedux.arrow} Item: ${item}\n💰 Cost: $${price}\n✅ Added to shop inventory.`
      );
    }

    if (shopInv[args[0]]) {
      return output.reply(
        `⚠️ Purchase Failed!\n${UNIRedux.arrow} Item: ${args[0]}\n⛔ Status: Already owned.`
      );
    }

    const price = shop.getPrice(args[0]);

    if (price === null) {
      return output.reply(
        `❌ Purchase Failed!\n${UNIRedux.arrow} Item: ${args[0]}\n⛔ Status: Does not exist.`
      );
    }

    if (price <= 0) {
      return output.reply(
        `🎁 Free Item Acquired!\n${UNIRedux.arrow} Item: ${args[0]}\n✅ Added to shop inventory at no cost!`
      );
    }

    if (isNaN(price)) {
      return output.reply("Something went wrong...");
    }
    const canPurchase = await shop.canPurchase(args[0], userMoney);
    if (!canPurchase) {
      return output.reply(
        `❌ Insufficient Funds!\n${UNIRedux.arrow} Item: "${args[0]}"\n💰 Cost: $${price}\n⛔ You don't have enough money to complete this purchase.`
      );
    }

    await shop.purchase(args[0], userMoney);

    await money.set(input.senderID, {
      shopInv: shop.raw(),
      money: userMoney - price,
    });
    return buyReply(`"${args[0]}"`, price);
  } else {
    const { shopInv = {}, money: userMoney } = await money.get(input.senderID);
    const shop = new ShopClass(shopInv);
    const allItems = shop.getItems();
    const page = Slicer.parseNum(args[0]);
    const slicer = new Slicer(allItems, 5);
    let i = 0;
    let result = `💡 Use **${prefix} ${
      context.commandName
    } <item name | page number>** to make a purchase or navigate between pages.\n${
      UNIRedux.arrow
    } Page ${page} of ${slicer.pagesLength + 1}\n${UNIRedux.standardLine}\n`;

    for (const { meta } of slicer.getPage(page)) {
      i++;
      const itemStatus = shopInv[meta.name]
        ? "✅ Owned"
        : userMoney >= meta.shopPrice
        ? "💰 Affordable"
        : "❌ Too Expensive";

      result +=
        `🔹 **${toTitleCase(meta.name)}** ${meta.icon || "📦"}\n` +
        `💲 Price: **${Number(meta.shopPrice).toLocaleString()}**$\n` +
        `📌 Status: ***${itemStatus}***\n` +
        `📖 ${meta.description}\n` +
        `${UNIRedux.standardLine}\n`;
    }

    return output.reply(result.trimEnd());
  }
}
