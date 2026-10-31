import React, { useState, useMemo } from 'react';
import { X, BookOpen, Search, Bookmark, GraduationCap, Layers, Building2, Tag, Check, Sparkles } from 'lucide-react';

export default function SubjectCombinationsModal({ teacher, onClose }) {
  const [search, setSearch] = useState('');

  if (!teacher) return null;

  // Extract distinct committed scope dimensions
  const committedClasses = useMemo(() => {
    if (teacher.stages && teacher.stages.length > 0) return teacher.stages;
    const set = new Set();
    (teacher.qualifiedSubjects || []).forEach(s => s.stage && set.add(s.stage));
    return Array.from(set).sort();
  }, [teacher]);

  const committedLevels = useMemo(() => {
    if (teacher.levels && teacher.levels.length > 0) return teacher.levels;
    const set = new Set();
    (teacher.qualifiedSubjects || []).forEach(s => s.level && set.add(s.level));
    return Array.from(set).sort();
  }, [teacher]);

  const committedSubjects = useMemo(() => {
    if (teacher.subjectNames && teacher.subjectNames.length > 0) return teacher.subjectNames;
    const set = new Set();
    (teacher.qualifiedSubjects || []).forEach(s => s.name && set.add(s.name));
    return Array.from(set).sort();
  }, [teacher]);

  const committedBoards = useMemo(() => {
    if (teacher.boards && teacher.boards.length > 0) return teacher.boards;
    const set = new Set();
    (teacher.qualifiedSubjects || []).forEach(s => s.board && set.add(s.board));
    return Array.from(set).sort();
  }, [teacher]);

  const committedDepartments = useMemo(() => {
    if (teacher.departments && teacher.departments.length > 0) return teacher.departments;
    const set = new Set();
    (teacher.qualifiedSubjects || []).forEach(s => s.department && set.add(s.department));
    return Array.from(set).sort();
  }, [teacher]);

  const filteredSubjects = (teacher.qualifiedSubjects || []).filter(s => {
    const q = search.toLowerCase();
    return (
      (s.label || '').toLowerCase().includes(q) ||
      (s.name || '').toLowerCase().includes(q) ||
      (s.board || '').toLowerCase().includes(q) ||
      (s.stage || '').toLowerCase().includes(q) ||
      (s.level || '').toLowerCase().includes(q) ||
      (s.department || '').toLowerCase().includes(q) ||
      (s.id || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '840px', width: '92vw' }}
      >
        <div className="modal-header">
          <div className="modal-title">
            <BookOpen size={20} style={{ color: 'var(--accent-sky, #0284c7)' }} />
            <span>Subject Combinations: {teacher.teacherName}</span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* TEACHER COMMITTED SCOPE OVERVIEW (Directly above search bar) */}
          <div style={{
            background: '#ffffff',
            border: '1.5px solid #e2e8f0',
            borderRadius: '12px',
            padding: '1rem 1.25rem',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.85rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 800, fontSize: '0.88rem', color: '#0f172a' }}>
                <Sparkles size={16} style={{ color: '#0284c7' }} />
                <span>Teacher Committed Scope Overview</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <span>Teacher ID: <strong style={{ color: '#0f172a' }}>{teacher.teacherId}</strong></span>
                <span>•</span>
                <span>Total Combinations: <strong style={{ color: '#0284c7' }}>{teacher.qualifiedSubjects?.length || 0}</strong></span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
              {/* 1. Committed Classes */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  🎓 Committed Classes ({committedClasses.length}):
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {committedClasses.length > 0 ? committedClasses.map(cls => (
                    <span 
                      key={cls}
                      onClick={() => setSearch(cls)}
                      style={{
                        background: '#f5f3ff',
                        color: '#6b21a8',
                        border: '1px solid #ddd6fe',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                      title={`Filter by ${cls}`}
                    >
                      {cls}
                    </span>
                  )) : <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>None</span>}
                </div>
              </div>

              {/* 2. Committed Levels */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  📊 Committed Levels ({committedLevels.length}):
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {committedLevels.length > 0 ? committedLevels.map(lvl => (
                    <span 
                      key={lvl}
                      onClick={() => setSearch(lvl)}
                      style={{
                        background: '#f0fdfa',
                        color: '#0f766e',
                        border: '1px solid #99f6e4',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                      title={`Filter by ${lvl}`}
                    >
                      {lvl}
                    </span>
                  )) : <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>None</span>}
                </div>
              </div>

              {/* 3. Committed Subjects */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  📚 Committed Subjects ({committedSubjects.length}):
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {committedSubjects.length > 0 ? committedSubjects.map(sub => (
                    <span 
                      key={sub}
                      onClick={() => setSearch(sub)}
                      style={{
                        background: '#ecfdf5',
                        color: '#047857',
                        border: '1px solid #a7f3d0',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                      title={`Filter by ${sub}`}
                    >
                      {sub}
                    </span>
                  )) : <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>None</span>}
                </div>
              </div>

              {/* 4. Committed Boards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  🏛️ Committed Boards ({committedBoards.length}):
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {committedBoards.length > 0 ? committedBoards.map(brd => (
                    <span 
                      key={brd}
                      onClick={() => setSearch(brd)}
                      style={{
                        background: '#eff6ff',
                        color: '#1d4ed8',
                        border: '1px solid #bfdbfe',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                      title={`Filter by ${brd}`}
                    >
                      {brd}
                    </span>
                  )) : <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>None</span>}
                </div>
              </div>

              {/* 5. Committed Departments */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  🏢 Committed Departments ({committedDepartments.length}):
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {committedDepartments.length > 0 ? committedDepartments.map(dept => (
                    <span 
                      key={dept}
                      onClick={() => setSearch(dept)}
                      style={{
                        background: '#fffbeb',
                        color: '#b45309',
                        border: '1px solid #fde68a',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                      title={`Filter by ${dept}`}
                    >
                      {dept}
                    </span>
                  )) : (
                    <span style={{
                      background: '#f8fafc',
                      color: '#64748b',
                      border: '1px solid #e2e8f0',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.5rem',
                      borderRadius: '6px'
                    }}>
                      General
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* SEARCH BAR (Directly below the overview card) */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.95rem', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="filter-input"
              style={{ paddingLeft: '2.4rem', width: '100%', height: '40px' }}
              placeholder="Search combinations by subject name, board, class, level, ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
            {search && (
              <button 
                type="button" 
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  background: 'none',
                  border: 'none',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  lineHeight: 1
                }}
                title="Clear search"
              >
                ×
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <span>
              Showing <strong>{filteredSubjects.length}</strong> of {teacher.qualifiedSubjects?.length || 0} combinations
              {search && <span> (filtered by "<em>{search}</em>")</span>}
            </span>
            {search && (
              <button 
                type="button" 
                onClick={() => setSearch('')} 
                style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Reset Search
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '45vh', overflowY: 'auto', paddingRight: '0.2rem' }}>
            {filteredSubjects.map((sub, idx) => (
              <div 
                key={`${sub.id}-${idx}`}
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '0.8rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  transition: 'transform 0.15s ease, border-color 0.15s ease'
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.92rem' }}>
                    {sub.label || sub.name}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#64748b', display: 'flex', gap: '0.6rem', marginTop: '0.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ color: '#0284c7', fontWeight: 700 }}>{sub.board || 'General'}</span>
                    <span>•</span>
                    <span style={{ fontWeight: 600 }}>{sub.stage || 'Class'}</span>
                    {sub.level && (
                      <>
                        <span>•</span>
                        <span style={{ color: '#0f766e', fontWeight: 600 }}>{sub.level}</span>
                      </>
                    )}
                    {sub.department && (
                      <>
                        <span>•</span>
                        <span style={{ color: '#b45309', fontWeight: 600 }}>{sub.department}</span>
                      </>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.74rem', background: '#f1f5f9', padding: '0.2rem 0.55rem', borderRadius: '6px', color: '#475569', fontFamily: 'monospace', fontWeight: 700, border: '1px solid #e2e8f0' }}>
                    {sub.id}
                  </span>
                </div>
              </div>
            ))}

            {filteredSubjects.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                No combinations matched "{search}"
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0' }}>
          <button className="header-btn" onClick={onClose} style={{ padding: '0.5rem 1.25rem', fontWeight: 700 }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
