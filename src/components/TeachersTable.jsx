import React, { useState, useMemo } from 'react';
import { Star, Phone, BookOpen, Calendar, Globe, ArrowUpDown, ArrowUp, ArrowDown, UserX, Sparkles, RotateCcw, Info } from 'lucide-react';
import { formatDuration } from '../utils/timeUtils';

// Default multi-level comparator requested in Audio 2 & 3:
// 1. Available Free Slots on top (remainingSlotsCount > 0 first)
// 2. Rating descending (5★ down to 1★, reviewed before unreviewed)
// 3. Declines count ascending (0 declines, 1 decline, 2, 3...)
const defaultTeacherComparator = (a, b) => {
  // Priority 1 (Audio 3): Teachers WITH available free slots first
  const aHasFree = (a.remainingSlotsCount || 0) > 0 || (a.remainingSlots && a.remainingSlots.length > 0);
  const bHasFree = (b.remainingSlotsCount || 0) > 0 || (b.remainingSlots && b.remainingSlots.length > 0);
  if (aHasFree && !bHasFree) return -1;
  if (!aHasFree && bHasFree) return 1;

  // Priority 2 (Audio 2): Rating descending (highest rating first)
  const hasA = a.ratingDetails?.hasReviews;
  const hasB = b.ratingDetails?.hasReviews;
  if (hasA && !hasB) return -1;
  if (!hasA && hasB) return 1;
  if (hasA && hasB) {
    const rateA = a.ratingDetails?.avgRating || 0;
    const rateB = b.ratingDetails?.avgRating || 0;
    if (rateB !== rateA) {
      return rateB - rateA; // 5 -> 4 -> 3
    }
    // Tie-breaker in rating: session count descending
    const sessA = a.ratingDetails?.sessionsCount || 0;
    const sessB = b.ratingDetails?.sessionsCount || 0;
    if (sessB !== sessA) {
      return sessB - sessA;
    }
  }

  // Priority 3 (Audio 2): Declines count ascending (least declined first: 0, 1, 2, 3...)
  const decA = a.declinesCount || 0;
  const decB = b.declinesCount || 0;
  if (decA !== decB) {
    return decA - decB;
  }

  // Tie-breaker: policy violations count ascending
  const violA = a.policyViolationsCount || 0;
  const violB = b.policyViolationsCount || 0;
  if (violA !== violB) {
    return violA - violB;
  }

  // Tie-breaker: remaining slots count descending
  const remDiff = (b.remainingSlotsCount || 0) - (a.remainingSlotsCount || 0);
  if (remDiff !== 0) return remDiff;

  // Final tie-breaker: Teacher Name ascending
  return (a.teacherName || '').localeCompare(b.teacherName || '', undefined, { sensitivity: 'base' });
};

export default function TeachersTable({
  teachers = [],
  onOpenCombinations,
  onOpenMatrix,
  onOpenDeclines,
  sortConfig: externalSortConfig,
  onSortChange
}) {
  const [internalSortConfig, setInternalSortConfig] = useState({ key: null, direction: 'asc' });
  const sortConfig = externalSortConfig !== undefined ? externalSortConfig : internalSortConfig;
  const setSortConfig = onSortChange || setInternalSortConfig;

  const handleSort = (key) => {
    setSortConfig(prev => {
      if (prev.key === key) {
        if (prev.direction === 'asc') return { key, direction: 'desc' };
        if (prev.direction === 'desc') return { key: null, direction: 'asc' }; // Reset to default smart priority
      }
      // Initial direction: text/name defaults to asc, numbers/ratings default to desc
      const initialDirection = (key === 'name') ? 'asc' : 'desc';
      return { key, direction: initialDirection };
    });
  };

  // Sort computation across all 7 columns
  const sortedTeachers = useMemo(() => {
    if (!sortConfig.key) {
      return [...teachers].sort(defaultTeacherComparator);
    }

    const { key, direction } = sortConfig;
    const multiplier = direction === 'asc' ? 1 : -1;

    return [...teachers].sort((a, b) => {
      let comparison = 0;

      switch (key) {
        case 'name': {
          const nameA = (a.teacherName || '').trim();
          const nameB = (b.teacherName || '').trim();
          comparison = nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
          break;
        }

        case 'rating': {
          const hasA = a.ratingDetails?.hasReviews;
          const hasB = b.ratingDetails?.hasReviews;
          // Teachers with reviews come before unreviewed in desc, or vice-versa
          if (hasA && !hasB) return -1 * multiplier;
          if (!hasA && hasB) return 1 * multiplier;
          if (!hasA && !hasB) return 0;

          const rateA = a.ratingDetails?.avgRating || 0;
          const rateB = b.ratingDetails?.avgRating || 0;
          comparison = rateA - rateB;
          if (comparison === 0) {
            comparison = (a.ratingDetails?.sessionsCount || 0) - (b.ratingDetails?.sessionsCount || 0);
          }
          break;
        }

        case 'combinations': {
          const countA = a.qualifiedSubjects?.length || 0;
          const countB = b.qualifiedSubjects?.length || 0;
          comparison = countA - countB;
          break;
        }

        case 'totalSlots': {
          comparison = (a.totalSlotsCount || 0) - (b.totalSlotsCount || 0);
          if (comparison === 0) {
            comparison = (a.totalMinutes || 0) - (b.totalMinutes || 0);
          }
          break;
        }

        case 'booked': {
          comparison = (a.bookedSlotsCount || 0) - (b.bookedSlotsCount || 0);
          if (comparison === 0) {
            comparison = (a.bookedMinutes || 0) - (b.bookedMinutes || 0);
          }
          break;
        }

        case 'remaining': {
          const sessA = a.possibleSessions || 0;
          const sessB = b.possibleSessions || 0;
          comparison = sessA - sessB;
          if (comparison === 0) {
            comparison = (a.remainingSlotsCount || 0) - (b.remainingSlotsCount || 0);
          }
          if (comparison === 0) {
            comparison = (a.remainingMinutes || 0) - (b.remainingMinutes || 0);
          }
          break;
        }

        case 'fragility': {
          const scoreA = a.fragilityScore;
          const scoreB = b.fragilityScore;

          if (scoreA === null && scoreB === null) return 0;
          if (scoreA === null) return 1 * multiplier;
          if (scoreB === null) return -1 * multiplier;

          comparison = scoreA - scoreB;
          if (comparison === 0) {
            comparison = (a.qualifiedSubjects?.length || 0) - (b.qualifiedSubjects?.length || 0);
          }
          break;
        }

        case 'vacancy': {
          const weights = { vacant: 4, partial: 3, filled: 2, none: 1 };
          const weightA = weights[a.vacancyStatus] !== undefined ? weights[a.vacancyStatus] : 0;
          const weightB = weights[b.vacancyStatus] !== undefined ? weights[b.vacancyStatus] : 0;
          comparison = weightA - weightB;
          break;
        }

        case 'declines': {
          const countA = a.declinesCount || 0;
          const countB = b.declinesCount || 0;
          comparison = countA - countB;
          if (comparison === 0) {
            comparison = (a.policyViolationsCount || 0) - (b.policyViolationsCount || 0);
          }
          break;
        }

        default:
          comparison = 0;
      }

      return comparison * multiplier;
    });
  }, [teachers, sortConfig]);

  if (teachers.length === 0) {
    return (
      <div className="table-container" style={{ padding: '3.5rem', textAlign: 'center', background: '#ffffff' }}>
        <p style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 700 }}>
          No active teachers match the selected filters.
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.4rem' }}>
          Try clearing some filters or widening your time, language, or day criteria.
        </p>
      </div>
    );
  }

  // Render a sortable <th> header with interactive sort toggle
  const renderSortableHeader = (key, label) => {
    const isSorted = sortConfig.key === key;
    const direction = isSorted ? sortConfig.direction : null;

    return (
      <th 
        className={`sortable-th ${isSorted ? 'active-sort' : ''}`}
        onClick={() => handleSort(key)}
        title={isSorted 
          ? (direction === 'asc' ? `Sorted Ascending by ${label}. Click for Descending.` : `Sorted Descending by ${label}. Click to reset.`)
          : `Click to sort by ${label}`}
      >
        <div className="th-sort-wrapper">
          <span>{label}</span>
          <span className={`sort-icon-box ${isSorted ? 'active' : 'idle'}`}>
            {isSorted ? (
              direction === 'asc' ? <ArrowUp size={12} strokeWidth={2.5} /> : <ArrowDown size={12} strokeWidth={2.5} />
            ) : (
              <ArrowUpDown size={11} strokeWidth={1.8} />
            )}
          </span>
        </div>
      </th>
    );
  };

  return (
    <div className="table-container">
      <table className="responsive-table">
        <thead>
          <tr>
            {renderSortableHeader('name', 'Teacher Details')}
            {renderSortableHeader('rating', 'Rating')}
            {renderSortableHeader('combinations', 'Combinations')}
            {renderSortableHeader('totalSlots', 'Total Slots')}
            {renderSortableHeader('booked', 'Booked')}
            {renderSortableHeader('remaining', 'Remaining Free & Sessions')}
            {renderSortableHeader('fragility', 'Fragility (N/C)')}
            {renderSortableHeader('vacancy', 'Vacancy Status')}
            {renderSortableHeader('declines', 'Declines')}
          </tr>
        </thead>
        <tbody>
          {sortedTeachers.map(teacher => {
            const initials = teacher.teacherName
              .split(' ')
              .map(n => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();

            const vacancyClass = teacher.vacancyColor || 'gray';
            const possibleSessions = teacher.possibleSessions || 0;

            return (
              <tr key={teacher.teacherId}>
                {/* Teacher Info */}
                <td>
                  <div className="teacher-cell">
                    <div className="teacher-avatar">{initials || 'TC'}</div>
                    <div className="teacher-name-box">
                      {/* Teacher ID placed as an inline chip next to Teacher Name */}
                      <div className="teacher-name-row" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                        <span className="teacher-name">{teacher.teacherName}</span>
                        <span className="teacher-id-chip">{teacher.teacherId}</span>
                      </div>
                      
                      <div className="teacher-meta-sub">
                        {teacher.contact && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <Phone size={11} /> {teacher.contact}
                          </span>
                        )}
                        {teacher.wage > 0 && (
                          <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>
                            ₹{teacher.wage}/session
                          </span>
                        )}
                      </div>

                      {/* Teach Lang Tags */}
                      {teacher.teachLanguages && teacher.teachLanguages.length > 0 && (
                        <div style={{ marginTop: '0.35rem', display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                          <span className="lang-tag" title="Teaching Languages">
                            <Globe size={10} style={{ color: '#1d4ed8' }} />
                            {teacher.teachLanguages.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </td>

                {/* Rating Column (Strictly from Teacher Review tab: session average and session counts; No reviews if empty) */}
                <td>
                  {teacher.ratingDetails?.hasReviews ? (
                    <div 
                      className="rating-col-cell"
                      title={`Average ${teacher.ratingDetails.formattedRating}★ per session across ${teacher.ratingDetails.sessionsCount} sessions (${teacher.ratingDetails.totalReviewsCount} student reviews)`}
                    >
                      <div className={`flipkart-rating-chip ${teacher.ratingDetails.avgRating < 3 ? 'danger' : teacher.ratingDetails.avgRating < 4 ? 'warning' : ''}`}>
                        <span className="rating-value">{teacher.ratingDetails.formattedRating}</span>
                        <Star size={11} fill="#ffffff" color="#ffffff" />
                      </div>
                      <div className="rating-subtext">
                        <span className="rating-sessions-label">
                          {teacher.ratingDetails.sessionsCount} {teacher.ratingDetails.sessionsCount === 1 ? 'session' : 'sessions'}
                        </span>
                        {teacher.ratingDetails.totalReviewsCount > teacher.ratingDetails.sessionsCount && (
                          <span className="rating-reviews-count">
                            ({teacher.ratingDetails.totalReviewsCount} revs)
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="rating-col-cell">
                      <span className="rating-none-chip" title="No session reviews submitted yet">
                        No reviews
                      </span>
                    </div>
                  )}
                </td>

                {/* Combinations (Subjects) */}
                <td>
                  <button
                    className="combination-badge"
                    onClick={() => onOpenCombinations(teacher)}
                    title="Click to view all subjects taught"
                  >
                    <BookOpen size={13} />
                    <span>{teacher.qualifiedSubjects.length} Subjects</span>
                  </button>
                </td>

                {/* Total Slots */}
                <td>
                  <div style={{ fontWeight: 800, color: '#0f172a' }}>
                    {teacher.totalSlotsCount} <small style={{ fontWeight: 600, color: 'var(--text-muted)' }}>slots</small>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                    {formatDuration(teacher.totalMinutes)}
                  </div>
                </td>

                {/* Booked Slots */}
                <td>
                  <div style={{ fontWeight: 800, color: teacher.bookedSlotsCount > 0 ? '#b45309' : 'var(--text-muted)' }}>
                    {teacher.bookedSlotsCount} <small style={{ fontWeight: 600 }}>classes</small>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                    {formatDuration(teacher.bookedMinutes)}
                  </div>
                </td>

                {/* Remaining Free Slots & Sessions */}
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.85rem' }}>
                    <div>
                      {teacher.remainingSlots.length === 0 ? (
                        <span style={{ fontSize: '0.82rem', color: '#991b1b', fontStyle: 'italic', fontWeight: 700 }}>
                          No Free Slots
                        </span>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                            <span 
                              className={`session-badge ${possibleSessions > 0 ? 'active' : 'zero'}`}
                              title={`${possibleSessions} ${possibleSessions === 1 ? 'Session' : 'Sessions'} Possible`}
                            >
                              {possibleSessions} Sess. Poss.
                            </span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                            {teacher.remainingSlotsCount} {teacher.remainingSlotsCount === 1 ? 'slot' : 'slots'} open ({formatDuration(teacher.remainingMinutes)})
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Matrix button placed directly in this column */}
                    <button
                      className="action-btn"
                      onClick={() => onOpenMatrix(teacher)}
                      title="View Weekly Schedule Matrix"
                      style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <Calendar size={13} style={{ color: '#1d4ed8' }} />
                      <span>Matrix</span>
                    </button>
                  </div>
                </td>

                {/* Fragility / Over-Commitment Index (Audio: N combinations / C possible sessions) */}
                <td>
                  {teacher.possibleSessions > 0 ? (
                    <div 
                      className="fragility-col-cell"
                      title={`Fragility Index: ${teacher.fragilityScore} (${teacher.qualifiedSubjects?.length || 0} combinations ÷ ${teacher.possibleSessions} possible sessions). When this teacher is booked, other combinations disappear.`}
                    >
                      <div className={`fragility-chip ${
                        teacher.fragilityScore >= 3.5 ? 'high-risk' :
                        teacher.fragilityScore >= 1.5 ? 'medium-risk' : 'stable'
                      }`}>
                        <span className="fragility-value">{teacher.fragilityScore}</span>
                        <span className="fragility-label">
                          {teacher.fragilityScore >= 3.5 ? 'High Risk' :
                           teacher.fragilityScore >= 1.5 ? 'Medium' : 'Stable'}
                        </span>
                      </div>
                      <div className="fragility-subtext">
                        <span>{teacher.qualifiedSubjects?.length || 0} subs</span>
                        <span style={{ color: '#94a3b8' }}>/</span>
                        <span>{teacher.possibleSessions} sess</span>
                      </div>
                    </div>
                  ) : (
                    <div className="fragility-col-cell" title="Teacher has 0 available sessions in this rolling window">
                      <span className="fragility-chip zero">
                        <span className="fragility-value">—</span>
                        <span className="fragility-label">0 Sess</span>
                      </span>
                      <div className="fragility-subtext" style={{ color: '#94a3b8' }}>
                        {teacher.qualifiedSubjects?.length || 0} subs / 0 sess
                      </div>
                    </div>
                  )}
                </td>

                {/* Vacancy Status (Red, Yellow, Green) */}
                <td>
                  <span className={`vacancy-badge ${vacancyClass}`}>
                    <span className="vacancy-dot"></span>
                    <span>{teacher.vacancyLabel}</span>
                  </span>
                </td>

                {/* Actions & Declines */}
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'nowrap' }}>
                    <button
                      type="button"
                      className={`decline-action-btn ${teacher.declinesCount > 0 ? (teacher.hasPolicyViolation ? 'violation' : 'has-declines') : 'zero'}`}
                      onClick={() => onOpenDeclines && onOpenDeclines(teacher)}
                      title={`View or log booking declines for ${teacher.teacherName}`}
                    >
                      <UserX size={13} />
                      <span>Declines ({teacher.declinesCount || 0})</span>
                      {teacher.hasPolicyViolation && (
                        <span className="violation-indicator-dot" title={`${teacher.policyViolationsCount} Policy Violation(s)`}>!</span>
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
