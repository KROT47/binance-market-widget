import { openWs, getOpenedWs } from "modules/WebsocketController";

import { EventEmitter } from "globals/EventEmitter";

const wsUrl = "wss://stream.binance.com/stream?streams=!miniTicker@arr";

type HandlerType = (...args: any[]) => void;

interface HandlersType {
  onOpen?: HandlerType[];
  onError?: HandlerType[];
  onMessage?: HandlerType[];
  onLostConnection?: HandlerType[];
  onReconnect?: HandlerType[];
  onClose?: HandlerType[];
}

const HANDLERS: HandlersType = {
  onMessage: [
    (message) => {
      const { data } = JSON.parse(message.data);
      EventEmitter.emit("WS_MESSAGE", { data });
      // console.log(">>>WS message", data);
    },
  ],
  onLostConnection: [
    () => {
      EventEmitter.emit("WS_CONNECTION_LOST");
    },
  ],
  onReconnect: [
    () => {
      EventEmitter.emit("WS_CONNECTION_REESTABLISHED");
    },
  ],
};

const OPEN_WS_CONFIG = Object.keys(HANDLERS).reduce((acc, key) => {
  acc[key] = function (...args) {
    const handlers = HANDLERS[key];

    for (const handler of handlers) handler(...args);
  };
  return acc;
}, {});

openWs(wsUrl, OPEN_WS_CONFIG);

// @ts-ignore
window.closeWs = () => {
  const WS = getOpenedWs(wsUrl);
  WS.close();
};
