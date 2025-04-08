let ws;

/**
 *
 * @param {string} base64String
 * @param {string} type
 * @returns {HTMLImageElement | HTMLVideoElement | HTMLAudioElement}
 */
function createElementFromBase64(base64String, type = undefined) {
  function detectFileType(base64) {
    const signatures = {
      "/9j/": "image/jpeg",
      iVBORw0KGgo: "image/png",
      R0lGOD: "image/gif",
      // UklGR: "image/webp",
      AAAAIGZ0eXBtcDQ: "video/mp4",
      GkXfo59ChoEB: "video/webm",
      T2dnUw: "audio/ogg",
      UklGR: "audio/wav",
      SUQzBA: "audio/mp3",
    };

    for (const [signature, mimeType] of Object.entries(signatures)) {
      if (base64.startsWith(signature)) {
        return mimeType;
      }
    }
    return null;
  }

  const mimeType = type ?? detectFileType(base64String);
  if (!mimeType) {
    console.error("Unknown or unsupported file type.");
    return null;
  }

  const dataUrl = `data:${mimeType};base64,${base64String}`;
  let element;

  if (mimeType.startsWith("image")) {
    element = document.createElement("img");
    element.src = dataUrl;
  } else if (mimeType.startsWith("video")) {
    element = document.createElement("video");
    element.src = dataUrl;
    element.controls = true;
  } else if (mimeType.startsWith("audio")) {
    element = document.createElement("audio");
    element.src = dataUrl;
    element.controls = true;
  }

  return element;
}

class IndexedDBMap {
  /**
   * @param {any} instanceId
   */
  constructor(instanceId, dbName = "IndexedDBMapDB", storeName = "mapStore") {
    this.instanceId = instanceId;
    this.dbName = dbName;
    this.storeName = storeName;
    this.db = null;
    this.ready = this.initDB();
  }

  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onupgradeneeded = (event) => {
        // @ts-ignore
        const db = event.target.result;
        db.createObjectStore(this.storeName, { keyPath: "key" });
      };

      request.onsuccess = (event) => {
        // @ts-ignore
        this.db = event.target.result;
        resolve();
      };

      request.onerror = (event) => {
        // @ts-ignore
        reject(new Error("Failed to open IndexedDB: " + event.target.error));
      };
    });
  }

  /**
   * @param {any} key
   */
  #getInstanceKey(key) {
    return `${this.instanceId}:${key}`;
  }

  /**
   * @param {(arg0: any) => any} fn
   */
  async #withDB(fn) {
    await this.ready;
    return fn(this.db);
  }

  /**
   * @param {any} key
   * @param {any} value
   */
  async set(key, value) {
    return this.#withDB(
      (
        /** @type {{ transaction: (arg0: string[], arg1: string) => any; }} */ db
      ) => {
        return new Promise((resolve, reject) => {
          const transaction = db.transaction([this.storeName], "readwrite");
          const store = transaction.objectStore(this.storeName);
          const instanceKey = this.#getInstanceKey(key);
          const request = store.put({ key: instanceKey, value });

          request.onsuccess = () => resolve(this);
          request.onerror = () => reject(request.error);
        });
      }
    );
  }

  /**
   * @param {any} key
   */
  async get(key) {
    return this.#withDB(
      (
        /** @type {{ transaction: (arg0: string[], arg1: string) => any; }} */ db
      ) => {
        return new Promise((resolve, reject) => {
          const transaction = db.transaction([this.storeName], "readonly");
          const store = transaction.objectStore(this.storeName);
          const instanceKey = this.#getInstanceKey(key);
          const request = store.get(instanceKey);

          request.onsuccess = () => resolve(request.result?.value);
          request.onerror = () => reject(request.error);
        });
      }
    );
  }

  /**
   * @param {any} key
   */
  async has(key) {
    return this.#withDB(
      (
        /** @type {{ transaction: (arg0: string[], arg1: string) => any; }} */ db
      ) => {
        return new Promise((resolve, reject) => {
          const transaction = db.transaction([this.storeName], "readonly");
          const store = transaction.objectStore(this.storeName);
          const instanceKey = this.#getInstanceKey(key);
          const request = store.count(instanceKey);

          request.onsuccess = () => resolve(request.result > 0);
          request.onerror = () => reject(request.error);
        });
      }
    );
  }

  /**
   * @param {any} key
   */
  async delete(key) {
    return this.#withDB(
      (
        /** @type {{ transaction: (arg0: string[], arg1: string) => any; }} */ db
      ) => {
        return new Promise((resolve, reject) => {
          const transaction = db.transaction([this.storeName], "readwrite");
          const store = transaction.objectStore(this.storeName);
          const instanceKey = this.#getInstanceKey(key);
          const request = store.delete(instanceKey);

          request.onsuccess = () => resolve(true);
          request.onerror = () => reject(request.error);
        });
      }
    );
  }

  async clear() {
    return this.#withDB(
      (
        /** @type {{ transaction: (arg0: string[], arg1: string) => any; }} */ db
      ) => {
        return new Promise((resolve, reject) => {
          const transaction = db.transaction([this.storeName], "readwrite");
          const store = transaction.objectStore(this.storeName);
          const request = store.clear();

          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      }
    );
  }

  async entries() {
    return this.#withDB(
      (
        /** @type {{ transaction: (arg0: string[], arg1: string) => any; }} */ db
      ) => {
        return new Promise((resolve, reject) => {
          const transaction = db.transaction([this.storeName], "readonly");
          const store = transaction.objectStore(this.storeName);
          const request = store.getAll();
          const prefix = `${this.instanceId}:`;

          request.onsuccess = () => {
            const entries = request.result
              .filter((/** @type {{ key: string; }} */ item) =>
                item.key.startsWith(prefix)
              )
              .map(
                (/** @type {{ key: string | any[]; value: any; }} */ item) => [
                  item.key.slice(prefix.length),
                  item.value,
                ]
              );
            resolve(entries);
          };
          request.onerror = () => reject(request.error);
        });
      }
    );
  }

  async keys() {
    const entries = await this.entries();
    return entries.map(([key]) => key);
  }

  async values() {
    const entries = await this.entries();
    return entries.map(([, value]) => value);
  }

  async size() {
    const entries = await this.entries();
    return entries.length;
  }

  async *[Symbol.iterator]() {
    const entries = await this.entries();
    for (const entry of entries) {
      yield entry;
    }
  }
}

const imageMap = new IndexedDBMap("Images");
let password = localStorage.getItem("password");
if (!password) {
  password = prompt("Enter your cassidy password.");
  localStorage.setItem("password", password);
}
let panelID = localStorage.getItem("panelID");
if (!panelID) {
  panelID = prompt("Enter your user ID.");
  localStorage.setItem("panelID", panelID);
}

const emojis = ["💜", "😆", "😮", "🥲", "😭", "👍"];
/* create MAX_PROPERTIES variable.

higher = saves more messages.
higher = more pain for browsers.

*/
const MAX_PROPERTIES = 200;

// I'm lazy so I made this, it automatically saves and load localStorage items.
// It's the one responsible for message info.
const infos = new Proxy(
  {},
  {
    get(_, prop) {
      return JSON.parse(localStorage.getItem("infos") || "{}")[prop];
    },
    set(_, prop, value) {
      const storedInfos = JSON.parse(localStorage.getItem("infos") || "{}");

      if (Object.keys(storedInfos).length >= MAX_PROPERTIES) {
        const oldestProp = Object.keys(storedInfos)[0];
        delete storedInfos[oldestProp];
      }

      storedInfos[prop] = { ...value, attachment: null };
      localStorage.setItem("infos", JSON.stringify(storedInfos));
      return true;
    },
  }
);

// Simple, load the convo as array.
function loadConvo() {
  const convo = JSON.parse(localStorage.getItem("convo") || "[]");
  return convo;
}

// window.onload always execute when the page loads..
window.onload = async () => {
  const reactOpt = document.querySelector("#reactOpt");

  //const reactOptions = document.querySelector("#reactOptions");
  for (const emoji of emojis) {
    reactOpt.innerHTML += `<span onclick="sendReact('${emoji}', '%1')"${emoji}</span>`;
  }
  /*const {
    data: { url },
  } = await axios.get("/ws-url");*/

  /**
   * @param {Element} e
   */
  function scrollA(e) {
    if (isScrolledBottom(e, 20)) {
      // @ts-ignore
      smoothScroll2(e);
    }
  }

  // Get the chatPad, I don't want to type it every time lmao
  const chatPad = document.getElementById("chatPad");
  // remember the loadConvo function?
  const convo = loadConvo();
  const ccc = document.querySelector("#ccc");

  // convo.forEach((c) => {
  //   if (c.message) {
  //     // Just iterate the shit
  //     return appendSend({ message: c.message, chatPad });
  //   }
  //   // if the message is from bot..
  //   return appendRep({ body: c.body, messageID: c.messageID, chatPad });
  // });
  for (const c of [...convo].sort(
    (a, b) =>
      Number(infos[a.messageID]?.timestamp ?? Date.now()) -
      Number(infos[b.messageID]?.timestamp - Date.now())
  )) {
    if (c.message) {
      // Just iterate the shit
      appendSend({ message: c.message, chatPad });
      // @ts-ignore
      smoothScroll2(ccc);
      continue;
    }
    // if the message is from bot..
    appendRep({
      ...c,
      body: c.body,
      messageID: c.messageID,
      chatPad,
      attachmentPromise: imageMap.get(c.messageID),
    });
    // @ts-ignore
    smoothScroll2(ccc);
  }

  // After a lot of appending, we gonna scroll the entire page.
  // @ts-ignore
  smoothScroll2(ccc);

  const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  ws = new WebSocket(`${wsProtocol}//${window.location.host}/ws`);
  // You can freely customize this ws.onopen, just make sure it doesn't do stuffs that may break the page :)

  ws.onopen = () => {
    ws.send(
      JSON.stringify({
        type: "login",
        password,
        panelID,
      })
    );
  };
  ws.onmessage = (i) => {
    const data = JSON.parse(i.data);
    switch (data.type) {
      case "login_failure":
        localStorage.removeItem("password");
        break;
      case "message":
        handleMessage(data);
        // @ts-ignore
        smoothScroll2(ccc);
        break;
      case "message_reply":
        handleMessage(data);
        // @ts-ignore
        smoothScroll2(ccc);
        break;
      case "message_edit":
        handleMessageEdit(data);
        scrollA(ccc);
        break;
    }
  };

  ws.onclose = () => {
    window.location.href = window.location.href;
    // Lmao refresh
  };
};

function pushConvo(data) {
  const convo = loadConvo();

  convo.push(data);

  if (convo.length > MAX_PROPERTIES) {
    convo.splice(0, convo.length - MAX_PROPERTIES);
  }
  // This thing saves the convo automatically, and ofc filter the length using the MAX_PROPERTIES, but the length only applies every refresh..

  localStorage.setItem("convo", JSON.stringify(convo));
}
/**
 * @param {string} message
 * @param {any} messageID
 */
function localEdit(message, messageID) {
  // Self explanatory, save edit changes to your browser
  let convo = loadConvo();
  for (const index in convo) {
    const { messageID: targetID } = convo[index];
    if (messageID === targetID) {
      convo[index].body = message;
    }
  }
  localStorage.setItem("convo", JSON.stringify(convo));
}
// I'm lazy to explain these all, but this one applies the edit changes to the message, uhh how the hell do i explain it, it just applies the edit message data sent by websocket
function handleMessageEdit({ messageID, body }) {
  const doc = document.querySelector(`#${messageID}_text`);
  if (!doc) {
    return;
  }
  const info = infos[messageID] ?? {};
  const botSend = info.botSend;
  const [bodyHTML, trueBody] = String(body).split("==========>");
  doc[botSend ? "innerHTML" : "innerText"] = bodyHTML || trueBody;
  doc.setAttribute("orig", trueBody || bodyHTML);
  localEdit(bodyHTML, messageID);
}
// This one is responsible for appending replies from bot
function appendRepOld({ body, messageID, chatPad }) {
  pushConvo({ body, messageID, chatPad });
  const elem = document.createElement("span");
  elem.innerHTML += `<div class="response-message-container" id="${messageID}_box"><div class="response-message" ><div onclick="togOpt('${messageID}')" id="${messageID}_text" >${autoAnchor(
    sanitize(body)
  )}</div><span id="${messageID}_options" style="display: none;"><br><br><div class="vanillaButton bnw" onclick="xCopy('${messageID}'); ">Copy</div><br><div class="vanillaButton bnw" onclick="chooseReaction('${messageID}'); ">React</div><br><div class="vanillaButton bnw" onclick="reply('${messageID}')">Reply</div></span></div></div>`;
  chatPad.appendChild(elem);
  animateSend(elem);
}

function appendRep({
  body,
  messageID,
  chatPad,
  botSend,
  attachmentPromise,
  attachment,
  ...etc
}) {
  console.log("APPEND REP", {
    body,
    messageID,
    chatPad,
    botSend,
    attachmentPromise,
    attachment,
    ...etc,
  });
  if (chatPad instanceof HTMLElement) {
    pushConvo({ body, messageID, chatPad });
    // if (!Array.isArray(attachment) && attachment) {
    //   attachment = [attachment];
    // }
    if (attachment) {
      attachmentPromise = Promise.resolve(attachment);
      (async () => {
        await imageMap.set(messageID, attachment);
      })();
    }

    const info = infos[messageID] ?? {};
    botSend ??= info.botSend;
    info.senderID ??= "unknown";
    // let everyWrapper = Array.from(chatPad.children)
    //   .reverse()
    //   .find((everyW) => {
    //     return everyW.getAttribute("senderid") === info.senderID;
    //   });
    let everyWrapper =
      chatPad.lastElementChild &&
      chatPad.lastElementChild &&
      chatPad.lastElementChild.classList.contains("every-wrapper") &&
      chatPad.lastElementChild.getAttribute("senderID") === info.senderID
        ? chatPad.lastElementChild
        : document.createElement("div");

    everyWrapper ??= document.createElement("div");
    everyWrapper.classList.add("every-wrapper");
    chatPad.append(everyWrapper);
    const messageContainer =
      everyWrapper.querySelector(".response-message-container") ??
      document.createElement("div");
    everyWrapper.append(messageContainer);

    // const messageContainer =
    //   chatPad.lastElementChild &&
    //   chatPad.lastElementChild &&
    //   chatPad.lastElementChild.classList.contains(
    //     "response-message-container"
    //   ) &&
    //   chatPad.lastElementChild.getAttribute("senderID") === info.senderID
    //     ? chatPad.lastElementChild
    //     : document.createElement("div");
    messageContainer.classList.add("response-message-container");
    everyWrapper.setAttribute("senderid", info.senderID);

    const imgPFP = document.createElement("img");
    imgPFP.src = "https://www.facebook.com/images/fb_icon_325x325.png";
    imgPFP.classList.add("pfp");
    if (!messageContainer.querySelector(".pfp")) {
      messageContainer.appendChild(imgPFP);
    }

    if (!everyWrapper.querySelector(".msg-label")) {
      const label = document.createElement("span");
      label.classList.add("msg-label");
      // label.textContent = info.botSend
      //   ? "Cassidy"
      //   : userInfo.name ?? "Unregistered";
      label.textContent = "Loading...";
      (async () => {
        const userInfo = await fetchUserCache(info.senderID);
        label.textContent = info.botSend
          ? "Cassidy"
          : userInfo.name ?? userInfo.userMeta?.name ?? "Unregistered";

        imgPFP.src = userInfo.userMeta.image ?? imgPFP.src;
      })();

      everyWrapper.prepend(label);
    }

    if (messageContainer instanceof HTMLElement) {
      const userMessage = document.createElement("div");
      userMessage.classList.add("response-message");
      const wrapper = messageContainer.querySelector(".col-response-message")
        ? messageContainer.querySelector(".col-response-message")
        : document.createElement("div");
      wrapper.classList.add("col-response-message");
      const [bodyHTML, trueBody] = String(body).split("==========>");
      userMessage[botSend ? "innerHTML" : "textContent"] = bodyHTML || trueBody;

      userMessage.setAttribute("orig", trueBody || bodyHTML);
      userMessage.id = `${messageID}_text`;
      if (isEmojiAll(body)) {
        userMessage.classList.add("emoji-only");
      }
      // const photoBox = document.createElement("img");
      // photoBox.classList.add("photo-box", "response-message");

      // photoBox.alt = "Loading...";
      // photoBox.src =
      //   "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAQSURBVHgBAW/AAwAAAAAAAA+fASK7JIQZAAAAAElFTkSuQmCC";
      wrapper.append(userMessage);
      let innerMenu;
      (async () => {
        /**
         * @type {unknown[] | undefined}
         */
        let attachmentres = attachment ?? (await attachmentPromise);
        if (!Array.isArray(attachmentres) && attachmentres) {
          attachmentres = [attachmentres];
        }

        if (!attachmentres) {
          console.log("NOAT");
          return;
        }

        let i = 0;
        for (const attachment of attachmentres) {
          console.log("ATT RES", attachment, attachmentres);
          if (typeof attachment === "string") {
            const photoBox = createElementFromBase64(
              attachment,
              info?.attachmentType?.[i]
            );
            photoBox?.classList.add("photo-box", "response-message");
            // photoBox.src = `data:image/png;base64,${attachment}`;
            // console.log(attachment);

            try {
              const ctxmenu = new ContextMenu(photoBox, {
                /**
                 * @param {{ clientY: number; }} event
                 */
                onOpen(event) {
                  // @ts-ignore
                  event.stopPropagation();
                  photoBox.style.pointerEvents = "none";
                  const rect1 = photoBox.getBoundingClientRect();
                  ctxmenu.menu.style.width = `${rect1.width}px`;
                  photoBox.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                  });
                  const blur = document.createElement("div");
                  blur.classList.add("blur-bg");
                  blur.addEventListener("click", () => {
                    ctxmenu.hide();
                  });
                  const reactOpt = document.createElement("div");
                  reactOpt.classList.add("react-c");
                  reS = reactOpt;

                  reactOpt.innerHTML = "";
                  for (const emoji of emojis) {
                    reactOpt.innerHTML += `<span onclick="sendReact('${emoji}', '${messageID}')" style="font-size: 30px;">${emoji}</span>  `;
                  }

                  blurS = blur;
                  setTimeout(() => {
                    const rect = photoBox.getBoundingClientRect();
                    ctxmenu.show({
                      clientY: rect.bottom + 20,
                      clientX: rect.left,
                    });

                    const clone = photoBox.cloneNode(true);
                    if (clone instanceof HTMLElement) {
                      clone.classList.add("center-fixed");
                      clone.style.left = rect.left + "px";
                      clone.style.right = rect.right + "px";
                      clone.style.top = rect.top + "px";
                      clone.style.bottom = rect.bottom + "px";
                      clone.style.width = rect.width + "px";
                      clone.style.height = rect.height + "px";

                      // @ts-ignore
                      reactOpt.disabled = false;

                      reactOpt.style.left = rect.left + "px";
                      reactOpt.style.right = rect.right + "px";
                      // reactOpt.style.bottom = rect.bottom + "px";

                      document.body.appendChild(clone);
                      document.body.appendChild(reactOpt);
                      // reactOpt.style.top = event.clientY - reactOpt.clientHeight + "px";

                      let newTop = rect.top - reactOpt.clientHeight - 20;
                      let alternativeTop =
                        event.clientY - reactOpt.clientHeight;

                      if (newTop < 0) {
                        newTop = alternativeTop;
                      } else if (
                        newTop + reactOpt.clientHeight >
                        window.innerHeight
                      ) {
                        newTop = window.innerHeight - reactOpt.clientHeight;
                      }

                      reactOpt.style.top = `${newTop}px`;

                      cloneS = clone;
                    }
                    document.body.appendChild(blur);
                  }, 300);
                },
                onClose() {
                  if (cloneS instanceof HTMLElement) {
                    cloneS.remove();
                  }
                  if (blurS instanceof HTMLElement) {
                    blurS.remove();
                  }
                  photoBox.style.pointerEvents = "";
                  if (reS instanceof HTMLElement) {
                    reS.remove();
                  }
                },
                items: [
                  // {
                  //   label: "React",
                  //   svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368"><path d="M800-680v-80h-80v-80h80v-80h80v80h80v80h-80v80h-80ZM620-520q25 0 42.5-17.5T680-580q0-25-17.5-42.5T620-640q-25 0-42.5 17.5T560-580q0 25 17.5 42.5T620-520Zm-280 0q25 0 42.5-17.5T400-580q0-25-17.5-42.5T340-640q-25 0-42.5 17.5T280-580q0 25 17.5 42.5T340-520Zm140 260q68 0 123.5-38.5T684-400H276q25 63 80.5 101.5T480-260Zm0 180q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q43 0 83 8.5t77 24.5v167h80v80h142q9 29 13.5 58.5T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z"/></svg>`,
                  //   async callback() {
                  //     chooseReaction(messageID);
                  //   },
                  // },
                  {
                    label: "Reply",
                    // @ts-ignore
                    svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368"><path d="M760-200v-160q0-50-35-85t-85-35H273l144 144-57 56-240-240 240-240 57 56-144 144h367q83 0 141.5 58.5T840-360v160h-80Z"/></svg>`,
                    async callback() {
                      reply(messageID);
                    },
                  },
                  {
                    label: "View",
                    // @ts-ignore
                    svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368"><path d="M760-200v-160q0-50-35-85t-85-35H273l144 144-57 56-240-240 240-240 57 56-144 144h367q83 0 141.5 58.5T840-360v160h-80Z"/></svg>`,
                    async callback() {
                      photoBox.click();
                    },
                  },
                ],
                allowance: 20,
                bottom: true,
              });

              innerMenu = ctxmenu;

              enhanceImage(photoBox);
            } catch (error) {}
            userMessage.after(photoBox);
            i++;
          }
        }
      })();
      autoParseUrlsAsAnchors(userMessage);
      messageContainer.append(wrapper);

      // chatPad.appendChild(messageContainer);
      animateSend(userMessage);
      chatPad.addEventListener("scroll", () => {
        ctxmenu.hide();
      });
      let cloneS = null;
      let blurS = null;
      let reS = null;
      const ctxmenu = new ContextMenu(userMessage, {
        /**
         * @param {{ clientY: number; }} event
         */
        onOpen(event) {
          userMessage.style.pointerEvents = "none";
          const rect1 = userMessage.getBoundingClientRect();
          ctxmenu.menu.style.width = `${rect1.width}px`;
          userMessage.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          const blur = document.createElement("div");
          blur.classList.add("blur-bg");
          blur.addEventListener("click", () => {
            ctxmenu.hide();
          });
          const reactOpt = document.createElement("div");
          reactOpt.classList.add("react-c");
          reS = reactOpt;

          reactOpt.innerHTML = "";
          for (const emoji of emojis) {
            reactOpt.innerHTML += `<span onclick="sendReact('${emoji}', '${messageID}')" style="font-size: 30px;">${emoji}</span>  `;
          }

          blurS = blur;
          setTimeout(() => {
            const rect = userMessage.getBoundingClientRect();
            ctxmenu.show({
              clientY: rect.bottom + 20,
              clientX: rect.left,
            });

            const clone = userMessage.cloneNode(true);
            if (clone instanceof HTMLElement) {
              clone.classList.add("center-fixed");
              clone.style.left = rect.left + "px";
              clone.style.right = rect.right + "px";
              clone.style.top = rect.top + "px";
              clone.style.bottom = rect.bottom + "px";
              clone.style.width = rect.width + "px";
              clone.style.height = rect.height + "px";

              // @ts-ignore
              reactOpt.disabled = false;

              reactOpt.style.left = rect.left + "px";
              reactOpt.style.right = rect.right + "px";
              // reactOpt.style.bottom = rect.bottom + "px";

              document.body.appendChild(clone);
              document.body.appendChild(reactOpt);
              // reactOpt.style.top = event.clientY - reactOpt.clientHeight + "px";

              let newTop = rect.top - reactOpt.clientHeight - 20;
              let alternativeTop = event.clientY - reactOpt.clientHeight;

              if (newTop < 0) {
                newTop = alternativeTop;
              } else if (newTop + reactOpt.clientHeight > window.innerHeight) {
                newTop = window.innerHeight - reactOpt.clientHeight;
              }

              reactOpt.style.top = `${newTop}px`;

              cloneS = clone;
            }
            document.body.appendChild(blur);
          }, 300);
        },
        onClose() {
          if (cloneS instanceof HTMLElement) {
            cloneS.remove();
          }
          if (blurS instanceof HTMLElement) {
            blurS.remove();
          }
          userMessage.style.pointerEvents = "";
          if (reS instanceof HTMLElement) {
            reS.remove();
          }
        },
        items: [
          // {
          //   label: "React",
          //   svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368"><path d="M800-680v-80h-80v-80h80v-80h80v80h80v80h-80v80h-80ZM620-520q25 0 42.5-17.5T680-580q0-25-17.5-42.5T620-640q-25 0-42.5 17.5T560-580q0 25 17.5 42.5T620-520Zm-280 0q25 0 42.5-17.5T400-580q0-25-17.5-42.5T340-640q-25 0-42.5 17.5T280-580q0 25 17.5 42.5T340-520Zm140 260q68 0 123.5-38.5T684-400H276q25 63 80.5 101.5T480-260Zm0 180q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q43 0 83 8.5t77 24.5v167h80v80h142q9 29 13.5 58.5T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z"/></svg>`,
          //   async callback() {
          //     chooseReaction(messageID);
          //   },
          // },
          {
            label: "Reply",
            // @ts-ignore
            svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368"><path d="M760-200v-160q0-50-35-85t-85-35H273l144 144-57 56-240-240 240-240 57 56-144 144h367q83 0 141.5 58.5T840-360v160h-80Z"/></svg>`,
            async callback() {
              reply(messageID);
            },
          },
          {
            label: "Copy",
            // @ts-ignore
            svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368"><path d="M160-40q-33 0-56.5-23.5T80-120v-560h80v560h440v80H160Zm160-160q-33 0-56.5-23.5T240-280v-560q0-33 23.5-56.5T320-920h280l240 240v400q0 33-23.5 56.5T760-200H320Zm240-440h200L560-840v200Z"/></svg>`,
            async callback() {
              const [bodyHTML, trueBody] = String(
                userMessage.getAttribute("orig")
              ).split("==========>");

              await navigator.clipboard.writeText(trueBody || bodyHTML);
            },
          },
        ],
        allowance: 20,
        bottom: true,
      });

      ctxmenu.init();

      if (innerMenu) {
        // @ts-ignore
        innerMenu.init();
      }
    }
  }
}

// some stuffs don't need to be documented
/**
 * @param {any} messageID
 */
function togOpt(messageID) {
  const elem = document.querySelector(`#${messageID}_options`);
  // @ts-ignore
  if (elem.style.display !== "none") {
    // @ts-ignore
    elem.style.display = "none";
  } else {
    // @ts-ignore
    elem.style.display = "block";
  }
}
/**
 * @param {any} id
 */
function xCopy(id) {
  // @ts-ignore
  copyToClipboard(document.querySelector(`#${id}_text`).innerText);
}
// this one also appends but it's a little different one, it appends messages sent by YOU
function appendSendOld({ message, chatPad }) {
  const elem = document.createElement("span");
  pushConvo({ message });
  elem.innerHTML += `<div class="user-message-container"><div class="user-message">${autoAnchor(
    sanitize(message)
  )}</div></div>`;
  chatPad.appendChild(elem);
  animateSend(elem);
}

function appendSend({ message, chatPad }) {
  if (chatPad instanceof HTMLElement) {
    pushConvo({ message });
    const messageContainer =
      chatPad.lastElementChild &&
      chatPad.lastElementChild &&
      chatPad.lastElementChild.classList.contains("user-message-container")
        ? chatPad.lastElementChild
        : document.createElement("div");
    messageContainer.classList.add("user-message-container");

    if (messageContainer instanceof HTMLElement) {
      const userMessage = document.createElement("div");
      userMessage.classList.add("user-message");
      const wrapper = messageContainer.querySelector(".col-user-message")
        ? messageContainer.querySelector(".col-user-message")
        : document.createElement("div");
      wrapper.classList.add("col-user-message");
      userMessage.textContent = message;
      if (isEmojiAll(message)) {
        userMessage.classList.add("emoji-only");
      }
      wrapper.append(userMessage);
      messageContainer.append(wrapper);
      autoParseUrlsAsAnchors(userMessage);

      chatPad.appendChild(messageContainer);
      animateSend(userMessage);
      chatPad.addEventListener("scroll", () => {
        ctxmenu.hide();
      });
      let cloneS = null;
      let blurS = null;

      const ctxmenu = new ContextMenu(userMessage, {
        onOpen() {
          userMessage.style.pointerEvents = "none";
          const rect1 = userMessage.getBoundingClientRect();
          ctxmenu.menu.style.width = `${rect1.width}px`;
          userMessage.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          const blur = document.createElement("div");
          blur.classList.add("blur-bg");
          blur.addEventListener("click", () => {
            ctxmenu.hide();
          });
          blurS = blur;
          setTimeout(() => {
            const rect = userMessage.getBoundingClientRect();
            ctxmenu.show({
              clientY: rect.bottom + 20,
              clientX: rect.right - rect.width,
              // isRight: true,
            });

            const clone = userMessage.cloneNode(true);
            if (clone instanceof HTMLElement) {
              clone.classList.add("center-fixed");
              clone.style.left = rect.left + "px";
              clone.style.right = rect.right + "px";
              clone.style.top = rect.top + "px";
              clone.style.bottom = rect.bottom + "px";
              clone.style.width = rect.width + "px";
              clone.style.height = rect.height + "px";

              document.body.appendChild(clone);
              cloneS = clone;
            }
            document.body.appendChild(blur);
          }, 300);
        },
        onClose() {
          if (cloneS instanceof HTMLElement) {
            cloneS.remove();
          }
          if (blurS instanceof HTMLElement) {
            blurS.remove();
          }
          userMessage.style.pointerEvents = "";
        },
        items: [
          {
            label: "React",
            // @ts-ignore
            svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368"><path d="M800-680v-80h-80v-80h80v-80h80v80h80v80h-80v80h-80ZM620-520q25 0 42.5-17.5T680-580q0-25-17.5-42.5T620-640q-25 0-42.5 17.5T560-580q0 25 17.5 42.5T620-520Zm-280 0q25 0 42.5-17.5T400-580q0-25-17.5-42.5T340-640q-25 0-42.5 17.5T280-580q0 25 17.5 42.5T340-520Zm140 260q68 0 123.5-38.5T684-400H276q25 63 80.5 101.5T480-260Zm0 180q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q43 0 83 8.5t77 24.5v167h80v80h142q9 29 13.5 58.5T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z"/></svg>`,
            async callback() {
              // @ts-ignore
              chooseReaction(messageID);
            },
          },

          {
            label: "Copy",
            // @ts-ignore
            svgIcon: `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#5f6368"><path d="M160-40q-33 0-56.5-23.5T80-120v-560h80v560h440v80H160Zm160-160q-33 0-56.5-23.5T240-280v-560q0-33 23.5-56.5T320-920h280l240 240v400q0 33-23.5 56.5T760-200H320Zm240-440h200L560-840v200Z"/></svg>`,
            async callback() {
              await navigator.clipboard.writeText(message);
            },
          },
        ],
        allowance: 20,
        bottom: true,
      });

      ctxmenu.init();
    }
  }
}

// this handles messages sent by user/bot
/**
 * @param {{ messageID: string | number; botSend: any; isYou: any; body: any; messageReply: { messageID: string | number; }; }} data
 */
function handleMessage(data) {
  console.log(data);
  const chatPad = document.getElementById("chatPad");
  if (data.messageID) {
    infos[data.messageID] = data;
  }
  if (data.botSend || !data.isYou) {
    // @ts-ignore
    appendRep({
      body: data.body,
      messageID: data.messageID,
      chatPad,
      botSend: data.botSend,
      // @ts-ignore
      attachment: data.attachment,
    });
  } else {
    let appended = data.body;
    if (data.messageReply) {
      const { body } = infos[data.messageReply.messageID] || {};
      appended = `Replying to: ${limitStr(body, 10)}

${data.body}`;
    }

    appendSend({ message: appended, chatPad });
  }
}

document.addEventListener("keydown", (event) => {
  if (event.ctrlKey) {
    return;
  }

  const messageBox = document.querySelector("#userText");
  if (!document.activeElement || document.activeElement === document.body) {
    // @ts-ignore
    messageBox.focus();
  }
});
document.addEventListener("keydown", function (event) {
  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    event.preventDefault();
    send();
  }
});

// this one is for sending messages..
/**
 * @param {boolean} [isReply]
 * @param {string | number} [mid]
 */
async function send(isReply, mid, extra = {}) {
  const messageDoc = document.querySelector("#userText");

  // @ts-ignore
  const message = messageDoc.value.trim();
  if (!message) {
    return alert(
      `You can't send an empty message, please type at the textarea first.`
    );
  }
  let payload = {
    params: {
      body: message,
      messageReply: isReply ? { ...infos[mid] } : null,
      type: isReply ? "message_reply" : "message",
      ...extra,
    },
  };
  ws.send(JSON.stringify(payload.params));

  // @ts-ignore
  messageDoc.value = "";
  adjustRows();
  await fetchUserCache(panelID, true);
}
/**
 * @param {any} messageID
 */
function chooseReaction(messageID) {
  const reactOpt = document.querySelector("#reactOpt");
  const reactBG = document.querySelector("#reactBG");

  const reactOptions = document.querySelector("#reactOptions");
  reactOptions.innerHTML = "";
  for (const emoji of emojis) {
    reactOptions.innerHTML += `<span onclick="sendReact('${emoji}', '${messageID}')" style="font-size: 30px;">${emoji}</span>  `;
  }
  // @ts-ignore
  reactOpt.style.display = "block";
  // @ts-ignore
  reactOpt.disabled = false;
  // @ts-ignore
  reactBG.style.display = "block";
  // @ts-ignore
  reactBG.disabled = false;
}
/**
 * @param {any} reaction
 * @param {string | number} messageID
 */
function sendReact(reaction, messageID) {
  const { senderID } = infos[messageID] ?? {};
  ws.send(
    JSON.stringify({
      type: "message_reaction",
      reaction,
      messageID,
      userID: panelID,
      senderID,
    })
  );
}
// this one is the oldest cassidy send function, and it sucks but t faster
/**
 * @param {any} isReply
 * @param {string | number} mid
 */
async function sendOld(isReply, mid, extra = {}) {
  // @ts-ignore
  const message = document.getElementById("userText").value?.trim();
  if (!message) {
    return alert(
      `You can't send an empty message, please type at the textarea first.`
    );
  }
  const chatPad = document.getElementById("chatPad");
  // @ts-ignore
  document.getElementById("userText").value = "";
  try {
    let appended = message;
    if (isReply) {
      const { body } = infos[mid];
      appended = `Replying to: ${limitStr(body, 10)}

${message}`;
    }
    let payload = {
      params: {
        body: message,
        messageReply: isReply ? { ...infos[mid] } : null,
        type: isReply ? "message_reply" : "message",
        ...extra,
      },
    };
    const emojis = ["👍", "❤️", "😮", "😢", "😠", "👎"];
    if (isReply && emojis.includes(message)) {
      const { messageID, body } = infos[mid];
      appended = `Reacting to ${limitStr(body, 10)}

${message}`;
      payload = {
        params: {
          type: "message_reaction",
          // @ts-ignore
          messageID,
          reaction: message,
          userID: panelID,
          ...extra,
        },
      };
    }
    appendSend({ message: appended, chatPad });
    smoothScroll();
    // @ts-ignore
    const response = await axios.get(`/postWReply`, payload);
    const {
      result,
      result: { body, messageID },
    } = response.data;
    infos[messageID] = result;
    // @ts-ignore
    appendRep({ messageID, body, chatPad });
    smoothScroll();
  } catch (err) {
    console.error(err);
  }
}
// Liane ain't documenting these all
/**
 * @param {any} mid
 */
async function reply(mid) {
  await send(true, mid);
}
// self explanatory, avoid xss even tho not needed very much since nobody else can chat together..
/**
 * @param {string} input
 */
function sanitize(input) {
  const sanitizedInput = input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const sanitizedWithLineBreaks = sanitizedInput.replace(/\n/g, "<br>");

  return sanitizedWithLineBreaks;
}

const textarea = document.getElementById("userText");
const MAX_ROWS = 7;
function adjustRows() {
  // @ts-ignore
  const lines = textarea.value.split("\n");
  const rowCount = Math.min(lines.length, MAX_ROWS);

  // @ts-ignore
  textarea.setAttribute("rows", rowCount);

  const ccc = document.querySelector("#ccc");
  if (isScrolledBottom(ccc, 20)) {
    ccc.lastElementChild.scrollIntoView({ behavior: "smooth" });
  }
}

/**
 * @param {HTMLSpanElement} element
 */
function animateSend(element) {
  if (element instanceof HTMLElement) {
    element.animate(
      [
        {
          transform: "translateY(20px)",
          opacity: 0,
        },
        {
          transform: "translateY(0)",
          opacity: 1,
        },
      ],
      {
        duration: 300,
        easing: "ease-out",
      }
    );
  }
}

textarea.addEventListener("input", adjustRows);

/**
 * @param {Element} element
 * @param {number} allowance
 */
function isScrolledBottom(element, allowance) {
  if (!element) return false;

  if (element instanceof HTMLElement) {
    const scrollPosition = element.scrollTop + element.clientHeight;
    const scrollHeight = element.scrollHeight;

    // console.log(
    //   `${scrollPosition} >= ${scrollHeight} - ${allowance} (${
    //     scrollHeight - allowance
    //   })`,
    //   scrollPosition >= scrollHeight - allowance
    // );

    return scrollPosition >= scrollHeight - allowance;
  }

  return false;
}

/**
 * @param {string} str
 */
function isEmojiAll(str) {
  const regex = /^\p{Emoji}+$/u;
  return regex.test(str.replace(/\n/g, "").replace(" ", ""));
}

/**
 * ContextMenu class for creating customizable and dynamic context menus.
 *
 * @author Liane Cagara
 */
class ContextMenu {
  /**
   * @type {this[]}
   */
  static cache = [];
  /**
   * Creates a new ContextMenu instance.
   *
   * @param {HTMLElement} element - The target element to attach the context menu to.
   * @param {{
   *   menu?: HTMLElement,
   *   bottom?: boolean,
   *   allowance?: number,
   *   clean?: boolean,
   *   leftClick?: boolean,
   *   items?: Array<{ label: string, callback: Function }>
   *   onOpen: Function,
   *   onClose: Function
   * }} [options] - Options to customize the context menu.
   */
  constructor(
    element,
    // @ts-ignore
    {
      menu,
      bottom,
      allowance = 0,
      items = [],
      clean = false,
      leftClick = false,
      onOpen,
      onClose,
    } = {}
  ) {
    this.leftClick = leftClick;
    this.target = element;
    this.clean = clean;
    if (!menu) {
      menu = document.createElement("div");
      menu.classList.add("lia-ctxmenu");
    }
    this.isBottom = !!bottom;
    this.menu = menu;
    this.allowance = allowance;
    this.items = items;
    this.visible = false;
    this.onOpen = onOpen;
    this.isHovered = false;
    this.optionsElem = [];
    this.onClose = onClose;

    menu.addEventListener("mouseenter", () => {
      this.isHovered = true;
    });
    menu.addEventListener("mouseleave", () => {
      this.isHovered = false;
    });
  }

  /**
   * Adds an option to the context menu.
   *
   * @param {{
   *   label: string,
   *   callback: Function,
   *   [etc]: Object
   * }} option - The menu option to add.
   */
  // @ts-ignore
  addOption({ label, callback, svgIcon, ...etc }) {
    const e = document.createElement("div");
    e.classList.add("item");

    if (svgIcon) {
      const span = document.createElement("span");
      span.innerHTML = svgIcon;
      const txt = document.createElement("span");
      txt.textContent = label;
      e.addEventListener("click", (e) => {
        callback(e, this.target);
      });
      e.append(txt, span);
      e.style.display = "flex";
      e.style.gap = "10px";
      e.style.alignItems = "center";
      e.classList.add("menusvg");
      span.style.display = "flex";
    } else {
      e.textContent = label;
      e.addEventListener("click", (e) => {
        callback(e, this.target);
      });
    }

    Object.assign(e, etc);

    this.menu.appendChild(e);
    this.optionsElem.push(e);
  }

  /**
   * Clears all options from the context menu.
   */
  clearOptions() {
    this.menu.innerHTML = "";
    this.optionsElem = [];
  }

  /**
   * Removes a specific option from the context menu by label.
   *
   * @param {string} label - The label of the option to remove.
   */
  removeOption(label) {
    // const items = this.menu.querySelectorAll(".item");
    const items = this.optionsElem;
    for (const item of items) {
      if (item.textContent === label) {
        this.menu.removeChild(item);
        this.optionsElem.splice(this.optionsElem.indexOf(item), 1);
        break;
      }
    }
  }

  /**
   * Updates an existing option in the context menu.
   *
   * @param {string} oldLabel - The label of the option to update.
   * @param {{
   *   label: string,
   *   callback: Function,
   *   [etc]: Object
   * }} newOption - The new properties for the updated option.
   */
  updateOption(oldLabel, { label, callback, ...etc }) {
    const items = this.menu.querySelectorAll(".item");
    // @ts-ignore
    for (const item of items) {
      if (item.textContent === oldLabel) {
        item.textContent = label;
        item.onclick = (/** @type {any} */ e) => callback(e, this.target);
        Object.assign(item, etc);
        break;
      }
    }
  }

  /**
   * Initializes the context menu and attaches necessary event listeners.
   */
  init() {
    if (!this.clean) {
      this.menu.classList.add("lia-ctxmenu");
    }
    Object.assign(this.menu.style, {
      position: "fixed",
      zIndex: "10000",
      display: "none",
      overflowY: "auto",
      maxHeight: "90vh",
    });
    // @ts-ignore
    const { target, menu } = this;
    for (const data of this.items) {
      this.addOption(data);
    }

    if (this.leftClick) {
      target.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.visible) {
          this.hide();
        } else {
          this.show(e);
        }
      });
      window.addEventListener("click", () => this.hide());
      window.addEventListener("contextmenu", () => this.hide());
      // target.addEventListener("contextmenu", (e) => {
      //   // e.stopPropagation();
      //   this.hide();
      // });
    } else if (!this.onOpen) {
      target.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.isHovered) {
          this.hide();
        } else {
          this.show(e);
        }
      });

      window.addEventListener("click", () => this.hide());
      window.addEventListener("contextmenu", () => this.hide());
    } else {
      target.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        e.stopPropagation();

        this.onOpen(e);
      });
      window.addEventListener("click", () => this.hide());
      window.addEventListener("contextmenu", () => this.hide());
    }

    // Calibration
    this.show();
    this.menu.style.display = "none";
    this.visible = false;
    ContextMenu.cache.push(this);
  }

  /**
   * Hides the context menu with an animation.
   */
  hide() {
    // console.log(this.hide?.caller);
    this.menu.style.animation = "closeApp 0.2s ease-out forwards";

    setTimeout(() => {
      this.menu.style.animation = "";

      this.menu.style.display = "none";
      this.visible = false;
      if (this.onClose) {
        this.onClose();
      }
    }, 200);
  }

  /**
   * Displays the context menu at the specified position.
   *
   * @param {{ clientX?: number, clientY?: number }} [position] - The position to show the menu at.
   */
  // @ts-ignore
  show({ clientX = 0, clientY = 0, isRight = false } = {}) {
    const { menu, isBottom, allowance } = this;
    const { innerWidth, innerHeight } = window;
    this.menu.style.animation = "openApp 0.2s ease-out forwards";

    setTimeout(() => {
      this.menu.style.animation = "";
    }, 200);

    // Temporarily make the menu visible to calculate dimensions
    Object.assign(menu.style, {
      visibility: "hidden",
      display: "block",
    });

    if (this.leftClick) {
      const rect = this.target.getBoundingClientRect();
      clientX = rect.right - menu.clientWidth;
      clientY = rect.bottom;
    }

    const menuWidth = menu.offsetWidth;
    const menuHeight = menu.offsetHeight;

    // Hide it again until properly positioned
    Object.assign(menu.style, {
      visibility: "",
      display: "none",
    });

    let left = clientX;
    let top = clientY;

    // Handle bottom positioning logic
    if (isBottom) {
      const bottomSpace = innerHeight - clientY;

      if (menuHeight > bottomSpace) {
        top = innerHeight - menuHeight - allowance;
      } else {
        top = clientY;
      }

      Object.assign(menu.style, {
        bottom: `${innerHeight - top - menuHeight}px`,
        top: "unset",
      });
    } else {
      // Ensure the menu doesn't overflow the viewport vertically
      if (clientY + menuHeight > innerHeight) {
        top = innerHeight - menuHeight - allowance;
      }

      // Prevent menu from going off-screen on the top side
      if (top < 0) top = allowance;

      Object.assign(menu.style, {
        top: `${top}px`,
        bottom: allowance ? `${allowance}px` : "unset",
      });
    }

    if (!isRight) {
      if (clientX + menuWidth > innerWidth) {
        left = innerWidth - menuWidth - allowance;
      }
    }

    Object.assign(menu.style, {
      [isRight ? "right" : "left"]: `${left}px`,
      display: "flex",
    });

    if (isRight) {
      menu.style.left = "";
    }

    document.body.appendChild(menu);
    this.visible = true;
    for (const c of ContextMenu.cache) {
      if (c === this) {
        continue;
      }
      c.hide();
    }
  }
}

let allUserCache = [];

/**
 * @param {string | number | boolean} uid
 */
async function fetchUserInfo(uid) {
  const res = await fetch(`/api/usercache?uid=${encodeURIComponent(uid)}`).then(
    (i) => i.json()
  );
  return res;
}

/**
 * @param {string} uid
 */
async function fetchUserCache(uid, refresh = false) {
  if (!allUserCache[uid] || !refresh) {
    allUserCache[uid] = await fetchUserInfo(uid);
  }

  return allUserCache[uid];
}

function enhanceImage(imgElement) {
  if (!(imgElement instanceof HTMLImageElement)) {
    throw new Error("Parameter must be an HTML image element");
  }

  const overlay = document.createElement("div");
  overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0);
      z-index: 1000;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.3s ease;
  `;

  const enlargedImg = imgElement.cloneNode();
  // @ts-ignore
  enlargedImg.style.cssText = `
      position: fixed;
      max-width: 90vw;
      max-height: 90vh;
      object-fit: contain;
      z-index: 1001;
      opacity: 0;
      transform: scale(0.8);
      transition: all 0.3s ease;
  `;

  function centerImage() {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    // @ts-ignore
    const imgWidth = enlargedImg.width;
    // @ts-ignore
    const imgHeight = enlargedImg.height;

    // @ts-ignore
    enlargedImg.style.left = `${(windowWidth - imgWidth) / 2}px`;
    // @ts-ignore
    enlargedImg.style.top = `${(windowHeight - imgHeight) / 2}px`;
  }

  function closeImage() {
    // @ts-ignore
    enlargedImg.style.opacity = "0";
    // @ts-ignore
    enlargedImg.style.transform = "scale(0.8)";
    overlay.style.opacity = "0";

    setTimeout(() => {
      if (enlargedImg.parentNode) {
        enlargedImg.parentNode.removeChild(enlargedImg);
      }
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    }, 300);
  }

  imgElement.style.cursor = "pointer";
  imgElement.addEventListener("click", (e) => {
    e.stopPropagation();
    e.stopImmediatePropagation();
    document.body.appendChild(overlay);
    document.body.appendChild(enlargedImg);

    // @ts-ignore
    enlargedImg.offsetWidth;

    centerImage();
    overlay.style.background = "rgba(0, 0, 0, 0.8)";
    overlay.style.opacity = "1";
    // @ts-ignore
    enlargedImg.style.opacity = "1";
    // @ts-ignore
    enlargedImg.style.transform = "scale(1)";
    overlay.style.pointerEvents = "auto";
  });
  // @ts-ignore
  window.addEventListener("click", (e) => {
    closeImage();
  });

  window.addEventListener("resize", () => {
    if (enlargedImg.parentNode) {
      centerImage();
    }
  });
}
function autoParseUrlsAsAnchors(element) {
  if (!element || !(element instanceof Element)) return;

  const urlRegex = /(\b(?:https?:\/\/|www\.)[^\s<>]+)/gi;

  function processNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.nodeValue;
      const parent = node.parentNode;
      let lastIndex = 0;
      let match;

      urlRegex.lastIndex = 0;
      const fragment = document.createDocumentFragment();

      while ((match = urlRegex.exec(text)) !== null) {
        const url = match[0];
        const start = match.index;

        if (start > lastIndex) {
          fragment.appendChild(
            document.createTextNode(text.slice(lastIndex, start))
          );
        }

        const a = document.createElement("a");
        a.href = url.startsWith("http") ? url : `http://${url}`;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.textContent = url;
        fragment.appendChild(a);

        lastIndex = urlRegex.lastIndex;
      }

      if (lastIndex < text.length) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
      }

      if (fragment.childNodes.length) {
        parent.replaceChild(fragment, node);
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      Array.from(node.childNodes).forEach(processNode);
    }
  }

  processNode(element);
}
