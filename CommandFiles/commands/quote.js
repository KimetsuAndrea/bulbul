// @ts-check
export const meta = {
  name: "quote",
  description: "Generate a quote image.",
  author: "Liane",
  version: "1.0.0",
  usage: "{prefix}{name} <text>",
  category: "Fun",
  permissions: [0],
  noPrefix: "both",
  waitingTime: 5,
  requirement: "3.0.0",
  otherNames: ["q"],
  icon: "📝",
  noLevelUI: true,
  noWeb: true,
};

import { defineEntry } from "@cass/define";
import axios from "axios";

export const entry = defineEntry(
  async ({
    cancelCooldown,
    output,
    args,
    prefix,
    commandName,
    input,
    money,
    event,
  }) => {
    if (args.length === 0) {
      cancelCooldown();
      return output.reply(
        `❌ Please enter a quote.
**Example**: ${prefix}${commandName} Life is short, smile while you still have teeth.`
      );
    }

    const uid = event.originalEvent?.senderID || input.sid;

    if (!money.isNumKey(uid)) {
      return output.reply("❌ Only facebook users can use this command.");
    }

    const quoteText = args.join(" ");
    const url = "https://api.popcat.xyz/quote";

    let ensure = await money.ensureUserInfo(uid);
    if (!ensure) {
      return output.reply(`❌ We cannot find your profile picture.`);
    }

    const i = await output.reply("⏳ ***Generating***\n\nPlease wait...");

    const { userMeta } = await money.getItem(uid);

    try {
      const res = await axios.get(url, {
        params: {
          image: userMeta.image,
          font: "Poppins-Bold",
          name: userMeta.name,
          text: quoteText,
        },
        responseType: "stream",
      });

      await output.reply({
        body: `📝 Quote from ***${userMeta.name}***:`,
        attachment: res.data,
      });

      await output.unsend(i.messageID);
    } catch (error) {
      return output.error(error);
    }
  }
);
