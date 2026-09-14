// src/pages/Admin_Screens/Admin_CreateProgramme.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Admin_Sidebar from '../../components/Admin/Admin_Sidebar';
import Admin_Header from '../../components/Admin/Admin_Header';
import '../../styles/Admin/Admin_CreateProgramme.css';

const Admin_CreateProgramme = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [showCalendar, setShowCalendar] = useState(false);
    const [selectedDate, setSelectedDate] = useState('');
    const [programmeData, setProgrammeData] = useState({
        programmeName: '',
        description: '',
        duration: '',
        startDate: '',
        status: 'Upcoming'
    });
    const [showDraftConfirmation, setShowDraftConfirmation] = useState(false);
    const [showPublishConfirmation, setShowPublishConfirmation] = useState(false);
    const [showPublishMessage, setShowPublishMessage] = useState(false);
    const [programmeOptions, setProgrammeOptions] = useState([
        'Digital Literacy Fundamentals',
        'Microsoft 365 Essentials',
        'Digital Marketing Pro',
        'Web Development Basics',
        'Data Analytics 101'
    ]);
    const [durationOptions, setDurationOptions] = useState([
        '4 weeks',
        '6 weeks',
        '8 weeks',
        '12 weeks',
        '16 weeks',
        '24 weeks'
    ]);
    const navigate = useNavigate();

    // Status options for dropdown
    const statusOptions = [
        'Upcoming',
        'Active',
        'Draft'
    ];

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

    const handleInputChange = (field, value) => {
        setProgrammeData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const toggleCalendar = () => {
        setShowCalendar(!showCalendar);
    };

    const handleDateSelect = (date) => {
        setSelectedDate(date);
        setProgrammeData(prev => ({
            ...prev,
            startDate: date
        }));
        setShowCalendar(false);
    };

    const generateCalendarDays = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        
        const days = [];
        // Empty days for start of month
        for (let i = 0; i < firstDay; i++) {
            days.push(null);
        }
        
        // Actual days
        for (let i = 1; i <= daysInMonth; i++) {
            const date = new Date(year, month, i);
            const dateString = date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
            days.push({
                day: i,
                date: dateString,
                isToday: date.toDateString() === today.toDateString()
            });
        }
        return days;
    };

    const handleCancel = () => {
          navigate('/admin/programmes');
    };

    const handleSaveDraft = () => {
        setShowDraftConfirmation(true);
    };

    const confirmSaveDraft = () => {
        setShowDraftConfirmation(false);
        // Update status to Draft
        setProgrammeData(prev => ({
            ...prev,
            status: 'Draft'
        }));
        // Navigate back with draft status
        navigate('/admin/programmes', { 
            state: { 
                message: 'Programme saved as draft successfully!',
                programme: { ...programmeData, status: 'Draft' }
            } 
        });
    };

    const cancelSaveDraft = () => {
        setShowDraftConfirmation(false);
    };

    const handlePublishProgramme = () => {
        setShowPublishConfirmation(true);
    };

    const confirmPublishProgramme = () => {
        const publishedProgramme = {
            id: Date.now(),
            name: programmeData.programmeName || 'Untitled Programme',
            enrolled: 0,
            startDate: programmeData.startDate || 'Not set',
            status: 'Active',
            category: 'General',
            duration: programmeData.duration,
            archived: false
        };

        setProgrammeData(prev => ({ ...prev, status: 'Active' }));
        setShowPublishConfirmation(false);
        setShowPublishMessage(true);

        setTimeout(() => {
            setShowPublishMessage(false);
            navigate('/admin/programmes', {
                state: {
                    message: 'Programme published successfully!',
                    programme: publishedProgramme
                }
            });
        }, 1500);
    };

    const cancelPublishProgramme = () => {
        setShowPublishConfirmation(false);
    };

    const handleDurationChange = (e) => {
        const value = e.target.value;
        setProgrammeData(prev => ({ ...prev, duration: value }));
    };

    return (
        <div className="admin-create-programme-layout">
            <Admin_Header 
                onMenuToggle={toggleMobileMenu}
                isMobileMenuOpen={isMobileMenuOpen}
            />
            
            <div className="admin-create-programme-body">
                <Admin_Sidebar 
                    active="programmes"
                    isMobileOpen={isMobileMenuOpen}
                    onClose={closeMobileMenu}
                />

                <div className="admin-create-programme-content">
                    {/* Header Section */}
                    <div className="admin-page-header">
                        <div className="admin-page-header-left">
                            <h1>Create New Programme</h1>
                            <p className="admin-page-subtitle">
                                Define programme details, set enrolment criteria, and configure certification requirements.
                            </p>
                        </div>
                    </div>

                    {/* Publish Success Message */}
                    {showPublishMessage && (
                        <div className="admin-publish-message">
                            <div className="admin-publish-message-content">
                                <svg className="admin-check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M22 4L12 14.01l-3-3" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                <span>Programme "{programmeData.programmeName || 'Untitled'}" is now published! ✅</span>
                            </div>
                        </div>
                    )}

                    {/* Main Form Section */}
                    <div className="admin-programme-form-container">
                        <div className="admin-form-main">
                            {/* Programme Name */}
                            <div className="admin-form-group">
                                <label className="admin-form-label">PROGRAMME NAME</label>
                                <input
                                    type="text"
                                    className="admin-form-input"
                                    list="programme-name-options"
                                    placeholder="e.g. Digital Literacy Fundamentals"
                                    value={programmeData.programmeName}
                                    onChange={(e) => handleInputChange('programmeName', e.target.value)}
                                    onBlur={() => {
                                        if (programmeData.programmeName && !programmeOptions.includes(programmeData.programmeName)) {
                                            setProgrammeOptions(prev => [...prev, programmeData.programmeName]);
                                        }
                                    }}
                                />
                                <datalist id="programme-name-options">
                                    {programmeOptions.map(option => <option key={option} value={option} />)}
                                </datalist>
                            </div>

                            {/* Description */}
                            <div className="admin-form-group">
                                <label className="admin-form-label">DESCRIPTION</label>
                                <textarea 
                                    className="admin-form-textarea"
                                    placeholder="Describe the programme objectives, outcomes, and target audience..."
                                    value={programmeData.description}
                                    onChange={(e) => handleInputChange('description', e.target.value)}
                                    rows="5"
                                />
                            </div>

                            {/* Duration */}
                            <div className="admin-form-group">
                                <label className="admin-form-label">DURATION</label>
                                <div className="admin-duration-container">
                                    <input
                                        type="text"
                                        className="admin-form-input admin-duration-select"
                                        list="duration-options"
                                        placeholder="e.g. 12 weeks"
                                        value={programmeData.duration || ''}
                                        onChange={handleDurationChange}
                                        onBlur={() => {
                                            if (programmeData.duration && !durationOptions.includes(programmeData.duration)) {
                                                setDurationOptions(prev => [...prev, programmeData.duration]);
                                            }
                                        }}
                                    />
                                    <datalist id="duration-options">
                                        {durationOptions.map(option => <option key={option} value={option} />)}
                                    </datalist>
                                </div>
                            </div>

                            {/* Start Date */}
                            <div className="admin-form-group">
                                <label className="admin-form-label">START DATE</label>
                                <div className="admin-date-picker-container">
                                    <div className="admin-date-input-wrapper" onClick={toggleCalendar}>
                                        <input 
                                            type="text"
                                            className="admin-form-input admin-date-input"
                                            placeholder="Select Date..."
                                            value={selectedDate}
                                            readOnly
                                        />
                                        <svg className="admin-calendar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                            <line x1="16" y1="2" x2="16" y2="6"/>
                                            <line x1="8" y1="2" x2="8" y2="6"/>
                                            <line x1="3" y1="10" x2="21" y2="10"/>
                                        </svg>
                                    </div>
                                    
                                    {showCalendar && (
                                        <div className="admin-calendar-dropdown">
                                            <div className="admin-calendar-header">
                                                <span className="admin-calendar-month">
                                                    {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                                </span>
                                            </div>
                                            <div className="admin-calendar-grid">
                                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                                    <div key={day} className="admin-calendar-weekday">{day}</div>
                                                ))}
                                                {generateCalendarDays().map((day, index) => (
                                                    <div 
                                                        key={index}
                                                        className={`admin-calendar-day ${day?.isToday ? 'admin-calendar-today' : ''} ${selectedDate === day?.date ? 'admin-calendar-selected' : ''}`}
                                                        onClick={() => day && handleDateSelect(day.date)}
                                                    >
                                                        {day?.day || ''}
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="admin-calendar-footer">
                                                <button 
                                                    className="admin-calendar-close"
                                                    onClick={() => setShowCalendar(false)}
                                                >
                                                    Close
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="admin-action-buttons">
                                <button 
                                    className="admin-cancel-btn"
                                    onClick={handleCancel}
                                >
                                    Cancel
                                </button>
                                <button 
                                    className="admin-save-draft-btn"
                                    onClick={handleSaveDraft}
                                >
                                    Save as Draft
                                </button>
                                <button 
                                    className="admin-publish-btn"
                                    onClick={handlePublishProgramme}
                                >
                                    Publish Programme
                                </button>
                            </div>
                        </div>

                        {/* Status Sidebar */}
                        <div className="admin-form-sidebar">
                            <div className="admin-status-card">
                                <h3 className="admin-status-title">Programme Status</h3>
                                <div className="admin-status-display">
                                    <span className="admin-status-label">STATUS</span>
                                    <select 
                                        className="admin-status-select"
                                        value={programmeData.status}
                                        onChange={(e) => handleInputChange('status', e.target.value)}
                                    >
                                        {statusOptions.map((option, index) => (
                                            <option key={index} value={option}>{option}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Draft Confirmation Modal */}
                    {showDraftConfirmation && (
                        <div className="admin-modal-overlay">
                            <div className="admin-modal">
                                <div className="admin-modal-header">
                                    <h3>Save as Draft</h3>
                                    <button 
                                        className="admin-modal-close"
                                        onClick={cancelSaveDraft}
                                    >
                                        ×
                                    </button>
                                </div>
                                <div className="admin-modal-body">
                                    <p>Are you sure you want to save this programme as a draft?</p>
                                    <p className="admin-modal-subtext">
                                        Programme will be saved with status "Draft" in the Programme Management page.
                                    </p>
                                </div>
                                <div className="admin-modal-footer">
                                    <button 
                                        className="admin-modal-cancel-btn"
                                        onClick={cancelSaveDraft}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        className="admin-modal-confirm-btn"
                                        onClick={confirmSaveDraft}
                                    >
                                        Confirm Save
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {showPublishConfirmation && (
                        <div className="admin-modal-overlay">
                            <div className="admin-modal">
                                <div className="admin-modal-header">
                                    <h3>Publish Programme</h3>
                                    <button className="admin-modal-close" onClick={cancelPublishProgramme}>
                                        ×
                                    </button>
                                </div>
                                <div className="admin-modal-body">
                                    <p>Are you sure you want to publish this programme?</p>
                                    <p className="admin-modal-subtext">
                                        It will be added to Programme Management as an active programme.
                                    </p>
                                </div>
                                <div className="admin-modal-footer">
                                    <button className="admin-modal-cancel-btn" onClick={cancelPublishProgramme}>
                                        Cancel
                                    </button>
                                    <button className="admin-modal-confirm-btn" onClick={confirmPublishProgramme}>
                                        Confirm Publish
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Admin_CreateProgramme;