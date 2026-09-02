function TableSkeletonRows({
    dynamicSkeletonCount = 5,
    selectable = false,
    showSerialNumber = false,
    effectiveColumns = [],
}) {
    return (
        <>
            {Array.from({ length: dynamicSkeletonCount }).map((_, rIdx) => (
                <tr key={`skel-${rIdx}`} className="advanced-table-row advanced-table-skeleton-row">
                    {selectable && <td className="advanced-table-body-cell checkbox-cell"></td>}
                    {showSerialNumber && (
                        <td
                            className="advanced-table-body-cell serial-number-cell"
                            style={{ width: '56px', minWidth: '56px', maxWidth: '56px' }}
                        >
                            <div
                                className="skeleton-cell-bar"
                                style={{ width: '60%', margin: '0 auto' }}
                            />
                        </td>
                    )}
                    <td className="advanced-table-body-cell badge-column-cell"></td>
                    {effectiveColumns.map((col, cIdx) => {
                        return (
                            <td key={`skel-col-${col.key}`} className="advanced-table-body-cell">
                                <div
                                    className="skeleton-cell-bar"
                                    style={{
                                        width: `${((cIdx * 19 + rIdx * 29 + 37) % 45) + 40}%`,
                                    }}
                                />
                            </td>
                        );
                    })}
                </tr>
            ))}
        </>
    );
}

export default TableSkeletonRows;
