import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Filter, X, Search, Clock, Calendar, Globe, BookOpen } from 'lucide-react';
import { WEEKDAYS } from '../utils/dateUtils';

/**
 * MultiSelectDropdown component with search & checkboxes
 */
function MultiSelectFilter({
  label,
  icon,
  options = [],
  selected = [],
  onChange,
  placeholder = 'All'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const selectedArray = Array.isArray(selected) ? selected : (selected ? [selected] : []);
  const hasValue = selectedArray.length > 0;

  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    return options.filter(opt => opt.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [options, searchTerm]);

  const toggleOption = (opt) => {
    if (selectedArray.includes(opt)) {
      onChange(selectedArray.filter(item => item !== opt));
    } else {
      onChange([...selectedArray, opt]);
    }
  };

  const handleSelectAll = () => {
    onChange([...options]);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  return (
    <div className={`filter-field ${hasValue ? 'is-active' : ''}`} ref={containerRef}>
      <label className="filter-label">
        {icon}
        <span>{label}</span>
        {hasValue && <span className="filter-badge-counter">{selectedArray.length}</span>}
      </label>
      <div className="filter-dropdown-wrapper">
        <button
          type="button"
          className={`filter-dropdown-btn ${hasValue ? 'has-value' : 'is-placeholder'}`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '85%' }}>
            {!hasValue
              ? placeholder
              : selectedArray.length === 1
              ? selectedArray[0]
              : `${selectedArray[0]} (+${selectedArray.length - 1} more)`}
          </span>
          <span style={{ fontSize: '0.7rem', color: hasValue ? '#2563eb' : '#94a3b8' }}>
            {isOpen ? '▲' : '▼'}
          </span>
        </button>

        {isOpen && (
          <div className="filter-dropdown-menu">
            {options.length > 5 && (
              <div className="filter-dropdown-search-box">
                <Search size={13} style={{ color: '#94a3b8' }} />
                <input
                  type="text"
                  className="filter-dropdown-search-input"
                  placeholder="Search options..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  autoFocus
                />
              </div>
            )}
            <div className="filter-dropdown-actions">
              <button type="button" className="filter-dropdown-action-btn" onClick={handleSelectAll}>
                Select All
              </button>
              <button type="button" className="filter-dropdown-action-btn" onClick={handleClearAll}>
                Clear
              </button>
            </div>
            <div className="filter-dropdown-list">
              {filteredOptions.length === 0 ? (
                <div style={{ padding: '0.6rem 0.75rem', fontSize: '0.78rem', color: '#94a3b8', fontStyle: 'italic' }}>
                  No options found
                </div>
              ) : (
                filteredOptions.map(opt => {
                  const isChecked = selectedArray.includes(opt);
                  return (
                    <label key={opt} className={`filter-dropdown-item ${isChecked ? 'is-selected' : ''}`}>
                      <input
                        type="checkbox"
                        className="filter-dropdown-checkbox"
                        checked={isChecked}
                        onChange={() => toggleOption(opt)}
                      />
                      <span>{opt}</span>
                    </label>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Searchable Combobox for Subject Label
 */
function SearchableCombobox({
  label,
  options = [],
  value = '',
  onChange,
  placeholder = 'Search & select...'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(value || '');
  const containerRef = useRef(null);

  useEffect(() => {
    setSearchQuery(value || '');
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options.slice(0, 100);
    const q = searchQuery.toLowerCase().trim();
    return options.filter(opt => opt.toLowerCase().includes(q)).slice(0, 100);
  }, [options, searchQuery]);

  const handleSelect = (item) => {
    setSearchQuery(item);
    onChange(item);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setSearchQuery('');
    onChange('');
    setIsOpen(false);
  };

  const hasValue = Boolean(value);

  return (
    <div className={`filter-field ${hasValue ? 'is-active' : ''}`} ref={containerRef}>
      <label className="filter-label">
        <span>{label}</span>
      </label>
      <div className="filter-dropdown-wrapper" style={{ position: 'relative' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input
            type="text"
            className="filter-input"
            style={{ paddingRight: hasValue ? '2.2rem' : '0.75rem' }}
            placeholder={placeholder}
            value={searchQuery}
            onFocus={() => setIsOpen(true)}
            onChange={e => {
              setSearchQuery(e.target.value);
              onChange(e.target.value);
              setIsOpen(true);
            }}
          />
          {hasValue && (
            <button
              type="button"
              className="filter-combobox-clear"
              style={{ position: 'absolute', right: '0.45rem' }}
              onClick={handleClear}
              title="Clear label filter"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {isOpen && (
          <div className="filter-dropdown-menu">
            <div style={{ padding: '0.35rem 0.6rem', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
              {filteredOptions.length} matching label{filteredOptions.length === 1 ? '' : 's'} (click to select)
            </div>
            <div className="filter-dropdown-list">
              {filteredOptions.length === 0 ? (
                <div style={{ padding: '0.6rem 0.75rem', fontSize: '0.78rem', color: '#94a3b8', fontStyle: 'italic' }}>
                  No matching labels found
                </div>
              ) : (
                filteredOptions.map(opt => (
                  <div
                    key={opt}
                    className={`filter-dropdown-item ${opt === value ? 'is-selected' : ''}`}
                    onClick={() => handleSelect(opt)}
                  >
                    <span>{opt}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function FilterBar({
  filters,
  onFilterChange,
  onResetFilters,
  catalog = {},
  activeCount = 0
}) {
  const toggleWeekday = (day) => {
    const current = filters.weekdays || [];
    if (current.includes(day)) {
      onFilterChange('weekdays', current.filter(d => d !== day));
    } else {
      onFilterChange('weekdays', [...current, day]);
    }
  };

  return (
    <div className="filter-card">
      <div className="filter-header">
        <div className="filter-title-wrap">
          <Filter size={18} style={{ color: 'var(--accent-sky)' }} />
          <span>Search & Filter Engine</span>
          {activeCount > 0 && (
            <span className="filter-active-count">{activeCount} active</span>
          )}
        </div>

        {activeCount > 0 && (
          <button className="reset-filter-btn" onClick={onResetFilters}>
            <X size={14} />
            <span>Reset All Filters</span>
          </button>
        )}
      </div>

      <div className="filter-grid">
        {/* Search Teacher */}
        <div className={`filter-field ${filters.searchQuery ? 'is-active' : ''}`}>
          <label className="filter-label">Search Teacher</label>
          <input
            type="text"
            className="filter-input"
            placeholder="Name, ID, Phone..."
            value={filters.searchQuery || ''}
            onChange={e => onFilterChange('searchQuery', e.target.value)}
          />
        </div>

        {/* 1. Teach Lang Filter: MULTI-SELECT DROPDOWN */}
        <MultiSelectFilter
          label="Teaching Language"
          icon={<Globe size={11} />}
          options={catalog.teachLanguages || []}
          selected={filters.teachLang}
          onChange={selectedArray => onFilterChange('teachLang', selectedArray)}
          placeholder="All Languages"
        />

        {/* Vacancy Status Filter */}
        <div className={`filter-field ${filters.vacancyStatus ? 'is-active' : ''}`}>
          <label className="filter-label">Vacancy Status</label>
          <select
            className="filter-select"
            data-has-value={!!filters.vacancyStatus}
            value={filters.vacancyStatus || ''}
            onChange={e => onFilterChange('vacancyStatus', e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="vacant">🟢 Vacant</option>
            <option value="partial">🟡 Partially Booked</option>
            <option value="filled">🔴 Filled</option>
          </select>
        </div>

        {/* Subject ID Filter */}
        <div className={`filter-field ${filters.subjectId ? 'is-active' : ''}`}>
          <label className="filter-label">Subject ID</label>
          <input
            type="text"
            className="filter-input"
            placeholder="e.g. SUB102, SUB227..."
            value={filters.subjectId || ''}
            onChange={e => onFilterChange('subjectId', e.target.value)}
          />
        </div>

        {/* 2. Subject Name Filter: MULTI-SELECT DROPDOWN */}
        <MultiSelectFilter
          label="Subject Name"
          icon={<BookOpen size={11} />}
          options={catalog.subjectNames || []}
          selected={filters.subjectName}
          onChange={selectedArray => onFilterChange('subjectName', selectedArray)}
          placeholder="All Subject Names"
        />

        {/* 3. Subject Label Filter: SEARCHABLE COMBOBOX */}
        <SearchableCombobox
          label="Subject Label"
          options={catalog.subjectLabels || []}
          value={filters.label}
          onChange={val => onFilterChange('label', val)}
          placeholder="Search & select label..."
        />

        {/* Level Filter */}
        <div className={`filter-field ${filters.level ? 'is-active' : ''}`}>
          <label className="filter-label">Level</label>
          <select
            className="filter-select"
            data-has-value={!!filters.level}
            value={filters.level || ''}
            onChange={e => onFilterChange('level', e.target.value)}
          >
            <option value="">All Levels</option>
            {(catalog.levels || []).map(lvl => (
              <option key={lvl} value={lvl}>{lvl}</option>
            ))}
          </select>
        </div>

        {/* Board Filter */}
        <div className={`filter-field ${filters.board ? 'is-active' : ''}`}>
          <label className="filter-label">Board</label>
          <select
            className="filter-select"
            data-has-value={!!filters.board}
            value={filters.board || ''}
            onChange={e => onFilterChange('board', e.target.value)}
          >
            <option value="">All Boards</option>
            {(catalog.boards || []).map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        {/* Stage / Class Filter */}
        <div className={`filter-field ${filters.stage ? 'is-active' : ''}`}>
          <label className="filter-label">Class / Stage</label>
          <select
            className="filter-select"
            data-has-value={!!filters.stage}
            value={filters.stage || ''}
            onChange={e => onFilterChange('stage', e.target.value)}
          >
            <option value="">All Classes / Stages</option>
            {(catalog.stages || []).map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Category Filter */}
        <div className={`filter-field ${filters.category ? 'is-active' : ''}`}>
          <label className="filter-label">Category</label>
          <select
            className="filter-select"
            data-has-value={!!filters.category}
            value={filters.category || ''}
            onChange={e => onFilterChange('category', e.target.value)}
          >
            <option value="">All Categories</option>
            {(catalog.categories || []).map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Department Filter */}
        <div className={`filter-field ${filters.department ? 'is-active' : ''}`}>
          <label className="filter-label">Department</label>
          <select
            className="filter-select"
            data-has-value={!!filters.department}
            value={filters.department || ''}
            onChange={e => onFilterChange('department', e.target.value)}
          >
            <option value="">All Departments</option>
            {(catalog.departments || []).map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Subject Description Filter */}
        <div className={`filter-field ${filters.subjectDescription ? 'is-active' : ''}`}>
          <label className="filter-label">Subject Description</label>
          <input
            type="text"
            className="filter-input"
            placeholder="Search description text..."
            value={filters.subjectDescription || ''}
            onChange={e => onFilterChange('subjectDescription', e.target.value)}
          />
        </div>

        {/* Time Filter: Start Time */}
        <div className={`filter-field ${filters.timeStart ? 'is-active' : ''}`}>
          <label className="filter-label">Slot Available After</label>
          <input
            type="time"
            className="filter-input"
            value={filters.timeStart || ''}
            onChange={e => onFilterChange('timeStart', e.target.value)}
          />
        </div>

        {/* Time Filter: End Time */}
        <div className={`filter-field ${filters.timeEnd ? 'is-active' : ''}`}>
          <label className="filter-label">Slot Available Before</label>
          <input
            type="time"
            className="filter-input"
            value={filters.timeEnd || ''}
            onChange={e => onFilterChange('timeEnd', e.target.value)}
          />
        </div>
      </div>

      {/* Weekday Multi-Select Pills */}
      <div>
        <label className="filter-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.6rem' }}>
          <Calendar size={13} />
          <span>Filter by Available Weekday</span>
        </label>
        <div className="weekday-selector">
          {WEEKDAYS.map(day => {
            const isSelected = (filters.weekdays || []).includes(day);
            return (
              <button
                key={day}
                type="button"
                className={`day-pill ${isSelected ? 'active' : ''}`}
                onClick={() => toggleWeekday(day)}
              >
                {day}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
