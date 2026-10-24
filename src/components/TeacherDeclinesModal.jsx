import React, { useState } from 'react';
import { 
  X, 
  UserX, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  Calendar, 
  FileText, 
  CheckCircle2, 
  ShieldAlert, 
  Clock, 
  MessageSquare, 
  BookOpen,
  ChevronDown,
  Sparkles,
  Check,
  ShieldCheck
} from 'lucide-react';

const COMMON_REASONS = [
  'Schedule / Time Conflict',
  'Personal Emergency',
  'High Workload / Busy',
  'Health / Medical Issue',
  'Unreachable / No Response',
  'Subject / Class Out of Scope',
  'Travel / Connectivity Issue',
  'Other'
];

export default function TeacherDeclinesModal({
  teacher,
  onClose,
  onAddDecline,
  onDeleteDecline
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [reason, setReason] = useState(COMMON_REASONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [policyViolation, setPolicyViolation] = useState(false);
  const [note, setNote] = useState('');
  const [remarks, setRemarks] = useState('');
  const [dateStr, setDateStr] = useState(() => {
    const now = new Date();
    // format as YYYY-MM-DDTHH:mm local
    const offset = now.getTimezoneOffset();
    const localDate = new Date(now.getTime() - offset * 60000);
    return localDate.toISOString().slice(0, 16);
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!teacher) return null;

  const declinesList = teacher.declines || [];
  const declinesCount = declinesList.length;
  const policyViolationsCount = declinesList.filter(d => d.policyViolation).length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalReason = reason === 'Other' && customReason.trim() ? customReason.trim() : reason;
    if (!finalReason) return;

    setIsSubmitting(true);
    try {
      const formattedTimestamp = dateStr ? dateStr.replace('T', ' ') + ':00' : new Date().toISOString();
      await onAddDecline({
        teacherId: teacher.teacherId,
        teacherName: teacher.teacherName,
        reason: finalReason,
        policyViolation,
        note: note.trim(),
        remarks: remarks.trim(),
        timestamp: formattedTimestamp
      });

      // Reset form
      setReason(COMMON_REASONS[0]);
      setCustomReason('');
      setPolicyViolation(false);
      setNote('');
      setRemarks('');
      setIsAdding(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const setQuickTime = (type) => {
    const now = new Date();
    if (type === 'now') {
      const offset = now.getTimezoneOffset();
      setDateStr(new Date(now.getTime() - offset * 60000).toISOString().slice(0, 16));
    } else if (type === '1h') {
      const past = new Date(now.getTime() - 60 * 60000);
      const offset = past.getTimezoneOffset();
      setDateStr(new Date(past.getTime() - offset * 60000).toISOString().slice(0, 16));
    } else if (type === '1d') {
      const past = new Date(now.getTime() - 24 * 60 * 60000);
      const offset = past.getTimezoneOffset();
      setDateStr(new Date(past.getTime() - offset * 60000).toISOString().slice(0, 16));
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content declines-modal-content" 
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '680px', width: '92vw' }}
      >
        {/* Modal Header */}
        <div className="modal-header declines-modal-header">
          <div className="declines-header-info">
            <div className={`decline-icon-avatar ${declinesCount > 0 ? (policyViolationsCount > 0 ? 'violation' : 'warn') : 'good'}`}>
              {declinesCount > 0 ? <UserX size={20} /> : <ShieldCheck size={20} />}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <h3 className="declines-teacher-title">
                  {teacher.teacherName}
                </h3>
                <span className="teacher-id-chip">{teacher.teacherId}</span>
              </div>
              <p className="declines-header-sub">
                Teacher Booking Declines & Policy Audit
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span className={`declines-count-badge ${declinesCount > 0 ? 'has-declines' : 'zero'}`}>
              {declinesCount} {declinesCount === 1 ? 'Decline' : 'Declines'}
            </span>
            {policyViolationsCount > 0 ? (
              <span className="policy-violation-badge" title="Breaches operational scheduling policy">
                <ShieldAlert size={12} />
                {policyViolationsCount} Policy {policyViolationsCount === 1 ? 'Violation' : 'Violations'}
              </span>
            ) : (
              declinesCount === 0 && (
                <span className="standing-badge good" title="Zero booking declines on record">
                  <Check size={11} strokeWidth={3} />
                  Good Standing
                </span>
              )
            )}
            <button className="modal-close-btn" onClick={onClose} title="Close (Esc)">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="modal-body declines-modal-body">
          {/* Top Actions: Toggle Log Decline Form */}
          <div className="declines-top-bar">
            <div>
              <h4 className="declines-section-title">
                Decline Records ({declinesCount})
              </h4>
              <p className="declines-section-desc">
                {declinesCount === 0 
                  ? 'No declined requests logged. Log incidents when the teacher rejects an assigned student slot.'
                  : `${declinesCount} recorded incident${declinesCount === 1 ? '' : 's'}. Review reasons and policy compliance below.`}
              </p>
            </div>

            {!isAdding && (
              <button 
                type="button" 
                className="btn-log-decline-trigger"
                onClick={() => setIsAdding(true)}
              >
                <Plus size={15} />
                <span>Log New Decline</span>
              </button>
            )}
          </div>

          {/* New Decline Form Card */}
          {isAdding && (
            <div className="decline-form-card-premium">
              <div className="decline-form-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <div className="form-icon-pill">
                    <UserX size={14} color="#dc2626" />
                  </div>
                  <span className="form-title-text">
                    Log Booking Decline Incident
                  </span>
                </div>
                <button 
                  type="button" 
                  className="form-cancel-text-btn"
                  onClick={() => setIsAdding(false)}
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleSubmit} className="decline-form-body">
                {/* Date & Time Picker with Quick Presets */}
                <div className="decline-input-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label className="decline-input-label">
                      <Calendar size={13} style={{ color: '#2563eb' }} />
                      <span>Date & Time of Decline</span>
                    </label>
                    <div className="quick-time-presets">
                      <button type="button" onClick={() => setQuickTime('now')}>Now</button>
                      <button type="button" onClick={() => setQuickTime('1h')}>-1h</button>
                      <button type="button" onClick={() => setQuickTime('1d')}>Yesterday</button>
                    </div>
                  </div>
                  <div className="decline-input-wrapper">
                    <input
                      type="datetime-local"
                      className="decline-styled-input"
                      value={dateStr}
                      onChange={e => setDateStr(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Reason Selection with Quick Category Pills */}
                <div className="decline-input-group">
                  <label className="decline-input-label">
                    <AlertTriangle size={13} style={{ color: '#d97706' }} />
                    <span>Reason for Decline <strong style={{ color: '#ef4444' }}>*</strong></span>
                  </label>

                  {/* Dropdown for complete list */}
                  <div className="decline-select-wrapper">
                    <select
                      className="decline-styled-select"
                      value={reason}
                      onChange={e => setReason(e.target.value)}
                    >
                      {COMMON_REASONS.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="select-chevron" />
                  </div>

                  {reason === 'Other' && (
                    <div className="decline-input-wrapper" style={{ marginTop: '0.45rem' }}>
                      <input
                        type="text"
                        className="decline-styled-input"
                        placeholder="Please specify custom reason in detail..."
                        value={customReason}
                        onChange={e => setCustomReason(e.target.value)}
                        required
                        autoFocus
                      />
                    </div>
                  )}
                </div>

                {/* Class / Student Context */}
                <div className="decline-input-group">
                  <label className="decline-input-label">
                    <BookOpen size={13} style={{ color: '#2563eb' }} />
                    <span>Student / Class Context <small style={{ color: '#94a3b8' }}>(Optional)</small></span>
                  </label>
                  <div className="decline-input-wrapper">
                    <input
                      type="text"
                      className="decline-styled-input"
                      placeholder="e.g. Class 10 CBSE Maths - Student Ananya (Tuesday 7 PM)"
                      value={note}
                      onChange={e => setNote(e.target.value)}
                    />
                  </div>
                </div>

                {/* Remarks & Admin Notes */}
                <div className="decline-input-group">
                  <label className="decline-input-label">
                    <MessageSquare size={13} style={{ color: '#64748b' }} />
                    <span>Remarks & Coordinator Notes <small style={{ color: '#94a3b8' }}>(Optional)</small></span>
                  </label>
                  <textarea
                    className="decline-styled-textarea"
                    rows={2}
                    placeholder="Details: called teacher, teacher was travelling, rescheduled next week..."
                    value={remarks}
                    onChange={e => setRemarks(e.target.value)}
                  />
                </div>

                {/* Policy Violation Toggle Card */}
                <div 
                  className={`policy-violation-toggle-card ${policyViolation ? 'active' : ''}`}
                  onClick={() => setPolicyViolation(!policyViolation)}
                >
                  <div className="policy-toggle-left">
                    <div className={`policy-icon-box ${policyViolation ? 'active' : ''}`}>
                      <AlertTriangle size={16} />
                    </div>
                    <div>
                      <div className="policy-toggle-title">
                        Flag as Operational Policy Violation
                      </div>
                      <div className="policy-toggle-desc">
                        Mark if this decline breached booking rules (last-minute cancellation &lt;2 hrs, refusing committed open slots, or repeated unexcused absence).
                      </div>
                    </div>
                  </div>
                  <div className={`custom-switch ${policyViolation ? 'checked' : ''}`}>
                    <div className="switch-handle" />
                  </div>
                </div>

                {/* Form Action Buttons */}
                <div className="decline-form-actions">
                  <button
                    type="button"
                    className="btn-decline-cancel"
                    onClick={() => setIsAdding(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-decline-submit"
                    disabled={isSubmitting}
                  >
                    <UserX size={14} />
                    <span>{isSubmitting ? 'Recording...' : 'Record Decline'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Declines List */}
          {declinesList.length === 0 ? (
            <div className="declines-empty-card">
              <div className="empty-icon-halo">
                <CheckCircle2 size={36} color="#10b981" />
              </div>
              <h5 className="empty-title">
                Zero Declines Recorded
              </h5>
              <p className="empty-description">
                {teacher.teacherName} has accepted all booking assignments and maintains an active, reliable teaching profile.
              </p>
            </div>
          ) : (
            <div className="declines-history-feed">
              {declinesList.map((dec, idx) => {
                const dateDisplay = dec.timestamp 
                  ? new Date(dec.timestamp).toLocaleString(undefined, { 
                      day: '2-digit', 
                      month: 'short', 
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : 'Date not recorded';

                return (
                  <div 
                    key={dec.id || idx} 
                    className={`decline-feed-card ${dec.policyViolation ? 'has-policy-violation' : ''}`}
                  >
                    <div className="feed-card-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                        <span className="feed-reason-badge">
                          {dec.reason}
                        </span>
                        {dec.policyViolation && (
                          <span className="feed-violation-pill">
                            <ShieldAlert size={11} />
                            Policy Violation
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                        <div className="feed-time-chip">
                          <Clock size={11} />
                          <span>{dateDisplay}</span>
                        </div>
                        {onDeleteDecline && (
                          <button
                            type="button"
                            className="feed-delete-btn"
                            onClick={() => onDeleteDecline(dec.id || idx)}
                            title="Remove decline record"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>

                    {dec.note && (
                      <div className="feed-context-box">
                        <BookOpen size={12} className="feed-context-icon" />
                        <div>
                          <strong>Context:</strong> {dec.note}
                        </div>
                      </div>
                    )}

                    {dec.remarks && (
                      <div className="feed-remarks-box">
                        <MessageSquare size={12} className="feed-remarks-icon" />
                        <div>
                          <strong>Coordinator Remarks:</strong> {dec.remarks}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
