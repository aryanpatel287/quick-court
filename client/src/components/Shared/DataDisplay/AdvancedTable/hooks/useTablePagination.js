import { useState, useEffect, useMemo } from 'react';

const PAGE_SIZE_STANDARDS = [5, 10, 15, 25, 50];

export function useTablePagination({
    initialRowsPerPage = 5,
    processedData = [],
    totalCount = null,
    serverSide = false,
}) {
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);

    const totalRows = typeof totalCount === 'number' ? totalCount : processedData.length;

    useEffect(() => {
        if (totalRows === 0) return;
        const meaningful = PAGE_SIZE_STANDARDS.filter((n) => n < totalRows);
        if (rowsPerPage >= totalRows && meaningful.length > 0) {
            setRowsPerPage(meaningful[meaningful.length - 1]);
            setCurrentPage(1);
        }
    }, [totalRows]);

    const rowsOptions = useMemo(() => {
        if (totalRows === 0) return [];
        const opts = [];
        const customSet = new Set(PAGE_SIZE_STANDARDS);
        if (!customSet.has(rowsPerPage) && rowsPerPage !== totalRows) {
            opts.push({
                value: rowsPerPage,
                label: String(rowsPerPage),
                disabled: rowsPerPage >= totalRows,
            });
        }
        PAGE_SIZE_STANDARDS.forEach((n) => {
            opts.push(
                n >= totalRows
                    ? {
                          value: n,
                          label: String(n),
                          disabled: true,
                          description: `Only ${totalRows} row${totalRows !== 1 ? 's' : ''} available`,
                      }
                    : { value: n, label: String(n) },
            );
        });
        opts.sort((a, b) => a.value - b.value);
        opts.push({
            value: totalRows,
            label: `Show all ${totalRows}`,
            description: 'Display every row on one page',
        });
        return opts;
    }, [rowsPerPage, totalRows]);

    const showRowsPerPage = useMemo(() => {
        if (totalRows <= 1) return false;
        return rowsOptions.filter((opt) => !opt.disabled && opt.value < totalRows).length >= 1;
    }, [rowsOptions, totalRows]);

    const totalPages = Math.max(Math.ceil(totalRows / rowsPerPage), 1);

    useEffect(() => {
        if (currentPage > totalPages) setCurrentPage(totalPages);
        if (currentPage < 1) setCurrentPage(1);
    }, [totalPages, currentPage]);

    const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);

    const paginatedData = useMemo(() => {
        if (serverSide) return processedData;
        const startIndex = (safeCurrentPage - 1) * rowsPerPage;
        return processedData.slice(startIndex, startIndex + rowsPerPage);
    }, [processedData, safeCurrentPage, rowsPerPage, serverSide]);

    const handleRowsPerPageChange = (val) => {
        setRowsPerPage(Number(val));
        setCurrentPage(1);
    };

    return {
        currentPage,
        setCurrentPage,
        rowsPerPage,
        setRowsPerPage,
        totalRows,
        rowsOptions,
        showRowsPerPage,
        totalPages,
        safeCurrentPage,
        paginatedData,
        handleRowsPerPageChange,
    };
}
