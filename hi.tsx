import { Pinger } from "@cass-modules/pinger";
import { CassTypes } from "@cass-modules/type-validator";

import { defineEntry } from "@cass/define";
import { SpectralCMDHome } from "@cassidy/spectral-home";
import { Inventory } from "@cassidy/ut-shop";

export const meta = {
  name: "hi",
  author: "Liane Cagara",
  otherNames: ["hello", "hey"],
  version: "1.0.0",
  description: "Testing?",
  usage: "{prefix}{name}{property}<message>",
  category: "System",
  permissions: [0, 1, 2],
  waitingTime: 5,
  noPrefix: false,
  whiteList: null,
  ext_plugins: {
    requester: "^1.2.0",
  },
};

const entryConf: Record<string, CommandEntry> = {
  async test({ input, output, commandName }) {
    if (input.arguments[0] === "Error" && input.arguments[1]) {
      throw new Error(input.arguments.slice(1).join(" "));
    }
    const messageInfo = await output.reply(
      "Hello wazzup, you said " +
        (input.arguments.join(" ") || "none.") +
        "\nYour sender ID is " +
        input.senderID +
        " and thread id is: " +
        input.threadID
    );

    output.reaction("💜");
    input.setReply(messageInfo.messageID, {
      key: commandName,
    });
  },
  async debug({ output, input }) {
    output.reply(JSON.stringify(input, null, 2));
  },
  async dbtest({ money, output }) {
    const payload: [string, Partial<UserData>] = [
      "test",
      {
        name: "Test",
        money: 69,
      },
    ];
    const pinger1 = new Pinger();
    pinger1.recordPing();
    await money.set(...payload);
    const ping1 = pinger1.getLastPing();

    const pinger2 = new Pinger();
    pinger2.recordPing();
    await money.setItem(...payload);
    const ping2 = pinger2.getLastPing();

    return output.reply(`money.set: ${ping1}\nmoney.setItem: ${ping2}`);
  },
  async dbtest2({ money, input }) {
    const items = await money.getItem(input.sid);

    items.inventory.at(0);
  },
  async typetest() {
    const UserSchema = new CassTypes.Validator({
      inv: Inventory,
      name: "string",
      test: "function",
      idk: new CassTypes.Union("number", "string", "bigint"),
    });

    type UserType = CassTypes.FromValidator<typeof UserSchema>;

    const invv = new Inventory();

    const userInfo: UserType = {
      test: () => {},
      inv: invv,
      name: "HAHA %1".formatWith("idk"),
      idk: 5,
    };

    UserSchema.validate(userInfo);
  },
  async test3() {
    return (
      <>
        <output reply>
          Hello, <userdata key={"name"}></userdata>!
        </output>
      </>
    );
  },
};

const home = new SpectralCMDHome({
  entryConfig: entryConf,
});

export const entry = defineEntry((ctx) => home.runInContext(ctx));

export async function reply({
  output,
  input,
  detectID,
  commandName,
}: CommandContext & { detectID: string }) {
  input.delReply(detectID);
  const messageInfo = await output.reply(
    `Why the hell are you replying to me?`
  );
  output.reaction("😭");
  input.setReply(messageInfo.messageID, {
    key: commandName,
  });
}

let a = (name: string) => {
  return name.repeat(5);
};

const wrapped = a.wrap((fn, name) => {
  return a.invokeMultiple(5, "idk");
});
