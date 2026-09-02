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
      duration: 'Duration: 8 weeks',
    },
    {
      title: 'Microsoft 365',
      desc: 'Learn Word, Excel, PowerPoint, Outlook and Teams for high-grade professional productivity.',
      duration: 'Duration: 12 weeks',
    },
    {
      title: 'Digital Marketing',
      desc: 'Social media marketing, SEO, content strategy, email campaigns, and campaign analytics.',
      duration: 'Duration: 10 weeks',
    },
  ];

  const userName = 'Sarah Khumalo';

  return (
    <div className="dashboard-layout">
      <Learner_Header 
        userName={userName}
        onMenuToggle={toggleMobileMenu}
        isMobileMenuOpen={isMobileMenuOpen}
      />
      
      <div className="dashboard-body">
        <Learner_SideBar 
          active="dashboard" 
          isMobileOpen={isMobileMenuOpen}
          onClose={closeMobileMenu}
        />
        
        <main className="learner-dashboard">
          <div className="dashboard-welcome">
            <h1>Welcome back, <span>{userName}</span></h1>
            <p>Here is your learning summary and available programmes for enrollment.</p>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Enrolled Programmes</div>
              <div className="stat-value">2</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Completed Programmes</div>
              <div className="stat-value">1</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Certificates Earned</div>
              <div className="stat-value">1</div>
            </div>
          </div>

          <section className="programmes-section">
            <h2>Our Programmes</h2>
            <div className="programmes-grid">
              {programmes.map((prog, index) => (
                <div className="programme-card" key={index}>
                  <h3>{prog.title}</h3>
                  <p className="programme-desc">{prog.desc}</p>
                  <div className="programme-duration">{prog.duration}</div>
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