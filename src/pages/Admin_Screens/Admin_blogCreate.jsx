 //src/pages/Admin_Screens/Admin_BlogCreate.jsx
// ============================================================
// Admin_BlogCreate — Create New Post page
// Handles Blog Posts, Events, Announcements and News.
// Article Body uses a contentEditable rich-text editor.
// Featured image is uploaded to the backend, and its URL is
// embedded as an <img> inside the post's HTML body so it appears
// on the public blog without adding any MySQL column.
// ============================================================

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Admin_Header from '../../components/Admin/Admin_Header';
import Admin_Sidebar from '../../components/Admin/Admin_Sidebar';
import '../../styles/Admin/Admin_BlogCreate.css';
import { blogAPI } from '../../services/api';

const Admin_BlogCreate = () => {
    // -----------------------------------------------------------
    // 1. HOOKS & STATE
    // -----------------------------------------------------------
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const editorRef = useRef(null);

    const [formData, setFormData] = useState({
        postType: 'Blog Post',
        officialTitle: '',
        authorReference: 'Admin User',
        tags: '',
        articleBody: '',
        featuredImage: null,
        eventDate: '',
        venue: '',
    });

    const [errors, setErrors] = useState({});

    // Toast notification state (replaces alert)
    const [toast, setToast] = useState(null); // { type: 'success' | 'error', text: string }

    const adminName = 'Admin User';

    // -----------------------------------------------------------
    // 2. SIDEBAR / HEADER HELPERS
    // -----------------------------------------------------------
    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
    const closeMobileMenu = () => setIsMobileMenuOpen(false);

    // -----------------------------------------------------------
    // TOAST HELPER — auto-hides after 3.5 seconds
    // -----------------------------------------------------------
    const showToast = (type, text) => {
        setToast({ type, text });
        window.setTimeout(() => setToast(null), 3500);
    };

    // -----------------------------------------------------------
    // 3. GENERIC INPUT HANDLER
    // -----------------------------------------------------------
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));

        setErrors((prev) => {
            if (!prev[name]) return prev;
            const next = { ...prev };
            delete next[name];
            return next;
        });
    };

    // -----------------------------------------------------------
    // 4. RICH TEXT EDITOR HANDLERS
    // -----------------------------------------------------------
    const handleEditorInput = () => {
        if (!editorRef.current) return;
        const html = editorRef.current.innerHTML;
        setFormData((prev) => ({ ...prev, articleBody: html }));

        setErrors((prev) => {
            if (!prev.articleBody) return prev;
            const next = { ...prev };
            delete next.articleBody;
            return next;
        });
    };

    const applyFormat = (command, value = null) => {
        editorRef.current?.focus();
        document.execCommand(command, false, value);
        handleEditorInput();
    };

    const handleInsertLink = () => {
        const url = window.prompt('Enter the URL (include https://):');
        if (!url) return;

        const safeUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;
        applyFormat('createLink', safeUrl);
    };

    // -----------------------------------------------------------
    // 5. FEATURED IMAGE UPLOAD
    // -----------------------------------------------------------
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setFormData((prev) => ({ ...prev, featuredImage: file }));

        setErrors((prev) => {
            if (!prev.featuredImage) return prev;
            const next = { ...prev };
            delete next.featuredImage;
            return next;
        });
    };

    // -----------------------------------------------------------
    // 6. VALIDATION
    // -----------------------------------------------------------
    const isEvent = formData.postType === 'Event';

    const stripHtml = (html) => {
        const temp = document.createElement('div');
        temp.innerHTML = html || '';
        return (temp.textContent || temp.innerText || '').trim();
    };

    const validate = ({ requireBody = true } = {}) => {
        const nextErrors = {};

        if (!formData.officialTitle.trim()) {
            nextErrors.officialTitle = 'Official Title is required.';
        }

        // Featured image is required (both draft and publish)
        if (!formData.featuredImage) {
            nextErrors.featuredImage = 'Featured image is required.';
        }

        if (requireBody && !stripHtml(formData.articleBody)) {
            nextErrors.articleBody = 'Article Body / Event Description is required.';
        }

        if (isEvent) {
            if (!formData.eventDate) {
                nextErrors.eventDate = 'Event Date is required for events.';
            }
            if (!formData.venue.trim()) {
                nextErrors.venue = 'Location / Venue is required for events.';
            }
        }

        return nextErrors;
    };

    // -----------------------------------------------------------
    // 7. ACTION HANDLERS
    // -----------------------------------------------------------

    // Uploads the picked image and returns its public URL.
    const uploadFeaturedImage = async () => {
        if (!formData.featuredImage) return null;
        const res = await blogAPI.uploadImage(formData.featuredImage);
        return res.data?.url || null;
    };

    // Builds the payload. The image URL is embedded at the TOP of
    // the article body as an <img> tag, so it's stored inside the
    // existing Content column — no schema change needed.
    const buildPayload = (status, imageUrl) => {
        const safeAlt = (formData.officialTitle || 'Post image').replace(/"/g, '&quot;');
        const imageTag = imageUrl
            ? `<img src="http://localhost:5000${imageUrl}" alt="${safeAlt}" style="max-width:100%;height:auto;border-radius:8px;margin-bottom:16px;display:block;" />`
            : '';

        return {
            postType:      formData.postType,
            officialTitle: formData.officialTitle,
            tags:          formData.tags,
            articleBody:   `${imageTag}${formData.articleBody || ''}`,
            eventDate:     formData.eventDate || null,
            venue:         formData.venue     || null,
            status,
        };
    };

    const handleSaveDraft = async () => {
        const nextErrors = validate({ requireBody: false });

        if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors);
            showToast('error', 'Please fix the highlighted fields before saving a draft.');
            return;
        }

        try {
            const imageUrl = await uploadFeaturedImage();
            await blogAPI.createPost(buildPayload('draft', imageUrl));
            showToast('success', `Draft "${formData.officialTitle}" saved successfully.`);

            window.setTimeout(() => {
                navigate('/admin/blog-management');
            }, 900);
        } catch (err) {
            showToast('error', err.response?.data?.error || err.message || 'Failed to save draft.');
        }
    };

    const handlePublish = async () => {
        const nextErrors = validate({ requireBody: true });

        if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors);
            showToast('error', 'Please complete all required fields before publishing.');
            return;
        }

        setErrors({});
        try {
            const imageUrl = await uploadFeaturedImage();
            await blogAPI.createPost(buildPayload('published', imageUrl));
            showToast('success', `${formData.postType} published successfully.`);

            window.setTimeout(() => {
                navigate('/admin/blog-management');
            }, 900);
        } catch (err) {
            showToast('error', err.response?.data?.error || err.message || 'Failed to publish post.');
        }
    };

    const handleCancel = () => {
        setFormData({
            postType: 'Blog Post',
            officialTitle: '',
            authorReference: 'Admin User',
            tags: '',
            articleBody: '',
            featuredImage: null,
            eventDate: '',
            venue: '',
        });
        setErrors({});

        if (editorRef.current) {
            editorRef.current.innerHTML = '';
        }

        showToast('success', 'Form has been reset.');
    };

    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== formData.articleBody) {
            editorRef.current.innerHTML = formData.articleBody || '';
        }
    }, [formData.articleBody]);

    const postTypeOptions = ['Blog Post', 'Event', 'Announcement', 'News'];

    // -----------------------------------------------------------
    // 8. RENDER
    // -----------------------------------------------------------
    return (
        <div className="admin-blogcreate-layout">
            <Admin_Header
                adminName={adminName}
                onMenuToggle={toggleMobileMenu}
                isMobileMenuOpen={isMobileMenuOpen}
                notificationCount={3}
            />

            {/* In-page toast (replaces alert) */}
            {toast && (
                <div
                    className={`blogcreate-toast blogcreate-toast--${toast.type}`}
                    role="status"
                    aria-live="polite"
                >
                    {toast.text}
                </div>
            )}

            <div className="admin-blogcreate-body">
                <Admin_Sidebar
                    active="blog-news"
                    isMobileOpen={isMobileMenuOpen}
                    onClose={closeMobileMenu}
                />

                <main className="admin-blogcreate-content">
                    <div className="blogcreate-page-header">
                        <h1>Create New Post</h1>
                        <p>
                            Draft or schedule digital skills insights, operational
                            updates, or calendar event schedules.
                        </p>
                    </div>

                    <div className="blogcreate-grid">
                        {/* LEFT COLUMN */}
                        <div className="blogcreate-left">
                            {/* Post Type */}
                            <div className="form-group">
                                <label>Post Type</label>
                                <div className="select-wrapper">
                                    <select
                                        name="postType"
                                        value={formData.postType}
                                        onChange={handleInputChange}
                                    >
                                        {postTypeOptions.map((type) => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                    <span className="select-arrow">▼</span>
                                </div>
                            </div>

                            {/* Official Title */}
                            <div className="form-group">
                                <label>Official Title</label>
                                <input
                                    type="text"
                                    name="officialTitle"
                                    placeholder="e.g. Navigating POPIA in the Digital Workspace..."
                                    value={formData.officialTitle}
                                    onChange={handleInputChange}
                                    className={errors.officialTitle ? 'input-error' : ''}
                                />
                                {errors.officialTitle && (
                                    <span className="field-error">{errors.officialTitle}</span>
                                )}
                            </div>

                            {/* Author + Tags */}
                            <div className="form-row">
                                <div className="form-group half">
                                    <label>Author Reference</label>
                                    <input
                                        type="text"
                                        name="authorReference"
                                        value={formData.authorReference}
                                        onChange={handleInputChange}
                                        readOnly
                                        className="author-field"
                                    />
                                </div>
                                <div className="form-group half">
                                    <label>Tags (Comma Separated)</label>
                                    <input
                                        type="text"
                                        name="tags"
                                        placeholder="e.g. skills, career, guidelines"
                                        value={formData.tags}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>

                            {/* RICH TEXT EDITOR */}
                            <div className="form-group">
                                <label>Article Body / Event Description</label>

                                <div className="rich-text-toolbar">
                                    <button
                                        type="button"
                                        className="toolbar-btn"
                                        title="Bold"
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => applyFormat('bold')}
                                    >
                                        <b>B</b>
                                    </button>

                                    <button
                                        type="button"
                                        className="toolbar-btn"
                                        title="Italic"
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => applyFormat('italic')}
                                    >
                                        <i>I</i>
                                    </button>

                                    <button
                                        type="button"
                                        className="toolbar-btn"
                                        title="Underline"
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => applyFormat('underline')}
                                    >
                                        <u>U</u>
                                    </button>

                                    <span className="toolbar-divider">|</span>

                                    <button
                                        type="button"
                                        className="toolbar-btn"
                                        title="Bullet List"
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => applyFormat('insertUnorderedList')}
                                    >
                                        •
                                    </button>

                                    <button
                                        type="button"
                                        className="toolbar-btn"
                                        title="Numbered List"
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => applyFormat('insertOrderedList')}
                                    >
                                        1.
                                    </button>

                                    <span className="toolbar-divider">|</span>

                                    <button
                                        type="button"
                                        className="toolbar-btn"
                                        title="Insert Link"
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={handleInsertLink}
                                    >
                                        🔗
                                    </button>

                                    <button
                                        type="button"
                                        className="toolbar-btn menu-btn"
                                        title="Clear Formatting"
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => applyFormat('removeFormat')}
                                    >
                                        ≡
                                    </button>
                                </div>

                                <div
                                    ref={editorRef}
                                    className={`rich-text-editor ${errors.articleBody ? 'input-error' : ''}`}
                                    contentEditable
                                    suppressContentEditableWarning
                                    onInput={handleEditorInput}
                                    onBlur={handleEditorInput}
                                    data-placeholder="Write your post content here. Support rich text formatting..."
                                />
                                {errors.articleBody && (
                                    <span className="field-error">{errors.articleBody}</span>
                                )}
                            </div>
                        </div>

                        {/* RIGHT COLUMN */}
                        <div className="blogcreate-right">
                            {/* Featured Image — required */}
                            <div className="blogcreate-card">
                                <h3 className="card-title">Featured Display Image</h3>
                                <div className={`upload-area ${errors.featuredImage ? 'upload-area--error' : ''}`}>
                                    <input
                                        type="file"
                                        id="imageUpload"
                                        accept="image/*"
                                        onChange={handleFileUpload}
                                        style={{ display: 'none' }}
                                    />
                                    <label htmlFor="imageUpload" className="upload-label">
                                        <div className="upload-content">
                                            <div className="upload-icon">
                                                <svg
                                                    width="32"
                                                    height="32"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="1.5"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                >
                                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                                                    <circle cx="8.5" cy="8.5" r="1.5" />
                                                    <polyline points="21 15 16 10 5 21" />
                                                </svg>
                                            </div>
                                            <p>Drag and drop or browse device</p>
                                            {formData.featuredImage && (
                                                <span className="uploaded-file">
                                                    {formData.featuredImage.name}
                                                </span>
                                            )}
                                        </div>
                                    </label>
                                </div>
                                {errors.featuredImage && (
                                    <span className="field-error">{errors.featuredImage}</span>
                                )}
                            </div>

                            {/* EVENT LOGISTICS — conditional */}
                            {isEvent && (
                                <div className="blogcreate-card event-card">
                                    <h3 className="card-title">
                                        Event Logistics{' '}
                                        <span className="conditional-badge">(Conditional)</span>
                                    </h3>

                                    <div className="event-fields">
                                        <div className="form-group">
                                            <label>Event Date</label>
                                            <input
                                                type="date"
                                                name="eventDate"
                                                value={formData.eventDate}
                                                onChange={handleInputChange}
                                                className={`date-input ${errors.eventDate ? 'input-error' : ''}`}
                                            />
                                            {errors.eventDate && (
                                                <span className="field-error">{errors.eventDate}</span>
                                            )}
                                        </div>

                                        <div className="form-group">
                                            <label>Location / Venue</label>
                                            <input
                                                type="text"
                                                name="venue"
                                                placeholder="e.g. Johannesburg Campus"
                                                value={formData.venue}
                                                onChange={handleInputChange}
                                                className={errors.venue ? 'input-error' : ''}
                                            />
                                            {errors.venue && (
                                                <span className="field-error">{errors.venue}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Bottom action bar */}
                    <div className="blogcreate-actions">
                        <button
                            className="btn-back"
                            onClick={() => navigate('/admin/blog-management')}
                        >
                            <i className="fas fa-arrow-left"></i> Back to Blog & News
                        </button>

                        <div className="blogcreate-actions-right">
                            <button className="btn-cancel" onClick={handleCancel}>
                                Cancel
                            </button>
                            <button className="btn-draft" onClick={handleSaveDraft}>
                                Save Draft
                            </button>
                            <button className="btn-publish" onClick={handlePublish}>
                                Publish Post
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Admin_BlogCreate;