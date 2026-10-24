import React, { useMemo, useState } from 'react';
import { X, Calendar, CheckCircle, Target, Globe, AlertTriangle, ZoomIn, ZoomOut } from 'lucide-react';
import { formatDuration, timeStringToMinutes, minutesToTimeString } from '../utils/timeUtils';

export default function ScheduleMatrixModal({ teacher, windowDates = [], filters = {}, onClose }) {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1); // 1 = 100%, 0.7 = 70%, 1.4 = 140%

  // Visibility toggles (Audio: Default HOLD=checked/enabled, Booked=unchecked/disabled)
  const [showHold, setShowHold] = useState(true);
  const [showBooked, setShowBooked] = useState(false);

  // Zoom control steps (Audio 3)
  const baseHourHeight = 52;
  const hourHeight = Math.max(34, Math.min(88, Math.round(baseHourHeight * zoomLevel)));

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(1.5, Number((prev + 0.15).toFixed(2))));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(0.65, Number((prev - 0.15).toFixed(2))));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
  };

  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (selectedEvent) {
          setSelectedEvent(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, selectedEvent]);

  // Dynamic Timeline Auto-Cropping (Covers Free slots, HOLD sessions if enabled, Booked classes if enabled & Filter window)
  const { startHour, endHour, totalHours } = useMemo(() => {
    if (!teacher) return { startHour: 17, endHour: 23, totalHours: 6 };
    const activityMins = [];

    // 1. Free slots
    (teacher.remainingSlots || []).forEach(s => {
      activityMins.push(s.slot_start_mins);
      activityMins.push(s.slot_end_mins);
    });

    // 2. HOLD sessions (if enabled)
    if (showHold) {
      (teacher.bookedInstances || []).filter(b => (b.status || '').toLowerCase() === 'hold').forEach(b => {
        activityMins.push(b.startMins);
        activityMins.push(b.endMins);
      });
    }

    // 3. Booked classes (if enabled)
    if (showBooked) {
      (teacher.bookedInstances || []).filter(b => (b.status || '').toLowerCase() !== 'hold').forEach(b => {
        activityMins.push(b.startMins);
        activityMins.push(b.endMins);
      });
    }

    // 4. Target filter window if specified
    if (filters.timeStart) {
      const sMins = timeStringToMinutes(filters.timeStart);
      if (sMins >= 0) activityMins.push(sMins);
    }
    if (filters.timeEnd) {
      const eMins = timeStringToMinutes(filters.timeEnd);
      if (eMins >= 0) activityMins.push(eMins);
    }

    if (activityMins.length === 0) {
      // If nothing is visible, check all booked instances or default to 5pm-11pm
      (teacher.bookedInstances || []).forEach(b => {
        activityMins.push(b.startMins);
        activityMins.push(b.endMins);
      });
      if (activityMins.length === 0) {
        return { startHour: 17, endHour: 23, totalHours: 6 };
      }
    }

    const minMins = Math.min(...activityMins);
    const maxMins = Math.max(...activityMins);

    let minH = Math.max(0, Math.floor(minMins / 60) - 1);
    let maxH = Math.min(24, Math.ceil(maxMins / 60) + 1);

    if (maxH - minH < 6) {
      const needed = 6 - (maxH - minH);
      minH = Math.max(0, minH - Math.floor(needed / 2));
      maxH = Math.min(24, minH + 6);
      if (maxH === 24) {
        minH = Math.max(0, 24 - 6);
      }
    }

    return {
      startHour: minH,
      endHour: maxH,
      totalHours: maxH - minH
    };
  }, [teacher, showHold, showBooked, filters.timeStart, filters.timeEnd]);

  // Array of hours for the cropped Y-axis timeline
  const hours = useMemo(() => {
    const list = [];
    for (let h = startHour; h < endHour; h++) {
      list.push(h);
    }
    return list;
  }, [startHour, endHour]);

  // Filter Target Window calculation
  const filterOverlayInfo = useMemo(() => {
    const hasTimeStart = Boolean(filters.timeStart);
    const hasTimeEnd = Boolean(filters.timeEnd);

    if (!hasTimeStart && !hasTimeEnd) {
      return null;
    }

    const targetStartMins = hasTimeStart ? timeStringToMinutes(filters.timeStart) : (startHour * 60);
    const targetEndMins = hasTimeEnd ? timeStringToMinutes(filters.timeEnd) : (endHour * 60);

    const gridStartMins = startHour * 60;
    const gridEndMins = endHour * 60;

    const clampedStart = Math.max(gridStartMins, targetStartMins);
    const clampedEnd = Math.min(gridEndMins, targetEndMins);

    if (clampedEnd <= clampedStart) return null;

    const topPx = ((clampedStart - gridStartMins) / 60) * hourHeight;
    const heightPx = ((clampedEnd - clampedStart) / 60) * hourHeight;

    const activeWeekdays = (filters.weekdays && filters.weekdays.length > 0)
      ? filters.weekdays
      : null;

    return {
      topPx,
      heightPx,
      targetStartStr: minutesToTimeString(targetStartMins),
      targetEndStr: minutesToTimeString(targetEndMins),
      activeWeekdays
    };
  }, [filters.timeStart, filters.timeEnd, filters.weekdays, startHour, endHour, hourHeight]);

  const formatHourLabel = (h) => {
    const meridian = h >= 12 && h < 24 ? 'PM' : 'AM';
    let displayH = h % 12;
    if (displayH === 0) displayH = 12;
    return `${displayH}:00 ${meridian}`;
  };

  if (!teacher) return null;

  const holdSessionsCount = (teacher.bookedInstances || []).filter(
    b => (b.status || '').toLowerCase() === 'hold'
  ).length;

  const bookedSessionsCount = (teacher.bookedInstances || []).filter(
    b => (b.status || '').toLowerCase() !== 'hold'
  ).length;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content matrix-modal-content" 
        style={{ maxWidth: '1280px', width: '96vw', maxHeight: '94vh', padding: 0 }} 
        onClick={e => e.stopPropagation()}
      >
        {/* Compact, Ultra-Clean Modal Header Bar (Audio 3: Space Maximization) */}
        <div className="matrix-header-bar">
          <div className="matrix-header-left">
            <div className="matrix-header-title">
              <Calendar size={18} style={{ color: 'var(--accent-primary)' }} />
              <span className="teacher-name-txt">{teacher.teacherName}</span>
              <span className="teacher-id-tag">{teacher.teacherId}</span>
            </div>

            <div className="matrix-header-badges">
              <span 
                className="badge-rating" 
                title={teacher.ratingDetails?.hasReviews 
                  ? `Average ${teacher.rating.toFixed(1)}★ across ${teacher.ratingDetails.sessionsCount} sessions (${teacher.ratingDetails.totalReviewsCount} student reviews)` 
                  : 'No session reviews yet'}
              >
                {teacher.ratingDetails?.hasReviews ? `★ ${teacher.rating.toFixed(1)}` : 'No reviews'}
                {teacher.ratingDetails?.hasReviews && (
                  <span style={{ fontSize: '0.68rem', marginLeft: '4px', opacity: 0.9 }}>
                    ({teacher.ratingDetails.sessionsCount} sess)
                  </span>
                )}
              </span>
              {teacher.contact && (
                <span className="badge-contact" title="Teacher Contact">{teacher.contact}</span>
              )}
              <span className={`vacancy-badge ${teacher.vacancyColor || 'gray'}`}>
                <span className="vacancy-dot"></span>
                <span>{teacher.vacancyLabel}</span>
              </span>
            </div>
          </div>

          {/* Right side: Zoom Controls & Close Button */}
          <div className="matrix-header-right">
            <div className="zoom-controls-group" title="Zoom in/out to adjust timetable slot height">
              <button 
                type="button"
                className="zoom-btn" 
                onClick={handleZoomOut} 
                disabled={zoomLevel <= 0.65}
                title="Zoom Out (make slots more compact)"
              >
                <ZoomOut size={13} />
              </button>
              <button 
                type="button"
                className="zoom-reset-btn" 
                onClick={handleResetZoom}
                title="Reset Zoom to 100%"
              >
                {Math.round(zoomLevel * 100)}%
              </button>
              <button 
                type="button"
                className="zoom-btn" 
                onClick={handleZoomIn} 
                disabled={zoomLevel >= 1.5}
                title="Zoom In (expand slots)"
              >
                <ZoomIn size={13} />
              </button>
            </div>

            <button className="modal-close-btn" onClick={onClose} title="Close Timetable">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Ultra-Slim Summary Ribbon with Toggle Checkbox-Buttons (Audio: Default HOLD=checked, Booked=unchecked) */}
        <div className="matrix-summary-ribbon">
          <div className="ribbon-stats">
            <span>Total: <strong>{teacher.totalSlotsCount} slots ({formatDuration(teacher.totalMinutes)})</strong></span>
            <span className="ribbon-sep">•</span>
            <span style={{ color: '#047857' }}>Remaining: <strong>{teacher.remainingSlotsCount} free ({formatDuration(teacher.remainingMinutes)})</strong></span>
            
            {teacher.teachLanguages && teacher.teachLanguages.length > 0 && (
              <>
                <span className="ribbon-sep">•</span>
                <span className="lang-tag" style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem' }}>
                  <Globe size={10} style={{ color: 'var(--accent-primary)' }} />
                  {teacher.teachLanguages.join(', ')}
                </span>
              </>
            )}
          </div>

          {/* Visibility Toggle Controls (Audio Request: Click to enable/disable, HOLD default ON, Booked default OFF) */}
          <div className="matrix-visibility-controls">
            <label 
              className={`matrix-toggle-pill hold ${showHold ? 'active' : 'inactive'}`}
              title={showHold ? 'Click to hide HOLD sessions' : 'Click to show HOLD sessions'}
            >
              <input 
                type="checkbox" 
                checked={showHold} 
                onChange={e => setShowHold(e.target.checked)} 
              />
              <span>HOLD ({holdSessionsCount})</span>
            </label>

            <label 
              className={`matrix-toggle-pill booked ${showBooked ? 'active' : 'inactive'}`}
              title={showBooked ? 'Click to hide Booked classes' : 'Click to show Booked classes'}
            >
              <input 
                type="checkbox" 
                checked={showBooked} 
                onChange={e => setShowBooked(e.target.checked)} 
              />
              <span>Booked ({bookedSessionsCount})</span>
            </label>

            {/* Inline Filter Target Badge if Active */}
            {filterOverlayInfo && (
              <div className="ribbon-target-chip">
                <Target size={12} style={{ color: 'var(--accent-primary)' }} />
                <span>
                  {filterOverlayInfo.targetStartStr} - {filterOverlayInfo.targetEndStr}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Interactive Timetable Calendar Grid with Cropped Hours (Single Clean Scrollbar) */}
        <div className="matrix-body-content">
          <div className="calendar-timeline-wrapper">
            {/* Timetable Body Scroll Container (Sticky Day Header + Grid Body) */}
            <div className="timeline-scroll-container">
              {/* Sticky Header Row: Corner + 7 Day Headers */}
              <div className="timeline-header-row">
                <div className="timeline-corner-cell">Time</div>
                {windowDates.map(dateObj => {
                  const isTargetDay = filterOverlayInfo && (!filterOverlayInfo.activeWeekdays || filterOverlayInfo.activeWeekdays.includes(dateObj.weekday));

                  return (
                    <div 
                      key={dateObj.dateStr} 
                      className={`timeline-day-header ${isTargetDay ? 'target-highlighted' : ''}`}
                    >
                      <span className="day-name">{dateObj.weekday}</span>
                      <span className={`day-date ${dateObj.isToday ? 'today' : ''}`}>
                        {dateObj.dayOfMonth} {dateObj.monthName} {dateObj.isToday ? '(Today)' : ''}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Timetable Grid Body (Cropped to active hours so it fits cleanly) */}
              <div className="timeline-grid-body" style={{ height: `${totalHours * hourHeight}px` }}>
                
                {/* Left Y-Axis Time Column (Cropped to Active Hours) */}
                <div className="timeline-time-col">
                  {hours.map(h => (
                    <div 
                      key={h} 
                      className="timeline-time-label" 
                      style={{ height: `${hourHeight}px` }}
                    >
                      <span>{formatHourLabel(h)}</span>
                    </div>
                  ))}
                </div>

                {/* 7 Day Column Tracks */}
                {windowDates.map(dateObj => {
                  const dayFreeSlots = teacher.remainingSlots.filter(s => s.date === dateObj.dateStr);
                  const dayHoldSessions = teacher.bookedInstances.filter(
                    b => b.date === dateObj.dateStr && (b.status || '').toLowerCase() === 'hold'
                  );
                  const dayBookedSessions = teacher.bookedInstances.filter(
                    b => b.date === dateObj.dateStr && (b.status || '').toLowerCase() !== 'hold'
                  );

                  const isTargetDay = filterOverlayInfo && (!filterOverlayInfo.activeWeekdays || filterOverlayInfo.activeWeekdays.includes(dateObj.weekday));
                  const gridStartMins = startHour * 60;

                  return (
                    <div key={dateObj.dateStr} className="timeline-day-track">
                      {/* Horizontal Hour Grid Guidelines (Crisp, Slightly Darker for High Visibility) */}
                      {hours.map(h => (
                        <div 
                          key={h} 
                          className="timeline-grid-line" 
                          style={{ height: `${hourHeight}px` }} 
                        />
                      ))}

                      {/* Filter Target Shaded Window Overlay (Sky Blue / Cyan distinction) */}
                      {isTargetDay && (
                        <div 
                          className="filter-target-overlay"
                          style={{ 
                            top: `${filterOverlayInfo.topPx}px`, 
                            height: `${filterOverlayInfo.heightPx}px` 
                          }}
                        >
                          <div className="filter-target-badge">
                            <Target size={9} />
                            <span>Target Filter</span>
                          </div>
                        </div>
                      )}

                      {/* Booked / Active Classes (Clean Blue - Shows Teacher Assign ID per audio request) */}
                      {showBooked && dayBookedSessions.map((b, idx) => {
                        const topPx = Math.max(0, ((b.startMins - gridStartMins) / 60) * hourHeight);
                        const heightPx = Math.max(22, ((b.endMins - b.startMins) / 60) * hourHeight);

                        return (
                          <div 
                            key={`booked-${idx}`} 
                            className="timeline-event-card booked"
                            style={{ top: `${topPx}px`, height: `${heightPx}px` }}
                            onClick={() => setSelectedEvent({ type: 'booked', data: b })}
                            title={`Booked Class: ${b.assignId} (${b.startTimeStr} - ${b.endTimeStr}). Click for details.`}
                          >
                            <div className="event-time-row">
                              <span>{b.startTimeStr} - {b.endTimeStr}</span>
                              <span className="assign-id-pill">{b.assignId}</span>
                            </div>
                          </div>
                        );
                      })}

                      {/* HOLD Sessions (Amber - Shown when showHold is true) */}
                      {showHold && dayHoldSessions.map((b, idx) => {
                        const topPx = Math.max(0, ((b.startMins - gridStartMins) / 60) * hourHeight);
                        const heightPx = Math.max(22, ((b.endMins - b.startMins) / 60) * hourHeight);

                        return (
                          <div 
                            key={`hold-${idx}`} 
                            className="timeline-event-card hold"
                            style={{ top: `${topPx}px`, height: `${heightPx}px` }}
                            onClick={() => setSelectedEvent({ type: 'hold', data: b })}
                            title="Click to view HOLD session details"
                          >
                            <div className="event-time-row">
                              <span>{b.startTimeStr} - {b.endTimeStr}</span>
                              <span style={{ textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: 800 }}>HOLD</span>
                            </div>
                          </div>
                        );
                      })}

                      {/* Remaining Free Slots (Uniform Clean Emerald Green - Click for details) */}
                      {dayFreeSlots.map((s, idx) => {
                        const topPx = Math.max(0, ((s.slot_start_mins - gridStartMins) / 60) * hourHeight);
                        const heightPx = Math.max(22, ((s.slot_end_mins - s.slot_start_mins) / 60) * hourHeight);

                        return (
                          <div 
                            key={`free-${idx}`} 
                            className="timeline-event-card free"
                            style={{ top: `${topPx}px`, height: `${heightPx}px` }}
                            onClick={() => setSelectedEvent({ type: 'free', data: s })}
                            title="Click to view free slot details"
                          >
                            <div className="event-time-row">
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                                <CheckCircle size={10} />
                                {s.slot_start_time} - {s.slot_end_time}
                              </span>
                              <span>{s.duration_minutes}m Free</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* On-Click Slot / HOLD / Booked Details Popup Modal */}
      {selectedEvent && (
        <div 
          className="modal-overlay" 
          style={{ zIndex: 70 }} 
          onClick={() => setSelectedEvent(null)}
        >
          <div 
            className="modal-content" 
            style={{ maxWidth: '440px', padding: 0 }} 
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-title" style={{ fontSize: '1rem' }}>
                {selectedEvent.type === 'booked' ? (
                  <>
                    <Calendar size={18} style={{ color: '#2563eb' }} />
                    <span>Booked Class Details</span>
                  </>
                ) : selectedEvent.type === 'hold' ? (
                  <>
                    <AlertTriangle size={18} style={{ color: '#d97706' }} />
                    <span>HOLD Session Details</span>
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} style={{ color: '#059669' }} />
                    <span>Free Available Slot Details</span>
                  </>
                )}
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedEvent(null)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ padding: '1.25rem', gap: '0.75rem' }}>
              {selectedEvent.type === 'booked' ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Time Interval:</span>
                    <strong style={{ fontSize: '0.85rem', color: '#1e40af' }}>
                      {selectedEvent.data.startTimeStr} - {selectedEvent.data.endTimeStr} ({selectedEvent.data.duration} mins)
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Status:</span>
                    <span className="vacancy-badge blue" style={{ padding: '0.15rem 0.5rem', fontSize: '0.72rem', background: '#dbeafe', color: '#1e40af', border: '1px solid #bfdbfe' }}>
                      Active Booked Class
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Student ID:</span>
                    <strong style={{ fontSize: '0.85rem' }}>{selectedEvent.data.studentId || 'N/A'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Subject:</span>
                    <strong style={{ fontSize: '0.85rem', textAlign: 'right', maxWidth: '240px' }}>
                      {selectedEvent.data.subjectLabel || selectedEvent.data.subjectId || 'N/A'}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Allocation ID:</span>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {selectedEvent.data.assignId}
                    </span>
                  </div>
                </>
              ) : selectedEvent.type === 'hold' ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Time Interval:</span>
                    <strong style={{ fontSize: '0.85rem', color: '#b45309' }}>
                      {selectedEvent.data.startTimeStr} - {selectedEvent.data.endTimeStr} ({selectedEvent.data.duration} mins)
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Status:</span>
                    <span className="vacancy-badge yellow" style={{ padding: '0.15rem 0.5rem', fontSize: '0.72rem' }}>
                      HOLD
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Student ID:</span>
                    <strong style={{ fontSize: '0.85rem' }}>{selectedEvent.data.studentId || 'N/A'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Subject:</span>
                    <strong style={{ fontSize: '0.85rem', textAlign: 'right', maxWidth: '240px' }}>
                      {selectedEvent.data.subjectLabel || selectedEvent.data.subjectId || 'N/A'}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Allocation ID:</span>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {selectedEvent.data.assignId}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Free Interval:</span>
                    <strong style={{ fontSize: '0.85rem', color: '#059669' }}>
                      {selectedEvent.data.slot_start_time} - {selectedEvent.data.slot_end_time} ({selectedEvent.data.duration_minutes} mins free)
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Day & Date:</span>
                    <strong style={{ fontSize: '0.85rem' }}>
                      {selectedEvent.data.weekday}, {selectedEvent.data.date}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Original Base Window:</span>
                    <strong style={{ fontSize: '0.85rem' }}>
                      {selectedEvent.data.orig_window_start} - {selectedEvent.data.orig_window_end}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Availability ID:</span>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {selectedEvent.data.orig_avail_id}
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="modal-footer" style={{ padding: '0.65rem 1.25rem' }}>
              <button className="header-btn" onClick={() => setSelectedEvent(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
