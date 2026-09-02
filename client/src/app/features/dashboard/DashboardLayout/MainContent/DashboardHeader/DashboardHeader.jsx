import './DashboardHeader.scss';

function DashboardHeader({ userName, activeTab = 'Home', activeSubTab = '' }) {
    const isHome = activeTab === 'Home';
    const isInsight = activeTab === 'Analytics' && (activeSubTab === 'Insight' || !activeSubTab);

    const greetingName = userName || 'User';

    const title = isHome
        ? `Hello, ${greetingName}`
        : isInsight
          ? 'Financial Insights & Invoices'
          : activeSubTab
            ? `${activeTab} - ${activeSubTab}`
            : activeTab;

    const subtitle = isHome
        ? 'Track team progress here. You almost reach a goal!'
        : isInsight
          ? 'Comprehensive overview of client billing, outstanding receivables, and payment tracking.'
          : `Overview and manage your workspace ${activeTab.toLowerCase()} content.`;

    return (
        <header className="dashboard-header-container">
            <div className="header-greeting-wrapper">
                <h1 className="header-title">{title}</h1>
                <p className="header-subtitle">{subtitle}</p>
            </div>
            <div className="header-actions-wrapper">{/* <DatePicker /> */}</div>
        </header>
    );
}

export default DashboardHeader;
