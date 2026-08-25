import React, { useState } from 'react';
import Learner_Header from '../../components/Learner/Learner_Header';
import Learner_SideBar from '../../components/Learner/Learner_SideBar';
import '../../styles/Learner/Learner_DashBoard.css';

const Learner_DashBoard = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const programmes = [
    {
      title: 'Digital Literacy',
      desc: 'Master essential computer skills, internet navigation, email management, and online safety.',
      duration: '8 weeks',
      icon: 'fa-laptop',
    },
    {
      title: 'Microsoft 365',
      desc: 'Learn Word, Excel, PowerPoint, Outlook and Teams for high-grade professional productivity.',
      duration: '12 weeks',
      icon: 'fa-microsoft',
    },
    {
      title: 'Digital Marketing',
      desc: 'Social media marketing, SEO, content strategy, email campaigns, and campaign analytics.',
      duration: '10 weeks',
      icon: 'fa-chart-line',
    },
  ];

  const userName = 'Sarah Khumalo';

  return (
    <div className="dashboard-layout">
      {/* Header - Always on top */}
      <Learner_Header 
        userName={userName}
        onMenuToggle={toggleMobileMenu}
        isMobileMenuOpen={isMobileMenuOpen}
      />
      
      <div className="dashboard-body">
        {/* Sidebar - Below header */}
        <Learner_SideBar 
          active="dashboard" 
          isMobileOpen={isMobileMenuOpen}
          onClose={closeMobileMenu}
        />
        
        {/* Main Content */}
        <main className="learner-dashboard">
          <div className="dashboard-welcome">
            <h1>Welcome back, <span>{userName}</span></h1>
            <p>Here is your learning summary and available programmes for enrollment.</p>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-icon"><i className="fas fa-book-open"></i></span>
              <div className="stat-label">Enrolled Programmes</div>
              <div className="stat-value">2</div>
            </div>
            <div className="stat-card">
              <span className="stat-icon"><i className="fas fa-check-circle"></i></span>
              <div className="stat-label">Completed Programmes</div>
              <div className="stat-value">1</div>
            </div>
            <div className="stat-card">
              <span className="stat-icon"><i className="fas fa-certificate"></i></span>
              <div className="stat-label">Certificates Earned</div>
              <div className="stat-value">1</div>
            </div>
          </div>

          <section className="programmes-section">
            <h2>Our Programmes</h2>
            <div className="programmes-grid">
              {programmes.map((prog, index) => (
                <div className="programme-card" key={index}>
                  <div className="programme-icon">
                    <i className={`fas ${prog.icon}`}></i>
                  </div>
                  <h3>{prog.title}</h3>
                  <p className="programme-desc">{prog.desc}</p>
                  <div className="programme-duration">
                    <i className="far fa-clock"></i> Duration: {prog.duration}
                  </div>
                  <button className="btn-interest">I'm Interested</button>
                </div>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default Learner_DashBoard;