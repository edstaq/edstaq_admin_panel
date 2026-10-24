import React, { useState } from 'react';
import { X, BookOpen, Search, Tag } from 'lucide-react';

export default function SubjectCombinationsModal({ teacher, onClose }) {
  const [search, setSearch] = useState('');

  if (!teacher) return null;

  const filteredSubjects = teacher.qualifiedSubjects.filter(s => {
    const q = search.toLowerCase();
    return (
      (s.label || '').toLowerCase().includes(q) ||
      (s.name || '').toLowerCase().includes(q) ||
      (s.board || '').toLowerCase().includes(q) ||
      (s.stage || '').toLowerCase().includes(q) ||
      (s.id || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title">
            <BookOpen size={20} style={{ color: 'var(--accent-sky)' }} />
            <span>Subject Combinations: {teacher.teacherName}</span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="filter-input"
              placeholder="Search subjects by name, board, class..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <span>Showing {filteredSubjects.length} of {teacher.qualifiedSubjects.length} subjects</span>
            <span>Teacher ID: {teacher.teacherId}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '50vh', overflowY: 'auto' }}>
            {filteredSubjects.map((sub, idx) => (
              <div 
                key={`${sub.id}-${idx}`}
                style={{
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem'
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                    {sub.label || sub.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', gap: '0.6rem', marginTop: '0.2rem' }}>
                    <span style={{ color: 'var(--accent-sky)', fontWeight: 600 }}>{sub.board || 'General'}</span>
                    <span>•</span>
                    <span>{sub.stage || 'Class'}</span>
                    {sub.department && (
                      <>
                        <span>•</span>
                        <span>{sub.department}</span>
                      </>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.72rem', background: 'rgba(255, 255, 255, 0.06)', padding: '0.15rem 0.5rem', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    {sub.id}
                  </span>
                </div>
              </div>
            ))}

            {filteredSubjects.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No subjects matched "{search}"
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="header-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
