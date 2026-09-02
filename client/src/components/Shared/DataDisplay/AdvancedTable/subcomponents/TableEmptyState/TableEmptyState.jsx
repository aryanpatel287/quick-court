import { FileText } from 'lucide-react';
import EmptyState from '@/components/Shared/DataDisplay/EmptyState/EmptyState';
import './TableEmptyState.scss';

function TableEmptyState({
    colSpan = 1,
    title = 'No records found',
    description = 'There are no items to display in table view. Try adjusting your filters.',
    icon = FileText,
}) {
    return (
        <EmptyState
            variant="table"
            colSpan={colSpan}
            title={title}
            description={description}
            icon={icon}
        />
    );
}

export default TableEmptyState;
