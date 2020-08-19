import React, {
  useRef,
  useState,
  useMemo,
  useEffect,
  useCallback,
} from "react";
import Big from "big.js";

import { EventEmitter } from "globals/EventEmitter";
import { useFetch } from "hooks/useFetch";
import fetchProducts from "api/fetchProducts";
import type { ProductDataType } from "api/fetchProducts";
import { MarketTable } from "components/MarketTable";
import type { MarketTableRowType } from "components/MarketTable";
import "./MarketWidget.module.scss";
import clsx from "clsx";

type MarketGroupsType = { [key: string]: ProductDataType[] };

type MarketDataType = {
  groups: MarketGroupsType;
  markets: string[];
  index: {
    [shortMarketName: string]: {
      group: string;
      row: ProductDataType;
    };
  };
};

const getDefaultMarketsData = (): MarketDataType => ({
  groups: {},
  markets: [],
  index: {},
});

export const MarketWidget = () => {
  const { data, refetch, error } = useFetch(fetchProducts);

  const { groups, markets, index } = useMemo(
    () => (data ? prepareMarketData(data) : getDefaultMarketsData()),
    [data]
  );

  const [selectedMarket, setSelectedMarket] = useState("");
  useEffect(() => {
    if (!selectedMarket) setSelectedMarket(markets[0]);
  }, [selectedMarket, markets]);

  const [shouldBeUpdated, setShouldBeUpdated] = useState(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const tableRows = useMemo(() => prepareTableRows(groups[selectedMarket]), [
    groups,
    selectedMarket,
    shouldBeUpdated,
  ]);

  const eventHandlers = useRef({
    handleWsMessage: ({ data }) => {},
    handleWsConnectionLost: () => {},
    handleWsConnectionReestablished: () => {},
  });

  useEffect(() => {
    eventHandlers.current.handleWsMessage = ({ data }) => {
      let shouldUpdate = false;

      for (let i = data.length; i--; ) {
        const newRowData = data[i];
        const { s: market, c, o } = newRowData;

        const item = index[market];
        if (!item) continue;

        const { row, group } = item;

        Object.assign(row, { c, o });

        if (group === selectedMarket) {
          shouldUpdate = true;
        }
      }

      if (shouldUpdate) {
        setShouldBeUpdated((num) => num + 1);
      }
    };
  }, [selectedMarket, index]);

  useEffect(() => {
    eventHandlers.current.handleWsConnectionLost = () => {
      setAlert({
        type: "error",
        message: "Websocket connection lost",
      });
    };
  }, []);

  useEffect(() => {
    eventHandlers.current.handleWsConnectionReestablished = () => {
      setAlert({
        type: "success",
        message: "Websocket connection reestablished",
      });

      // on reestablished connection refetch to prevent data loss
      refetch();

      setTimeout(() => setAlert(null), 3000);
    };
  }, [refetch]);

  const selectMarket = useCallback(({ target }) => {
    setSelectedMarket(target.dataset.market);
  }, []);

  const [alert, setAlert] = useState(null);

  useEffect(() => {
    const subscriptions = [
      EventEmitter.addListener("WS_MESSAGE", (data) => {
        eventHandlers.current.handleWsMessage(data);
      }),

      EventEmitter.addListener("WS_CONNECTION_LOST", () => {
        eventHandlers.current.handleWsConnectionLost();
      }),

      EventEmitter.addListener("WS_CONNECTION_REESTABLISHED", () => {
        eventHandlers.current.handleWsConnectionReestablished();
      }),
    ];

    return () => {
      subscriptions.forEach((s) => s.remove());
    };
  }, []);

  return (
    <div styleName="root">
      <div styleName="title">
        Market
        {alert && (
          <div styleName="alert" className={alert.type}>
            {alert.message}
          </div>
        )}
      </div>
      <div styleName="select">
        {Object.keys(groups).map((marketName) => (
          <div
            key={marketName}
            styleName="marketName"
            className={clsx({ active: marketName === selectedMarket })}
            onClick={selectMarket}
            data-market={marketName}
          >
            {marketName}
          </div>
        ))}
      </div>
      <div className="table">
        {error ? (
          <div styleName="error">Can not load data</div>
        ) : (
          <div styleName="table">
            <MarketTable rows={tableRows} />
          </div>
        )}
      </div>

      {/* @ts-ignore */}
      <div styleName="closeWsBtn" onClick={window.closeWs}>
        Drop Websocket connection
      </div>
    </div>
  );
};

function prepareMarketData(rows: ProductDataType[]): MarketDataType {
  return rows.reduce((acc, row) => {
    const { groups, markets, index } = acc;
    const { b, q, pm } = row;

    if (!groups[pm]) {
      markets.push(pm);
      groups[pm] = [];
    }
    groups[pm].push(row);

    index[b + q] = {
      group: pm,
      row,
    };

    return acc;
  }, getDefaultMarketsData());
}

function prepareTableRows(rows: ProductDataType[] = []): MarketTableRowType[] {
  return rows.map(({ b, q, c, o }) => ({
    pair: `${b}/${q}`,
    lastPrice: Big(c),
    change: getChangePercent(c, o),
  }));
}

function getChangePercent(prev: number, current: number): Big {
  if (!prev) return Big(0);

  return Big(current).minus(prev).div(prev).times(100);
}
