// src/pages/Admin_Screens/AdminBlogManagement.jsx
import { useEffect, useState } from 'react';
import Admin_Sidebar from '../../components/Admin/Admin_Sidebar';
import Admin_Header from '../../components/Admin/Admin_Header';
import '../../styles/Admin/Admin_BlogManagement.css';
import { useNavigate } from 'react-router-dom';
import { blogAPI } from '../../services/api';

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
  const [formData, setFormData] = useState({
    title: '',
    type: 'Blog Post',
    author: 'Admin User',
    date: '',
    status: 'Draft',
  });

  const [blogPosts, setBlogPosts] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  const toggleMobileMenu = () => setIsMobileMenuOpen((isOpen) => !isOpen);
  const closeMobileMenu  = () => setIsMobileMenuOpen(false);

  const tabs = ['All', 'Blog Posts', 'News', 'Events', 'Drafts'];

  
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await blogAPI.getPosts({ tab: activeTab, search: searchTerm });
        if (!cancelled) setBlogPosts(res.data);
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.error || err.message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [activeTab, searchTerm]);

  const filteredPosts = blogPosts;

  const getStatusClass = (status) => status.toLowerCase();

  const openEditModal = (post) => {
    setFormData(post);
    setModal({ type: 'edit', postId: post.id });
  };

  
  const savePost = async (event) => {
    event.preventDefault();
    if (!formData.title.trim()) return;
    try {
      await blogAPI.updatePost(modal.postId, {
        title:  formData.title,
        type:   formData.type,
        author: formData.author,
        status: formData.status,
        date:   formData.date,
      });
      const res = await blogAPI.getPosts({ tab: activeTab, search: searchTerm });
      setBlogPosts(res.data);
      setModal(null);
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  //  DELETE to API 
  const confirmDelete = async () => {
    try {
      await blogAPI.deletePost(modal.postId);
      setBlogPosts((posts) => posts.filter((p) => p.id !== modal.postId));
      setModal(null);
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
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
                <p className="hero-subtitle">
                  Create and manage blog posts, news updates, and organisation events.
                </p>
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
                    {loading ? (
                      <tr>
                        <td colSpan="6" className="no-results">Loading posts…</td>
                      </tr>
                    ) : error ? (
                      <tr>
                        <td colSpan="6" className="no-results">Error: {error}</td>
                      </tr>
                    ) : filteredPosts.length > 0 ? (
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
                                onClick={() => setModal({
                                  type: 'delete',
                                  postId: post.id,
                                  title: post.title,
                                })}
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
              <div
                className={`admin-blog-modal ${modal.type === 'delete' ? 'admin-blog-delete-modal' : ''}`}
                onClick={(event) => event.stopPropagation()}
              >
                {modal.type === 'delete' ? (
                  <>
                    <div className="admin-blog-delete-header">
                      <h2>Delete Post</h2>
                      <button
                        type="button"
                        className="admin-blog-delete-close"
                        onClick={closeModal}
                        aria-label="Close"
                      >
                        &times;
                      </button>
                    </div>
                    <div className="admin-blog-delete-body">
                      <p className="admin-blog-delete-question">
                        Are you sure you want to delete this post?
                      </p>
                      <p className="admin-blog-delete-warning">
                        {modal.title}<br />
                        This action will permanently delete the post.
                      </p>
                    </div>
                    <div className="admin-blog-delete-actions">
                      <button
                        type="button"
                        className="admin-blog-delete-cancel"
                        onClick={closeModal}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="admin-blog-delete-confirm"
                        onClick={confirmDelete}
                      >
                        Delete Post
                      </button>
                    </div>
                  </>
                ) : (
                  <form onSubmit={savePost}>
                    <div className="admin-blog-modal-header">
                      <h2>Edit Post</h2>
                      <button
                        type="button"
                        className="modal-close-button"
                        onClick={closeModal}
                        aria-label="Close"
                      >
                        &times;
                      </button>
                    </div>
                    <div className="admin-blog-modal-body post-form">
                      <label>
                        Title
                        <input
                          value={formData.title}
                          onChange={(event) =>
                            setFormData({ ...formData, title: event.target.value })
                          }
                          required
                        />
                      </label>
                      <label>
                        Type
                        <select
                          value={formData.type}
                          onChange={(event) =>
                            setFormData({ ...formData, type: event.target.value })
                          }
                        >
                          <option>Blog Post</option>
                          <option>News</option>
                          <option>Event</option>
                        </select>
                      </label>
                      <label>
                        Author
                        <input
                          value={formData.author}
                          onChange={(event) =>
                            setFormData({ ...formData, author: event.target.value })
                          }
                          required
                        />
                      </label>
                      <div className="post-form-row">
                        <label>
                          Date Published
                          <input
                            type="date"
                            value={formatDateForInput(formData.date)}
                            onChange={(event) =>
                              setFormData({
                                ...formData,
                                date: formatDateForDisplay(event.target.value),
                              })
                            }
                            onKeyDown={(event) => event.preventDefault()}
                            required
                          />
                        </label>
                        <label>
                          Status
                          <select
                            value={formData.status}
                            onChange={(event) =>
                              setFormData({ ...formData, status: event.target.value })
                            }
                          >
                            <option>Draft</option>
                            <option>Published</option>
                          </select>
                        </label>
                      </div>
                    </div>
                    <div className="admin-blog-modal-actions">
                      <button
                        type="button"
                        className="modal-cancel-button"
                        onClick={closeModal}
                      >
                        Cancel
                      </button>
                      <button type="submit" className="modal-save-button">
                        Save Post
                      </button>
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