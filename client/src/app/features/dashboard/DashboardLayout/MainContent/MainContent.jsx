import { Outlet } from 'react-router';
import './MainContent.scss';

function MainContent() {
    return (
        <div className="main-content-container">
            <Outlet />
        </div>
    );
}

export default MainContent;
