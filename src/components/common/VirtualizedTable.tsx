import React, { useState, useCallback } from "react";
import clsx from "clsx";
import {
  AutoSizer,
  Column,
  Table,
  TableCellRenderer,
  TableHeaderProps,
  SortDirection,
} from "react-virtualized";
import type {
  SortDirectionType,
  ColumnProps as ColumnPropsType,
  Index as IndexType,
} from "react-virtualized";

import styles from "./VirtualizedTable.module.scss";

interface PropsType {
  columns: ColumnPropsType[];
  rowCount: number;
  rowGetter: (row: IndexType) => Object;
  sort?: (params: { sortBy: string; sortDirection: SortDirectionType }) => void;
}

const gridStyle = {
  direction: "inherit",
};

const headerHeight = 48;
const rowHeight = 48;

const getRowClassName = (row: IndexType) =>
  clsx(styles.tableRow, styles.flexContainer);

const cellRenderer: TableCellRenderer = ({ cellData }) => (
  <div
    className={clsx(styles.tableCell, styles.flexContainer)}
    style={{ height: rowHeight }}
  >
    {cellData}
  </div>
);

const headerRenderer = ({
  label,
  sortBy,
  sortDirection,
  dataKey,
}: TableHeaderProps) => (
  <div
    className={clsx(styles.tableCell, styles.flexContainer, {
      sortActive: sortBy === dataKey,
      sortDesc: sortDirection === SortDirection.DESC,
    })}
    style={{ height: headerHeight }}
    data-testid={`header-${dataKey}`}
  >
    <span>{label}</span>
  </div>
);

export const VirtualizedTable: React.FunctionComponent<PropsType> = (props) => {
  const { columns, sort, ...tableProps } = props;
  const [state, setState] = useState({
    sortBy: sort ? columns[0].dataKey : undefined,
    sortDirection: SortDirection.ASC,
  });

  const sortHandler = useCallback(
    ({ sortBy, sortDirection }) => {
      if (sort) {
        sort({ sortBy, sortDirection });
        setState({
          sortBy,
          sortDirection,
        });
      }
    },
    [sort]
  );

  return (
    <AutoSizer>
      {({ height, width }) => (
        <Table
          height={height}
          width={width}
          rowHeight={rowHeight}
          gridStyle={gridStyle}
          sort={sortHandler}
          sortBy={state.sortBy}
          sortDirection={state.sortDirection}
          headerHeight={headerHeight}
          {...tableProps}
          rowClassName={getRowClassName}
        >
          {columns.map(({ dataKey, ...other }) => {
            return (
              <Column
                key={dataKey}
                headerRenderer={headerRenderer}
                className={styles.flexContainer}
                cellRenderer={cellRenderer}
                dataKey={dataKey}
                {...other}
              />
            );
          })}
        </Table>
      )}
    </AutoSizer>
  );
};
