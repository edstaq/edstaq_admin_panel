import React from 'react';
import { Clock, Star, Phone, Scissors, CalendarCheck, Globe } from 'lucide-react';

export default function DetailedSlotsTable({ slots = [], onOpenTeacherMatrix }) {
  if (slots.length === 0) {
    return (
      <div className="table-container" style={{ padding: '3.5rem', textAlign: 'center', background: '#ffffff' }}>
        <p style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 700 }}>
          No free slots match the selected criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="responsive-table">
        <thead>
          <tr>
            <th>Date & Day</th>
            <th>Remaining Free Interval</th>
            <th>Duration</th>
            <th>Teacher Details</th>
            <th>Original Window & Split</th>
            <th>Vacancy Status</th>
            <th style={{ textAlign: 'right' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {slots.map(slot => {
            const vacancyClass = slot.vacancy_status === 'vacant' ? 'green' : (slot.vacancy_status === 'partial' ? 'yellow' : 'red');

            return (
              <tr key={slot.slot_id}>
                {/* Date & Weekday */}
                <td>
                  <div style={{ fontWeight: 800, color: '#0f172a' }}>
                    {slot.weekday}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                    {slot.date}
                  </div>
                </td>

                {/* Free Interval */}
                <td>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', background: '#ecfdf5', border: '1.5px solid #6ee7b7', padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-md)' }}>
                    <Clock size={13} style={{ color: '#059669' }} />
                    <span style={{ fontWeight: 800, color: '#065f46', fontSize: '0.9rem' }}>
                      {slot.slot_start_time} - {slot.slot_end_time}
                    </span>
                  </div>
                </td>

                {/* Duration */}
                <td>
                  <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>
                    {slot.duration_minutes} min
                  </span>
                </td>

                {/* Teacher Details */}
                <td>
                  <div style={{ fontWeight: 800, color: '#0f172a' }}>
                    {slot.teacher_name}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.4rem', marginTop: '0.15rem' }}>
                    <span style={{ fontWeight: 600 }}>{slot.teacher_id}</span>
                    {slot.teacher_contact && (
                      <span>• 📞 {slot.teacher_contact}</span>
                    )}
                    {slot.rating_details?.hasReviews && (
                      <span 
                        style={{ color: '#d97706', display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: 700 }}
                        title={`Average ${slot.rating.toFixed(1)}★ across ${slot.rating_details.sessionsCount} sessions (${slot.rating_details.totalReviewsCount} student reviews)`}
                      >
                        <Star size={11} fill="#f59e0b" color="#f59e0b" /> {slot.rating.toFixed(1)}
                        <span style={{ fontSize: '0.70rem', color: '#64748b', fontWeight: 600 }}>
                          ({slot.rating_details.sessionsCount} sess)
                        </span>
                      </span>
                    )}
                  </div>
                  {slot.teach_languages && slot.teach_languages.length > 0 && (
                    <div style={{ marginTop: '0.25rem' }}>
                      <span className="lang-tag">
                        <Globe size={10} style={{ color: '#1d4ed8' }} />
                        {slot.teach_languages.join(', ')}
                      </span>
                    </div>
                  )}
                </td>

                {/* Original Window & Split Info */}
                <td>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    Base: {slot.orig_window_start} - {slot.orig_window_end}
                  </div>
                  {slot.is_split ? (
                    <span className="status-badge split" style={{ marginTop: '0.25rem' }}>
                      <Scissors size={11} />
                      <span>Cut by {slot.cut_by_assign_id}</span>
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Full unallocated window
                    </span>
                  )}
                </td>

                {/* Vacancy Status */}
                <td>
                  <span className={`vacancy-badge ${vacancyClass}`}>
                    <span className="vacancy-dot"></span>
                    <span>
                      {slot.vacancy_status === 'vacant' ? 'Vacant' : (slot.vacancy_status === 'partial' ? 'Partially Booked' : 'Filled')}
                    </span>
                  </span>
                </td>

                {/* Action */}
                <td style={{ textAlign: 'right' }}>
                  <button
                    className="action-btn"
                    onClick={() => onOpenTeacherMatrix && onOpenTeacherMatrix(slot.teacher_id)}
                  >
                    <CalendarCheck size={13} />
                    <span>View Day</span>
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
