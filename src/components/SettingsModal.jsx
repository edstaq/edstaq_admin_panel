import React, { useState } from 'react';
import { X, Settings, Clock } from 'lucide-react';
import { formatDateISO } from '../utils/dateUtils';

export default function SettingsModal({
  settings,
  onSaveSettings,
  onClose
}) {
  const [windowDays, setWindowDays] = useState(settings.windowDays || 7);
  const [refDateStr, setRefDateStr] = useState(
    settings.refDate instanceof Date 
      ? formatDateISO(settings.refDate) 
      : (settings.refDate || formatDateISO(new Date()))
  );
  const [minDuration, setMinDuration] = useState(settings.minDuration || 0);
  const [sessionDuration, setSessionDuration] = useState(settings.sessionDuration || 75);

  const handleSave = () => {
    onSaveSettings({
      ...settings,
      windowDays: parseInt(windowDays, 10) || 7,
      refDate: refDateStr,
      minDuration: parseInt(minDuration, 10) || 0,
      sessionDuration: Math.max(15, parseInt(sessionDuration, 10) || 75)
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        style={{ maxWidth: '540px' }} 
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title">
            <Settings size={20} style={{ color: 'var(--accent-primary)' }} />
            <span>Calculation Parameters & Schedule Settings</span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {/* Standard Session Duration (Audio 1 & 3: Default 75m, configurable) */}
          <div className="filter-field">
            <label className="filter-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Clock size={12} style={{ color: 'var(--accent-primary)' }} />
              <span>Standard Class Session Duration</span>
            </label>
            <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {[45, 60, 75, 90, 120].map(mins => (
                <button
                  key={mins}
                  type="button"
                  className={`day-pill ${parseInt(sessionDuration, 10) === mins ? 'active' : ''}`}
                  onClick={() => setSessionDuration(mins)}
                >
                  {mins} mins {mins === 75 ? '(Default)' : ''}
                </button>
              ))}
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginLeft: 'auto' }}>
                <input
                  type="number"
                  min="15"
                  max="300"
                  step="5"
                  className="filter-input"
                  style={{ width: '75px', padding: '0.35rem 0.5rem', textAlign: 'center' }}
                  value={sessionDuration}
                  onChange={e => setSessionDuration(e.target.value)}
                />
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>mins</span>
              </div>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Defines the length of 1 full session (e.g. 75m). Used to compute how many bookable sessions each teacher can carry. (A 150m slot carries 2 sessions; slots &lt; {sessionDuration}m carry 0 sessions).
            </span>
          </div>

          {/* Rolling Window Days */}
          <div className="filter-field">
            <label className="filter-label">Rolling Allocation Window (Days)</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {[7, 14, 21, 30].map(days => (
                <button
                  key={days}
                  type="button"
                  className={`day-pill ${windowDays === days ? 'active' : ''}`}
                  onClick={() => setWindowDays(days)}
                >
                  {days} Days
                </button>
              ))}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Determines how many days into the future teacher allocations are projected and calculated.
            </span>
          </div>

          {/* Reference Start Date */}
          <div className="filter-field">
            <label className="filter-label">Evaluation Reference Date</label>
            <input
              type="date"
              className="filter-input"
              value={refDateStr}
              onChange={e => setRefDateStr(e.target.value)}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Schedule evaluations start from this date (Default: Today).
            </span>
          </div>

          {/* Minimum Free Slot Duration Filter */}
          <div className="filter-field">
            <label className="filter-label">Minimum Free Slot Duration</label>
            <select
              className="filter-select"
              value={minDuration}
              onChange={e => setMinDuration(e.target.value)}
            >
              <option value="0">All remaining slots (Any duration)</option>
              <option value="15">At least 15 minutes</option>
              <option value="30">At least 30 minutes</option>
              <option value="45">At least 45 minutes</option>
              <option value="60">At least 60 minutes (1 hour)</option>
            </select>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Hides small split slots that are shorter than this duration.
            </span>
          </div>
        </div>

        <div className="modal-footer">
          <button className="header-btn" onClick={onClose}>
            Cancel
          </button>
          <button className="header-btn primary" onClick={handleSave}>
            Save & Apply
          </button>
        </div>
      </div>
    </div>
  );
}
