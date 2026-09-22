import { useMemo, useState, type ReactNode } from "react";

export interface Column<T> {
    key: string;
    header: string;
    render: (row: T) => ReactNode;
    align?: "right";
    compare?: (a: T, b: T) => number;
}

interface DataTableProps<T> {
    columns: Column<T>[];
    rows: T[];
    rowKey: (row: T) => string;
    onRowClick?: (row: T) => void;
    empty?: string;
    caption?: string;
}

export function DataTable<T>({ columns, rows, rowKey, onRowClick, empty, caption }: DataTableProps<T>) {
    const [sort, setSort] = useState<{ key: string; desc: boolean } | null>(null);

    const ordered = useMemo(() => {
        if (!sort) return rows;
        const column = columns.find((c) => c.key === sort.key);
        if (!column?.compare) return rows;
        const sorted = [...rows].sort(column.compare);
        return sort.desc ? sorted.reverse() : sorted;
    }, [rows, sort, columns]);

    function toggle(key: string) {
        setSort((current) =>
            current?.key === key ? { key, desc: !current.desc } : { key, desc: false },
        );
    }

    if (!rows.length) return <p className="table-empty">{empty ?? "Nothing to show."}</p>;

    return (
        <div className="table-scroll">
            <table className="data-table">
                {caption && <caption className="sr-only">{caption}</caption>}
                <thead>
                    <tr>
                        {columns.map((column) => {
                            const sorted = sort?.key === column.key;
                            return (
                                <th
                                    key={column.key}
                                    className={column.align === "right" ? "num" : undefined}
                                    aria-sort={sorted ? (sort.desc ? "descending" : "ascending") : undefined}
                                >
                                    {column.compare ? (
                                        <button type="button" className="th-sort" onClick={() => toggle(column.key)}>
                                            {column.header}
                                            <span className="th-caret" aria-hidden="true">
                                                {sorted ? (sort.desc ? "▾" : "▴") : "⇅"}
                                            </span>
                                        </button>
                                    ) : (
                                        column.header
                                    )}
                                </th>
                            );
                        })}
                    </tr>
                </thead>
                <tbody>
                    {ordered.map((row) => (
                        <tr
                            key={rowKey(row)}
                            className={onRowClick ? "is-clickable" : undefined}
                            tabIndex={onRowClick ? 0 : undefined}
                            onClick={onRowClick ? () => onRowClick(row) : undefined}
                            onKeyDown={
                                onRowClick
                                    ? (event) => event.key === "Enter" && onRowClick(row)
                                    : undefined
                            }
                        >
                            {columns.map((column) => (
                                <td key={column.key} className={column.align === "right" ? "num" : undefined}>
                                    {column.render(row)}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
