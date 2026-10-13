// src/pages/Admin_Screens/Admin_BlogCreate.jsx
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Admin_Header from '../../components/Admin/Admin_Header';
import Admin_Sidebar from '../../components/Admin/Admin_Sidebar';
import '../../styles/Admin/Admin_BlogCreate.css';
import { blogAPI } from '../../services/api';
import { API_BASE } from '../../config/api';

const Admin_BlogCreate = () => {
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const editorRef = useRef(null);

    const MAX_IMAGE_MB = 5;

    const [formData, setFormData] = useState({
        postType: 'Blog Post',
        officialTitle: '',
        authorReference: 'Admin',
        tags: '',
        articleBody: '',
        featuredImage: null,
        eventDate: '',
        venue: '',
    });

    const [errors, setErrors] = useState({});

    const [toast, setToast] = useState(null);

    const adminName = 'Admin';

    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
    const closeMobileMenu = () => setIsMobileMenuOpen(false);

    const showToast = (type, text) => {
        setToast({ type, text });
        window.setTimeout(() => setToast(null), 3500);
    };

    

    const extractErrorMessage = (err, fallback) => {
        // 1. Network failure — backend unreachable
        if (err?.code === 'ERR_NETWORK' || err?.message === 'Network Error') {
            return ' Please check your internet connection and try again.';
        }

        // 2. Timeout
        if (err?.code === 'ECONNABORTED') {
            return 'The server took too long to respond. Please try again.';
        }
        const data = err?.response?.data;
        const status = err?.response?.status;

        if (status === 413) {
            return `The image is too large. Please use an image under ${MAX_IMAGE_MB} MB.`;
        }

        if (typeof data === 'string' && /too large|payloadtoo|entity too large/i.test(data)) {
            return `The image is too large. Please use an image under ${MAX_IMAGE_MB} MB.`;
        }

        // 4. Server returned structured JSON
        if (data && typeof data === 'object') {
            if (typeof data.error === 'string' && data.error.trim()) return data.error;
            if (typeof data.message === 'string' && data.message.trim()) return data.message;
            if (Array.isArray(data.errors) && data.errors.length > 0) {
                return data.errors
                    .map((e) => e.message || e.msg || '')
                    .filter(Boolean)
                    .join(', ');
            }
        }

        // 5. Fall back on HTTP status code
        if (status === 400) return 'Please check your input and try again.';
        if (status === 401) return 'Your session has expired. Please log in again.';
        if (status === 403) return 'You do not have permission to do that.';
        if (status === 404) return 'We could not find what you were looking for.';
        if (status >= 500) return 'Something went wrong on our end. Please try again in a moment.';

        // 6. Last resort — the caller's default message
        return fallback;
    };

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

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // ---- Reject oversized files before the upload starts ----
        const maxBytes = MAX_IMAGE_MB * 1024 * 1024;
        if (file.size > maxBytes) {
            const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
            showToast(
                'error',
                `The image is too large (${sizeMb} MB). Please use an image under ${MAX_IMAGE_MB} MB.`
            );
            e.target.value = '';
            return;
        }

        // ---- Reject non-image files ----
        if (!/^image\//i.test(file.type)) {
            showToast('error', 'Please choose an image file (JPG, PNG, GIF, or WEBP).');
            e.target.value = '';
            return;
        }

        setFormData((prev) => ({ ...prev, featuredImage: file }));

        setErrors((prev) => {
            if (!prev.featuredImage) return prev;
            const next = { ...prev };
            delete next.featuredImage;
            return next;
        });
    };

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

    const uploadFeaturedImage = async () => {
        if (!formData.featuredImage) return null;
        const res = await blogAPI.uploadImage(formData.featuredImage);
        return res.data?.url || null;
    };

    const buildPayload = (status, imageUrl) => {
        const safeAlt = (formData.officialTitle || 'Post image').replace(/"/g, '&quot;');

        const src = !imageUrl
            ? ''
            : imageUrl.startsWith('data:')
                ? imageUrl
                : `${API_BASE}${imageUrl}`;

        const imageTag = src
            ? `<img src="${src}" alt="${safeAlt}" style="max-width:100%;height:auto;border-radius:8px;margin-bottom:16px;display:block;" />`
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
            showToast(
                'error',
                extractErrorMessage(err, 'Failed to save draft. Please try again.')
            );
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
            showToast(
                'error',
                extractErrorMessage(err, 'Failed to publish post. Please try again.')
            );
        }
    };

    const handleCancel = () => {
        setFormData({
            postType: 'Blog Post',
            officialTitle: '',
            authorReference: 'Admin',
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

    return (
        <div className="admin-blogcreate-layout">
            <Admin_Header
                adminName={adminName}
                onMenuToggle={toggleMobileMenu}
                isMobileMenuOpen={isMobileMenuOpen}
                notificationCount={3}
            />

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
                        <div className="blogcreate-left">
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

                        <div className="blogcreate-right">
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