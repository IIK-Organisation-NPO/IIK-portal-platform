// src/pages/Home/Blog.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import logo from "../../assets/images/small Mki.png";
import Footer from "../../components/common/Footer";
import "../../styles/pages/Blog.css";
import api from '../../services/api';

const API_BASE = import.meta.env.VITE_API_URL;

// ---------------------------------------------------------------------------
// Extract the first <img src="..."> from HTML (fallback for legacy posts).
// ---------------------------------------------------------------------------
const extractFirstImageSrc = (html) => {
  if (!html) return null;
  const match = html.match(/<img\s[^>]*src=["']([^"']+)["']/i);
  return match ? match[1] : null;
};

// ---------------------------------------------------------------------------
// Remove the FIRST <img> tag from HTML — used when expanding a post.
// ---------------------------------------------------------------------------
const stripLeadingImage = (html) => {
  if (!html) return '';
  return html.replace(/<img\s[^>]*>/i, '').trim();
};

// ---------------------------------------------------------------------------
// Strip HTML tags and return a short plain-text excerpt.
// ---------------------------------------------------------------------------
const buildExcerpt = (html, maxLen = 180) => {
  if (!html) return '';
  const withoutImages = html.replace(/<img\s[^>]*>/gi, '');
  const text = withoutImages.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).trimEnd() + '…';
};

const BlogPage = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedPost, setExpandedPost] = useState(null);

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

        const res = await api.get('/blog', {
          params: { tab: 'All' },
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
  // FILTER CATEGORIES
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

  // ============================================
  // RESOLVE COVER IMAGE URL
  //   1. If the post has a stored DB blob → use the API endpoint
  //   2. Else if the HTML body contains a data URL → use it directly
  //   3. Else if the HTML body contains a legacy /uploads/... path → prefix API_BASE
  //   4. Else → no image (placeholder shown)
  // ============================================
  const resolveCoverImage = (post) => {
    // Prefer the DB blob endpoint when the post advertises one
    if (post.hasCoverImage) {
      return `${API_BASE}/api/blog/${post.id}/image`;
    }

    // Fallback: parse the first <img> from the body HTML
    const inline = extractFirstImageSrc(post.content);
    if (!inline) return null;

    // Data URLs work as-is
    if (inline.startsWith('data:')) return inline;

    // Legacy relative paths need the API host
    if (inline.startsWith('/')) return `${API_BASE}${inline}`;

    // Absolute URL
    return inline;
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
            <a href="https://www.iik.co.za/Home">Home</a>
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
                filteredPosts.map((post) => {
                  const imageSrc = resolveCoverImage(post);
                  const excerpt  = buildExcerpt(post.content);

                  return (
                    <article key={post.id} className="blog-card">
                      {/* Featured image — real image if present, placeholder otherwise */}
                      {imageSrc ? (
                        <div className="blog-image">
                          <img
                            src={imageSrc}
                            alt={post.title || 'Post image'}
                            loading="lazy"
                            onError={(e) => {
                              // If the image fails to load, hide it — the
                              // parent still keeps the layout stable.
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      ) : (
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
                      )}

                      <div className="blog-meta">
                        {post.date} · {post.author}
                      </div>

                      <h2>{post.title}</h2>

                      <p className="blog-excerpt">
                        {expandedPost === post.id ? '' : excerpt}
                        {!excerpt && expandedPost !== post.id && 'No preview available.'}
                      </p>

                      <button
                        className="blog-read-more"
                        onClick={() => toggleReadMore(post.id)}
                      >
                        {expandedPost === post.id ? 'Show Less' : 'Read More'}
                      </button>

                      {/* When expanded, show full content but strip the
                          leading image — it's already shown at the top
                          of the card. */}
                      {expandedPost === post.id && post.content && (
                        <div
                          className="blog-full-content"
                          dangerouslySetInnerHTML={{
                            __html: stripLeadingImage(post.content),
                          }}
                        />
                      )}
                    </article>
                  );
                })
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