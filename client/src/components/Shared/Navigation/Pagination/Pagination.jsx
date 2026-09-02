import Button from '@/components/Shared/Buttons/Button/Button';
import './Pagination.scss';

function Pagination({ currentPage, totalPages, onPageChange, className = '' }) {
    const handlePageClick = (page) => {
        if (page !== currentPage && page >= 1 && page <= totalPages) {
            onPageChange(page);
        }
    };

    // Generates page number sequence like [1, 2, 3, '...', 6]
    const getPageNumbers = () => {
        const pages = [];
        const range = 1; // Numbers to show around current page

        // Always show first page
        pages.push(1);

        if (currentPage > range + 2) {
            pages.push('...');
        }

        const start = Math.max(2, currentPage - range);
        const end = Math.min(totalPages - 1, currentPage + range);

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        if (currentPage < totalPages - range - 1) {
            pages.push('...');
        }

        // Always show last page if more than 1 page
        if (totalPages > 1) {
            pages.push(totalPages);
        }

        return pages;
    };

    const pageNumbers = getPageNumbers();

    return (
        <div className={`shared-pagination-container ${className}`}>
            <Button
                preset="prev"
                onClick={() => handlePageClick(currentPage - 1)}
                disabled={currentPage === 1}
            />

            <div className="pagination-pages-list">
                {pageNumbers.map((page, idx) => {
                    if (page === '...') {
                        return (
                            <span key={`ellipsis-${idx}`} className="pagination-ellipsis">
                                ...
                            </span>
                        );
                    }
                    return (
                        <button
                            key={`page-${page}`}
                            type="button"
                            className={`pagination-number-btn ${currentPage === page ? 'active' : ''}`}
                            onClick={() => handlePageClick(page)}
                            aria-label={`Go to page ${page}`}
                            aria-current={currentPage === page ? 'page' : undefined}
                        >
                            {page}
                        </button>
                    );
                })}
            </div>

            <Button
                preset="next"
                onClick={() => handlePageClick(currentPage + 1)}
                disabled={currentPage === totalPages}
            />
        </div>
    );
}

export default Pagination;
