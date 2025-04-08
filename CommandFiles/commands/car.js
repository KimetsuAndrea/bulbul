import { SpectralCMDHome } from "@cassidy/spectral-home";
import { CassEXP } from "../modules/cassEXP.js";
import { clamp, UNIRedux } from "../modules/unisym.js";

export const meta = {
  name: "car",
  description: "Rule the roads: customize, race, and build your car empire!",
  otherNames: ["c"],
  version: "1.0.9",
  usage: "{prefix}{name} <command> [args]",
  category: "Simulation Games",
  author: "JenicaDev",
  permissions: [0],
  noPrefix: "both",
  waitingTime: 1,
  requirement: "2.5.0",
  icon: "🚗",
};

const { invLimit } = global.Cassidy;

async function confirmSell({ input, output, repObj, money }) {
  const { carsData, newMoney, price, author, carToSell, code } = repObj;
  const { name = "Unregistered" } = await money.get(input.senderID);

  if (author !== input.senderID) return;
  if (input.body.trim() !== code.trim()) {
    return output.reply(
      `👤 **${name}** (Car)\n\n❌ Wrong code. Sale cancelled.`
    );
  }

  carsData.deleteOne(carToSell.key);
  await money.set(input.senderID, {
    money: newMoney,
    carsData: Array.from(carsData),
  });

  return output.reply(
    `👤 **${name}** (Car)\n\n✅ Sold ${carToSell.icon} **${carToSell.name}** for $${price}💵\nYour empire grows!`
  );
}

async function uncageReply({ input, output, Inventory, money, repObj }) {
  const { author, inventory, carVentory, type, detectID } = repObj;
  const { name = "Unregistered", carsData: rawCarsData = [] } = await money.get(
    input.senderID
  );
  const carsData = new Inventory(rawCarsData);

  if (input.senderID !== author) return;
  if (carsData.getAll().length >= invLimit) {
    return output.reply(
      `👤 **${name}** (Car)\n\n❌ Garage full! Max ${invLimit} cars. Sell or upgrade your garage.`
    );
  }

  switch (type) {
    case "uncaging":
      await handleUncage();
      break;
    case "naming":
      await handleRename();
      break;
  }

  async function handleUncage() {
    const index = Number(input.body) - 1;
    const item = carVentory.getAll()[index];
    if (!item) {
      return output.reply(
        `👤 **${name}** (Car)\n\n❌ Invalid number. Try again.`
      );
    }
    const i = await output.reply(
      `👤 **${name}** (Car)\n\n${item.icon} **${item.name}**\nName your ride (no spaces):`
    );
    input.delReply(detectID);
    input.setReply(i.messageID, {
      author: input.senderID,
      callback: uncageReply,
      type: "naming",
      item,
      key: "car",
      inventory,
      carVentory,
      detectID: i.messageID,
    });
  }

  async function handleRename() {
    const { item } = repObj;
    const s = input.body.trim().split(" ")[0];
    const newName = s.length > 20 ? s.slice(0, 20) : s;
    const existingCar = carsData.getAll().find((car) => car.name === newName);
    if (existingCar) {
      return output.reply(
        `👤 **${name}** (Car)\n\n❌ "${newName}" taken by ${existingCar.carType} ${existingCar.icon}. Pick another.`
      );
    }

    const updatedItem = updateCarData(item);
    carsData.addOne({
      ...updatedItem,
      name: newName,
      carType: item.key,
      key: "car:" + item.key + "_" + Date.now(),
      level: 1,
      fuel: 100,
      distance: 0,
      lastAction: null,
      condition: 100,
      upgrades: [],
      achievements: [],
      crew: [],
    });
    inventory.deleteOne(item.key);
    await money.set(input.senderID, {
      inventory: Array.from(inventory),
      carsData: Array.from(carsData),
    });

    input.delReply(detectID);
    return output.reply(
      `👤 **${name}** (Car)\n\n✅ Unleashed ${item.icon} **${newName}** (${item.key}) from the garage!\nReady to rule the roads!`
    );
  }
}

export const style = {
  title: "NicaBoT CarSim 🚗",
  titleFont: "fancy",
  contentFont: "fancy",
};

const carShopItems = [
  {
    icon: "🚗",
    name: "Sedan",
    flavorText: "A reliable daily driver.",
    key: "sedan",
    price: 1000,
    onPurchase({ moneySet }) {
      moneySet.inventory.push({
        name: "Sedan",
        key: "sedan",
        flavorText: "Balanced and dependable.",
        icon: "🚗",
        type: "car",
        sellPrice: 500,
        maxSpeed: 120,
        fuelEfficiency: 0.5,
        durability: 1.0,
      });
    },
  },
  {
    icon: "🏎️",
    name: "Sports Car",
    flavorText: "Speed and style in one.",
    key: "sportsCar",
    price: 5000,
    onPurchase({ moneySet }) {
      moneySet.inventory.push({
        name: "Sports Car",
        key: "sportsCar",
        flavorText: "Built for racing.",
        icon: "🏎️",
        type: "car",
        sellPrice: 2500,
        maxSpeed: 180,
        fuelEfficiency: 0.7,
        durability: 0.8,
      });
    },
  },
  {
    icon: "🚚",
    name: "Truck",
    flavorText: "Hauls big, moves slow.",
    key: "truck",
    price: 3000,
    onPurchase({ moneySet }) {
      moneySet.inventory.push({
        name: "Truck",
        key: "truck",
        flavorText: "Heavy duty hauler.",
        icon: "🚚",
        type: "car",
        sellPrice: 1500,
        maxSpeed: 90,
        fuelEfficiency: 0.9,
        durability: 1.5,
      });
    },
  },
  {
    icon: "🏍️",
    name: "Motorcycle",
    flavorText: "Fast but fragile.",
    key: "motorcycle",
    price: 2000,
    onPurchase({ moneySet }) {
      moneySet.inventory.push({
        name: "Motorcycle",
        key: "motorcycle",
        flavorText: "Nimble and quick.",
        icon: "🏍️",
        type: "car",
        sellPrice: 1000,
        maxSpeed: 150,
        fuelEfficiency: 0.4,
        durability: 0.6,
      });
    },
  },
  {
    icon: "🚓",
    name: "Police Cruiser",
    flavorText: "Chase-ready classic.",
    key: "policeCruiser",
    price: 4000,
    onPurchase({ moneySet }) {
      moneySet.inventory.push({
        name: "Police Cruiser",
        key: "policeCruiser",
        flavorText: "Built for pursuit.",
        icon: "🚓",
        type: "car",
        sellPrice: 2000,
        maxSpeed: 140,
        fuelEfficiency: 0.6,
        durability: 1.2,
      });
    },
  },
  {
    icon: "⛽",
    name: "Regular Fuel",
    flavorText: "Standard fuel for any car.",
    key: "regularFuel",
    price: 50,
    onPurchase({ moneySet }) {
      moneySet.inventory.push({
        name: "Regular Fuel",
        key: "regularFuel",
        flavorText: "Refills 50% fuel.",
        icon: "⛽",
        type: "fuel",
        sellPrice: 25,
        fuelAmount: 50,
        speedBoost: 0,
      });
    },
  },
  {
    icon: "🛢️",
    name: "Premium Fuel",
    flavorText: "High-octane performance.",
    key: "premiumFuel",
    price: 100,
    onPurchase({ moneySet }) {
      moneySet.inventory.push({
        name: "Premium Fuel",
        key: "premiumFuel",
        flavorText: "Refills 75% fuel, slight speed boost.",
        icon: "🛢️",
        type: "fuel",
        sellPrice: 50,
        fuelAmount: 75,
        speedBoost: 10,
      });
    },
  },
  {
    icon: "⚡",
    name: "Nitro Boost",
    flavorText: "Explosive speed burst.",
    key: "nitroBoost",
    price: 250,
    onPurchase({ moneySet }) {
      moneySet.inventory.push({
        name: "Nitro Boost",
        key: "nitroBoost",
        flavorText: "Refills 100% fuel, big speed boost.",
        icon: "⚡",
        type: "fuel",
        sellPrice: 125,
        fuelAmount: 100,
        speedBoost: 25,
      });
    },
  },
  {
    icon: "⚙️",
    name: "Turbo Engine",
    flavorText: "Boosts speed.",
    key: "turboEngine",
    price: 2000,
    onPurchase({ moneySet }) {
      moneySet.inventory.push({
        name: "Turbo Engine",
        key: "turboEngine",
        flavorText: "Increases max speed by 30 mph.",
        icon: "⚙️",
        type: "upgrade",
        sellPrice: 1000,
        speedBoost: 30,
      });
    },
  },
  {
    icon: "🛠️",
    name: "Repair Kit",
    flavorText: "Restores car condition.",
    key: "repairKit",
    price: 300,
    onPurchase({ moneySet }) {
      moneySet.inventory.push({
        name: "Repair Kit",
        key: "repairKit",
        flavorText: "Restores 50% condition.",
        icon: "🛠️",
        type: "repair",
        sellPrice: 150,
        conditionBoost: 50,
      });
    },
  },
  {
    icon: "🛡️",
    name: "Armor Plating",
    flavorText: "Increases durability.",
    key: "armorPlating",
    price: 1500,
    onPurchase({ moneySet }) {
      moneySet.inventory.push({
        name: "Armor Plating",
        key: "armorPlating",
        flavorText: "Reduces condition damage by 20%.",
        icon: "🛡️",
        type: "upgrade",
        sellPrice: 750,
        durabilityBoost: 0.2,
      });
    },
  },
];

function calculateWorth(car) {
  const updatedCar = updateCarData(car);
  const { sellPrice, level, distance, upgrades, condition } = updatedCar;
  const upgradeValue = upgrades.length * 500;
  const conditionFactor = condition / 100;
  return Math.floor(
    (sellPrice * 2 + distance * 0.1 * 2 ** (level - 1) + upgradeValue) *
      conditionFactor
  );
}

function isCarLowOnFuel(car) {
  const updatedCar = updateCarData(car);
  return updatedCar.fuel <= 20;
}

function isCarDamaged(car) {
  const updatedCar = updateCarData(car);
  return updatedCar.condition <= 30;
}

function updateCarData(carData) {
  const cleanedCarData = {};
  for (const key in carData) {
    if (carData[key] !== null) {
      cleanedCarData[key] = carData[key];
    }
  }

  const defaults = {
    distance: 0,
    level: 1,
    fuel: 100,
    condition: 100,
    maxSpeed: 120,
    fuelEfficiency: 0.5,
    durability: 1.0,
    currentSpeed: 0,
    gear: 0,
    isRunning: false,
    lastAction: null,
    upgrades: [],
    crew: [],
    achievements: [],
    sellPrice: 500,
    carType: cleanedCarData.carType || "unknown",
    icon: cleanedCarData.icon || "🚗",
    name: cleanedCarData.name || "Unnamed",
    key: cleanedCarData.key || `car:unknown_${Date.now()}`,
  };

  // Step 3: Merge cleaned data with defaults
  const updatedCar = { ...defaults, ...cleanedCarData };
  updatedCar.level =
    updatedCar.distance < 100
      ? 1
      : Math.floor(Math.log2(updatedCar.distance / 100)) + 1;
  return updatedCar;
}

function calculateNextLevel(carData) {
  const updatedCar = updateCarData(carData);
  const { distance } = updatedCar;
  const currentLevel =
    distance < 100 ? 1 : Math.floor(Math.log2(distance / 100)) + 1;
  const nextLevel = currentLevel + 1;
  return nextLevel < 2 ? 100 : 100 * Math.pow(2, nextLevel - 1);
}

const carShop = {
  key: "carShop",
  sellTexts: ["🛑 We don’t buy junk here!"],
  tradeRefuses: ["🛑 Cash only, no trades!"],
  talkTexts: [
    {
      name: "Introduce Yourself",
      responses: ["🚗 I’m Alex, king of car deals!"],
      icon: "🛡️",
    },
    {
      name: "Hot Tip",
      responses: ["🚗 Upgrade for better races!"],
      icon: "💡",
    },
  ],
  buyTexts: ["🚗 Pick your beast!"],
  welcomeTexts: ["🚗 Welcome to Alex’s Elite Garage!"],
  goBackTexts: ["🚗 Browse away."],
  askTalkTexts: ["🚗 What’s up?"],
  thankTexts: ["🚗 Drive like a legend!"],
};

const weatherEffects = {
  Sunny: { speedMod: 1.0, fuelMod: 1.0, conditionMod: 1.0 },
  Rain: { speedMod: 0.8, fuelMod: 1.1, conditionMod: 1.2 },
  Snow: { speedMod: 0.6, fuelMod: 1.3, conditionMod: 1.5 },
};

function getRandomWeather() {
  const weathers = Object.keys(weatherEffects);
  return weathers[Math.floor(Math.random() * weathers.length)];
}

const achievements = {
  "Road Warrior": { condition: (car) => car.distance >= 1000, reward: 500 },
  "Speed Demon": { condition: (car) => car.maxSpeed >= 200, reward: 1000 },
  "Crew Master": { condition: (car) => car.crew.length >= 3, reward: 750 },
};

export async function entry(ctx) {
  const {
    input,
    output,
    money,
    Inventory,
    UTShop,
    generateGift,
    prefix,
    args,
  } = ctx;
  const {
    name = "Unregistered",
    carsData: rawCarsData = [],
    inventory: rawInventory = [],
    money: playerMoney = 0,
    cassEXP: cxp,
  } = await money.get(input.senderID);

  const home = new SpectralCMDHome({ isHypen: true }, [
    {
      key: "status",
      description: "Inspect your car’s diagnostics",
      aliases: ["-s"],
      args: ["[car_name]"],
      async handler() {
        const carsData = new Inventory(rawCarsData);
        if (args[0]) {
          const car = carsData
            .getAll()
            .find(
              (car) =>
                String(car.name).toLowerCase().trim() ===
                String(args[0]).toLowerCase().trim()
            );
          if (!car) {
            return output.reply(
              `👤 **${name}** (Car)\n\n❌ No car named "${args[0]}"!`
            );
          }
          const updatedCar = updateCarData(car);
          return output.reply(
            `👤 **${name}** (Car)\n\n${UNIRedux.arrow} ***Diagnostics***\n\n` +
              `${updatedCar.icon} **${updatedCar.name}** (${updatedCar.carType})\n` +
              `Speed: ${updatedCar.currentSpeed}/${updatedCar.maxSpeed} mph\n` +
              `Gear: ${updatedCar.gear}/6\n` +
              `Fuel: ${updatedCar.fuel.toFixed(1)}%\n` +
              `Condition: ${updatedCar.condition.toFixed(1)}%\n` +
              `Distance: ${updatedCar.distance.toFixed(1)} miles\n` +
              `Level: ${updatedCar.level}\n` +
              `Next Level: ${updatedCar.distance}/${calculateNextLevel(
                updatedCar
              )} miles\n` +
              `Upgrades: ${
                updatedCar.upgrades.length
                  ? updatedCar.upgrades.join(", ")
                  : "None"
              }\n` +
              `Crew: ${
                updatedCar.crew.length ? updatedCar.crew.join(", ") : "None"
              }\n` +
              `Achievements: ${
                updatedCar.achievements.length
                  ? updatedCar.achievements.join(", ")
                  : "None"
              }\n` +
              `Worth: $${calculateWorth(updatedCar)}\n` +
              `Engine: ${updatedCar.isRunning ? "Revving" : "Idle"}\n` +
              `${isCarLowOnFuel(updatedCar) ? "⛽ Fuel critical!\n" : ""}` +
              `${isCarDamaged(updatedCar) ? "🛠️ Needs repairs!\n" : ""}` +
              `ID: ${updatedCar.key}`
          );
        }

        let result = `👤 **${name}** (Car)\n\n${UNIRedux.arrow} ***Garage***\n\n`;
        for (const car of carsData.getAll()) {
          const updatedCar = updateCarData(car);
          result +=
            `${updatedCar.icon} **${updatedCar.name}** (${updatedCar.carType})\n` +
            `Fuel: ${updatedCar.fuel.toFixed(
              1
            )}% | Condition: ${updatedCar.condition.toFixed(1)}%\n` +
            `Distance: ${updatedCar.distance.toFixed(1)} miles\n\n`;
        }
        result += `Use "${prefix}car status <car_name>" for details!`;
        return output.reply(result);
      },
    },
    {
      key: "sell",
      description: "Cash out a car",
      aliases: ["-sl"],
      args: ["<car_name>"],
      async handler() {
        const carsData = new Inventory(rawCarsData);
        const nameToSell = String(args[0]);
        if (!nameToSell) {
          return output.reply(
            `👤 **${name}** (Car)\n\n❌ Specify a car to sell!`
          );
        }

        const carToSell =
          carsData
            .getAll()
            .find(
              (car) =>
                car.name.toLowerCase().trim() ===
                nameToSell.toLowerCase().trim()
            ) || carsData.getOne(nameToSell);
        if (!carToSell) {
          return output.reply(
            `👤 **${name}** (Car)\n\n❌ No car named "${nameToSell}"!`
          );
        }
        const updatedCar = updateCarData(carToSell);
        if (updatedCar.level < 2) {
          return output.reply(
            `👤 **${name}** (Car)\n\n❌ "${updatedCar.name}" needs level 2+ to sell!`
          );
        }

        const price = calculateWorth(updatedCar);
        const newMoney = playerMoney + price;
        const code = global.utils.generateCaptchaCode(12);
        const i = await output.reply(
          `👤 **${name}** (Car)\n\n🚨 Confirm sale of ${updatedCar.icon} **${updatedCar.name}** for $${price}💵\n` +
            `Condition: ${updatedCar.condition.toFixed(1)}% | Upgrades: ${
              updatedCar.upgrades.length
            }\n` +
            `Reply with code: [${code}]`
        );
        input.setReply(i.messageID, {
          carsData,
          newMoney,
          code,
          price,
          author: input.senderID,
          carToSell: updatedCar,
          key: "car",
          callback: confirmSell,
        });
      },
    },
    {
      key: "shop",
      description: "Visit the elite dealership",
      aliases: ["-sh"],
      async handler() {
        const shop = new UTShop({ ...carShop, itemData: carShopItems });
        await shop.onPlay();
      },
    },
    {
      key: "drive",
      description: "Burn rubber on the open road",
      aliases: ["-d"],
      args: ["<car_name>", "<distance>"],
      async handler() {
        const carsData = new Inventory(rawCarsData);
        const cassEXP = new CassEXP(cxp);
        const [targetCar, distanceStr] = args;
        let distance = parseFloat(distanceStr) || 10;

        if (!targetCar) {
          return output.reply(
            `👤 **${name}** (Car)\n\n❌ Usage: ${prefix}car drive <car_name> <distance>`
          );
        }

        const rawTargetCarData = carsData
          .getAll()
          .find((car) => car.name.toLowerCase() === targetCar.toLowerCase());
        if (!rawTargetCarData) {
          return output.reply(
            `👤 **${name}** (Car)\n\n❌ No car named "${targetCar}"!`
          );
        }
        const targetCarData = updateCarData(rawTargetCarData);
        if (targetCarData.fuel <= 0) {
          return output.reply(
            `👤 **${name}** (Car)\n\n❌ **${targetCarData.name}** is out of gas! Refuel it.`
          );
        }
        if (targetCarData.condition <= 10) {
          return output.reply(
            `👤 **${name}** (Car)\n\n❌ **${targetCarData.name}** is too wrecked to drive!`
          );
        }

        const weather = getRandomWeather();
        const { speedMod, fuelMod, conditionMod } = weatherEffects[weather];
        const maxSpeed = targetCarData.maxSpeed * speedMod;
        if (distance * 5 > maxSpeed) {
          distance = maxSpeed / 5;
        }

        const fuelCost = distance * targetCarData.fuelEfficiency * fuelMod;
        const conditionDamage =
          distance * 0.1 * conditionMod * (1 - targetCarData.durability);
        targetCarData.distance += distance;
        targetCarData.fuel = Math.max(targetCarData.fuel - fuelCost, 0);
        targetCarData.condition = Math.max(
          targetCarData.condition - conditionDamage,
          0
        );
        targetCarData.isRunning = targetCarData.fuel > 0;
        targetCarData.currentSpeed = clamp(distance * 5, 0, maxSpeed);
        targetCarData.gear = Math.min(
          Math.floor(targetCarData.currentSpeed / 20) + 1,
          6
        );

        const updatedCar = updateCarData(targetCarData);
        const expGain = clamp(3, Math.floor(updatedCar.distance / 100), 50);
        cassEXP.expControls.raise(expGain);
        const moneyEarned = Math.floor(distance * updatedCar.level * 0.5);

        checkAchievements(updatedCar);
        carsData.deleteOne(updatedCar.key);
        carsData.addOne(updatedCar);
        await money.set(input.senderID, {
          carsData: Array.from(carsData),
          cassEXP: cassEXP.raw(),
          money: playerMoney + moneyEarned,
        });

        return output.reply(
          `👤 **${name}** (Car)\n\n✅ Drove ${updatedCar.icon} **${updatedCar.name}** for ${distance} miles!\n` +
            `Weather: ${weather}\n\n` +
            `${UNIRedux.arrow} ***Status***\n` +
            `${updatedCar.icon} **${updatedCar.name}**\n` +
            `Speed: ${updatedCar.currentSpeed} mph\n` +
            `Fuel: ${updatedCar.fuel.toFixed(1)}%\n` +
            `Condition: ${updatedCar.condition.toFixed(1)}%\n` +
            `Distance: ${updatedCar.distance.toFixed(1)} miles\n` +
            `Level: ${updatedCar.level}\n` +
            `Worth: $${calculateWorth(updatedCar)}\n` +
            `Earnings: $${moneyEarned}💵 | EXP: +${expGain}\n` +
            `${isCarLowOnFuel(updatedCar) ? "⛽ Fuel low!\n" : ""}` +
            `${isCarDamaged(updatedCar) ? "🛠️ Needs repairs!\n" : ""}`
        );
      },
    },
    {
      key: "race",
      description: "Challenge a rival crew",
      aliases: ["-rc"],
      args: ["<car_name>"],
      async handler() {
        const carsData = new Inventory(rawCarsData);
        const cassEXP = new CassEXP(cxp);
        const targetCar = args[0];

        if (!targetCar) {
          return output.reply(
            `👤 **${name}** (Car)\n\n❌ Usage: ${prefix}car race <car_name>`
          );
        }

        const rawTargetCarData = carsData
          .getAll()
          .find((car) => car.name.toLowerCase() === targetCar.toLowerCase());
        if (!rawTargetCarData) {
          return output.reply(
            `👤 **${name}** (Car)\n\n❌ No car named "${targetCar}"!`
          );
        }
        const targetCarData = updateCarData(rawTargetCarData);
        if (targetCarData.fuel < 20) {
          return output.reply(
            `👤 **${name}** (Car)\n\n❌ **${targetCarData.name}** needs 20%+ fuel to race!`
          );
        }
        if (targetCarData.condition < 30) {
          return output.reply(
            `👤 **${name}** (Car)\n\n❌ **${targetCarData.name}** is too damaged to race!`
          );
        }

        const raceDistance = 50;
        const weather = getRandomWeather();
        const { speedMod } = weatherEffects[weather];
        const playerSpeed =
          targetCarData.maxSpeed * (targetCarData.level / 10 + 0.9) * speedMod;
        const opponentSpeed =
          130 + Math.random() * 50 + Math.min(targetCarData.level * 10, 50);
        const fuelCost = raceDistance * targetCarData.fuelEfficiency;
        const conditionDamage =
          raceDistance * 0.15 * (1 - targetCarData.durability);

        if (targetCarData.fuel < fuelCost) {
          return output.reply(
            `👤 **${name}** (Car)\n\n❌ **${
              targetCarData.name
            }** needs ${fuelCost.toFixed(1)}% fuel for the race!`
          );
        }

        const playerTime = (raceDistance / playerSpeed) * 60;
        const opponentTime = (raceDistance / opponentSpeed) * 60;
        const playerWins = playerTime < opponentTime;
        const crewBonus = targetCarData.crew.length * 0.05;
        const reward = playerWins
          ? Math.floor((150 + targetCarData.level * 40) * (1 + crewBonus))
          : Math.floor(30 * (1 + crewBonus));
        targetCarData.distance += raceDistance;
        targetCarData.fuel = Math.max(targetCarData.fuel - fuelCost, 0);
        targetCarData.condition = Math.max(
          targetCarData.condition - conditionDamage,
          0
        );

        const updatedCar = updateCarData(targetCarData);
        const expGain = playerWins ? 20 + targetCarData.crew.length * 5 : 10;
        cassEXP.expControls.raise(expGain);
        const newMoney = playerMoney + reward;

        checkAchievements(updatedCar);
        carsData.deleteOne(updatedCar.key);
        carsData.addOne(updatedCar);
        await money.set(input.senderID, {
          carsData: Array.from(carsData),
          cassEXP: cassEXP.raw(),
          money: newMoney,
        });

        const resultText = playerWins
          ? `🏁 Victory! Beat them by ${(opponentTime - playerTime).toFixed(
              2
            )} minutes!`
          : `🏁 Defeat. They finished ${(playerTime - opponentTime).toFixed(
              2
            )} minutes ahead.`;
        return output.reply(
          `👤 **${name}** (Car)\n\n🏎️ **Race Mode** - ${updatedCar.icon} **${updatedCar.name}**\n\n` +
            `Weather: ${weather}\n` +
            `Distance: ${raceDistance} miles\n` +
            `Your Speed: ${playerSpeed.toFixed(1)} mph\n` +
            `Rival Speed: ${opponentSpeed.toFixed(1)} mph\n` +
            `Your Time: ${playerTime.toFixed(2)} min\n` +
            `Rival Time: ${opponentTime.toFixed(2)} min\n` +
            `${resultText}\n` +
            `Reward: $${reward}💵 | EXP: +${expGain}\n` +
            `Fuel Left: ${updatedCar.fuel.toFixed(1)}%\n` +
            `Condition: ${updatedCar.condition.toFixed(1)}%`
        );
      },
    },
    {
      key: "refuel",
      description: "Pump some gas",
      aliases: ["-r"],
      args: ["<car_name>", "<fuel_key>"],
      async handler() {
        const carsData = new Inventory(rawCarsData);
        const inventory = new Inventory(rawInventory);
        const [targetCar, fuelKey] = args;

        if (!targetCar) {
          return output.reply(
            `👤 **${name}** (Car)\n\n❌ Usage: ${prefix}car refuel <car_name> <fuel_key>`
          );
        }

        const rawTargetCarData = carsData
          .getAll()
          .find((car) => car.name.toLowerCase() === targetCar.toLowerCase());
        if (!rawTargetCarData) {
          return output.reply(
            `👤 **${name}** (Car)\n\n❌ No car named "${targetCar}"!`
          );
        }
        const targetCarData = updateCarData(rawTargetCarData);
        if (targetCarData.fuel >= 100) {
          return output.reply(
            `👤 **${name}** (Car)\n\n❌ **${targetCarData.name}** is already full!`
          );
        }
        if (isCooldownActive(targetCarData.lastAction)) {
          const timeLeft =
            5 -
            Math.floor(
              (new Date() - new Date(targetCarData.lastAction)) / (1000 * 60)
            );
          return output.reply(
            `👤 **${name}** (Car)\n\n❌ **${targetCarData.name}** on refuel cooldown. Wait ${timeLeft} min.`
          );
        }

        const fuel = inventory.getOne(fuelKey);
        if (!fuel || fuel.type !== "fuel") {
          return output.reply(
            `👤 **${name}** (Car)\n\n❌ No valid fuel "${fuelKey}"! Check the shop.`
          );
        }

        targetCarData.fuel = Math.min(
          targetCarData.fuel + fuel.fuelAmount,
          100
        );
        targetCarData.maxSpeed =
          targetCarData.maxSpeed + (fuel.speedBoost || 0);
        targetCarData.lastAction = new Date().toISOString();
        inventory.deleteOne(fuel.key);
        const updatedCar = updateCarData(targetCarData);

        carsData.deleteOne(updatedCar.key);
        carsData.addOne(updatedCar);
        await money.set(input.senderID, {
          carsData: Array.from(carsData),
          inventory: Array.from(inventory),
        });

        return output.reply(
          `👤 **${name}** (Car)\n\n✅ Refueled ${updatedCar.icon} **${updatedCar.name}** with ${fuel.icon} **${fuel.name}**!\n` +
            `Fuel: ${updatedCar.fuel.toFixed(1)}%\n` +
            `Max Speed: ${updatedCar.maxSpeed} mph\n` +
            `Cooldown: 5 min started`
        );
      },
    },
    {
      key: "top",
      description: "Check the top car legends",
      aliases: ["-t"],
      async handler() {
        const allPlayers = await money.getAll();
        if (!allPlayers || Object.keys(allPlayers).length === 0) {
          return output.reply(
            `👤 **${name}** (Car)\n\n❌ No cars registered yet!`
          );
        }

        let allCars = [];
        for (const [playerID, playerData] of Object.entries(allPlayers)) {
          const {
            name: playerName = "Unregistered",
            carsData: rawCarsData = [],
          } = playerData;
          const carsData = new Inventory(rawCarsData);
          const playerCars = carsData.getAll().map((car) => {
            const updatedCar = updateCarData(car);
            return {
              owner: playerName,
              ownerID: playerID,
              car: updatedCar,
              worth: calculateWorth(updatedCar),
            };
          });
          allCars = allCars.concat(playerCars);
        }

        if (allCars.length === 0) {
          return output.reply(
            `👤 **${name}** (Car)\n\n❌ No cars in the system!`
          );
        }

        allCars.sort((a, b) => b.worth - a.worth);
        const topCars = allCars.slice(0, Math.min(10, allCars.length));

        let leaderboard = `👤 **${name}** (Car)\n\n${UNIRedux.arrow} ***Top Car Legends***\n\n`;
        topCars.forEach((entry, index) => {
          const { owner, car, worth } = entry;
          leaderboard +=
            `${index + 1}. ${car.icon} **${car.name}** (${car.carType})\n` +
            `   Owner: ${owner}\n` +
            `   Worth: $${worth}\n` +
            `   Level: ${car.level} | Distance: ${car.distance.toFixed(
              1
            )} miles\n\n`;
        });

        return output.reply(leaderboard);
      },
    },
    {
      key: "uncage",
      description: "Unleash a car from the garage",
      aliases: ["-u"],
      async handler() {
        const inventory = new Inventory(rawInventory);
        const carVentory = new Inventory(
          rawInventory.filter((item) => item.type === "car")
        );
        const cars = carVentory.getAll();
        if (cars.length === 0) {
          return output.reply(
            `👤 **${name}** (Car)\n\n❌ No cars in the garage! Hit the shop!`
          );
        }

        let carList = `${UNIRedux.arrow} ***Garaged Rides***\n\n`;
        cars.forEach((car, index) => {
          carList += `${index + 1}. ${car.icon} **${car.name}** [${car.key}]\n`;
        });
        carList += `\nReply with a number to unleash a car!`;
        const i = await output.reply(`👤 **${name}** (Car)\n\n${carList}`);
        input.setReply(i.messageID, {
          author: input.senderID,
          callback: uncageReply,
          key: "car",
          inventory,
          carVentory,
          type: "uncaging",
          detectID: i.messageID,
        });
      },
    },
    {
      key: "upgrade",
      description: "Mod your car",
      aliases: ["-up"],
      args: ["<car_name>", "<upgrade_key>"],
      async handler() {
        const carsData = new Inventory(rawCarsData);
        const inventory = new Inventory(rawInventory);
        const [carName, upgradeKey] = args;

        if (!carName || !upgradeKey) {
          return output.reply(
            `👤 **${name}** (Car)\n\n❌ Usage: ${prefix}car upgrade <car_name> <upgrade_key>`
          );
        }

        const rawCar = carsData
          .getAll()
          .find((c) => c.name.toLowerCase() === carName.toLowerCase());
        if (!rawCar) {
          return output.reply(
            `👤 **${name}** (Car)\n\n❌ No car named "${carName}"!`
          );
        }
        const car = updateCarData(rawCar);
        const upgrade = inventory.getOne(upgradeKey);
        if (
          !upgrade ||
          (upgrade.type !== "upgrade" && upgrade.type !== "repair")
        ) {
          return output.reply(
            `👤 **${name}** (Car)\n\n❌ No valid upgrade/repair "${upgradeKey}"!`
          );
        }

        if (upgrade.type === "upgrade") {
          car.maxSpeed = car.maxSpeed + (upgrade.speedBoost || 0);
          car.durability = car.durability + (upgrade.durabilityBoost || 0);
          car.upgrades.push(upgrade.name);
        } else if (upgrade.type === "repair") {
          car.condition = Math.min(car.condition + upgrade.conditionBoost, 100);
        }
        inventory.deleteOne(upgrade.key);
        const updatedCar = updateCarData(car);
        checkAchievements(updatedCar);
        carsData.deleteOne(updatedCar.key);
        carsData.addOne(updatedCar);
        await money.set(input.senderID, {
          carsData: Array.from(carsData),
          inventory: Array.from(inventory),
        });

        return output.reply(
          `👤 **${name}** (Car)\n\n✅ Modded ${updatedCar.icon} **${updatedCar.name}** with ${upgrade.icon} **${upgrade.name}**!\n` +
            `Max Speed: ${updatedCar.maxSpeed} mph\n` +
            `Condition: ${updatedCar.condition.toFixed(1)}%\n` +
            `Worth: $${calculateWorth(updatedCar)}`
        );
      },
    },
    {
      key: "roadtrip",
      description: "Embark on an epic journey",
      aliases: ["-rt"],
      args: ["<car_name>", "<destination>"],
      async handler() {
        const carsData = new Inventory(rawCarsData);
        const cassEXP = new CassEXP(cxp);
        const [targetCar, destination] = args;

        if (!targetCar || !destination) {
          return output.reply(
            `👤 **${name}** (Car)\n\n❌ Usage: ${prefix}car roadtrip <car_name> <destination>`
          );
        }

        const rawTargetCarData = carsData
          .getAll()
          .find((car) => car.name.toLowerCase() === targetCar.toLowerCase());
        if (!rawTargetCarData) {
          return output.reply(
            `👤 **${name}** (Car)\n\n❌ No car named "${targetCar}"!`
          );
        }
        const targetCarData = updateCarData(rawTargetCarData);
        if (targetCarData.fuel < 50) {
          return output.reply(
            `👤 **${name}** (Car)\n\n❌ **${targetCarData.name}** needs 50%+ fuel for a road trip!`
          );
        }
        if (targetCarData.condition < 50) {
          return output.reply(
            `👤 **${name}** (Car)\n\n❌ **${targetCarData.name}** is too beat up for a trip!`
          );
        }

        const destinations = {
          city: { distance: 100, reward: 500, exp: 50 },
          mountains: { distance: 200, reward: 1000, exp: 100 },
          desert: { distance: 300, reward: 1500, exp: 150 },
        };
        const trip = destinations[destination.toLowerCase()];
        if (!trip) {
          return output.reply(
            `👤 **${name}** (Car)\n\n❌ Valid destinations: city, mountains, desert`
          );
        }

        const weather = getRandomWeather();
        const { speedMod, fuelMod, conditionMod } = weatherEffects[weather];
        const fuelCost = trip.distance * targetCarData.fuelEfficiency * fuelMod;
        const conditionDamage =
          trip.distance * 0.1 * conditionMod * (1 - targetCarData.durability);
        if (targetCarData.fuel < fuelCost) {
          return output.reply(
            `👤 **${name}** (Car)\n\nt**${
              targetCarData.name
            }** needs ${fuelCost.toFixed(1)}% fuel!`
          );
        }

        targetCarData.distance += trip.distance;
        targetCarData.fuel = Math.max(targetCarData.fuel - fuelCost, 0);
        targetCarData.condition = Math.max(
          targetCarData.condition - conditionDamage,
          0
        );
        const updatedCar = updateCarData(targetCarData);
        cassEXP.expControls.raise(trip.exp);
        const newMoney = playerMoney + trip.reward;

        checkAchievements(updatedCar);
        carsData.deleteOne(updatedCar.key);
        carsData.addOne(updatedCar);
        await money.set(input.senderID, {
          carsData: Array.from(carsData),
          cassEXP: cassEXP.raw(),
          money: newMoney,
        });

        return output.reply(
          `👤 **${name}** (Car)\n\n🌍 **Road Trip** - ${updatedCar.icon} **${updatedCar.name}**\n\n` +
            `Destination: ${destination}\n` +
            `Distance: ${trip.distance} miles\n` +
            `Weather: ${weather}\n` +
            `Fuel Left: ${updatedCar.fuel.toFixed(1)}%\n` +
            `Condition: ${updatedCar.condition.toFixed(1)}%\n` +
            `Reward: $${trip.reward}💵 | EXP: +${trip.exp}`
        );
      },
    },
    {
      key: "crew",
      description: "Manage your car crew",
      aliases: ["-cr"],
      args: ["<car_name>", "<add|remove>", "<member>"],
      async handler() {
        const carsData = new Inventory(rawCarsData);
        const [carName, action, member] = args;

        if (!carName || !action) {
          return output.reply(
            `👤 **${name}** (Car)\n\n❌ Usage: ${prefix}car crew <car_name> <add|remove> <member>`
          );
        }

        const rawCar = carsData
          .getAll()
          .find((c) => c.name.toLowerCase() === carName.toLowerCase());
        if (!rawCar) {
          return output.reply(
            `👤 **${name}** (Car)\n\n❌ No car named "${carName}"!`
          );
        }
        const car = updateCarData(rawCar);
        if (action === "add") {
          if (!member) {
            return output.reply(
              `👤 **${name}** (Car)\n\n❌ Specify a member to add!`
            );
          }
          if (car.crew.length >= 3) {
            return output.reply(
              `👤 **${name}** (Car)\n\n❌ **${car.name}** crew is full (max 3)!`
            );
          }
          if (car.crew.includes(member)) {
            return output.reply(
              `👤 **${name}** (Car)\n\n❌ **${member}** is already in the crew!`
            );
          }
          car.crew.push(member);
        } else if (action === "remove") {
          if (!member) {
            return output.reply(
              `👤 **${name}** (Car)\n\n❌ Specify a member to remove!`
            );
          }
          const index = car.crew.indexOf(member);
          if (index === -1) {
            return output.reply(
              `👤 **${name}** (Car)\n\n❌ **${member}** not in **${car.name}** crew!`
            );
          }
          car.crew.splice(index, 1);
        } else {
          return output.reply(
            `👤 **${name}** (Car)\n\n❌ Use "add" or "remove"!`
          );
        }

        const updatedCar = updateCarData(car);
        checkAchievements(updatedCar);
        carsData.deleteOne(updatedCar.key);
        carsData.addOne(updatedCar);
        await money.set(input.senderID, { carsData: Array.from(carsData) });

        return output.reply(
          `👤 **${name}** (Car)\n\n✅ Updated crew for ${updatedCar.icon} **${updatedCar.name}**!\n` +
            `Crew: ${
              updatedCar.crew.length ? updatedCar.crew.join(", ") : "None"
            }`
        );
      },
    },
  ]);

  return home.runInContext(ctx);
}

function isCooldownActive(lastAction, cooldownMinutes = 5) {
  if (!lastAction) return false;
  const now = new Date();
  const last = new Date(lastAction);
  const diffMs = now - last;
  const diffMins = diffMs / (1000 * 60);
  return diffMins < cooldownMinutes;
}

function checkAchievements(car) {
  const updatedCar = updateCarData(car);
  for (const [name, { condition, reward }] of Object.entries(achievements)) {
    if (!updatedCar.achievements.includes(name) && condition(updatedCar)) {
      updatedCar.achievements.push(name);
      updatedCar.sellPrice = updatedCar.sellPrice + reward;
    }
  }
}
