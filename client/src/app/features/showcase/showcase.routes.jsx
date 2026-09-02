import ComponentsShowcase from './ComponentsShowcase/ComponentsShowcase';

export default {
    publicRoutes: [
        {
            path: 'components',
            element: <ComponentsShowcase />,
        },
        {
            path: 'showcase',
            element: <ComponentsShowcase />,
        },
    ],
};
