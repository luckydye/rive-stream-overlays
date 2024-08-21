import { AnimationElement } from "@atrium-ui/elements/animation";

AnimationElement.riveWasm = "https://unpkg.com/@rive-app/canvas-advanced@2.19.8/rive.wasm";

// https://github.com/rive-app/rive-wasm/blob/9677ba80e78d20e27693b27681b61614d11f6c44/js/src/rive.ts#L265
const StateMachineInputType = {
  Number: 56,
  Trigger: 58,
  Boolean: 59,
}

function connect() {
  const anim = document.querySelector<AnimationElement>("#anim");
  const ws = new WebSocket("ws://localhost:1890")
  const state = new Map();

  ws.onopen = () => {
    console.log("connected")
  }

  ws.onerror = (error) => {
    // TODO: reconnect
  }

  ws.onclose = () => {
    // TODO: reconnect
  }

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    console.info(data);

    for (const key in data) {
      const value = data[key];

      if (key === "src") {
        anim.src = value;
      }

      let needsUpdate = false;

      if (!state.has(key)) {
        needsUpdate = true;
      } else if (state.get(key) !== value) {
        needsUpdate = true;
      }

      state.set(key, value);

      if (!needsUpdate) {
        continue;
      }

      // search input by name
      const input = anim.input(key);
      if (input) {
        // update input value
        switch (input.type) {
          case StateMachineInputType.Boolean:
            input.asBool().value = Boolean(value);
            break;
          case StateMachineInputType.Number:
            input.asNumber().value = Number(value);
            break;
          case StateMachineInputType.Trigger:
            input.asTrigger().fire();
            break;
          default:
            console.log("unknown input", input);
        }
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
  setTimeout(() => { connect(); }, 250);
}
