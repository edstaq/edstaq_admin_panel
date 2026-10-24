import React from 'react';
import { Users, Clock, CalendarCheck, PauseCircle, CheckCircle2, Layers, AlertTriangle } from 'lucide-react';
import { formatDuration } from '../utils/timeUtils';

export default function MetricsCards({ 
  teacherSummaries = [], 
  rawRemainingSlots = [], 
  assignmentStats = null,
  windowDays = 7,
  sessionDuration = 75,
  urgentAllocationNeeded = 0
}) {
  const activeTeachersCount = teacherSummaries.length;
  
  const totalAvailSlots = teacherSummaries.reduce((acc, t) => acc + t.totalSlotsCount, 0);
  const totalAvailMinutes = teacherSummaries.reduce((acc, t) => acc + t.totalMinutes, 0);

  // Active Assignments Stats (from direct assignmentStats or fallback)
  const activeTeachersWithAllocCount = assignmentStats?.active?.teachersCount ?? 
    teacherSummaries.filter(t => (t.activeSlotsCount || 0) > 0).length;
  const totalActiveSlots = assignmentStats?.active?.classesCount ?? 
    teacherSummaries.reduce((acc, t) => acc + (t.activeSlotsCount || 0), 0);
  const totalActiveMinutes = assignmentStats?.active?.totalMinutes ?? 
    teacherSummaries.reduce((acc, t) => acc + (t.activeMinutes || 0), 0);

  // HOLD Assignments Stats (from direct assignmentStats or fallback)
  const holdTeachersWithAllocCount = assignmentStats?.hold?.teachersCount ?? 
    teacherSummaries.filter(t => (t.holdSlotsCount || 0) > 0).length;
  const totalHoldSlots = assignmentStats?.hold?.classesCount ?? 
    teacherSummaries.reduce((acc, t) => acc + (t.holdSlotsCount || 0), 0);
  const totalHoldMinutes = assignmentStats?.hold?.totalMinutes ?? 
    teacherSummaries.reduce((acc, t) => acc + (t.holdMinutes || 0), 0);

  const totalRemainingSlots = rawRemainingSlots.length;
  const totalRemainingMinutes = rawRemainingSlots.reduce((acc, s) => acc + s.duration_minutes, 0);

  // Calculate total vacant bookable sessions based on sessionDuration (e.g. 75 mins)
  const totalVacantSessions = rawRemainingSlots.reduce((acc, s) => {
    return acc + Math.floor(s.duration_minutes / sessionDuration);
  }, 0);

  return (
    <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
      {/* 0. Urgent Allocation Needed (Audio 1: Added from Supply vs Demand) */}
      <div 
        className="metric-card urgent-kpi-card" 
        style={{ 
          borderColor: urgentAllocationNeeded > 0 ? '#fca5a5' : 'var(--border-color)', 
          background: urgentAllocationNeeded > 0 ? 'linear-gradient(135deg, #fff5f5 0%, #ffffff 100%)' : 'var(--bg-card)',
          boxShadow: urgentAllocationNeeded > 0 ? '0 4px 12px rgba(220, 38, 38, 0.08)' : 'var(--shadow-sm)'
        }}
      >
        <div className="metric-icon-box" style={{ background: urgentAllocationNeeded > 0 ? '#dc2626' : '#fee2e2', color: urgentAllocationNeeded > 0 ? '#ffffff' : '#dc2626' }}>
          <AlertTriangle size={22} />
        </div>
        <div className="metric-info">
          <span className="metric-label" style={{ color: urgentAllocationNeeded > 0 ? '#991b1b' : 'var(--text-muted)', fontWeight: 700 }}>
            Urgent Allocation Needed
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
            <span className="metric-value" style={{ color: urgentAllocationNeeded > 0 ? '#b91c1c' : 'var(--text-primary)' }}>
              {urgentAllocationNeeded}
            </span>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: urgentAllocationNeeded > 0 ? '#dc2626' : 'var(--text-muted)' }}>
              Active Demos
            </span>
          </div>
          <span className="metric-sub" style={{ color: urgentAllocationNeeded > 0 ? '#7f1d1d' : 'var(--text-muted)', fontWeight: 600 }}>
            Scheduled without Teacher!
          </span>
        </div>
      </div>

      {/* 1. Active Teachers */}
      <div className="metric-card">
        <div className="metric-icon-box royal">
          <Users size={22} />
        </div>
        <div className="metric-info">
          <span className="metric-label">Active Teachers</span>
          <span className="metric-value">{activeTeachersCount}</span>
          <span className="metric-sub">Verified & Onboarded</span>
        </div>
      </div>

      {/* 2. Total Availability */}
      <div className="metric-card">
        <div className="metric-icon-box indigo">
          <Clock size={22} />
        </div>
        <div className="metric-info">
          <span className="metric-label">Total Availability ({windowDays}d)</span>
          <span className="metric-value">{totalAvailSlots} <small style={{ fontSize: '0.82rem', fontWeight: 500 }}>slots</small></span>
          <span className="metric-sub">{formatDuration(totalAvailMinutes)} committed</span>
        </div>
      </div>

      {/* 3. Allocated Active: Distinct teachers & total occupied time */}
      <div className="metric-card">
        <div className="metric-icon-box amber">
          <CalendarCheck size={22} />
        </div>
        <div className="metric-info">
          <span className="metric-label">Allocated (Active)</span>
          <span className="metric-value">
            {activeTeachersWithAllocCount} <small style={{ fontSize: '0.82rem', fontWeight: 500 }}>teachers</small>
          </span>
          <span className="metric-sub">
            {formatDuration(totalActiveMinutes)} occupied ({totalActiveSlots} {totalActiveSlots === 1 ? 'class' : 'classes'})
          </span>
        </div>
      </div>

      {/* 4. Allocated HOLD: Distinct teachers & total on hold time */}
      <div className="metric-card">
        <div className="metric-icon-box" style={{ background: '#fef3c7', color: '#b45309' }}>
          <PauseCircle size={22} />
        </div>
        <div className="metric-info">
          <span className="metric-label">Allocated (HOLD)</span>
          <span className="metric-value" style={{ color: '#b45309' }}>
            {holdTeachersWithAllocCount} <small style={{ fontSize: '0.82rem', fontWeight: 500 }}>teachers</small>
          </span>
          <span className="metric-sub">
            {formatDuration(totalHoldMinutes)} on hold ({totalHoldSlots} {totalHoldSlots === 1 ? 'class' : 'classes'})
          </span>
        </div>
      </div>

      {/* 5. Remaining Free Slots */}
      <div className="metric-card">
        <div className="metric-icon-box emerald">
          <CheckCircle2 size={22} />
        </div>
        <div className="metric-info">
          <span className="metric-label">Remaining Free Slots</span>
          <span className="metric-value" style={{ color: '#047857' }}>
            {totalRemainingSlots} <small style={{ fontSize: '0.82rem', fontWeight: 500 }}>open</small>
          </span>
          <span className="metric-sub">{formatDuration(totalRemainingMinutes)} free time</span>
        </div>
      </div>

      {/* 6. Vacant Bookable Sessions */}
      <div className="metric-card highlight-session-card">
        <div className="metric-icon-box session">
          <Layers size={22} />
        </div>
        <div className="metric-info">
          <span className="metric-label">Vacant Sessions ({sessionDuration}m)</span>
          <span className="metric-value" style={{ color: 'var(--accent-primary)' }}>
            {totalVacantSessions} <small style={{ fontSize: '0.82rem', fontWeight: 600 }}>sessions</small>
          </span>
          <span className="metric-sub">Full {sessionDuration}m capacity</span>
        </div>
      </div>
    </div>
  );
}
