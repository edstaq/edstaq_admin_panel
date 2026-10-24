import React, { useState, useMemo } from 'react';
import { 
  X, 
  CalendarPlus, 
  Clock, 
  Calendar, 
  User, 
  BookOpen, 
  Video, 
  Plus,
  ExternalLink,
  Sparkles,
  AlertCircle,
  Check,
  Search,
  ChevronDown
} from 'lucide-react';
import { WEEKDAYS, normalizeWeekday } from '../utils/dateUtils';
import { timeStringToMinutes, minutesTo24H } from '../utils/timeUtils';

export default function TeacherAssignModal({
  teacher,
  filters = {},
  studentsCatalog = [],
  allSubjects = [],
  onClose,
  onAddAssign
}) {
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!teacher) return null;

  // Pre-fill days from active filters
  const initialDays = useMemo(() => {
    if (filters && Array.isArray(filters.weekdays) && filters.weekdays.length > 0) {
      return filters.weekdays.map(d => normalizeWeekday(d)).filter(Boolean);
    }
    return [];
  }, [filters]);

  // Pre-fill start/end times from active filters in 24H HH:mm format
  const initialStartTime = useMemo(() => {
    if (filters.timeStart) {
      const sM = timeStringToMinutes(filters.timeStart);
      if (sM >= 0) return minutesTo24H(sM);
    }
    return '19:30';
  }, [filters.timeStart]);

  const initialEndTime = useMemo(() => {
    if (filters.timeEnd) {
      const eM = timeStringToMinutes(filters.timeEnd);
      if (eM >= 0) return minutesTo24H(eM);
    }
    const startMins = timeStringToMinutes(initialStartTime);
    if (startMins >= 0) {
      return minutesTo24H(startMins + 75);
    }
    return '20:45';
  }, [filters.timeEnd, initialStartTime]);

  const todayStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = (now.getMonth() + 1).toString().padStart(2, '0');
    const d = now.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  const [className, setClassName] = useState('');
  // Multi-student selection state
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);

  const [meetLink, setMeetLink] = useState('');
  const [meetGenerated, setMeetGenerated] = useState(false);

  const [selectedSubjectId, setSelectedSubjectId] = useState(() => {
    return (teacher.qualifiedSubjects && teacher.qualifiedSubjects[0]?.id) || '';
  });
  const [startDate, setStartDate] = useState(todayStr);
  const [selectedDays, setSelectedDays] = useState(initialDays);
  const [startTime, setStartTime] = useState(initialStartTime);
  const [endTime, setEndTime] = useState(initialEndTime);
  const [status, setStatus] = useState('Active');
  const [weekCycle, setWeekCycle] = useState('1');
  const [sessionsPerDay, setSessionsPerDay] = useState('1');
  const [paymentMode, setPaymentMode] = useState('After');
  const [interactiveSession, setInteractiveSession] = useState(true);
  const [neurostack, setNeurostack] = useState(true);
  const [paymentNote, setPaymentNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Toggle Day selection
  const toggleDay = (day) => {
    setSelectedDays(prev => {
      if (prev.includes(day)) {
        return prev.filter(d => d !== day);
      } else {
        return [...prev, day];
      }
    });
  };

  // Quick duration setter helper (Audio 2: clicking 60, 75, 90 mins accurately updates End Time based on Start Time)
  const setQuickDuration = (durationMinutes) => {
    const sMins = timeStringToMinutes(startTime);
    if (sMins >= 0) {
      const eMins = sMins + durationMinutes;
      setEndTime(minutesTo24H(eMins));
    }
  };

  // Compute calculated duration in minutes
  const calculatedDuration = useMemo(() => {
    const sMins = timeStringToMinutes(startTime);
    const eMins = timeStringToMinutes(endTime);
    if (sMins >= 0 && eMins > sMins) {
      return eMins - sMins;
    }
    return 0;
  }, [startTime, endTime]);

  // Google Meet Link Generator under data.edstaq@gmail.com (Audio 2 Point 4)
  const handleGenerateMeet = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    const randPart = (len) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const meetCode = `${randPart(3)}-${randPart(4)}-${randPart(3)}`;
    const generatedUrl = `https://meet.google.com/${meetCode}`;
    setMeetLink(generatedUrl);
    setMeetGenerated(true);
  };

  // Filter student catalog by search query
  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return studentsCatalog;
    const q = studentSearch.toLowerCase();
    return studentsCatalog.filter(s => 
      s.name.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q) ||
      (s.class && s.class.toLowerCase().includes(q))
    );
  }, [studentsCatalog, studentSearch]);

  const toggleStudentSelection = (st) => {
    setSelectedStudents(prev => {
      const exists = prev.some(s => s.id === st.id);
      let updated;
      if (exists) {
        updated = prev.filter(s => s.id !== st.id);
      } else {
        updated = [...prev, st];
      }

      // Auto-suggest class room name if blank
      if (!className.trim() && updated.length > 0) {
        const studentNames = updated.map(s => s.name).join(', ');
        setClassName(`Edstaq - ${studentNames}`);
      }
      return updated;
    });
  };

  const removeStudent = (stId) => {
    setSelectedStudents(prev => prev.filter(s => s.id !== stId));
  };

  // Subject List: Show label on left, Subject ID on right (Audio 2 Point 3)
  const subjectsToDisplay = useMemo(() => {
    // If teacher has qualified subjects, put them first
    const qualified = teacher.qualifiedSubjects || [];
    const qualifiedIds = new Set(qualified.map(q => q.id));
    const others = (allSubjects || []).filter(s => !qualifiedIds.has(s.id));
    return {
      qualified,
      others
    };
  }, [teacher.qualifiedSubjects, allSubjects]);

  const hasFilterPrefills = initialDays.length > 0 || !!filters.timeStart || !!filters.timeEnd;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (selectedDays.length === 0) {
      setErrorMessage('Please select at least one day of the week for this class schedule.');
      return;
    }

    const sMins = timeStringToMinutes(startTime);
    const eMins = timeStringToMinutes(endTime);
    if (sMins < 0 || eMins <= sMins) {
      setErrorMessage('End time must be after start time.');
      return;
    }

    setIsSubmitting(true);
    try {
      const generatedAssignId = `TAS_${Date.now().toString().slice(-5)}_${Math.floor(100 + Math.random() * 900)}`;
      const formattedStartTime = minutesTo24H(sMins);
      const formattedEndTime = minutesTo24H(eMins);
      const studentIdsJoined = selectedStudents.map(s => s.id).join(', ');

      const newAssignRecord = {
        'Teacher Assign ID': generatedAssignId,
        'Class Room ID': className.trim() || `Class - ${teacher.teacherName} (${selectedDays.join(', ')})`,
        'Meet Link': meetLink.trim(),
        'Subject ID': selectedSubjectId,
        'Student ID': studentIdsJoined,
        'Teacher ID': teacher.teacherId,
        'Start Date': startDate,
        'Sessions per day': sessionsPerDay,
        'Start Time': formattedStartTime,
        'End Time': formattedEndTime,
        'Days': selectedDays.join(', '),
        'Status': status,
        'Week Cycle': weekCycle,
        'End Date Req': '',
        'Class Count Req': '',
        'Student Limit': selectedStudents.length > 0 ? String(selectedStudents.length) : '1',
        'Classes Payment Mode': paymentMode,
        'Period in Days': '10',
        'Interactive Session': interactiveSession ? 'TRUE' : 'FALSE',
        'Status Summary': '',
        'Payment Note': paymentNote.trim(),
        'Neurostack': neurostack ? 'TRUE' : 'FALSE',
        'Subscriptions': ''
      };

      await onAddAssign(newAssignRecord);
      onClose();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to create teacher allocation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content teacher-assign-modal-content"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '720px', width: '95vw' }}
      >
        {/* Header */}
        <div className="modal-header assign-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="assign-icon-avatar">
              <CalendarPlus size={20} color="#2563eb" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <h3 className="assign-teacher-title">
                  Allocate Teacher
                </h3>
                <span className="teacher-id-chip">{teacher.teacherId}</span>
                <span className="assign-badge-tag">{teacher.teacherName}</span>
              </div>
              <p className="assign-header-sub">
                Create new class booking allocation in Google Sheet Classroom &amp; Session Mng
              </p>
            </div>
          </div>

          <button className="modal-close-btn" onClick={onClose} title="Close (Esc)">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body assign-modal-body">
          {hasFilterPrefills && (
            <div className="assign-prefill-banner">
              <Sparkles size={14} style={{ color: '#2563eb', flexShrink: 0 }} />
              <div>
                <strong>Auto-filled from active filter:</strong>
                {initialDays.length > 0 && ` Days: [${initialDays.join(', ')}]`}
                {filters.timeStart && ` Start: ${filters.timeStart}`}
                {filters.timeEnd && ` End: ${filters.timeEnd}`}
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="assign-error-banner">
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="assign-form-container">
            {/* Row 1: Class Room ID */}
            <div className="assign-input-group">
              <label className="assign-input-label">
                <User size={13} style={{ color: '#2563eb' }} />
                <span>Class Room / Batch Name <strong style={{ color: '#ef4444' }}>*</strong></span>
              </label>
              <input
                type="text"
                className="assign-styled-input"
                placeholder="e.g. Edstaq C-6 Ananya (Maths) or Grade 10 Batch A"
                value={className}
                onChange={e => setClassName(e.target.value)}
                required
              />
            </div>

            {/* Row 2: Student ID Multi-Select with Name, ID, Class (Audio 2 Point 2) */}
            <div className="assign-input-group">
              <label className="assign-input-label">
                <User size={13} style={{ color: '#2563eb' }} />
                <span>Select Students <small style={{ color: '#64748b' }}>(Multi-student options supported)</small></span>
              </label>

              {/* Selected Students Chips */}
              {selectedStudents.length > 0 && (
                <div className="selected-students-chips">
                  {selectedStudents.map(st => (
                    <span key={st.id} className="student-chip">
                      <span><strong>{st.name}</strong> ({st.id}) {st.class ? `• ${st.class}` : ''}</span>
                      <button type="button" onClick={() => removeStudent(st.id)} title="Remove student">
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Search & Selection Dropdown Box */}
              <div className="student-selector-box">
                <div className="student-search-input-wrapper">
                  <Search size={14} className="search-icon" />
                  <input
                    type="text"
                    className="student-search-input"
                    placeholder="Search by student name, ID (e.g. STD101), or class..."
                    value={studentSearch}
                    onChange={e => {
                      setStudentSearch(e.target.value);
                      setShowStudentDropdown(true);
                    }}
                    onFocus={() => setShowStudentDropdown(true)}
                  />
                  <button 
                    type="button" 
                    className="toggle-dropdown-btn"
                    onClick={() => setShowStudentDropdown(!showStudentDropdown)}
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>

                {showStudentDropdown && (
                  <div className="students-dropdown-list">
                    {filteredStudents.length === 0 ? (
                      <div className="dropdown-empty-row">
                        No students found matching "{studentSearch}"
                      </div>
                    ) : (
                      filteredStudents.map(st => {
                        const isSelected = selectedStudents.some(s => s.id === st.id);
                        return (
                          <div
                            key={st.id}
                            className={`student-dropdown-item ${isSelected ? 'selected' : ''}`}
                            onClick={() => toggleStudentSelection(st)}
                          >
                            <div className="student-item-left">
                              <span className="student-checkbox">{isSelected ? <Check size={11} strokeWidth={3} /> : null}</span>
                              <span className="student-name">{st.name}</span>
                              <span className="student-id-tag">{st.id}</span>
                            </div>
                            <span className="student-class-tag">{st.class || 'Standard'}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Row 3: Subject Dropdown with Label on left, Subject ID on right (Audio 2 Point 3) */}
            <div className="assign-input-group">
              <label className="assign-input-label">
                <BookOpen size={13} style={{ color: '#2563eb' }} />
                <span>Subject <strong style={{ color: '#ef4444' }}>*</strong> <small style={{ color: '#64748b' }}>(Label on left, Subject ID on right)</small></span>
              </label>
              <select
                className="assign-styled-select"
                value={selectedSubjectId}
                onChange={e => setSelectedSubjectId(e.target.value)}
                required
              >
                <option value="">-- Choose Subject --</option>
                {subjectsToDisplay.qualified.length > 0 && (
                  <optgroup label="Teacher's Qualified Subjects">
                    {subjectsToDisplay.qualified.map(sub => (
                      <option key={sub.id} value={sub.id}>
                        {sub.label || sub.name} — ({sub.id})
                      </option>
                    ))}
                  </optgroup>
                )}
                {subjectsToDisplay.others.length > 0 && (
                  <optgroup label="Other Subjects">
                    {subjectsToDisplay.others.map(sub => (
                      <option key={sub.id} value={sub.id}>
                        {sub.label || sub.name} — ({sub.id})
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            {/* Row 4: Google Meet Link with "Create New" Button (Audio 2 Point 4) */}
            <div className="assign-input-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="assign-input-label">
                  <Video size={13} style={{ color: '#059669' }} />
                  <span>Google Meet Link <small style={{ color: '#64748b' }}>(Under data.edstaq@gmail.com)</small></span>
                </label>
                {meetGenerated && (
                  <span className="meet-created-badge">
                    <Check size={11} strokeWidth={3} />
                    Ready for data.edstaq@gmail.com
                  </span>
                )}
              </div>

              <div className="meet-input-with-button">
                <input
                  type="url"
                  className="assign-styled-input"
                  placeholder="https://meet.google.com/xxx-yyyy-zzz"
                  value={meetLink}
                  onChange={e => setMeetLink(e.target.value)}
                />
                <button
                  type="button"
                  className="btn-create-meet"
                  onClick={handleGenerateMeet}
                  title="Generate Google Meet Link under data.edstaq@gmail.com"
                >
                  <Plus size={14} />
                  <span>Create New</span>
                </button>
              </div>

              {meetLink && (
                <div className="meet-helper-row">
                  <a
                    href={`https://meet.google.com/new?authuser=data.edstaq@gmail.com`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="meet-external-link"
                    title="Start meeting in Google Meet using data.edstaq@gmail.com"
                  >
                    <span>Open in data.edstaq@gmail.com</span>
                    <ExternalLink size={11} />
                  </a>
                </div>
              )}
            </div>

            {/* Schedule Section: Days of Week */}
            <div className="assign-schedule-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                <label className="assign-input-label">
                  <Calendar size={13} style={{ color: '#2563eb' }} />
                  <span>Days of Week <strong style={{ color: '#ef4444' }}>*</strong></span>
                </label>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  {selectedDays.length} {selectedDays.length === 1 ? 'day' : 'days'} selected
                </span>
              </div>

              <div className="assign-days-row">
                {WEEKDAYS.map(day => {
                  const isSelected = selectedDays.includes(day);
                  const shortDay = day.slice(0, 3);
                  return (
                    <button
                      key={day}
                      type="button"
                      className={`assign-day-pill ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggleDay(day)}
                    >
                      {shortDay}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Schedule Section: Date & Time Range with Quick Durations (Audio 2 Point 5) */}
            <div className="assign-form-grid-3">
              <div className="assign-input-group">
                <label className="assign-input-label">
                  <Calendar size={13} style={{ color: '#2563eb' }} />
                  <span>Start Date <strong style={{ color: '#ef4444' }}>*</strong></span>
                </label>
                <input
                  type="date"
                  className="assign-styled-input"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  required
                />
              </div>

              <div className="assign-input-group">
                <label className="assign-input-label">
                  <Clock size={13} style={{ color: '#2563eb' }} />
                  <span>Start Time <strong style={{ color: '#ef4444' }}>*</strong></span>
                </label>
                <input
                  type="time"
                  className="assign-styled-input"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  required
                />
              </div>

              <div className="assign-input-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="assign-input-label">
                    <Clock size={13} style={{ color: '#2563eb' }} />
                    <span>End Time <strong style={{ color: '#ef4444' }}>*</strong></span>
                  </label>
                  {calculatedDuration > 0 && (
                    <span className="duration-calc-badge">{calculatedDuration}m</span>
                  )}
                </div>
                <input
                  type="time"
                  className="assign-styled-input"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Quick Duration Buttons (Audio 2 Point 5: Automatically adjusts End Time based on Start Time) */}
            <div className="assign-quick-durations">
              <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Quick duration:</span>
              <button type="button" onClick={() => setQuickDuration(60)}>60 mins</button>
              <button type="button" onClick={() => setQuickDuration(75)}>75 mins (Std)</button>
              <button type="button" onClick={() => setQuickDuration(90)}>90 mins</button>
            </div>

            {/* Allocation Settings: Status & Week Cycle */}
            <div className="assign-form-grid-2">
              <div className="assign-input-group">
                <label className="assign-input-label">
                  <span>Allocation Status</span>
                </label>
                <select
                  className="assign-styled-select"
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                >
                  <option value="Active">Active (Occupies slot / Booked)</option>
                  <option value="HOLD">HOLD (Slot on hold)</option>
                </select>
              </div>

              <div className="assign-input-group">
                <label className="assign-input-label">
                  <span>Week Cycle</span>
                </label>
                <select
                  className="assign-styled-select"
                  value={weekCycle}
                  onChange={e => setWeekCycle(e.target.value)}
                >
                  <option value="1">Cycle 1 (Every week)</option>
                  <option value="2">Cycle 2 (Alternate weeks)</option>
                  <option value="3">Cycle 3 (Every 3rd week)</option>
                </select>
              </div>
            </div>

            {/* Payment Note (Optional) */}
            <div className="assign-input-group">
              <label className="assign-input-label">
                <span>Payment / Booking Notes <small style={{ color: '#94a3b8' }}>(Optional)</small></span>
              </label>
              <input
                type="text"
                className="assign-styled-input"
                placeholder="e.g. ₹250 per session, monthly billing"
                value={paymentNote}
                onChange={e => setPaymentNote(e.target.value)}
              />
            </div>

            {/* Modal Actions */}
            <div className="assign-modal-actions">
              <button
                type="button"
                className="btn-assign-cancel"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-assign-submit"
                disabled={isSubmitting}
              >
                <CalendarPlus size={15} />
                <span>{isSubmitting ? 'Creating Allocation...' : 'Create Allocation'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
