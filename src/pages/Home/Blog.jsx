import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowUp } from 'react-icons/fa';
import logo from "../../assets/images/small Mki.png";
import Footer from "../../components/common/Footer";
import "../../styles/pages/Blog.css";
import api from '../../services/api';

// Blog page component: handles category filters, text search, and expanded post content.
const BlogPage = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedPost, setExpandedPost] = useState(null);

  // Data from backend
  const [blogPosts, setBlogPosts] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  // ============================================
  // FETCH PUBLISHED POSTS FROM BACKEND
  // ============================================
  useEffect(() => {
    let cancelled = false;

    const loadPosts = async () => {
      try {
        setLoading(true);
        setError(null);

        // Only fetch Published posts (the public site shouldn't show drafts).
        const res = await api.get('/blog', {
          params: { tab: 'All' },   // backend returns all; we filter below
        });

        const all = res.data || [];

        // Public site: hide drafts.
        const published = all.filter(
          (p) => p.status?.toLowerCase() === 'published'
        );

        if (!cancelled) setBlogPosts(published);
      } catch (err) {
        console.error('Failed to load blog posts:', err);
        if (!cancelled) setError('Unable to load blog posts right now.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadPosts();
    return () => { cancelled = true; };
  }, []);

  // ============================================
  // FILTER CATEGORIES — derived from the data
  // ============================================
  const categorySet = new Set(['All']);
  blogPosts.forEach((p) => { if (p.type) categorySet.add(p.type); });
  const categories = Array.from(categorySet);

  // ============================================
  // FILTER POSTS BY CATEGORY + SEARCH
  // ============================================
  const filteredPosts = blogPosts.filter((post) => {
    const matchesCategory =
      activeCategory === 'All' || post.type === activeCategory;

    const term = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !term ||
      (post.title  || '').toLowerCase().includes(term) ||
      (post.author || '').toLowerCase().includes(term);

    return matchesCategory && matchesSearch;
  });

  const toggleReadMore = (postId) => {
    setExpandedPost((cur) => (cur === postId ? null : postId));
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
            <Link to="/">Home</Link>
            <a href="https://www.iik.co.za/contact-us" target="_blank" rel="noopener noreferrer">Contact</a>
            <Link to="/about">About</Link>
            <Link to="/BlogPage" className="active">Blog</Link>
            <div className="nav-actions">
              <Link to="/login" className="btn-login">Login</Link>
              <Link to="/signup" className="btn-signup">SignUp</Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="blog-hero">
        <div className="hero-content">
          <h1 className="blog-title">IIK Blog — News &amp; Insights</h1>
        </div>
      </section>

      {/* Filters */}
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

      {/* Grid */}
      <section className="blog-grid-section">
        <div className="grid-content">
          {loading ? (
            <div className="no-results"><p>Loading posts…</p></div>
          ) : error ? (
            <div className="no-results"><p>{error}</p></div>
          ) : (
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

                    <div className="blog-meta">
                      {post.date} · {post.author}
                    </div>

                    <h2>{post.title}</h2>

                    <p className="blog-excerpt">
                      {post.excerpt || (expandedPost === post.id ? post.content : '')}
                      {!post.excerpt && !post.content && 'No preview available.'}
                    </p>

                    <button
                      className="blog-read-more"
                      onClick={() => toggleReadMore(post.id)}
                    >
                      {expandedPost === post.id ? 'Show Less' : 'Read More'}
                    </button>

                    {/* When expanded, show full content (HTML safe) */}
                    {expandedPost === post.id && post.content && (
                      <div
                        className="blog-full-content"
                        dangerouslySetInnerHTML={{ __html: post.content }}
                      />
                    )}
                  </article>
                ))
              ) : (
                <div className="no-results">
                  <p>No blog posts found matching your criteria.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Pagination */}
      <section className="blog-pagination">
        <div className="pagination-content">
          <a href="#" className="prev">Previous</a>
          <a href="#" className="active">1</a>
          <a href="#" className="next">Next</a>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default BlogPage;