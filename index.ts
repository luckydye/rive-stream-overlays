import { AnimationElement } from "@atrium-ui/elements/animation";

AnimationElement.riveWasm = "https://unpkg.com/@rive-app/canvas-advanced@2.19.8/rive.wasm";

// https://github.com/rive-app/rive-wasm/blob/9677ba80e78d20e27693b27681b61614d11f6c44/js/src/rive.ts#L265
const StateMachineInputType = {
  Number: 56,
  Trigger: 58,
  Boolean: 59,
}

function connect(ws) {
  const anim = document.querySelector<AnimationElement>("#anim");
  const state = new Map();

  setInterval(() => tick(), 12 / 1000);

  function tick() {
    const delta = Date.now() - state.get("timer");
    const formattedTime = new Date(delta).toISOString().substr(11, 8);

    const textRun = anim.artboardInstance?.textRun("timer");
    if (textRun) {
      textRun.text = formattedTime;
    }
  }

  ws.onopen = () => {
    console.log("connected")
  }

  ws.onerror = (error) => {
    // TODO: reconnect
  }

  ws.onclose = () => {
    // TODO: reconnect
  }

  ws.onmessage = async (event) => {
    const data = JSON.parse(event.data);

    console.info(data);

    if ("src" in data && anim.src !== data.src) {
      const loaded = new Promise((resolve) => {
        const onLoaded = () => {
          anim.removeEventListener("load", onLoaded);
          resolve(0);
        }
        anim.addEventListener("load", onLoaded);
      });

      anim.src = data.src;

      await loaded;
    }

    for (const key in data) {
      const value = data[key];

      // search input by name
      const input = anim.input(key);
      if (input) {
        // update input value
        switch (input.type) {
          case StateMachineInputType.Boolean:
            const bool = input.asBool();
            if (bool.value !== value) {
              bool.value = value;
            }
            break;
          case StateMachineInputType.Number:
            const number = input.asNumber();
            if (number.value !== value) {
              number.value = Number(value);
            }
            break;
          case StateMachineInputType.Trigger:
            const trigger = input.asTrigger();
            if (state.get(key) !== value) {
              trigger.fire();
            }
            break;
          default:
            console.log("unknown input", input);
        }
      }

      state.set(key, value);

      if (key === "timer") {
        // timer is a special variable for a stopwatch
        continue;
      }

      // look for text run too
      const textRun = anim.artboardInstance?.textRun(key);
      if (textRun?.name === key) {
        textRun.text = value.toString();
      }
    }
  }
}

if (typeof window !== "undefined") {
  console.info("connecting");
  setTimeout(() => { connect(new WebSocket(location.hash ? `ws://${location.search.substring(1)}` : "ws://localhost:1890")); }, 250);
}
