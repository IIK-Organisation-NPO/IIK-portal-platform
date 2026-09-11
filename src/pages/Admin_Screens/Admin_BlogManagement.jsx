import React, { useEffect, useState } from 'react';
import Admin_Sidebar from '../../components/Admin/Admin_Sidebar';
import Admin_Header from '../../components/Admin/Admin_Header';
import '../../styles/Admin/Admin_BlogManagement.css';
import { useNavigate } from 'react-router-dom';

const formatDateForInput = (dateValue) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const formatDateForDisplay = (dateValue) => {
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateValue;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const AdminBlogManagement = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [modal, setModal] = useState(null);
  const [formData, setFormData] = useState({ title: '', type: 'Blog Post', author: 'Admin User', date: '', status: 'Draft' });

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen((isOpen) => !isOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const [blogPosts, setBlogPosts] = useState(() => {
    const savedPosts = localStorage.getItem('iik-admin-blog-posts');
    if (savedPosts) {
      try {
        return JSON.parse(savedPosts).map((post) => ({
          ...post,
          title: post.id === 3
            ? 'Why Basic Digital Literacy Dictates Current Careers'
            : post.id === 4
              ? 'AI-Driven Professional Certification Accreditations'
              : post.title
        }));
      } catch {
        localStorage.removeItem('iik-admin-blog-posts');
      }
    }

    return [
    {
      id: 1,
      title: 'Navigating POPIA in South African Corporate...',
      type: 'Blog Post',
      author: 'Prof. AM. Ndlovu',
      date: 'May 12, 2026',
      status: 'Published'
    },
    {
      id: 2,
      title: 'Unlocking Collaborative Power inside Micro...',
      type: 'Blog Post',
      author: 'Sarah Jenkins',
      date: 'Apr 28, 2026',
      status: 'Published'
    },
    {
      id: 3,
      title: 'Why Basic Digital Literacy Dictates Current Careers',
      type: 'Blog Post',
      author: 'Dr. Thabo Molefe',
      date: 'Apr 15, 2026',
      status: 'Draft'
    },
    {
      id: 4,
      title: 'AI-Driven Professional Certification Accreditations',
      type: 'News',
      author: 'Admin User',
      date: 'Mar 30, 2026',
      status: 'Published'
    },
    {
      id: 5,
      title: 'Annual Corporate Digitisation Summit 2026',
      type: 'Event',
      author: 'Admin User',
      date: 'Feb 10, 2026',
      status: 'Draft'
    }
    ];
  });

  useEffect(() => {
    localStorage.setItem('iik-admin-blog-posts', JSON.stringify(blogPosts));
  }, [blogPosts]);

  const tabs = ['All', 'Blog Posts', 'News', 'Events', 'Drafts'];

  const filteredPosts = blogPosts.filter(post => {
    const matchesTab = activeTab === 'All'
      ? true
      : activeTab === 'Blog Posts'
      ? post.type === 'Blog Post'
      : activeTab === 'Drafts'
        ? post.status === 'Draft'
        : post.type === activeTab;
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.author.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const getStatusClass = (status) => {
    return status.toLowerCase();
  };

  const openEditModal = (post) => {
    setFormData(post);
    setModal({ type: 'edit', postId: post.id });
  };

  const savePost = (event) => {
    event.preventDefault();
    if (!formData.title.trim()) return;
    setBlogPosts((posts) => posts.map((post) => (
      post.id === modal.postId ? { ...formData, id: post.id } : post
    )));
    setModal(null);
  };

  const confirmDelete = () => {
    setBlogPosts((posts) => posts.filter((post) => post.id !== modal.postId));
    setModal(null);
  };

  const closeModal = () => setModal(null);

  return (
    <div className="admin-blog-layout">
      <Admin_Header
        userName="Admin User"
        onMenuToggle={toggleMobileMenu}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      <div className="admin-blog-body">
          <Admin_Sidebar
          active="blog"
          isMobileOpen={isMobileMenuOpen}
          onClose={closeMobileMenu}
        />

        <main className="admin-blog-page">
          {/* Header Section */}
          <section className="admin-blog-hero">
            <div className="hero-content">
              <div>
                <h1>Blog &amp; Content Management</h1>
                <p className="hero-subtitle">Create and manage blog posts, news updates, and organisation events.</p>
              </div>
              <button 
                type="button" 
                className="create-post-button"
                onClick={() => navigate('/admin/blog-create')}
              >
                Create New Post
              </button>
            </div>
          </section>

          {/* Filter and Search Section */}
          <section className="admin-blog-filter">
            <div className="filter-content">
              <div className="filter-left">
                <div className="tab-filters">
                  {tabs.map((tab) => (
                    <button
                      key={tab}
                      className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                      onClick={() => setActiveTab(tab)}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
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

          {/* Table Section */}
          <section className="admin-blog-table-section">
            <div className="table-content">
              <div className="table-wrapper">
                <table className="blog-table">
                  <thead>
                    <tr>
                      <th>TITLE</th>
                      <th>TYPE</th>
                      <th>AUTHOR</th>
                      <th>DATE PUBLISHED</th>
                      <th>STATUS</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPosts.length > 0 ? (
                      filteredPosts.map((post) => (
                        <tr key={post.id}>
                          <td className="title-cell">{post.title}</td>
                          <td>
                            <span className={`type-badge ${post.type.toLowerCase().replace(' ', '-')}`}>
                              {post.type}
                            </span>
                          </td>
                          <td>{post.author}</td>
                          <td>{post.date}</td>
                          <td>
                            <span className={`status-badge ${getStatusClass(post.status)}`}>
                              {post.status}
                            </span>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button 
                                className="btn-edit"
                                onClick={() => openEditModal(post)}
                              >
                                Edit
                              </button>
                              <button 
                                className="btn-delete"
                                onClick={() => setModal({ type: 'delete', postId: post.id, title: post.title })}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="no-results">
                          No posts found matching your criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Footer */}
              <div className="table-footer">
                <div className="showing-info">
                  Showing 1–{filteredPosts.length} of {filteredPosts.length} posts
                </div>
                <div className="pagination">
                  <button 
                    className="page-btn prev"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                  <button 
                    className={`page-btn ${currentPage === 1 ? 'active' : ''}`}
                    onClick={() => setCurrentPage(1)}
                  >
                    1
                  </button>
                  <button 
                    className={`page-btn ${currentPage === 2 ? 'active' : ''}`}
                    onClick={() => setCurrentPage(2)}
                  >
                    2
                  </button>
                  <button 
                    className="page-btn next"
                    onClick={() => setCurrentPage(Math.min(2, currentPage + 1))}
                    disabled={currentPage === 2}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </section>

          {modal && (
            <div className="admin-blog-modal-overlay" onClick={closeModal}>
              <div className="admin-blog-modal" onClick={(event) => event.stopPropagation()}>
                {modal.type === 'delete' ? (
                  <>
                    <div className="admin-blog-modal-header">
                      <h2>Delete Post</h2>
                      <button type="button" className="modal-close-button" onClick={closeModal} aria-label="Close">&times;</button>
                    </div>
                    <div className="admin-blog-modal-body">
                      <p>Are you sure you want to delete this post?</p>
                      <p className="delete-post-title">{modal.title}</p>
                    </div>
                    <div className="admin-blog-modal-actions">
                      <button type="button" className="modal-cancel-button" onClick={closeModal}>Cancel</button>
                      <button type="button" className="modal-confirm-delete-button" onClick={confirmDelete}>Delete Post</button>
                    </div>
                  </>
                ) : (
                  <form onSubmit={savePost}>
                    <div className="admin-blog-modal-header">
                      <h2>Edit Post</h2>
                      <button type="button" className="modal-close-button" onClick={closeModal} aria-label="Close">&times;</button>
                    </div>
                    <div className="admin-blog-modal-body post-form">
                      <label>Title<input value={formData.title} onChange={(event) => setFormData({ ...formData, title: event.target.value })} required /></label>
                      <label>Type<select value={formData.type} onChange={(event) => setFormData({ ...formData, type: event.target.value })}><option>Blog Post</option><option>News</option><option>Event</option></select></label>
                      <label>Author<input value={formData.author} onChange={(event) => setFormData({ ...formData, author: event.target.value })} required /></label>
                      <div className="post-form-row">
                        <label>Date Published<input type="date" value={formatDateForInput(formData.date)} onChange={(event) => setFormData({ ...formData, date: formatDateForDisplay(event.target.value) })} onKeyDown={(event) => event.preventDefault()} required /></label>
                        <label>Status<select value={formData.status} onChange={(event) => setFormData({ ...formData, status: event.target.value })}><option>Draft</option><option>Published</option></select></label>
                      </div>
                    </div>
                    <div className="admin-blog-modal-actions">
                      <button type="button" className="modal-cancel-button" onClick={closeModal}>Cancel</button>
                      <button type="submit" className="modal-save-button">Save Post</button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminBlogManagement;