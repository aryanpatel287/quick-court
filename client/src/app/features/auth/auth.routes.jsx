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
            element: <RegisterLayout role="USER" />,
        },
        {
            path: 'register/user',
            element: <RegisterLayout role="USER" />,
        },
        {
            path: 'register/facility-owner',
            element: <RegisterLayout role="FACILITY_OWNER" />,
        },
        {
            path: 'user/register',
            element: <RegisterLayout role="USER" />,
        },
        {
            path: 'facility-owner/register',
            element: <RegisterLayout role="FACILITY_OWNER" />,
        },
    ],
};
