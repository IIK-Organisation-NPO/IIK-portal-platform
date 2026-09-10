import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowUp } from 'react-icons/fa';
import logo from "../../assets/images/small Mki.png";
import missionImage from "../../assets/images/download.jfif";
import Footer from "../../components/common/Footer";
import "../../styles/pages/Blog.css";

// Blog page component: handles category filters, text search, and expanded post content.
const BlogPage = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedPost, setExpandedPost] = useState(null);

  // Blog posts data with full content used by the article cards and search filter.
  const blogPosts = [
    {
      id: 1,
      date: 'May 12, 2026',
      author: 'Prof. AM. Ndlovu',
      title: 'Navigating POPIA in the Digital Workspace',
      excerpt: 'Understanding the regulatory landscape of data privacy in South Africa and how it impacts day-to-day operations and administrative reporting.',
      fullContent: 'The Protection of Personal Information Act (POPIA) has transformed how South African businesses handle data. In this comprehensive guide, we explore the key provisions of POPIA, compliance requirements for digital workspaces, and practical steps organizations can take to ensure they meet regulatory standards. From data subject rights to breach notification procedures, this article covers everything you need to know about navigating POPIA in today\'s digital landscape.',
      category: 'Announcements',
      image: '/blog1.jpg'
    },
    {
      id: 2,
      date: 'Apr 28, 2026',
      author: 'Sarah Jenkins',
      title: 'Top 5 Microsoft 365 Features You Aren\'t Using',
      excerpt: 'Unlocking hidden automation features inside Microsoft Excel and collaborative hacks in MS Teams to double your overall workplace output.',
      fullContent: 'Microsoft 365 is packed with powerful features that many users overlook. From Power Automate workflows that streamline repetitive tasks to advanced Excel functions like XLOOKUP and dynamic arrays, these hidden gems can significantly boost productivity. We also explore collaborative features in MS Teams, including breakout rooms, meeting recordings with automatic transcription, and integration with third-party apps that can transform how your team works together.',
      category: 'Digital Skills',
      image: '/blog2.jpg'
    },
    {
      id: 3,
      date: 'Apr 15, 2026',
      author: 'Dr. Thabo Molefe',
      title: 'Why Digital Literacy is the New Literacy',
      excerpt: 'A critical review of standard employment requirements in South Africa and the shifting digital divide in basic professional operations.',
      fullContent: 'In today\'s rapidly evolving workplace, digital literacy has become as fundamental as traditional reading and writing skills. This article examines the changing landscape of employment requirements in South Africa, highlighting how digital skills are no longer optional but essential for professional success. We explore the digital divide affecting different communities and propose strategies for bridging this gap through education and accessible training programs.',
      category: 'Career Tips',
      image: '/blog3.jpg'
    },
    {
      id: 4,
      date: 'Mar 30, 2026',
      author: 'Amina Yusuf',
      title: 'Demystifying SEO for Small Businesses',
      excerpt: 'Practical search engine optimization strategies that don\'t require massive budgets or heavy technical operations to drive traffic.',
      fullContent: 'Search Engine Optimization (SEO) doesn\'t have to be complicated or expensive. This guide breaks down SEO into simple, actionable steps that small businesses can implement without technical expertise or large budgets. From keyword research and content optimization to local SEO and mobile-friendliness, we cover the essential strategies that can help your business attract more organic traffic and grow your online presence effectively.',
      category: 'Digital Skills',
      image: '/blog4.jpg'
    }
  ];

  // Filter categories
  const categories = ['All', 'Digital Skills', 'Career Tips', 'Announcements'];

  // Filter posts based on active category and search term
  const filteredPosts = blogPosts.filter(post => {
    const matchesCategory = activeCategory === 'All' || post.category === activeCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          post.fullContent.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleReadMore = (postId) => {
    if (expandedPost === postId) {
      setExpandedPost(null);
    } else {
      setExpandedPost(postId);
    }
  };

  return (
    <div className="blog-page">
      {/* Header */}
      <header className="home-header">
        <div className="header-container">
          <div className="header-logo">
            <img src={logo} alt="IIK Portal Logo" />
            <span>Learner Certificate Portal</span>
          </div>
          <nav className="header-nav">
            <Link to="/homepage">Home</Link>
            <a href="https://www.iik.co.za/contact-us" target="_blank" rel="noopener noreferrer">Contact</a>
            <Link to="/about">About</Link>
            <Link to="/blog" className="active">Blog</Link>
            <div className="nav-actions">
              <Link to="/login" className="btn-login">Login</Link>
              <Link to="/signup" className="btn-signup">SignUp</Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Blog Hero Section with Title on Left */}
      <section className="blog-hero">
        <div className="hero-content">
          <h1 className="blog-title">IIK Blog — News &amp; Insights</h1>
        </div>
      </section>

      {/* Filter Bar - Categories on Left, Search on Right */}
      <section className="blog-filter">
        <div className="filter-content">
          <div className="filter-left">
            {categories.map((category) => (
              <button 
                key={category} 
                className={`filter-btn ${activeCategory === category ? 'active' : ''}`}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
          <div className="filter-right">
            <input 
              type="text" 
              placeholder="Search articles..." 
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* Blog Grid - 2 columns */}
      <section className="blog-grid-section">
        <div className="grid-content">
          <div className="blog-grid">
            {filteredPosts.length > 0 ? (
              filteredPosts.map((post) => (
                <article key={post.id} className="blog-card">
                  <div className="blog-image-placeholder">
                    <div className="placeholder-content">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="M21 15L16 10L5 21" />
                      </svg>
                      <span>Image Placeholder</span>
                    </div>
                  </div>
                  <div className="blog-meta">{post.date} · {post.author}</div>
                  <h2>{post.title}</h2>
                  <p className="blog-excerpt">
                    {expandedPost === post.id ? post.fullContent : post.excerpt}
                  </p>
                  <button 
                    className="blog-read-more"
                    onClick={() => toggleReadMore(post.id)}
                  >
                    {expandedPost === post.id ? 'Show Less' : 'Read More'}
                  </button>
                </article>
              ))
            ) : (
              <div className="no-results">
                <p>No blog posts found matching your criteria.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Pagination */}
      <section className="blog-pagination">
        <div className="pagination-content">
          <a href="#" className="prev">Previous</a>
          <a href="#" className="active">1</a>
          <a href="#">2</a>
          <a href="#">3</a>
          <a href="#" className="next">Next</a>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default BlogPage;