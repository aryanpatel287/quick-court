import { Navigate } from 'react-router';
import GeneralSettings from './GeneralSettings';
import AccountSettings from './AccountSettings';

export default {
    userRoutes: [
        {
            path: 'settings',
            children: [
                {
                    index: true,
                    element: <Navigate to="general" replace />,
                },
                {
                    path: 'general',
                    element: <GeneralSettings />,
                },
                {
                    path: 'account',
                    element: <AccountSettings />,
                },
            ],
        },
    ],
    adminRoutes: [
        {
            path: 'settings',
            children: [
                {
                    index: true,
                    element: <Navigate to="general" replace />,
                },
                {
                    path: 'general',
                    element: <GeneralSettings />,
                },
                {
                    path: 'account',
                    element: <AccountSettings />,
                },
            ],
        },
    ],
};
