import {
  fontMarkups,
  isAdminCommand,
  removeCommandAliases,
  toTitleCase,
  UNIRedux,
} from "@cassidy/unispectra";
import { ShopClass } from "../plugins/shopV2.js";

export const meta = {
  name: "start",
  author: "Liane Cagara",
  description:
    "Acts as a central hub, like a Start Menu, providing users with an overview of available commands, their functionalities, and access to specific command details. Helps users quickly navigate the bot's features.",
  version: "2.5.0",
  usage: "{prefix}{name} [commandName]",
  category: "System",
  permissions: [0],
  requirement: "3.0.0",
  icon: "🧰",
};

export async function entry({
  input,
  output,
  commands: ogc,
  prefix,
  money,
}: CommandContext) {
  const commands = removeCommandAliases(ogc);
  const args = input.arguments;
  const { logo: icon } = global.Cassidy;
  const userData = await money.get(input.senderID);
  const shop = new ShopClass(userData.shopInv);

  if (args.length > 0 && isNaN(parseInt(args[0]))) {
    const commandName = args[0];
    const command = ogc[commandName];

    if (command) {
      let {
        name,
        author,
        description,
        otherNames,
        usage,
        category,
        permissions,
        waitingTime,
      } = command.meta;
      output.reply(
        `╭─────────────❍
  │  𝗖𝗼𝗺𝗺𝗮𝗻𝗱: ${name}
  │  𝗗𝗲𝘀𝗰𝗿𝗶𝗽𝘁𝗶𝗼𝗻: ${description}
  │  𝗔𝗹𝗶𝗮𝘀𝗲𝘀: ${otherNames?.join ? otherNames.join(", ") : "None"}
  │  𝗨𝘀𝗮𝗴𝗲: ${usage?.replace(/{prefix}/g, prefix)?.replace(/{name}/g, name)}
  │  𝗖𝗮𝘁𝗲𝗴𝗼𝗿𝘆: ${category || "No category"}
  │  𝗣𝗲𝗿𝗺𝗶𝘀𝘀𝗶𝗼𝗻𝘀: ${
    permissions.join ? permissions.join(", ") : "No permissions required"
  }
  │  𝗖𝗼𝗼𝗹𝗱𝗼𝘄𝗻: ${waitingTime || 5} seconds
  │  𝗔𝘂𝘁𝗵𝗼𝗿: ${author || "No author"}
  ├────────⬤
  │  𝗖𝗮𝘀𝘀𝗶𝗱𝘆 𝖠𝗌𝗌𝗂𝗌𝗍𝖺𝗇𝖼𝖾  v${global.package.version}
  ╰─────────────❍`
      );
    } else {
      output.reply(
        `${icon}\n\n❌ The command "${commandName}" does not exist in the help list.`
      );
    }
    return;
  }

  const categorizedCommands = Object.values(commands).reduce(
    (categories, command) => {
      const category = command.meta.category || "Miscellaneous";
      if (!categories[category]) categories[category] = [];
      categories[category].push(command);
      return categories;
    },
    {}
  );

  const sortedCategories = Object.keys(categorizedCommands).sort((a, b) => {
    const aContainsGame = a.toLowerCase().includes("game");
    const bContainsGame = b.toLowerCase().includes("game");

    if (aContainsGame && bContainsGame) {
      return a.localeCompare(b);
    }

    if (aContainsGame) {
      return -1;
    }
    if (bContainsGame) {
      return 1;
    }

    return a.localeCompare(b);
  });

  const itemsPerPage = 3;
  const totalPages = Math.ceil(sortedCategories.length / itemsPerPage);
  let currentPage = parseInt(args[0]) || 1;

  if (currentPage < 1) currentPage = 1;
  if (currentPage > totalPages) currentPage = totalPages;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = currentPage * itemsPerPage;

  const pageCategories = sortedCategories.slice(startIndex, endIndex);

  let result = `**Page ${currentPage} of ${totalPages}** 📄\n`;
  let preff = "│ ";

  pageCategories.forEach((category) => {
    result += `\n╭─────────────❍\n${preff}**${category}** 📁\n${preff}\n`;
    categorizedCommands[category].forEach((command) => {
      const {
        name,
        description,
        icon,
        otherNames,
        shopPrice = 0,
      } = command.meta;
      const statusIcon = isAdminCommand(command)
        ? "👑"
        : shop.isUnlocked(name)
        ? icon || "📄"
        : shop.canPurchase(name, userData.money)
        ? "🔐"
        : "🔒";
      result += `${preff}  ${statusIcon} ${prefix}**${toTitleCase(name)}**${
        shopPrice
          ? ` - $**${shopPrice}** ${
              shop.canPurchase(name, userData.money)
                ? shop.isUnlocked(name)
                  ? "✅"
                  : "💰"
                : "❌"
            }`
          : ""
      } ${UNIRedux.charm}\n${preff}    ${
        UNIRedux.charm
      } ${fontMarkups.fancy_italic(
        "Description"
      )}: ${description} 💬\n${preff}   ${
        UNIRedux.charm
      } ${fontMarkups.fancy_italic("Aliases")}: ${
        otherNames?.join(", ") || "None 📝"
      }\n${preff}\n`;
    });
    result += `╰─────────────❍\n\n`;
  });

  result += `\n\n» Theres **MORE** commands! To navigate pages, type **${prefix}start <page_number>**.\n`;
  result += `\n» To see the next page, type **${prefix}start ${
    currentPage + 1
  }**.\n`;
  result += `\n» To get an information about a certain command, type **${prefix}start <command_name>**.\n`;

  return output.reply(
    `${icon}\n  ${UNIRedux.standardLine}\n🔍 | **Available Commands** 🧰\n\n${result}\n» Developed by @**Liane Cagara** 🎀`
  );
}
