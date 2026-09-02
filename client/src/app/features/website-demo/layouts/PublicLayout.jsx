import { Outlet } from 'react-router';
import Header from './Header';
import Footer from './Footer';
import '../styles/public-layout.scss';

export default function PublicLayout() {
    return (
        <div className="public-layout">
            <Header />
            <main className="main-content" id="main-content" tabIndex="-1">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
}
