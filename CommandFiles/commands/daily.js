import { UNIRedux } from "@cassidy/unispectra";

export const meta = {
  name: "daily",
  description: "Claim your daily reward!",
  version: "1.0.2",
  author: "Liane Cagara | JenicaDev",
  category: "Rewards",
  permissions: [0],
  noPrefix: false,
  requirement: "3.0.0",
  icon: "💎",
};

export const style = {
  title: "Daily Reward 💎",
  titleFont: "fancy",
  contentFont: "fancy",
};

/**
 * @type {CommandEntry}
 */
export async function entry({
  input,
  output,
  money,
  Collectibles,
  CassExpress,
  CassEXP,
}) {
  let {
    money: userMoney,
    lastDailyClaim,
    collectibles,
    battlePoints = 0,
    cassExpress = {},
    cassEXP: cxp,
    name = "Unregistered",
  } = await money.get(input.senderID);
  let cassEXP = new CassEXP(cxp);
  cassExpress = new CassExpress(cassExpress);
  collectibles = new Collectibles(collectibles);

  const currentTime = Date.now();
  const oneDayInMilliseconds = 24 * 60 * 60 * 1000;

  let canClaim = false;

  const elapsedTime = currentTime - (lastDailyClaim || Date.now());
  const claimTimes = Math.max(
    1,
    Math.floor(elapsedTime / oneDayInMilliseconds)
  );
  const dailyReward = 100 * claimTimes;
  const gemReward = claimTimes;
  const extraEXP = claimTimes * cassEXP.level * 5;
  const petPoints = Math.floor(dailyReward / 10);

  const rewardList =
    `${UNIRedux.arrow} ***Next Rewards***\n\n` +
    `🧪 **Experience Points** (x${extraEXP}) [exp]\n` +
    `💵 **Money** (x${dailyReward.toLocaleString()}) [money]\n` +
    `💶 **Pet Points** (x${petPoints.toLocaleString()}) [battlePoints]\n` +
    `💎 **Gems** (x${gemReward}) [gems]`;

  if (!lastDailyClaim) {
    canClaim = true;
  } else {
    const timeElapsed = currentTime - lastDailyClaim;
    if (timeElapsed >= oneDayInMilliseconds) {
      canClaim = true;
    } else if (input.isAdmin && input.arguments[0] === "cheat") {
      canClaim = true;
    } else {
      const timeRemaining = oneDayInMilliseconds - timeElapsed;
      const hoursRemaining = Math.floor(
        (timeRemaining / (1000 * 60 * 60)) % 24
      );
      const minutesRemaining = Math.floor((timeRemaining / (1000 / 60)) % 60);
      const secondsRemaining = Math.floor((timeRemaining / 1000) % 60);

      return output.reply(
        `👤 **${name}** (Daily Claim)\n\n` +
          `❌ Wait ${hoursRemaining} hours, ${minutesRemaining} minutes, and ${secondsRemaining} seconds to claim again.\n\n` +
          `${rewardList}`
      );
    }
  }

  if (canClaim) {
    cassExpress.createMail({
      title: `Daily Reward Claimed`,
      author: input.senderID,
      body: `Congratulations **${name}** for claiming your daily reward!`,
      timeStamp: Date.now(),
    });

    cassEXP.expControls.raise(extraEXP);
    collectibles.raise("gems", gemReward);
    await money.set(input.senderID, {
      money: userMoney + dailyReward,
      lastDailyClaim: currentTime,
      battlePoints: battlePoints + petPoints,
      collectibles: Array.from(collectibles),
      cassExpress: cassExpress.raw(),
      cassEXP: cassEXP.raw(),
    });

    const claimedList =
      `${UNIRedux.arrow} ***Rewards***\n\n` +
      `🧪 **Experience Points** (x${extraEXP}) [exp]\n` +
      `💵 **Money** (x${dailyReward.toLocaleString()}) [money]\n` +
      `💶 **Pet Points** (x${petPoints.toLocaleString()}) [battlePoints]\n` +
      `💎 **Gems** (x${gemReward}) [gems]`;

    return output.reply(
      `👤 **${name}** (Daily Claim)\n\n` +
        `✅ Claimed your daily reward! Come back tomorrow.\n\n` +
        `${claimedList}`
    );
  }
}
