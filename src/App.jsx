import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import MetricsCards from './components/MetricsCards';
import FilterBar from './components/FilterBar';
import TeachersTable from './components/TeachersTable';
import DetailedSlotsTable from './components/DetailedSlotsTable';
import ScheduleMatrixModal from './components/ScheduleMatrixModal';
import SubjectCombinationsModal from './components/SubjectCombinationsModal';
import TeacherDeclinesModal from './components/TeacherDeclinesModal';
import SettingsModal from './components/SettingsModal';
import SupplyDemandReport from './components/SupplyDemandReport';
import { loadAllData, processTeacherRemainingAvailability, postTeacherDecline, processSupplyDemandAnalytics } from './services/dataService';
import { timeStringToMinutes } from './utils/timeUtils';
import { Users, ListFilter, AlertCircle, Loader2, Sparkles, RotateCcw, Info } from 'lucide-react';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rawData, setRawData] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const DEFAULT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwfs_yCOYTpmTjLR0KKPCvhsPBu3YIK8Hm5BpjOeYCNfz-id24Sek5r_jQfI32EC52J/exec';
  const OLD_SCRIPT_URLS = [
    'https://script.google.com/macros/s/AKfycbxiWHvLqSj9_mxStlaLoik9r1c_SEpBVQUUbd-fHWtEneeSBsvka-6NRnOVRcCNCDFg/exec',
    'https://script.google.com/macros/s/AKfycbw5FFrD4aeR2przgNwvWqDlzSIch-La9Zl22d-kXHrB5-meroec0kepzBt9zZz9TMqJ/exec',
    'https://script.google.com/macros/s/AKfycbzhoidGQuaiv9suKWubVXSUlsg9pd3RtMFvF2zjaDhAzkszgohurI4t0h9PRQ4ORDiy/exec'
  ];

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('edstaq_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const resolvedScriptUrl = (!parsed.scriptUrl || OLD_SCRIPT_URLS.includes(parsed.scriptUrl))
          ? DEFAULT_SCRIPT_URL
          : parsed.scriptUrl;
        return {
          ...parsed,
          sessionDuration: parsed.sessionDuration || 75,
          dataSource: parsed.dataSource || 'script',
          scriptUrl: resolvedScriptUrl
        };
      } catch (e) { /* ignore */ }
    }
    return {
      windowDays: 7,
      refDate: new Date().toISOString().slice(0, 10),
      minDuration: 0,
      sessionDuration: 75,
      dataSource: 'script',
      scriptUrl: DEFAULT_SCRIPT_URL
    };
  });

  const [filters, setFilters] = useState({
    searchQuery: '',
    teachLang: [],
    vacancyStatus: '',
    subjectId: '',
    subjectName: [],
    label: '',
    level: '',
    board: '',
    stage: '',
    category: '',
    department: '',
    subjectDescription: '',
    weekdays: [],
    timeStart: '',
    timeEnd: ''
  });

  const [viewMode, setViewMode] = useState('teachers'); // 'teachers' | 'detailed'
  const [currentModule, setCurrentModule] = useState('availability'); // 'availability' | 'supply-demand'
  const [selectedTeacherForCombinations, setSelectedTeacherForCombinations] = useState(null);
  const [selectedTeacherForMatrix, setSelectedTeacherForMatrix] = useState(null);
  const [selectedTeacherForDeclines, setSelectedTeacherForDeclines] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showPriorityInfo, setShowPriorityInfo] = useState(false);

  // Declines state: pure live data from database with transient optimistic tracking
  const [localDeclines, setLocalDeclines] = useState([]);

  // Clear any legacy test declines from localStorage
  useEffect(() => {
    try {
      localStorage.removeItem('edstaq_local_declines');
    } catch (e) {
      // Ignore
    }
  }, []);

  const sessionDuration = settings.sessionDuration || 75;

  // Load data on mount or when data source changes
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await loadAllData({
        dataSource: settings.dataSource,
        scriptUrl: settings.scriptUrl
      });
      setRawData(data);
    } catch (err) {
      console.error('Data loading error:', err);
      setError(err.message || 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [settings.dataSource, settings.scriptUrl]);

  // Save settings when changed
  const handleSaveSettings = (newSettings) => {
    setSettings(newSettings);
    localStorage.setItem('edstaq_settings', JSON.stringify(newSettings));
  };

  // Add decline handler (Live Google Apps Script sheet sync)
  const handleAddDecline = async (declineRecord) => {
    const recordWithId = {
      ...declineRecord,
      id: declineRecord.id || `dec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`
    };

    if (settings.dataSource === 'script' && settings.scriptUrl) {
      try {
        await postTeacherDecline({ scriptUrl: settings.scriptUrl }, recordWithId);
        // Immediately fetch live sheet data to keep app in 100% sync with the Google Sheet
        await fetchData();
        return;
      } catch (err) {
        console.warn('Direct cloud sync failed, tracking in local state:', err);
      }
    }

    setLocalDeclines(prev => [recordWithId, ...prev]);
  };


  // Delete decline handler
  const handleDeleteDecline = (declineIdOrTimestamp) => {
    setLocalDeclines(prev => prev.filter(d => 
      (d.id ? d.id !== declineIdOrTimestamp : true) &&
      (d.timestamp ? d.timestamp !== declineIdOrTimestamp : true)
    ));
  };

  // Process data through math engine & compute bookable sessions per teacher (Audio 1 & 3)
  const processedData = useMemo(() => {
    if (!rawData) return null;

    // Merge server teacherDeclines with locally added declines
    const combinedDeclines = [
      ...(rawData.teacherDeclines || []),
      ...localDeclines
    ];

    const dataWithCombinedData = {
      ...rawData,
      teacherDeclines: combinedDeclines
    };

    const result = processTeacherRemainingAvailability(dataWithCombinedData, {
      windowDays: settings.windowDays,
      refDate: settings.refDate,
      minDuration: settings.minDuration
    });

    if (!result) return null;

    const teacherSummariesWithSessions = (result.teacherSummaries || []).map(t => {
      const possibleSessions = (t.remainingSlots || []).reduce((acc, slot) => {
        return acc + Math.floor(slot.duration_minutes / sessionDuration);
      }, 0);
      const combinationsCount = t.qualifiedSubjects?.length || 0;
      // Teacher Fragility / Over-Commitment Index: N combinations / C real sessions
      const fragilityScore = possibleSessions > 0
        ? Number((combinationsCount / possibleSessions).toFixed(2))
        : null;

      return {
        ...t,
        possibleSessions,
        combinationsCount,
        fragilityScore
      };
    });

    return {
      ...result,
      teacherSummaries: teacherSummariesWithSessions
    };
  }, [rawData, localDeclines, settings.windowDays, settings.refDate, settings.minDuration, sessionDuration]);

  // Process Supply vs Market Demand Intelligence (Demo Book vs Teacher Capacity)
  const supplyDemandAnalytics = useMemo(() => {
    if (!rawData || !processedData) return null;
    return processSupplyDemandAnalytics(rawData, processedData.teacherSummaries, {
      sessionDuration
    });
  }, [rawData, processedData, sessionDuration]);



  // Keep selected teacher for declines synced with latest processedData
  const currentTeacherForDeclines = useMemo(() => {
    if (!selectedTeacherForDeclines || !processedData) return null;
    return processedData.teacherSummaries.find(t => t.teacherId === selectedTeacherForDeclines.teacherId) || selectedTeacherForDeclines;
  }, [selectedTeacherForDeclines, processedData]);

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.searchQuery) count++;
    if (Array.isArray(filters.teachLang) ? filters.teachLang.length > 0 : !!filters.teachLang) count++;
    if (filters.vacancyStatus) count++;
    if (filters.subjectId) count++;
    if (Array.isArray(filters.subjectName) ? filters.subjectName.length > 0 : !!filters.subjectName) count++;
    if (filters.label) count++;
    if (filters.level) count++;
    if (filters.board) count++;
    if (filters.stage) count++;
    if (filters.category) count++;
    if (filters.department) count++;
    if (filters.subjectDescription) count++;
    if (filters.weekdays && filters.weekdays.length > 0) count += filters.weekdays.length;
    if (filters.timeStart) count++;
    if (filters.timeEnd) count++;
    return count;
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      searchQuery: '',
      teachLang: [],
      vacancyStatus: '',
      subjectId: '',
      subjectName: [],
      label: '',
      level: '',
      board: '',
      stage: '',
      category: '',
      department: '',
      subjectDescription: '',
      weekdays: [],
      timeStart: '',
      timeEnd: ''
    });
  };

  // Filter Teacher Summaries
  const filteredTeachers = useMemo(() => {
    if (!processedData) return [];

    const startFilterMins = filters.timeStart ? timeStringToMinutes(filters.timeStart) : -1;
    const endFilterMins = filters.timeEnd ? timeStringToMinutes(filters.timeEnd) : -1;

    return processedData.teacherSummaries.filter(teacher => {
      // 1. Text search on name, ID, phone
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        const matchesName = teacher.teacherName.toLowerCase().includes(q);
        const matchesId = teacher.teacherId.toLowerCase().includes(q);
        const matchesContact = (teacher.contact || '').toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesContact) return false;
      }

      // 2. Teach Lang (Multi-select)
      if (filters.teachLang && (Array.isArray(filters.teachLang) ? filters.teachLang.length > 0 : !!filters.teachLang)) {
        const selectedLangs = Array.isArray(filters.teachLang) ? filters.teachLang : [filters.teachLang];
        const hasAny = selectedLangs.some(l => teacher.teachLanguages.includes(l));
        if (!hasAny) return false;
      }

      // 3. Vacancy Status
      if (filters.vacancyStatus && teacher.vacancyStatus !== filters.vacancyStatus) {
        return false;
      }

      // 4. Subject ID
      if (filters.subjectId) {
        const q = filters.subjectId.toLowerCase().trim();
        const hasSubId = teacher.subjectIds.some(id => id.toLowerCase().includes(q));
        if (!hasSubId) return false;
      }

      // 5. Subject Name (Multi-select)
      if (filters.subjectName && (Array.isArray(filters.subjectName) ? filters.subjectName.length > 0 : !!filters.subjectName)) {
        const selectedSubs = Array.isArray(filters.subjectName) ? filters.subjectName : [filters.subjectName];
        const hasAny = selectedSubs.some(n => teacher.subjectNames.includes(n));
        if (!hasAny) return false;
      }

      // 6. Label
      if (filters.label) {
        const q = filters.label.toLowerCase().trim();
        const hasLabel = teacher.subjectLabels.some(l => l.toLowerCase().includes(q));
        if (!hasLabel) return false;
      }

      // 7. Level
      if (filters.level && !teacher.levels.includes(filters.level)) {
        return false;
      }

      // 8. Board
      if (filters.board && !teacher.boards.includes(filters.board)) {
        return false;
      }

      // 9. Stage / Class
      if (filters.stage && !teacher.stages.includes(filters.stage)) {
        return false;
      }

      // 10. Category
      if (filters.category && !teacher.categories.includes(filters.category)) {
        return false;
      }

      // 11. Department
      if (filters.department && !teacher.departments.includes(filters.department)) {
        return false;
      }

      // 12. Subject Description
      if (filters.subjectDescription) {
        const q = filters.subjectDescription.toLowerCase();
        const hasMatchingDesc = teacher.qualifiedSubjects.some(
          s => (s.description || '').toLowerCase().includes(q)
        );
        if (!hasMatchingDesc) return false;
      }

      // 13. Weekdays & Time Filter applied to Remaining Slots (Audio 1 & 2: Overlap of at least 1-2 minutes)
      if ((filters.weekdays && filters.weekdays.length > 0) || startFilterMins >= 0 || endFilterMins >= 0) {
        const hasMatchingSlot = teacher.remainingSlots.some(slot => {
          if (filters.weekdays.length > 0 && !filters.weekdays.includes(slot.weekday)) {
            return false;
          }
          // Overlap check: slot intersects [startFilterMins, endFilterMins]
          if (startFilterMins >= 0 && endFilterMins >= 0) {
            return slot.slot_start_mins < endFilterMins && slot.slot_end_mins > startFilterMins;
          }
          if (startFilterMins >= 0) {
            return slot.slot_end_mins > startFilterMins;
          }
          if (endFilterMins >= 0) {
            return slot.slot_start_mins < endFilterMins;
          }
          return true;
        });

        if (!hasMatchingSlot) return false;
      }

      return true;
    });
  }, [processedData, filters]);

  // Filter Raw Remaining Slots
  const filteredRawSlots = useMemo(() => {
    if (!processedData) return [];

    const startFilterMins = filters.timeStart ? timeStringToMinutes(filters.timeStart) : -1;
    const endFilterMins = filters.timeEnd ? timeStringToMinutes(filters.timeEnd) : -1;

    return processedData.rawRemainingSlotsTable.filter(slot => {
      // 1. Text search
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        const matchesName = slot.teacher_name.toLowerCase().includes(q);
        const matchesId = slot.teacher_id.toLowerCase().includes(q);
        const matchesContact = (slot.teacher_contact || '').toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesContact) return false;
      }

      // 2. Teach Lang (Multi-select)
      if (filters.teachLang && (Array.isArray(filters.teachLang) ? filters.teachLang.length > 0 : !!filters.teachLang)) {
        const selectedLangs = Array.isArray(filters.teachLang) ? filters.teachLang : [filters.teachLang];
        const hasAny = selectedLangs.some(l => slot.teach_languages.includes(l));
        if (!hasAny) return false;
      }

      // 3. Vacancy Status
      if (filters.vacancyStatus && slot.vacancy_status !== filters.vacancyStatus) return false;

      // 4. Subject ID
      if (filters.subjectId) {
        const q = filters.subjectId.toLowerCase().trim();
        const hasSubId = slot.subject_ids.some(id => id.toLowerCase().includes(q));
        if (!hasSubId) return false;
      }

      // 5. Subject Name (Multi-select)
      if (filters.subjectName && (Array.isArray(filters.subjectName) ? filters.subjectName.length > 0 : !!filters.subjectName)) {
        const selectedSubs = Array.isArray(filters.subjectName) ? filters.subjectName : [filters.subjectName];
        const hasAny = selectedSubs.some(n => slot.subject_names.includes(n));
        if (!hasAny) return false;
      }

      // 6. Label
      if (filters.label) {
        const q = filters.label.toLowerCase().trim();
        const hasLabel = slot.subject_labels.some(l => l.toLowerCase().includes(q));
        if (!hasLabel) return false;
      }

      // 7. Level
      if (filters.level && !slot.levels.includes(filters.level)) return false;

      // 8. Board
      if (filters.board && !slot.boards.includes(filters.board)) return false;

      // 9. Stage
      if (filters.stage && !slot.stages.includes(filters.stage)) return false;

      // 10. Category
      if (filters.category && !slot.categories.includes(filters.category)) return false;

      // 11. Department
      if (filters.department && !slot.departments.includes(filters.department)) return false;

      // 12. Description
      if (filters.subjectDescription) {
        const q = filters.subjectDescription.toLowerCase();
        const hasMatchingDesc = slot.qualified_subjects.some(
          s => (s.description || '').toLowerCase().includes(q)
        );
        if (!hasMatchingDesc) return false;
      }

      // 13. Weekdays
      if (filters.weekdays && filters.weekdays.length > 0 && !filters.weekdays.includes(slot.weekday)) {
        return false;
      }

      // 14. Time range overlap (Audio 1 & 2: any partial or full overlap with filter window)
      if (startFilterMins >= 0 && endFilterMins >= 0) {
        if (!(slot.slot_start_mins < endFilterMins && slot.slot_end_mins > startFilterMins)) {
          return false;
        }
      } else if (startFilterMins >= 0) {
        if (!(slot.slot_end_mins > startFilterMins)) {
          return false;
        }
      } else if (endFilterMins >= 0) {
        if (!(slot.slot_start_mins < endFilterMins)) {
          return false;
        }
      }

      return true;
    });
  }, [processedData, filters]);

  // Handler to open matrix from a teacher ID
  const handleOpenMatrixById = (teacherId) => {
    if (!processedData) return;
    const t = processedData.teacherSummaries.find(item => item.teacherId === teacherId);
    if (t) setSelectedTeacherForMatrix(t);
  };

  return (
    <div className="app-container">
      <Header
        dataSource={settings.dataSource}
        onRefresh={fetchData}
        loading={loading}
        onOpenSettings={() => setIsSettingsOpen(true)}
        currentModule={currentModule}
        onSelectModule={setCurrentModule}
      />

      <main className="main-layout">
        {/* Loading Overlay */}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '3.5rem', color: '#1d4ed8' }}>
            <Loader2 size={24} className="spin" />
            <span style={{ fontSize: '1.05rem', fontWeight: 700 }}>Connecting to Edstaq Cloud DB & Computing Remaining Availability...</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div style={{
            background: '#fef2f2',
            border: '1.5px solid #ef4444',
            borderRadius: 'var(--radius-md)',
            padding: '1.1rem 1.35rem',
            color: '#991b1b',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <AlertCircle size={22} />
            <div>
              <strong style={{ fontWeight: 800 }}>Database Sync Alert:</strong> {error}
            </div>
          </div>
        )}

        {!loading && processedData && (
          currentModule === 'supply-demand' ? (
            <SupplyDemandReport
              analyticsData={supplyDemandAnalytics}
              loading={loading}
              onRefresh={fetchData}
            />
          ) : (
            <>
              {/* Top Metrics Cards */}
              <MetricsCards
                teacherSummaries={processedData.teacherSummaries}
                rawRemainingSlots={processedData.rawRemainingSlotsTable}
                assignmentStats={processedData.assignmentStats}
                windowDays={settings.windowDays}
                sessionDuration={sessionDuration}
                urgentAllocationNeeded={supplyDemandAnalytics?.kpis?.urgentPendingNoTeacher || 0}
              />

            {/* Filter Bar with separate fields */}
            <FilterBar
              filters={filters}
              onFilterChange={handleFilterChange}
              onResetFilters={handleResetFilters}
              catalog={processedData.catalog}
              activeCount={activeFilterCount}
            />

            {/* View Control Bar */}
            <div className="view-control-bar">
              <div className="results-count-badge">
                Showing{' '}
                <strong>
                  {viewMode === 'teachers' ? filteredTeachers.length : filteredRawSlots.length}
                </strong>{' '}
                {viewMode === 'teachers' ? 'teachers' : 'free slots'}{' '}
                {activeFilterCount > 0 && <span style={{ color: '#1d4ed8', fontWeight: 700 }}>(Filtered)</span>}
              </div>

              <div className="view-bar-right-group">
                {viewMode === 'teachers' && (
                  <div className="priority-control-wrapper" onMouseLeave={() => setShowPriorityInfo(false)}>
                    <button
                      type="button"
                      className={`btn-priority-toggle ${sortConfig.key ? 'manual' : 'active'}`}
                      onClick={() => {
                        if (sortConfig.key) {
                          setSortConfig({ key: null, direction: 'asc' });
                        }
                      }}
                      title={sortConfig.key ? 'Click to reset to default smart priority' : 'Default smart priority is active'}
                    >
                      {sortConfig.key ? (
                        <>
                          <RotateCcw size={13} />
                          <span>Reset to Default Priority</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={13} />
                          <span>Smart Priority Active</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      className={`priority-info-btn ${showPriorityInfo ? 'active' : ''}`}
                      onClick={() => setShowPriorityInfo(prev => !prev)}
                      onMouseEnter={() => setShowPriorityInfo(true)}
                      aria-label="Priority sorting info"
                      title="Sorting Priority Information"
                    >
                      <Info size={14} />
                    </button>

                    {showPriorityInfo && (
                      <div className="priority-info-popover">
                        <div className="priority-popover-title">
                          <Sparkles size={14} className="popover-icon" />
                          <span>Default Priority Ranking</span>
                        </div>
                        <ul className="priority-popover-list">
                          <li>
                            <span className="priority-dot green"></span>
                            <div>
                              <strong>Available Free Slots on Top</strong>
                              <p>Teachers with active free slots prioritized first</p>
                            </div>
                          </li>
                          <li>
                            <span className="priority-dot amber"></span>
                            <div>
                              <strong>Highest Rating (5★ → 1★)</strong>
                              <p>Reviewed teachers sorted before unreviewed</p>
                            </div>
                          </li>
                          <li>
                            <span className="priority-dot blue"></span>
                            <div>
                              <strong>Lowest Declines (0 → N)</strong>
                              <p>Least declines and fewest policy violations</p>
                            </div>
                          </li>
                        </ul>
                        {sortConfig.key && (
                          <div className="priority-popover-current">
                            <span>Currently sorted manually by <strong>{sortConfig.key.toUpperCase()} ({sortConfig.direction.toUpperCase()})</strong>.</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="view-tabs">
                  <button
                    className={`view-tab ${viewMode === 'teachers' ? 'active' : ''}`}
                    onClick={() => setViewMode('teachers')}
                  >
                    <Users size={14} />
                    <span>Teacher Overview</span>
                  </button>
                  <button
                    className={`view-tab ${viewMode === 'detailed' ? 'active' : ''}`}
                    onClick={() => setViewMode('detailed')}
                  >
                    <ListFilter size={14} />
                    <span>Detailed Slots Grid</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Active Data View */}
            {viewMode === 'teachers' ? (
              <TeachersTable
                teachers={filteredTeachers}
                onOpenCombinations={t => setSelectedTeacherForCombinations(t)}
                onOpenMatrix={t => setSelectedTeacherForMatrix(t)}
                onOpenDeclines={t => setSelectedTeacherForDeclines(t)}
                onSelectSlot={slot => handleOpenMatrixById(slot.teacher_id)}
                sessionDuration={sessionDuration}
                sortConfig={sortConfig}
                onSortChange={setSortConfig}
              />
            ) : (
              <DetailedSlotsTable
                slots={filteredRawSlots}
                onOpenTeacherMatrix={handleOpenMatrixById}
              />
            )}
          </>
          )
        )}
      </main>

      {/* Modals */}
      {selectedTeacherForCombinations && (
        <SubjectCombinationsModal
          teacher={selectedTeacherForCombinations}
          onClose={() => setSelectedTeacherForCombinations(null)}
        />
      )}

      {selectedTeacherForMatrix && (
        <ScheduleMatrixModal
          teacher={selectedTeacherForMatrix}
          windowDates={processedData?.windowDates || []}
          filters={filters}
          onClose={() => setSelectedTeacherForMatrix(null)}
        />
      )}

      {currentTeacherForDeclines && (
        <TeacherDeclinesModal
          teacher={currentTeacherForDeclines}
          onClose={() => setSelectedTeacherForDeclines(null)}
          onAddDecline={handleAddDecline}
          onDeleteDecline={handleDeleteDecline}
        />
      )}



      {isSettingsOpen && (
        <SettingsModal
          settings={settings}
          onSaveSettings={handleSaveSettings}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </div>
  );
}
