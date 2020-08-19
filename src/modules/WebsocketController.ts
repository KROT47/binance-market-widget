// =============================================================================
// Import
// =============================================================================

// Types
// --------------------------------------------------------
export type OpenWsConfigType = {
  getReconnectDelay?: (reconnectTryCount: number) => number;
  onOpen?: (event: Event) => void;
  onError?: (event: Event) => void;
  onClose?: (event: Event) => void;
  onMessage?: (event: Event) => void;
  onReconnect?: () => void;
  onLostConnection?: () => void;
};

type WsStateType = {
  ws: WebSocket;
  reconnectTryCount: number;
  closeCount: number;
};

// =============================================================================
// Constants
// =============================================================================
const WS_CLOSED_BY_INTENTION_CODE = 1000;

const OpenedWs: {
  [url: string]: WsStateType;
} = {};

const DefaultWsStateType = {
  reconnectTryCount: 0,
  closeCount: 0,
};

const DefaultConfig = {
  getReconnectDelay: (reconnectTryCount) => {
    if (reconnectTryCount > 7) {
      return 20 * 1000; // 20 sec
    }

    if (reconnectTryCount > 3) {
      return 10 * 1000; // 10 sec
    }

    return 3 * 1000; // 3 sec
  },
};

// =============================================================================
// getOpenedWs
// =============================================================================
export function getOpenedWs(wsUrl: string): WebSocket | undefined {
  if (!OpenedWs[wsUrl]) return;

  const { ws } = OpenedWs[wsUrl];

  return ws;
}

// =============================================================================
// isOpenedWs
// =============================================================================
export function isOpenedWs(wsUrl: string): boolean {
  if (!OpenedWs[wsUrl]) return false;

  const { ws } = OpenedWs[wsUrl];

  return ws && ws.readyState <= 1;
}

// =============================================================================
// openWs
// =============================================================================
export function openWs(
  wsUrl: string,
  config?: OpenWsConfigType,
  _prevState?: WsStateType
): WebSocket | undefined {
  const {
    getReconnectDelay,
    onOpen,
    onError,
    onMessage,
    onClose,
    onReconnect,
    onLostConnection,
  }: OpenWsConfigType = {
    ...DefaultConfig,
    ...config,
  };

  if (!isOpenedWs(wsUrl)) {
    try {
      OpenedWs[wsUrl] = {
        ...DefaultWsStateType,
        ..._prevState,
        ws: new WebSocket(wsUrl),
      };
    } catch (e) {
      onError && onError(e);

      console.error("Can not open socket due to error: ", e.message);

      return;
    }
  }

  const { ws } = OpenedWs[wsUrl];

  let reconnectTimeoutId = null;

  ws.onopen = (event) => {
    OpenedWs[wsUrl].reconnectTryCount = 0;
    reconnectTimeoutId && clearTimeout(reconnectTimeoutId);

    if (OpenedWs[wsUrl].closeCount) {
      OpenedWs[wsUrl].closeCount = 0;

      onReconnect && onReconnect();
    } else {
      onOpen && onOpen(event);
    }
  };

  if (onMessage) ws.onmessage = onMessage;

  ws.onerror = (event) => {
    onError && onError(event);

    console.log(event);
    console.error("Socket encountered error, closing socket");

    ws.close();
  };

  ws.onclose = (e) => {
    if (e.code !== WS_CLOSED_BY_INTENTION_CODE) {
      OpenedWs[wsUrl].closeCount++;

      onLostConnection && onLostConnection();
    }

    if (!OpenedWs[wsUrl]) return;

    onClose && onClose(e);

    const reconnectDelay = getReconnectDelay(OpenedWs[wsUrl].reconnectTryCount);

    console.log(
      `Socket is closed. Reconnect will be attempted in ${
        reconnectDelay / 1000
      } seconds.`,
      e.reason
    );

    reconnectTimeoutId = setTimeout(() => {
      OpenedWs[wsUrl] && OpenedWs[wsUrl].reconnectTryCount++;
      openWs(wsUrl, config, OpenedWs[wsUrl]);
    }, reconnectDelay);
  };

  return ws;
}

// =============================================================================
// closeWs
// =============================================================================
/**
 * Closes opened WebSocket by url and returns true
 * If no Ws was opened returns false
 */
export function closeWs(
  wsUrl: string,
  reason?: string,
  code: number = 1000
): boolean {
  const { ws } = OpenedWs[wsUrl];

  if (!ws) return false;

  delete OpenedWs[wsUrl];

  ws.close(code, reason);

  return true;
}
