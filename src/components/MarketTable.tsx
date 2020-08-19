import React, { useRef, useState, useCallback, useEffect } from "react";
import Big from "big.js";

import { VirtualizedTable } from "components/common/VirtualizedTable";
import "./MarketTable.module.scss";

export type MarketTableRowType = {
  pair: string;
  lastPrice: Big;
  change: Big;
};

type SortParamsType = {
  sortBy: string;
  sortDirection: string;
};

type SortType = SortParamsType & {
  rows: MarketTableRowType[];
};

type PropsType = {
  rows: MarketTableRowType[];
};

const pairCellRenderer = ({ cellData }: { cellData?: string }) => (
  <span data-testid="pair-cell">{cellData}</span>
);

const lastPriceCellRenderer = ({ cellData }: { cellData?: Big }) => (
  <span data-testid="last-price-cell">{Big(cellData).toFixed(8)}</span>
);

const changeCellRenderer = ({ cellData }: { cellData?: Big }) => {
  if (!cellData) return null;

  const styleName = Big(cellData).lt(0) ? "negative" : "positive";
  return (
    <div styleName={styleName} data-testid="change-cell">
      {Big(cellData).toFixed(2)}
    </div>
  );
};

const columns = [
  {
    width: 200,
    label: "Pair",
    dataKey: "pair",
    cellRenderer: pairCellRenderer,
  },
  {
    width: 120,
    label: "Last Price",
    dataKey: "lastPrice",
    cellRenderer: lastPriceCellRenderer,
  },
  {
    width: 120,
    label: "Change",
    dataKey: "change",
    cellRenderer: changeCellRenderer,
  },
];

const defaultSortParams = {
  sortBy: columns[0].dataKey,
  sortDirection: "ASC",
};

const columnsSortConfig = {
  pair: <T extends string>(a: T, b: T) => a < b,
  lastPrice: <T extends Big>(a: T, b: T) => a.lt(b),
  change: <T extends Big>(a: T, b: T) => a.lt(b),
};

export const MarketTable = React.memo(({ rows }: PropsType) => {
  const sortParamsCache = useRef(defaultSortParams);

  const [sortedRows, setSortedRows] = useState(
    getInitialRows(rows, sortParamsCache.current)
  );

  useEffect(() => {
    setSortedRows(getInitialRows(rows, sortParamsCache.current));
  }, [rows]);

  const rowGetter = useCallback(({ index }) => sortedRows[index], [sortedRows]);

  const setSortParams = useCallback(
    (sortParams: SortParamsType) => {
      sortParamsCache.current = sortParams;
      setSortedRows(sortRows({ rows, ...sortParams }));
    },
    [rows, setSortedRows]
  );

  if (!sortedRows.length) return null;

  return (
    <VirtualizedTable
      rowCount={rows.length}
      rowGetter={rowGetter}
      columns={columns}
      sort={setSortParams}
    />
  );
});

function getInitialRows(
  rows: MarketTableRowType[],
  { sortBy, sortDirection }: SortParamsType
) {
  return sortRows({ rows, sortBy, sortDirection });
}

function sortRows({ rows, sortBy, sortDirection }: SortType) {
  const sortedRows = [...rows];
  sortedRows.sort((a, b) => {
    const dir = sortDirection === "ASC" ? -1 : 1;
    const compare = columnsSortConfig[sortBy];
    return compare(a[sortBy], b[sortBy]) ? dir : -dir;
  });

  return sortedRows;
}
