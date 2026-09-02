import { Navigate } from 'react-router';
import InsightsPage from './Insights/InsightsPage';

export default {
    userRoutes: [
        {
            path: 'analytics',
            children: [
                {
                    index: true,
                    element: <Navigate to="insight" replace />,
                },
                {
                    path: 'insight',
                    element: <InsightsPage />,
                },
                {
                    path: 'reports',
                    element: (
                        <div className="reports-section-placeholder">This is Reports Section</div>
                    ),
                },
            ],
        },
    ],
    adminRoutes: [
        {
            path: 'analytics',
            children: [
                {
                    index: true,
                    element: <Navigate to="insight" replace />,
                },
                {
                    path: 'insight',
                    element: <InsightsPage />,
                },
                {
                    path: 'reports',
                    element: (
                        <div className="reports-section-placeholder">This is Reports Section</div>
                    ),
                },
            ],
        },
    ],
};
