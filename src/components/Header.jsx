import React, { useState, useRef, useEffect } from 'react';
import { RefreshCw, Settings, Layers, ChevronDown, Check, BarChart3 } from 'lucide-react';

export default function Header({
  onRefresh,
  loading,
  onOpenSettings,
  currentModule = 'availability',
  onSelectModule
}) {
  const [isModuleDropdownOpen, setIsModuleDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsModuleDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="app-header">
      <div className="brand-section">
        <div className="brand-logo-badge">
          E
        </div>
        <div>
          <div className="brand-title">
            Edstaq Admin
          </div>
          <div className="brand-subtitle">
            Management & Scheduling Portal
          </div>
        </div>
      </div>

      {/* Modern Interactive Module Switcher Dropdown (Audio 1 & 2) */}
      <div className="page-switcher-container" ref={dropdownRef}>
        <button
          type="button"
          className={`page-switcher-box-btn ${isModuleDropdownOpen ? 'active' : ''}`}
          onClick={() => setIsModuleDropdownOpen(prev => !prev)}
          title="Switch Edstaq Management Module"
        >
          {currentModule === 'supply-demand' ? (
            <BarChart3 size={16} className="switcher-icon" style={{ color: '#0284c7' }} />
          ) : (
            <Layers size={16} className="switcher-icon" />
          )}
          <span className="switcher-label">
            {currentModule === 'supply-demand' ? 'Supply vs Demand' : 'Tutor Availability'}
          </span>
          <ChevronDown size={14} className={`switcher-arrow ${isModuleDropdownOpen ? 'open' : ''}`} />
        </button>

        {isModuleDropdownOpen && (
          <div className="module-dropdown-menu">
            <div className="module-dropdown-header">
              <span>EDSTAQ SYSTEM MODULES</span>
            </div>

            <div className="module-dropdown-list">
              {/* Module 1: Tutor Availability */}
              <div 
                className={`module-item ${currentModule === 'availability' ? 'active' : ''}`}
                onClick={() => {
                  onSelectModule && onSelectModule('availability');
                  setIsModuleDropdownOpen(false);
                }}
              >
                <div className={`module-item-icon ${currentModule === 'availability' ? 'active' : ''}`}>
                  <Layers size={16} />
                </div>
                <div className="module-item-content">
                  <div className="module-item-title-row">
                    <span className="module-item-title">Tutor Availability</span>
                    {currentModule === 'availability' && <span className="module-tag-current">Current Active</span>}
                  </div>
                  <span className="module-item-desc">Teacher allocations & remaining hours engine</span>
                </div>
                {currentModule === 'availability' && <Check size={16} className="module-check-icon" />}
              </div>

              {/* Module 2: Supply vs Demand (New!) */}
              <div 
                className={`module-item ${currentModule === 'supply-demand' ? 'active' : ''}`}
                onClick={() => {
                  onSelectModule && onSelectModule('supply-demand');
                  setIsModuleDropdownOpen(false);
                }}
              >
                <div className={`module-item-icon ${currentModule === 'supply-demand' ? 'active' : ''}`}>
                  <BarChart3 size={16} />
                </div>
                <div className="module-item-content">
                  <div className="module-item-title-row">
                    <span className="module-item-title">Supply vs Demand</span>
                    {currentModule === 'supply-demand' ? (
                      <span className="module-tag-current">Current Active</span>
                    ) : (
                      <span className="module-tag-new" style={{ background: '#dcfce7', color: '#15803d', fontSize: '0.68rem', fontWeight: 700, padding: '0.1rem 0.45rem', borderRadius: '4px' }}>New</span>
                    )}
                  </div>
                  <span className="module-item-desc">Hiring intelligence & market gap analytics</span>
                </div>
                {currentModule === 'supply-demand' && <Check size={16} className="module-check-icon" />}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="header-actions">
        <button 
          className="header-btn" 
          onClick={onRefresh} 
          disabled={loading}
          title="Reload database"
        >
          <RefreshCw size={15} className={loading ? 'spin' : ''} />
          <span>Sync Database</span>
        </button>

        <button 
          className="header-btn primary" 
          onClick={onOpenSettings}
          title="Application Settings"
        >
          <Settings size={15} />
          <span>Settings</span>
        </button>
      </div>
    </header>
  );
}
