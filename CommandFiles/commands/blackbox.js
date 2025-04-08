// @ts-check

import { Deku } from "@cass-modules/deku-api";
import { UNISpectra } from "@cassidy/unispectra";

/**
 * @type {CassidySpectra.CommandMeta}
 */
export const meta = {
  name: "blackbox",
  description: "Blackbox AI (Conversational)",
  author: "Deku",
  version: "1.0.0",
  usage: "{prefix}{name} <prompt>",
  category: "AI",
  permissions: [0],
  noPrefix: "both",
  otherNames: ["ai", "ask"],
  botAdmin: false,
  waitingTime: 1,
  requirement: "3.0.0",
  icon: "⬛",
  deku: true,
};

export const style = {
  title: "⬛ Blackbox",
  titleFont: "bold",
  contentFont: "none",
};

/**
 * @param {CassidySpectra.CommandContext} ctx
 */
export async function entry({
  input,
  output,
  args,
  prefix,
  commandName,
  event,
}) {
  const prompt = args.join(" ");

  if (prompt.length < 1) {
    return output.reply(
      `***Guide***\n\nEnter a question as arguments. **Example**: ${prefix}${commandName} hello!`
    );
  }

  let j;
  if (!input.isWeb) {
    j = await output.reply("⏳ ***Generating***\n\nPlease wait...");
  }

  const { data } = await Deku.get("/api/blackbox", {
    params: {
      uid: event.originalEvent?.senderID ?? input.sid,
      prompt,
    },
  });

  // data.response += `\n\n${UNISpectra.standardLine}\n${UNISpectra.arrow} Use **CLEAR** to reset conversation.\n${UNISpectra.arrowFromT} Use **TOGGLE** to switch websearch.\n${UNISpectra.charm} Use **CODE** to switch coding model`;

  if (input.isWeb) {
    const i = await output.replyStyled(parseRes(data.response), style);
    j = i;
  } else {
    await output.edit(parseRes(data.response), j.messageID, 0, style);
  }
  input.setReply(j.messageID, {
    callback(ctx) {
      if (ctx.input.sid !== input.sid) {
        return;
      }
      return entry({ ...ctx, args: ctx.input.words });
    },
  });
}

function parseRes(text) {
  const regex = /\$~~~\$(.*?)\$~~~\$/s;
  const match = text.match(regex);

  if (!match) return text;

  let parsedList = "";
  try {
    const jsonData = JSON.parse(match[1]);

    parsedList += `🔎 ***Searched (${jsonData.length}) sites:***\n\n`;

    parsedList =
      parsedList +
      jsonData
        .map((item) => {
          let entry = `${UNISpectra.charm} **${item.position}.** **${item.title}**\n`;
          if (item.link)
            entry += `   ${UNISpectra.arrowFromT} 🌐 **Link**: ${item.link}\n`;
          if (item.snippet)
            entry += `   ${UNISpectra.arrowFromT} 📝 ${item.snippet}\n`;
          if (item.date)
            entry += `   ${UNISpectra.arrowFromT} 📅 ${item.date}\n`;

          if (item.sitelinks && Array.isArray(item.sitelinks)) {
            entry += `   ${UNISpectra.arrowFromT} 🔗 **Related Links**:\n`;
            item.sitelinks.forEach((linkObj) => {
              entry += `     ${UNISpectra.arrowFromT} [${linkObj.title}](${linkObj.link})\n`;
            });
          }

          return entry.trim();
        })
        .join("\n\n");
  } catch (err) {
    return text.replace(regex, "**[Error parsing JSON block]**");
  }

  return text.replace(regex, parsedList);
}
