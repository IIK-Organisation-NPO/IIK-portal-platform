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
} from 'react-icons/fa';
import '../../styles/Admin/EmailComposerModal.css';

const EmailComposerModal = ({ isOpen, onClose, learners = [] }) => {
    const [template, setTemplate] = useState('Follow-up: Course Interest Intro');
    const [subject, setSubject] = useState('Take the next step in your learning journey!');
    const [message, setMessage] = useState(
        'Hi,\n\nThank you for expressing interest in our curriculum. Our lesson starts next month and seats are filling up rapidly.'
    );

    if (!isOpen) return null;

    const handleSend = () => {
        alert(`Email sent to ${learners.length} learner(s)!`);
        onClose();
    };
    const handleSchedule = () => {
        alert('Email scheduled for later!');
        onClose();
    };
    const handleSaveDraft = () => {
        alert('Draft saved!');
        onClose();
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
                    {/* TO */}
                    <div className="form-group">
                        <label className="to-heading">Selected Learners ({learners.length})</label>
                        <div className="to-field">
                            <div className="learner-chip-group">
                                {learners.map((learner, index) => (
                                    <span className="learner-chip" key={learner?.id ?? index}>
                                        {typeof learner === 'string' ? learner : learner?.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* EMAIL TEMPLATE */}
                    <div className="form-group">
                        <label>Email Template</label>
                        <select value={template} onChange={(e) => setTemplate(e.target.value)}>
                            <option>Follow-up: Course Interest Intro</option>
                            <option>Enrollment Confirmation</option>
                            <option>Reminder: Upcoming Session</option>
                            <option>Welcome to the Programme</option>
                        </select>
                    </div>

                    {/* SUBJECT */}
                    <div className="form-group">
                        <label>Subject</label>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                        />
                    </div>

                    {/* MESSAGE with rich-text style toolbar */}
                    <div className="form-group">
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
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="modal-footer">
                    <button className="btn-send-primary" onClick={handleSend}>
                        <FaPaperPlane className="btn-icon" />
                        Send Email Now
                    </button>
                    <div className="secondary-actions">
                        <button className="btn-secondary" onClick={handleSchedule}>
                            Schedule Send
                        </button>
                        <button className="btn-secondary" onClick={handleSaveDraft}>
                            Save Draft
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmailComposerModal;