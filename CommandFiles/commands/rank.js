import { UNIRedux } from "../modules/unisym.js";

export const meta = {
  name: "rank",
  description: "Displays your in-game rank and experience.",
  version: "1.1.7",
  usage: "{prefix}{name}",
  category: "Utilities",
  author: "JenicaDev",
  permissions: [0],
  noPrefix: "both",
  otherNames: ["level", "exp"],
  waitingTime: 0.1,
};

function formatNumber(number) {
  const absNumber = Math.abs(number);

  if (absNumber >= 1e21) {
    return (number / 1e21).toFixed(2) + " Sextillion";
  } else if (absNumber >= 1e18) {
    return (number / 1e18).toFixed(2) + " Quintillion";
  } else if (absNumber >= 1e15) {
    return (number / 1e15).toFixed(2) + " Quadrillion";
  } else if (absNumber >= 1e12) {
    return (number / 1e12).toFixed(2) + " Trillion";
  } else if (absNumber >= 1e9) {
    return (number / 1e9).toFixed(2) + " Billion";
  } else if (absNumber >= 1e6) {
    return (number / 1e6).toFixed(2) + " Million";
  } else if (absNumber >= 1e3) {
    return (number / 1e3).toFixed(2) + " Thousand";
  } else {
    return String(number);
  }
}

export const style = {
  title: "🌟 Rank",
  titleFont: "bold",
  content: {
    text_font: "fancy",
    // text_prefix: "➤ ",
  },
};

function isBrokenMoney(playerMoney) {
  return !!(
    isNaN(playerMoney) ||
    !isFinite(playerMoney) ||
    playerMoney < 0 ||
    playerMoney > Number.MAX_SAFE_INTEGER
  );
}

function sortUsers(users, top) {
  let result = {};
  let sortedKeys = Object.keys(users).sort(
    (a, b) => Number(users[b].money) - Number(users[a].money)
  );
  if (top) {
    sortedKeys = sortedKeys.slice(0, top);
  }
  for (const key of sortedKeys) {
    result[key] = users[key];
  }
  return result;
}
function getTop(id, users) {
  const sorted = sortUsers(users);
  return Object.keys(sorted).findIndex((key) => key === id) + 1;
}
function totalReducer(totalObj) {
  return Object.values(totalObj).reduce((a, b) => {
    const numA = Number(a);
    const numB = Number(b);

    if (!isNaN(numA) && !isNaN(numB)) {
      return numA + numB;
    } else {
      return numA;
    }
  }, 0);
}
const { parseCurrency: pCy } = global.utils;

/**
 * @type {CommandEntry}
 */
export async function entry({
  money,
  input,
  output,
  icon,
  prefix,
  clearCurrStack,
  CassEXP,
}) {
  const progressBar = (prog, need, totalBars = 7) => {
    const bar = "🟨";
    const empty = "⬜";
    const percent =
      need > 0
        ? Math.min(Math.max(Math.round((prog / need) * 100), 0), 100)
        : 0;
    const filledBars = Math.min(
      Math.max(Math.round((percent / 100) * totalBars), 0),
      totalBars
    );
    const emptyBars = totalBars - filledBars;

    const barX = bar.repeat(filledBars) + empty.repeat(emptyBars);
    return barX;
  };

  // output.prepend = UNIRedux.arrow;

  if (input.arguments[0] === "top") {
    let { participantIDs = [] } = input;
    if (!Array.isArray(participantIDs)) {
      participantIDs = [];
    }
    const allData = await money.getAll();

    const topList = Object.entries(allData)
      .sort(
        (a, b) =>
          new CassEXP(b[1].cassEXP).getEXP() -
          new CassEXP(a[1].cassEXP).getEXP()
      )
      .slice(0, 10);

    const formattedTopList = topList.map(([uid, data], index) => {
      const { name, money: userMoney, cassEXP } = data;
      const cxp = new CassEXP(cassEXP);

      return `${UNIRedux.arrow} ${index + 1}. ${name} 🌟\n${
        UNIRedux.arrowFromT
      } Level: ${cxp.getLevel()}\n${
        UNIRedux.arrowFromT
      } Experience: ${cxp.getEXP()} / ${cxp.getNextEXP()}\n${
        UNIRedux.arrowFromT
      } Current: ${cxp.getEXPCurrentLv()} / ${
        cxp.getNextEXP() - CassEXP.getEXPFromLevel(cxp.level - 1)
      }\n${UNIRedux.arrowFromT} ${progressBar(
        cxp.getEXPCurrentLv(),
        cxp.getNextEXP()
      )}\n`;
    });

    const response = formattedTopList.length
      ? `🌟 Top 10 List:\n${formattedTopList.join("\n")}`
      : "No data available for the top list.";

    return output.replyStyled(response, {
      ...style,
    });
  }

  let { senderID } = input;
  if (input.replier) {
    ({ senderID } = input.replier);
  }
  if (input.hasMentions) {
    ({ senderID } = input.firstMention);
  }
  if (input.arguments[0]) {
    senderID = input.arguments[0];
  }

  const data = await money.get(input.senderID);
  if (!data) {
    return output.reply(
      `${UNIRedux.arrow} ${
        input.senderID !== senderID ? data.name ?? "Unregistered" : "You"
      } are not yet registered in our system.`
    );
  }
  const { name, cassEXP } = data;
  const cxp = new CassEXP(cassEXP);

  output.reply(
    `${UNIRedux.arrow} ${
      input.senderID !== senderID ? data.name ?? "Unregistered" : "You"
    } are at Level ${cxp.getLevel()} with ${cxp.getEXP()} / ${cxp.getNextEXP()} experience points.\n${
      UNIRedux.arrowFromT
    } Current: ${cxp.getEXPCurrentLv()} / ${
      cxp.getNextEXP() - CassEXP.getEXPFromLevel(cxp.level - 1)
    } \n\n${UNIRedux.arrowFromT} ${progressBar(
      cxp.getEXPCurrentLv(),
      cxp.getNextEXP()
    )}`
  );
}
