import { useState, useCallback } from 'react';

/**
 * useTableData — Generic hook to connect AdvancedTable to any backend API.
 *
 * Works in two modes:
 *
 * 1. CLIENT-SIDE (default): Fetch all data once on mount; the table handles
 *    filtering, sorting, and pagination locally.
 *
 * 2. SERVER-SIDE (serverSide=true): Fetch a page of data on every table change
 *    (page / sort / search / tab). Pass the returned `onTableChange` directly
 *    to AdvancedTable's `onTableChange` prop along with `serverSide={true}` and
 *    `totalCount={total}`.
 *
 * @param {string}   endpoint   - API endpoint URL (e.g. '/api/users')
 * @param {boolean}  serverSide - When true, fetches on every table state change
 *                                instead of fetching all data up-front.
 *
 * @returns {{ data, total, loading, error, fetchData, onTableChange, refetch }}
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * CLIENT-SIDE USAGE (fetch-once, table handles everything)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *   const { data, loading, error, refetch } = useTableData({ endpoint: '/api/users' });
 *
 *   <AdvancedTable
 *       data={data}
 *       loading={loading}
 *       onRefresh={refetch}
 *   />
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * SERVER-SIDE USAGE (API handles filtering, sorting, and pagination)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *   const { data, total, loading, onTableChange } = useTableData({
 *       endpoint: '/api/users',
 *       serverSide: true,
 *   });
 *
 *   <AdvancedTable
 *       data={data}
 *       totalCount={total}
 *       loading={loading}
 *       serverSide={true}
 *       onTableChange={onTableChange}
 *   />
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * EXPECTED API RESPONSE FORMAT
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *   Client-side:  any array  →  [ { id, ...fields }, ... ]
 *
 *   Server-side:  paginated object  →  { data: [...], total: 150 }
 *                 OR plain array   →  [ ... ]   (total inferred from length)
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * QUERY PARAMS SENT TO THE API (server-side mode)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *   ?page=1&limit=10&search=alice&sortBy=name&sortDir=asc&filter=active
 *
 *   Param      Source
 *   ─────────  ───────────────────────────────────────────────────────
 *   page       current page number (1-indexed)
 *   limit      rows per page
 *   search     search bar value
 *   sortBy     column key being sorted (omitted when no sort)
 *   sortDir    'asc' | 'desc'  (omitted when no sort)
 *   filter     active tab id  (omitted when tab is 'all')
 */
export function useTableData({ endpoint, serverSide = false }) {
    const [data, setData] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    /**
     * Core fetch function.
     * Accepts optional query params for server-side mode; ignores them
     * in client-side mode (fetches the plain endpoint with no params).
     */
    const fetchData = useCallback(
        async (params = {}) => {
            setLoading(true);
            setError(null);

            try {
                let url = endpoint;

                if (serverSide && Object.keys(params).length > 0) {
                    const {
                        page = 1,
                        rowsPerPage = 10,
                        searchTerm = '',
                        sortConfig = {},
                        activeTab = 'all',
                    } = params;

                    const query = new URLSearchParams();
                    query.set('page', page);
                    query.set('limit', rowsPerPage);

                    if (searchTerm) query.set('search', searchTerm);
                    if (sortConfig?.key) {
                        query.set('sortBy', sortConfig.key);
                        query.set('sortDir', sortConfig.direction ?? 'asc');
                    }
                    if (activeTab && activeTab !== 'all') {
                        query.set('filter', activeTab);
                    }

                    url = `${endpoint}?${query.toString()}`;
                }

                const response = await fetch(url);

                if (!response.ok) {
                    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
                }

                const json = await response.json();

                // Handle both { data: [], total: N } and plain array responses
                if (Array.isArray(json)) {
                    setData(json);
                    setTotal(json.length);
                } else {
                    setData(json.data ?? []);
                    setTotal(json.total ?? json.data?.length ?? 0);
                }
            } catch (err) {
                setError(err.message);
                setData([]);
                setTotal(0);
            } finally {
                setLoading(false);
            }
        },
        [endpoint, serverSide],
    );

    /**
     * Convenience alias — used as the `onTableChange` prop on AdvancedTable
     * when running in server-side mode.
     *
     * AdvancedTable fires onTableChange with:
     * { page, rowsPerPage, searchTerm, activeTab, sortConfig }
     */
    const onTableChange = useCallback(
        (tableState) => {
            fetchData(tableState);
        },
        [fetchData],
    );

    /**
     * Re-fetch with no params (client-side refresh or initial server-side load).
     * Wire this to AdvancedTable's `onRefresh` prop.
     */
    const refetch = useCallback(() => {
        fetchData();
    }, [fetchData]);

    return {
        data,
        total,
        loading,
        error,
        fetchData,
        onTableChange,
        refetch,
    };
}
