import { NeonHub } from "@cass-modules/neonhub";
import { UNIRedux } from "../modules/unisym.js";

export const style = {
  title: "GambleDen 🎰",
  titleFont: "bold",
  contentFont: "fancy",
};

export const meta = {
  name: "gambleden",
  description: "Test your luck in the neon-lit GambleDen!",
  author: "JenicaDev",
  version: "1.0.1",
  usage: "{prefix}{name} -<game> <betamount> [args]",
  category: "Gambling Games",
  permissions: [0],
  noPrefix: "both",
  waitingTime: 10,
  otherNames: ["gden", "gd"],
  requirement: "2.5.0",
  icon: "🎰",
  requiredLevel: 2,
};

const gameDescriptions = {
  neonflip: "**💰 Neon Flip** - Flip a coin, double your bet or lose it all.",
  diceclash: "**🎲 Dice Clash** - Roll higher than the house to win.",
  gemheist: "**💎 Gem Heist** - Pick a gem, score big or bust.",
  shadowrace: "**🏁 Shadow Race** - Bet on a racer, win if they place top 3.",
  luckystrike: "**⚡ Lucky Strike** - Match numbers for a jackpot.",
};

export async function entry(ctx) {
  const { input, output, money, Inventory, prefix, args } = ctx;

  const {
    money: playerMoney = 0,
    prizePool = 0,
    name = "Unregistered",
    inventory: rawInventory = [],
  } = await money.get(input.senderID);
  const inventory = new Inventory(rawInventory);
  const { invLimit } = global.Cassidy;

  const formatMoney = (amount) => `$${amount.toLocaleString()}`;

  const home = new NeonHub({
    pulseEffect: false,
    commands: [
      {
        key: "neonflip",
        description: gameDescriptions.neonflip,
        aliases: ["-nf"],
        args: ["<bet>"],
        async handler({ args }) {
          const bet = parseInt(args[0]);
          if (!bet || bet <= 0 || bet > playerMoney) {
            return (
              `👤 **${name}** (GambleDen)\n\n` +
              `❌ Invalid bet! You have ${formatMoney(playerMoney)}.`
            );
          }

          const maxWin = prizePool * 2;
          const potentialWin = bet * 2;
          const canWin = potentialWin <= maxWin;
          const flip = canWin && Math.random() < 0.5 ? "Heads" : "Tails";
          const win = flip === "Heads";
          const payout = win ? potentialWin : -bet;
          const newMoney = playerMoney + payout;
          const newPrizePool = win
            ? Math.max(0, prizePool - potentialWin)
            : prizePool + bet;

          await money.set(input.senderID, {
            money: newMoney,
            prizePool: newPrizePool,
          });

          return (
            `👤 **${name}** (GambleDen)\n\n` +
            `${UNIRedux.arrow} ***Neon Flip***\n` +
            `Coin: **${flip}**\n` +
            `${win ? "🎉 You doubled it!" : "❌ Tough break!"}\n` +
            `Payout: ${formatMoney(payout)}\n` +
            `New Balance: ${formatMoney(newMoney)}\n` +
            `Prize Pool: ${formatMoney(newPrizePool)}`
          );
        },
      },
      {
        key: "diceclash",
        description: gameDescriptions.diceclash,
        aliases: ["-dc"],
        args: ["<bet>"],
        async handler({ args }) {
          const bet = parseInt(args[0]);
          if (!bet || bet <= 0 || bet > playerMoney) {
            return (
              `👤 **${name}** (GambleDen)\n\n` +
              `❌ Invalid bet! You have ${formatMoney(playerMoney)}.`
            );
          }

          const maxWin = prizePool * 2;
          const potentialWin = bet * 1.5;
          const canWin = potentialWin <= maxWin;
          const playerRoll =
            Math.floor(Math.random() * 6) +
            1 +
            Math.floor(Math.random() * 6) +
            1;
          const houseRoll =
            canWin && playerRoll > houseRoll
              ? Math.floor(Math.random() * 6) +
                1 +
                Math.floor(Math.random() * 6) +
                1
              : playerRoll + 1;
          const win = playerRoll > houseRoll;
          const payout = win ? potentialWin : -bet;
          const newMoney = playerMoney + payout;
          const newPrizePool = win
            ? Math.max(0, prizePool - potentialWin)
            : prizePool + bet;

          await money.set(input.senderID, {
            money: newMoney,
            prizePool: newPrizePool,
          });

          return (
            `👤 **${name}** (GambleDen)\n\n` +
            `${UNIRedux.arrow} ***Dice Clash***\n` +
            `Your Roll: 🎲 ${playerRoll}\n` +
            `House Roll: 🎲 ${houseRoll}\n` +
            `${win ? "🎉 You beat the house!" : "❌ House wins!"}\n` +
            `Payout: ${formatMoney(payout)}\n` +
            `New Balance: ${formatMoney(newMoney)}\n` +
            `Prize Pool: ${formatMoney(newPrizePool)}`
          );
        },
      },
      {
        key: "gemheist",
        description: gameDescriptions.gemheist,
        aliases: ["-gh"],
        args: ["<bet>"],
        async handler({ args }) {
          const bet = parseInt(args[0]);
          if (!bet || bet <= 0 || bet > playerMoney) {
            return (
              `👤 **${name}** (GambleDen)\n\n` +
              `❌ Invalid bet! You have ${formatMoney(playerMoney)}.`
            );
          }

          const maxWin = prizePool * 2;
          const gems = [
            { symbol: "💎", chance: 0.2, multiplier: 3 },
            { symbol: "💍", chance: 0.3, multiplier: 2 },
            { symbol: "💿", chance: 0.5, multiplier: 0 },
          ];
          const potentialWin = Math.max(...gems.map((g) => bet * g.multiplier));
          const canWin = potentialWin <= maxWin;
          const roll = Math.random();
          let cumulative = 0;
          const pickedGem = canWin
            ? gems.find((gem) => {
                cumulative += gem.chance;
                return roll <= cumulative;
              })
            : gems.find((g) => g.multiplier === 0);
          const payout =
            pickedGem.multiplier > 0 ? bet * pickedGem.multiplier : -bet;
          const newMoney = playerMoney + payout;
          const newPrizePool =
            payout > 0 ? Math.max(0, prizePool - payout) : prizePool + bet;

          await money.set(input.senderID, {
            money: newMoney,
            prizePool: newPrizePool,
          });

          return (
            `👤 **${name}** (GambleDen)\n\n` +
            `${UNIRedux.arrow} ***Gem Heist***\n` +
            `Picked: ${pickedGem.symbol}\n` +
            `${payout > 0 ? "🎉 Jackpot!" : "❌ Empty-handed!"}\n` +
            `Payout: ${formatMoney(payout)}\n` +
            `New Balance: ${formatMoney(newMoney)}\n` +
            `Prize Pool: ${formatMoney(newPrizePool)}`
          );
        },
      },
      {
        key: "shadowrace",
        description: gameDescriptions.shadowrace,
        aliases: ["-sr"],
        args: ["<bet>", "<racer: 1-5>"],
        async handler({ args }) {
          const bet = parseInt(args[0]);
          const racerChoice = parseInt(args[1]);
          if (
            !bet ||
            bet <= 0 ||
            bet > playerMoney ||
            !racerChoice ||
            racerChoice < 1 ||
            racerChoice > 5
          ) {
            return (
              `👤 **${name}** (GambleDen)\n\n` +
              `❌ Invalid bet or racer (1-5)! You have ${formatMoney(
                playerMoney
              )}.`
            );
          }

          const maxWin = prizePool * 2;
          const potentialWin = bet * 2.5;
          const canWin = potentialWin <= maxWin;
          const racers = Array.from({ length: 5 }, (_, i) => ({
            id: i + 1,
            finish: Math.floor(Math.random() * 10) + 1,
          })).sort((a, b) => a.finish - b.finish);
          const topThree = canWin
            ? racers.slice(0, 3).map((r) => r.id)
            : racers
                .filter((r) => r.id !== racerChoice)
                .slice(0, 3)
                .map((r) => r.id);
          const win = topThree.includes(racerChoice);
          const payout = win ? potentialWin : -bet;
          const newMoney = playerMoney + payout;
          const newPrizePool = win
            ? Math.max(0, prizePool - potentialWin)
            : prizePool + bet;

          await money.set(input.senderID, {
            money: newMoney,
            prizePool: newPrizePool,
          });

          return (
            `👤 **${name}** (GambleDen)\n\n` +
            `${UNIRedux.arrow} ***Shadow Race***\n` +
            `Your Pick: Racer ${racerChoice}\n` +
            `Top 3: ${topThree.join(", ")}\n` +
            `${win ? "🎉 Racer placed!" : "❌ Out of the money!"}\n` +
            `Payout: ${formatMoney(payout)}\n` +
            `New Balance: ${formatMoney(newMoney)}\n` +
            `Prize Pool: ${formatMoney(newPrizePool)}`
          );
        },
      },
      {
        key: "luckystrike",
        description: gameDescriptions.luckystrike,
        aliases: ["-ls"],
        args: ["<bet>"],
        async handler({ args }) {
          const bet = parseInt(args[0]);
          if (!bet || bet <= 0 || bet > playerMoney) {
            return (
              `👤 **${name}** (GambleDen)\n\n` +
              `❌ Invalid bet! You have ${formatMoney(playerMoney)}.`
            );
          }

          const maxWin = prizePool * 2;
          const potentialWin = bet * 5;
          const canWin = potentialWin <= maxWin;
          const playerNumbers = Array.from(
            { length: 3 },
            () => Math.floor(Math.random() * 9) + 1
          );
          const winningNumbers = canWin
            ? Array.from({ length: 3 }, () => Math.floor(Math.random() * 9) + 1)
            : playerNumbers.map((n, i) => (i === 0 ? n + 1 : n));
          const matches = playerNumbers.filter(
            (num, i) => num === winningNumbers[i]
          ).length;
          const multiplier = canWin
            ? matches === 3
              ? 5
              : matches === 2
              ? 2
              : matches === 1
              ? 1
              : 0
            : 0;
          const payout = multiplier > 0 ? bet * multiplier : -bet;
          const newMoney = playerMoney + payout;
          const newPrizePool =
            payout > 0 ? Math.max(0, prizePool - payout) : prizePool + bet;

          await money.set(input.senderID, {
            money: newMoney,
            prizePool: newPrizePool,
          });

          return (
            `👤 **${name}** (GambleDen)\n\n` +
            `${UNIRedux.arrow} ***Lucky Strike***\n` +
            `Your Numbers: ${playerNumbers.join(" ")}\n` +
            `Winning Numbers: ${winningNumbers.join(" ")}\n` +
            `Matches: ${matches}\n` +
            `${payout > 0 ? "🎉 Strike!" : "❌ No luck!"}\n` +
            `Payout: ${formatMoney(payout)}\n` +
            `New Balance: ${formatMoney(newMoney)}\n` +
            `Prize Pool: ${formatMoney(newPrizePool)}`
          );
        },
      },
    ],
  });

  return home.runInContext(ctx);
}
