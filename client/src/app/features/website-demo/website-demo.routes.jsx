import PublicLayout from './layouts/PublicLayout';
import LandingPage from './pages/LandingPage';

export const websiteDemoRoutes = [
    {
        path: 'demo/website',
        element: <PublicLayout />,
        children: [
            {
                index: true,
                element: <LandingPage />,
            },
        ],
    },
    {
        path: 'website-demo',
        element: <PublicLayout />,
        children: [
            {
                index: true,
                element: <LandingPage />,
            },
        ],
    },
];

export default {
    publicRoutes: websiteDemoRoutes,
};
