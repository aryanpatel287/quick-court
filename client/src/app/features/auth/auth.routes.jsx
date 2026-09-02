import LoginLayout from './login/LoginLayout/LoginLayout';
import RegisterLayout from './register/RegisterLayout/RegisterLayout';

export default {
    publicRoutes: [
        {
            path: 'login',
            element: <LoginLayout />,
        },
        {
            path: 'reset-password',
            element: <LoginLayout />,
        },
        {
            path: 'recover-account',
            element: <LoginLayout />,
        },
        {
            path: 'register',
            element: <RegisterLayout />,
        },
    ],
};
