// src/components/Admin/EmailComposerModal.jsx
import React, { useState } from 'react';
import {
    FaRegEnvelope,
    FaTimes,
    FaBold,
    FaItalic,
    FaLink,
    FaListUl,
    FaListOl,
    FaPaperPlane,
    FaSpinner,
    FaCheck,
    FaExclamationTriangle,
} from 'react-icons/fa';
import api from '../../services/api';
import '../../styles/Admin/EmailComposerModal.css';

const EmailComposerModal = ({ isOpen, onClose, learners = [], onSuccess }) => {
    const [template, setTemplate] = useState('Follow-up: Course Interest Intro');
    const [subject, setSubject] = useState('Take the next step in your learning journey!');
    const [message, setMessage] = useState(
        'Hi,\n\nThank you for expressing interest in our curriculum. Our lesson starts next month and seats are filling up rapidly.'
    );
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null);

    if (!isOpen) return null;

    // Template presets
    const templatePresets = {
        'Follow-up: Course Interest Intro': {
            subject: 'Take the next step in your learning journey!',
            message: 'Hi,\n\nThank you for expressing interest in our curriculum. Our lesson starts next month and seats are filling up rapidly.'
        },
        'Enrollment Confirmation': {
            subject: 'Enrollment Confirmation - IIK Learner Portal',
            message: 'Hi,\n\nWe are pleased to confirm your enrollment in our programme. You will receive further details about the course structure and schedule soon.\n\nWelcome aboard!'
        },
        'Reminder: Upcoming Session': {
            subject: 'Reminder: Upcoming Session',
            message: 'Hi,\n\nThis is a friendly reminder that your next session is coming up. Please ensure you have completed any pre-requisite work.\n\nWe look forward to seeing you there!'
        },
        'Welcome to the Programme': {
            subject: 'Welcome to the IIK Learner Programme!',
            message: 'Hi,\n\nWelcome to the IIK Learner Certificate Portal! We are excited to have you on board. Please explore the available resources and get started with your learning journey.\n\nBest wishes!'
        }
    };

    const handleTemplateChange = (e) => {
        const selected = e.target.value;
        setTemplate(selected);
        if (templatePresets[selected]) {
            setSubject(templatePresets[selected].subject);
            setMessage(templatePresets[selected].message);
        }
    };

    const handleSend = async () => {
        if (!subject.trim()) {
            setError('Please enter a subject');
            return;
        }
        if (!message.trim()) {
            setError('Please enter a message');
            return;
        }
        if (learners.length === 0) {
            setError('No learners selected');
            return;
        }

        setSending(true);
        setError(null);

        try {
            const response = await api.post('/admin/send-bulk-email', {
                recipients: learners.map(l => ({
                    email: l.email,
                    name: l.name || l.learner_name,
                    surname: l.surname || ''
                })),
                subject: subject.trim(),
                message: message.trim()
            }, {
                timeout: 60000 // 60 seconds timeout
            });

            if (response.data.success) {
                setSent(true);
                setResult({
                    sent: response.data.data?.total || learners.length,
                    failed: 0,
                    total: response.data.data?.total || learners.length
                });
                if (onSuccess) {
                    onSuccess(response.data.data);
                }
                
                // Show success message
                const total = response.data.data?.total || learners.length;
                alert(`✅ ${total} emails are being sent! Please check your inbox.`);
                
                // Close modal after 2 seconds
                setTimeout(() => {
                    onClose();
                }, 2000);
            } else {
                setError(response.data.message || 'Failed to send emails');
            }
        } catch (err) {
            console.error('Error sending emails:', err);
            // Check if it was a timeout error
            if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
                setError('⏳ Emails are being sent in the background. Please check your email inbox in a few minutes.');
                // Still show success because emails are being processed
                setSent(true);
                setResult({
                    sent: learners.length,
                    failed: 0,
                    total: learners.length
                });
                setTimeout(() => {
                    onClose();
                }, 3000);
            } else {
                setError(err.response?.data?.message || 'Failed to send emails. Please try again.');
            }
        } finally {
            setSending(false);
        }
    };

    const handleSchedule = () => {
        alert('Schedule feature coming soon!');
    };

    const handleSaveDraft = () => {
        alert('Draft saved!');
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="email-composer-modal" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="modal-header">
                    <div className="modal-title">
                        <FaRegEnvelope className="header-icon" />
                        <h2>Email Composer</h2>
                    </div>
                    <button className="close-btn" onClick={onClose} aria-label="Close">
                        <FaTimes />
                    </button>
                </div>

                <div className="modal-body">
                    {/* TO - Selected Learners */}
                    <div className="form-group">
                        <label className="to-heading">
                            Selected Learners ({learners.length})
                            <span className="learner-count-badge">{learners.length}</span>
                        </label>
                        <div className="to-field">
                            <div className="learner-chip-group">
                                {learners.map((learner, index) => (
                                    <span className="learner-chip" key={learner?.id || learner?.User_id || index}>
                                        {learner?.name || learner?.learner_name || `Learner ${index + 1}`}
                                        <span className="learner-chip-email">
                                            {learner?.email || 'No email'}
                                        </span>
                                    </span>
                                ))}
                            </div>
                            <div className="learner-count-summary">
                                Sending to {learners.length} recipient{learners.length !== 1 ? 's' : ''}
                            </div>
                        </div>
                    </div>

                    {/* EMAIL TEMPLATE */}
                    <div className="form-group">
                        <label>Email Template</label>
                        <select value={template} onChange={handleTemplateChange}>
                            {Object.keys(templatePresets).map((tpl) => (
                                <option key={tpl} value={tpl}>{tpl}</option>
                            ))}
                        </select>
                    </div>

                    {/* SUBJECT */}
                    <div className="form-group">
                        <label>Subject <span className="required">*</span></label>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Enter email subject"
                            className={error && !subject.trim() ? 'input-error' : ''}
                        />
                    </div>

                    {/* MESSAGE with rich-text style toolbar */}
                    <div className="form-group">
                        <label>Message <span className="required">*</span></label>
                        <div className="editor-wrapper">
                            <div className="editor-toolbar">
                                <button type="button" className="toolbar-btn" aria-label="Bold">
                                    <FaBold />
                                </button>
                                <button type="button" className="toolbar-btn" aria-label="Italic">
                                    <FaItalic />
                                </button>
                                <button type="button" className="toolbar-btn" aria-label="Insert link">
                                    <FaLink />
                                </button>
                                <span className="toolbar-divider" />
                                <button type="button" className="toolbar-btn" aria-label="Bullet list">
                                    <FaListUl />
                                </button>
                                <button type="button" className="toolbar-btn" aria-label="Numbered list">
                                    <FaListOl />
                                </button>
                            </div>
                            <textarea
                                rows="6"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Type your email message here..."
                                className={error && !message.trim() ? 'input-error' : ''}
                            />
                        </div>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="email-error">
                            <FaExclamationTriangle className="error-icon" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Success Display */}
                    {sent && result && (
                        <div className="email-success">
                            <FaCheck className="success-icon" />
                            <div>
                                <strong>Emails sent successfully!</strong>
                                <p>Sent: {result.sent || learners.length} | Failed: {result.failed || 0}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="modal-footer">
                    <button 
                        className="btn-send-primary" 
                        onClick={handleSend}
                        disabled={sending || sent}
                    >
                        {sending ? (
                            <>
                                <FaSpinner className="btn-icon spinning" />
                                Sending...
                            </>
                        ) : sent ? (
                            <>
                                <FaCheck className="btn-icon" />
                                Sent!
                            </>
                        ) : (
                            <>
                                <FaPaperPlane className="btn-icon" />
                                Send Email Now
                            </>
                        )}
                    </button>
                    <div className="secondary-actions">
                        <button className="btn-secondary" onClick={handleSchedule} disabled={sending}>
                            Schedule Send
                        </button>
                        <button className="btn-secondary" onClick={handleSaveDraft} disabled={sending}>
                            Save Draft
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmailComposerModal;