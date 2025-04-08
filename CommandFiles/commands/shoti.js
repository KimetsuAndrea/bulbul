export const meta = {
  name: "shoti",
  description: "Send a random Shoti video",
  author: "0xVoid",
  version: "1.0.0",
  usage: "{prefix}{name}",
  category: "bold",
  permissions: [0],
  noPrefix: "both",
  waitingTime: 10,
  requirement: "3.0.0",
  otherNames: ["shoti"],
  icon: "😋",
};

import Shoti from "shoti";
import { defineEntry } from "@cass/define";

const shoti = new Shoti("$shoti-b04f8c279e");

export async function entry({
  output,
  money,
  input,
  styler,
  cancelCooldown,
  Inventory,
}) {
  try {
    const data = await shoti.getShoti({ type: "link" });

    const message = `Instagram: ${data?.user?.instagram || "N/A"}\n` +
                    `Nickname: ${data?.user?.nickname || "N/A"}\n` +
                    `Signature: ${data?.user?.signature || "N/A"}\n` +
                    `Twitter: ${data?.user?.twitter || "N/A"}\n` +
                    `Username: ${data?.user?.username || "N/A"}`;

    await output.reply({
      body: message,
      attachment: await global.utils.getStreamFromURL(data?.content),
    });
  } catch (err) {
    await output.reply({
      body: `Failed to fetch Shoti video: ${err.message || err}`,
    });
  }
};

export const style = {
  title: "Random Shoti Video",
  titleFont: "bold",
  contentFont: "fancy",
};