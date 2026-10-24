import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  Briefcase, 
  Search, 
  RotateCcw, 
  Filter, 
  Layers, 
  ChevronRight,
  ExternalLink,
  BookOpen,
  Calendar,
  Clock,
  Sparkles,
  AlertCircle,
  Phone,
  CheckCircle2,
  X,
  SlidersHorizontal,
  UserCheck,
  User,
  ListFilter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  FileSpreadsheet,
  UserPlus,
  Download,
  Copy,
  Check,
  FileText,
  ShieldCheck
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import Papa from 'papaparse';
import { parseDemoDate } from '../services/dataService';

export const LEVEL_CLASS_MAP = {
  'LP': ['Class 1', 'Class 2', 'Class 3', 'Class 4'],
  'UP': ['Class 5', 'Class 6', 'Class 7'],
  'HS': ['Class 8', 'Class 9', 'Class 10'],
  'HSS': ['Plus 1', 'Plus 2']
};

/**
 * Comprehensive Hiring Brief & Recruitment Intelligence Generator (Audio 1, 2 & Safety Backup Update)
 * Provides actionable details for Media Team (posters/ads) and HR / Recruitment Team.
 */
export const generateHiringBrief = (cellData) => {
  if (!cellData) return null;
  const shortage = cellData.shortage || 0;
  const urgentNoTeacher = cellData.urgentNoTeacher || 0;
  const backupRequired = cellData.backupRequired || 0;
  const backupPercentage = cellData.backupPercentage || 10;
  const directShortage = cellData.directShortage !== undefined 
    ? cellData.directShortage 
    : (cellData.demand > cellData.supply ? cellData.demand - cellData.supply : 0);
  const targetRequiredSupply = cellData.targetRequiredSupply || (cellData.demand + backupRequired);
  const subjectName = cellData.subjectName || 'General';
  const dimensionKey = cellData.colKey || '';
  const dimensionLabel = cellData.colLabel || cellData.dimensionLabel || '';
  const columnDimension = cellData.columnDimension || 'level';
  const demos = cellData.demos || [];
  const demandSubs = cellData.demandSubjectsList || [];
  const zeroSupply = cellData.zeroSupplySubjects || [];
  const qualifiedTeachers = cellData.qualifiedTeachers || [];
  const demand = cellData.demand || 0;
  const supply = cellData.supply || 0;

  // 1. Calculate stages / classes included (Audio 1)
  let includedClasses = [];
  if (LEVEL_CLASS_MAP[dimensionKey]) {
    includedClasses = LEVEL_CLASS_MAP[dimensionKey];
  } else if (columnDimension === 'class' && dimensionKey.startsWith('Class ')) {
    includedClasses = [dimensionKey];
  } else {
    const classSet = new Set();
    demos.forEach(d => { if (d.stage) classSet.add(d.stage); });
    includedClasses = Array.from(classSet);
    if (includedClasses.length === 0 && dimensionLabel) {
      includedClasses = [dimensionLabel];
    }
  }

  // Active inquiries class breakdown
  const activeClassCountMap = {};
  demos.forEach(d => {
    if (d.stage) {
      activeClassCountMap[d.stage] = (activeClassCountMap[d.stage] || 0) + 1;
    }
  });

  // 2. Boards in demand (Audio 1)
  const boardCountMap = {};
  demos.forEach(d => {
    const b = d.board || 'General';
    boardCountMap[b] = (boardCountMap[b] || 0) + 1;
  });
  const boardsList = Object.keys(boardCountMap);
  const boardsStr = boardsList.length > 0 ? boardsList.join(' & ') : 'CBSE & Kerala State';

  // 3. Syllabi details
  const syllabusLines = demandSubs.map(ds => {
    return `${ds.subjectLabel}: ${ds.count} inquiry(s)${ds.urgentCount > 0 ? ` [${ds.urgentCount} Urgent / No Teacher]` : ''}`;
  });

  // 4. Job Role Title
  const jobTitle = `${subjectName} Teacher - ${dimensionLabel || dimensionKey} (${includedClasses.join(', ')})`;
  const targetHeadcount = shortage > 0 
    ? shortage 
    : (urgentNoTeacher > 0 ? urgentNoTeacher : (backupRequired > 0 && supply <= demand ? backupRequired : 1));

  const headcountText = backupRequired > 0
    ? `${targetHeadcount} Teacher(s) Needed (Direct Deficit: ${directShortage} + Safety Backup: ${backupRequired})`
    : `${targetHeadcount} Teacher(s) Needed (Net Shortage: ${shortage > 0 ? `-${shortage}` : 'Balanced'})`;

  // 5. Build full copy-pasteable text brief for Media Team & HR (Audio 1 & Safety Backup Update)
  const textLines = [
    `📢 EDSTAQ TEACHER RECRUITMENT BRIEF`,
    `========================================`,
    `🎯 Position: ${jobTitle}`,
    `📚 Subject: ${subjectName}`,
    `🏫 Category / Level: ${dimensionLabel || dimensionKey}`,
    `🎓 Included Classes: ${includedClasses.join(', ')}`,
    `🏛️ Target Boards: ${boardsStr} (${Object.entries(boardCountMap).map(([b, c]) => `${b}: ${c}`).join(', ') || 'Active demand'})`,
    `👥 Headcount Target: ${headcountText}`,
    ...(backupRequired > 0 ? [
      `🛡️ Safety Backup Reserve: ${backupRequired} Standby Teacher(s) included (${backupPercentage}% buffer for sudden surge / tutor cancellations)`
    ] : []),
    `📊 Current Analytics: Student Inquiries: ${demand} | Available Teachers: ${supply}${backupRequired > 0 ? ` | Target Required Capacity: ${targetRequiredSupply}` : ''}`,
    ...(urgentNoTeacher > 0 ? [
      `🚨 URGENT ACTION: ${urgentNoTeacher} student demo request(s) are actively waiting with NO TEACHER assigned!`
    ] : []),
    ...(zeroSupply.length > 0 ? [
      `⚠️ ZERO-SUPPLY ALERT: 0 teachers currently exist in database for: ${zeroSupply.map(z => z.subjectLabel).join(', ')}`
    ] : []),
    `----------------------------------------`,
    `📋 INQUIRIES & CURRICULUM BREAKDOWN:`,
    ...(syllabusLines.length > 0 ? syllabusLines.map(l => `  • ${l}`) : [`  • ${subjectName} curriculum for ${includedClasses.join(', ')}`]),
    `----------------------------------------`,
    `⏰ AVAILABILITY & COMMITMENT:`,
    `  • Minimum 1 - 2 bookable sessions per week per teacher`,
    `  • Primary demo slots: Evening hours (4:00 PM – 9:00 PM IST) & Weekends`,
    `----------------------------------------`,
    `📝 SPECIAL NOTES FOR MEDIA & HR TEAM:`,
    `  • Pedagogical focus: Engaging, child-friendly teaching methodology for ${dimensionLabel || 'students'}.`,
    `  • Language requirement: Bilingual proficiency (English & Malayalam) required for Kerala State syllabus learners.`,
    ...(backupRequired > 0 ? [
      `  • Capacity policy: Safety reserve of ${backupRequired} teacher(s) maintains buffer against unexpected student enrollments.`
    ] : []),
    ...(urgentNoTeacher > 0 ? [`  • IMMEDIATE PRIORITY: Expedite candidate screening and demo onboarding to fulfill pending student inquiries.`] : []),
    `========================================`,
    `Generated by Edstaq Admin Intelligence Engine`
  ];

  const fullTextNote = textLines.join('\n');

  return {
    jobTitle,
    subjectName,
    dimensionKey,
    dimensionLabel,
    includedClasses,
    activeClassCountMap,
    boardsList,
    boardsStr,
    boardCountMap,
    demand,
    supply,
    shortage,
    directShortage,
    backupRequired,
    backupPercentage,
    targetRequiredSupply,
    headcountText,
    urgentNoTeacher,
    targetHeadcount,
    zeroSupply,
    syllabusLines,
    fullTextNote
  };
};

/**
 * Helper to generate structured hiring requirements based on cell/row intelligence (Audio 2 & Safety Backup Update)
 */
export const generateHiringRequirements = (cellData) => {
  if (!cellData) return [];
  const brief = generateHiringBrief(cellData);
  if (!brief) return [];

  const reqs = [];
  const shortage = cellData.shortage || 0;
  const urgentNoTeacher = cellData.urgentNoTeacher || 0;
  const backupRequired = cellData.backupRequired || 0;
  const backupPercentage = cellData.backupPercentage || 10;
  const directShortage = cellData.directShortage !== undefined 
    ? cellData.directShortage 
    : (cellData.demand > cellData.supply ? cellData.demand - cellData.supply : 0);
  const subjectName = cellData.subjectName || 'General';
  const dimension = cellData.colLabel || cellData.dimensionLabel || '';
  const zeroSupply = cellData.zeroSupplySubjects || [];
  const qualifiedTeachers = cellData.qualifiedTeachers || [];

  // 1. Headcount Target
  if (shortage > 0) {
    reqs.push({
      key: 'headcount',
      category: 'Headcount Target',
      priority: 'high',
      text: backupRequired > 0
        ? `Recruit at least ${brief.targetHeadcount} qualified teacher(s) for ${subjectName}${dimension ? ` (${dimension})` : ''} (${directShortage} to cover direct student demand + ${backupRequired} safety reserve at ${backupPercentage}%).`
        : `Recruit at least ${brief.targetHeadcount} qualified teacher(s) for ${subjectName}${dimension ? ` (${dimension})` : ''} to eliminate the net shortage of ${shortage} teacher(s).`
    });
  } else {
    reqs.push({
      key: 'headcount',
      category: 'Capacity Status',
      priority: 'normal',
      text: `Current capacity is balanced with a buffer of +${cellData.buffer || 0} teacher(s) above student demand and ${backupPercentage}% safety reserve.`
    });
  }

  // 2. Safety Backup Reserve Policy
  if (backupRequired > 0) {
    reqs.push({
      key: 'safety_backup',
      category: 'Safety Backup Buffer',
      priority: cellData.isShortage ? 'high' : 'normal',
      text: `Safety buffer policy (${backupPercentage}%): ${backupRequired} standby teacher(s) reserved to prevent immediate deficits upon unexpected student arrivals or teacher cancellations.`
    });
  }

  // 3. Urgent Allocation Priority
  if (urgentNoTeacher > 0) {
    reqs.push({
      key: 'urgent',
      category: 'Immediate Action Needed',
      priority: 'critical',
      text: `URGENT: ${urgentNoTeacher} scheduled demo inquiry is waiting with NO TEACHER assigned. Immediate teacher onboarding or reassignment required.`
    });
  }

  // 4. Stages & Curriculum Coverage (Audio 1)
  reqs.push({
    key: 'stages_classes',
    category: 'Target Stages & Classes',
    priority: 'high',
    text: `Included Stages / Classes: ${brief.includedClasses.join(', ')}. Target Boards: ${brief.boardsStr}.`
  });

  // 5. Zero-Supply Priority
  if (zeroSupply.length > 0) {
    const zsList = zeroSupply.map(s => `${s.subjectLabel} (${s.count} inquiries)`).join(', ');
    reqs.push({
      key: 'zero_supply',
      category: 'Zero-Supply Acquisition',
      priority: 'critical',
      text: `Critical Gap: Zero qualified teachers exist in Edstaq database for: ${zsList}. Priority hiring needed.`
    });
  }

  // 6. Schedule & Availability Window
  reqs.push({
    key: 'availability',
    category: 'Slot & Availability Window',
    priority: 'medium',
    text: `Required schedule commitment: Minimum 1-2 open sessions/week per teacher, with availability during peak demo slots (4:00 PM – 9:00 PM IST).`
  });

  // 7. Fragility & Backup Coverage
  const highFragilityTeachers = qualifiedTeachers.filter(t => t.isHighFragility);
  if (qualifiedTeachers.length === 1 || highFragilityTeachers.length > 0) {
    reqs.push({
      key: 'fragility',
      category: 'Fragility & Backup Cover',
      priority: 'medium',
      text: qualifiedTeachers.length === 1 
        ? `Single-Teacher Dependency: Only 1 active teacher currently available. Backup hire recommended to prevent operational bottlenecks.`
        : `High Fragility Detected: ${highFragilityTeachers.length} teacher(s) have heavy utilization. Secondary hires needed for load balancing.`
    });
  }

  return reqs;
};

/**
 * Intelligent Hiring Priority Calculator (Audio 2: ഏത് ആദ്യം ഹയർ ചെയ്യണം എന്ന പ്രയോരിറ്റി കണ്ടുപിടിക്കാൻ)
 * Evaluates urgency based on:
 * 1. Active demo inquiries waiting with NO teacher assigned (Critical P1)
 * 2. Zero-supply subjects in database with student demand (Critical P1)
 * 3. Heavy shortage volume (High P2: 5+ deficit or 3+ direct shortage)
 * 4. Moderate shortage (Medium P3: 1-4 deficit)
 * 5. Capacity balanced (Low / Balanced P4)
 */
export const calculateHiringPriority = (item) => {
  if (!item) return { tier: 'P4', label: 'P4 - Balanced', level: 'balanced', score: 0, fullReason: 'Capacity covered' };

  const urgentNoTeacher = item.urgentNoTeacher || 0;
  const supply = item.supply || 0;
  const demand = item.demand || 0;
  const shortage = item.shortage || 0;
  const directShortage = item.directShortage !== undefined 
    ? item.directShortage 
    : (demand > supply ? demand - supply : 0);
  const isShortage = item.isShortage;
  const zeroSupply = (item.cellData?.zeroSupplySubjects || []).length > 0 || (supply === 0 && demand > 0);

  // 1. P1 - Critical: Active unassigned student inquiries (Top emergency)
  if (urgentNoTeacher > 0) {
    return {
      tier: 'P1',
      label: 'P1 - Critical',
      level: 'critical',
      score: 10000 + (urgentNoTeacher * 200) + shortage,
      color: '#dc2626',
      bg: '#fee2e2',
      border: '#fca5a5',
      fullReason: `CRITICAL: ${urgentNoTeacher} demo(s) actively waiting with NO teacher assigned`
    };
  }

  // 2. P1 - Critical: Zero supply in database with pending demand
  if (zeroSupply && demand > 0) {
    return {
      tier: 'P1',
      label: 'P1 - Critical',
      level: 'critical',
      score: 8000 + (demand * 20) + shortage,
      color: '#b91c1c',
      bg: '#ffe4e6',
      border: '#fecdd3',
      fullReason: `CRITICAL: 0 qualified teachers currently exist in database for this subject`
    };
  }

  // 3. P2 - High: Heavy teacher shortage (5+ teachers needed or 3+ direct shortage)
  if (shortage >= 5 || directShortage >= 3) {
    return {
      tier: 'P2',
      label: 'P2 - High',
      level: 'high',
      score: 4000 + (shortage * 30) + (directShortage * 20) + demand,
      color: '#c2410c',
      bg: '#ffedd5',
      border: '#fed7aa',
      fullReason: `HIGH PRIORITY: Heavy deficit of ${shortage} teacher(s) (${directShortage} direct + ${item.backupRequired || 0} reserve)`
    };
  }

  // 4. P3 - Medium: Moderate shortage (1 - 4 teachers needed)
  if (isShortage && shortage > 0) {
    return {
      tier: 'P3',
      label: 'P3 - Medium',
      level: 'medium',
      score: 2000 + (shortage * 20) + (directShortage * 15) + demand,
      color: '#2563eb',
      bg: '#eff6ff',
      border: '#bfdbfe',
      fullReason: `MEDIUM PRIORITY: Moderate deficit of ${shortage} teacher(s)`
    };
  }

  // 5. P4 - Balanced: Demand and reserve are met
  return {
    tier: 'P4',
    label: 'P4 - Balanced',
    level: 'balanced',
    score: 100 - (item.buffer || 0),
    color: '#166534',
    bg: '#f0fdf4',
    border: '#bbf7d0',
    fullReason: `BALANCED: Current capacity covers student inquiries and backup reserve`
  };
};

export default function SupplyDemandReport({
  analyticsData = null,
  loading = false,
  onRefresh
}) {
  // 1. Column Dimension Selector (Audio 3: Default is 'level')
  const [columnDimension, setColumnDimension] = useState('level'); // 'level' | 'class' | 'board' | 'department'

  // 2. Shortage Forecasting Lookback Period (Audio 3: Default is 'all' - Lifetime)
  const [forecastPeriod, setForecastPeriod] = useState('all'); // 'all' | '1_month' | '2_months' | '3_months' | '6_months' | '9_months' | '1_year'

  // 3. Secondary Cross-Filters (Audio: Board CBSE/Kerala, Level, Class)
  const [boardFilter, setBoardFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');

  // 4. "Show Shortage Only" Toggle (Audio 3: Default is ON - true)
  const [showShortageOnly, setShowShortageOnly] = useState(true);

  // 5. Subject Search Query
  const [searchQuery, setSearchQuery] = useState('');

  // 6. Selected Cell for Pop-up Modal (Audio: Click cell for details)
  const [selectedCellDrilldown, setSelectedCellDrilldown] = useState(null);

  // 7. Expanded Teachers for Subject Badges in Modal (Audio 3: +X more expander)
  const [expandedTeacherIds, setExpandedTeacherIds] = useState(new Set());

  // 8. View Mode: 'pivot' | 'list' (Audio 3: Default is 'list')
  const [viewMode, setViewMode] = useState('list');

  // 9. List View Sort State (Audio 2: Default sort by Priority so most critical hiring needs appear first)
  const [listSortKey, setListSortKey] = useState('priority'); // 'priority' | 'subjectName' | 'dimensionLabel' | 'demand' | 'supply' | 'backupRequired' | 'shortage' | 'urgentNoTeacher'
  const [listSortDirection, setListSortDirection] = useState('desc'); // 'asc' | 'desc'

  // 10. Multi-Select State for List View (Audio 2: Select with checkboxes, Select All, Export to Excel)
  const [selectedRowIds, setSelectedRowIds] = useState(new Set());

  // 11. Clipboard Copied Feedback State for Media/HR Hiring Brief (Audio 1)
  const [copiedBrief, setCopiedBrief] = useState(false);

  // 12. Safety Backup Reserve Percentage (Audio: 10% default, configurable)
  const [backupPercentage, setBackupPercentage] = useState(10);

  // 13. Export to Excel Status Toast
  const [exportingStatus, setExportingStatus] = useState(null);

  const handleListSort = (key) => {
    if (listSortKey === key) {
      setListSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setListSortKey(key);
      setListSortDirection('desc');
    }
  };

  const toggleTeacherExpand = (teacherId) => {
    setExpandedTeacherIds(prev => {
      const next = new Set(prev);
      if (next.has(teacherId)) {
        next.delete(teacherId);
      } else {
        next.add(teacherId);
      }
      return next;
    });
  };

  if (!analyticsData) {
    return (
      <div className="table-container" style={{ padding: '4rem', textAlign: 'center', background: '#fff' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading Supply vs Demand Intelligence...</p>
      </div>
    );
  }

  const { kpis, processedDemos = [], detailedRows = [] } = analyticsData;

  // Active Filter Count for Reset
  const activeSecondaryFilterCount = (boardFilter ? 1 : 0) + 
                                     (levelFilter ? 1 : 0) + 
                                     (classFilter ? 1 : 0) + 
                                     (forecastPeriod !== 'all' ? 1 : 0) + 
                                     (searchQuery ? 1 : 0) + 
                                     (showShortageOnly ? 1 : 0) +
                                     (backupPercentage !== 10 ? 1 : 0);

  const handleResetFilters = () => {
    setBoardFilter('');
    setLevelFilter('');
    setClassFilter('');
    setForecastPeriod('all');
    setSearchQuery('');
    setShowShortageOnly(false);
    setBackupPercentage(10);
  };

  // Define Column Definitions based on selected columnDimension (Audio 4: Department added with General default)
  const columnDefs = useMemo(() => {
    switch (columnDimension) {
      case 'level':
        return [
          { key: 'LP', label: 'LP (Lower Primary)', shortLabel: 'LP' },
          { key: 'UP', label: 'UP (Upper Primary)', shortLabel: 'UP' },
          { key: 'HS', label: 'HS (High School)', shortLabel: 'HS' },
          { key: 'HSS', label: 'HSS (Higher Sec)', shortLabel: 'HSS' }
        ];

      case 'board':
        return [
          { key: 'CBSE', label: 'CBSE', shortLabel: 'CBSE' },
          { key: 'Kerala', label: 'Kerala State', shortLabel: 'Kerala' }
        ];

      case 'department': {
        const deptSet = new Set(['General']);
        (detailedRows || []).forEach(dr => {
          const dept = (dr.department || '').trim();
          if (dept) deptSet.add(dept);
        });
        (processedDemos || []).forEach(d => {
          const dept = (d.department || '').trim();
          if (dept) deptSet.add(dept);
        });
        const depts = Array.from(deptSet).sort((a, b) => {
          if (a === 'General') return -1;
          if (b === 'General') return 1;
          return a.localeCompare(b);
        });
        return depts.map(dep => ({
          key: dep,
          label: dep,
          shortLabel: dep
        }));
      }

      case 'class':
      default:
        return [
          { key: 'Class 1', label: 'Class 1', shortLabel: 'Cl 1' },
          { key: 'Class 2', label: 'Class 2', shortLabel: 'Cl 2' },
          { key: 'Class 3', label: 'Class 3', shortLabel: 'Cl 3' },
          { key: 'Class 4', label: 'Class 4', shortLabel: 'Cl 4' },
          { key: 'Class 5', label: 'Class 5', shortLabel: 'Cl 5' },
          { key: 'Class 6', label: 'Class 6', shortLabel: 'Cl 6' },
          { key: 'Class 7', label: 'Class 7', shortLabel: 'Cl 7' },
          { key: 'Class 8', label: 'Class 8', shortLabel: 'Cl 8' },
          { key: 'Class 9', label: 'Class 9', shortLabel: 'Cl 9' },
          { key: 'Class 10', label: 'Class 10', shortLabel: 'Cl 10' },
          { key: 'Plus 1', label: 'Plus 1', shortLabel: '+1' },
          { key: 'Plus 2', label: 'Plus 2', shortLabel: '+2' }
        ];
    }
  }, [columnDimension, detailedRows, processedDemos]);

  // Available options for secondary filter dropdowns
  const filterOptions = useMemo(() => {
    const boards = new Set();
    const levels = new Set();
    const classes = new Set();

    processedDemos.forEach(d => {
      if (d.board) boards.add(d.board);
      if (d.level) levels.add(d.level);
      if (d.stage) classes.add(d.stage);
    });

    return {
      boards: Array.from(boards).sort(),
      levels: Array.from(levels).sort(),
      classes: Array.from(classes).sort((a, b) => {
        const numA = parseInt(a.replace(/\D/g, ''), 10) || 99;
        const numB = parseInt(b.replace(/\D/g, ''), 10) || 99;
        return numA - numB;
      })
    };
  }, [processedDemos]);

  // Reference Date for Forecast Lookback (Audio 4)
  const maxDemoDate = useMemo(() => {
    if (kpis?.maxDemoDate) return new Date(kpis.maxDemoDate);
    let maxD = null;
    processedDemos.forEach(d => {
      const pDate = d.parsedDate ? new Date(d.parsedDate) : parseDemoDate(d.slotDate);
      if (pDate && !isNaN(pDate.getTime())) {
        if (!maxD || pDate > maxD) maxD = pDate;
      }
    });
    return maxD || new Date();
  }, [processedDemos, kpis]);

  // Lookback Start Date based on "Shortage for" period (Audio 4: Next 1 Month = Past 30 Days Demand, etc.)
  const lookbackStartDate = useMemo(() => {
    if (!maxDemoDate || forecastPeriod === 'all') return null;
    const msPerDay = 24 * 60 * 60 * 1000;
    switch (forecastPeriod) {
      case '1_month': return new Date(maxDemoDate.getTime() - 30 * msPerDay);
      case '2_months': return new Date(maxDemoDate.getTime() - 60 * msPerDay);
      case '3_months': return new Date(maxDemoDate.getTime() - 90 * msPerDay);
      case '6_months': return new Date(maxDemoDate.getTime() - 180 * msPerDay);
      case '9_months': return new Date(maxDemoDate.getTime() - 270 * msPerDay);
      case '1_year': return new Date(maxDemoDate.getTime() - 365 * msPerDay);
      default: return null;
    }
  }, [maxDemoDate, forecastPeriod]);

  // Filter processedDemos by Forecast Lookback and Secondary Cross-Filters
  const filteredDemos = useMemo(() => {
    return processedDemos.filter(d => {
      // 1. Forecast lookback check (Audio 4: Demand changes based on lookback, supply is fixed)
      if (lookbackStartDate) {
        const pDate = d.parsedDate ? new Date(d.parsedDate) : parseDemoDate(d.slotDate);
        if (pDate && pDate < lookbackStartDate) return false;
      }
      // 2. Secondary cross-filters
      if (boardFilter && d.board !== boardFilter) return false;
      if (levelFilter && d.level !== levelFilter) return false;
      if (classFilter && d.stage !== classFilter) return false;
      return true;
    });
  }, [processedDemos, lookbackStartDate, boardFilter, levelFilter, classFilter]);

  // Dynamic KPIs reflecting the current forecast lookback and cross-filters
  const dynamicKpis = useMemo(() => {
    const totalD = filteredDemos.length;
    const urgentNoTeacher = filteredDemos.filter(d => d.isUrgentPending).length;
    const lostNoTeacher = filteredDemos.filter(d => d.isLostNoTeacher).length;
    const converted = filteredDemos.filter(d => d.status === 'Converted to Sale').length;
    const conversionRate = totalD > 0 ? Number(((converted / totalD) * 100).toFixed(1)) : 0;
    return {
      totalDemos: totalD,
      urgentPendingNoTeacher: urgentNoTeacher,
      lostNoTeacher,
      totalConverted: converted,
      conversionRate
    };
  }, [filteredDemos]);

  // Build the Pivot Matrix: Demand (demo requests) vs Supply (count of qualified teachers with available slots)
  const { pivotRows, columnTotals, grandTotal, totalShortageSubjectCount } = useMemo(() => {
    const subjectMap = new Map();

    // From filtered demos
    filteredDemos.forEach(d => {
      const sName = (d.subjectName || 'Unknown Subject').trim();
      if (!subjectMap.has(sName)) {
        subjectMap.set(sName, {
          subjectName: sName,
          demos: []
        });
      }
      subjectMap.get(sName).demos.push(d);
    });

    // Also include subjects from detailedRows matching filters so supply is fully visible
    (detailedRows || []).forEach(dr => {
      if (boardFilter && dr.board !== boardFilter) return;
      if (levelFilter && dr.level !== levelFilter) return;
      if (classFilter && dr.stage !== classFilter) return;
      const sName = (dr.subjectName || '').trim();
      if (sName && !subjectMap.has(sName)) {
        subjectMap.set(sName, {
          subjectName: sName,
          demos: []
        });
      }
    });

    // Helper to get column key for a demo (Audio 4: Department supported with General default)
    const getColKey = (demo) => {
      switch (columnDimension) {
        case 'level': return demo.level;
        case 'board': return demo.board;
        case 'department': return (demo.department || '').trim() || 'General';
        case 'class':
        default: return demo.stage;
      }
    };

    const colKeys = columnDefs.map(c => c.key);
    let shortageSubjectCount = 0;

    const rows = Array.from(subjectMap.values()).map(sub => {
      const cells = {};
      let rowTotalDemand = 0;
      let rowTotalSupply = 0;
      let rowTotalShortage = 0;
      let rowTotalUrgentNoTeacher = 0;
      let hasAnyShortage = false;

      colKeys.forEach(colKey => {
        // Demand: count of demo requests in this intersection
        const matchingDemos = sub.demos.filter(d => getColKey(d) === colKey);
        const demand = matchingDemos.length;
        const urgentNoTeacher = matchingDemos.filter(d => d.isUrgentPending).length;

        // Supply: count of unique qualified teachers who have >= 1 available session (Audio 2 & 3)
        const qualifiedTeachersMap = new Map();

        (detailedRows || []).forEach(dr => {
          if (boardFilter && dr.board !== boardFilter) return;
          if (levelFilter && dr.level !== levelFilter) return;
          if (classFilter && dr.stage !== classFilter) return;

          const drColKey = columnDimension === 'level' ? dr.level :
                           columnDimension === 'board' ? dr.board :
                           columnDimension === 'department' ? ((dr.department || '').trim() || 'General') :
                           dr.stage;

          if (dr.subjectName === sub.subjectName && drColKey === colKey) {
            (dr.qualifiedTeachers || []).forEach(qt => {
              if (!qualifiedTeachersMap.has(qt.teacherId)) {
                qualifiedTeachersMap.set(qt.teacherId, qt);
              }
            });
          }
        });

        const qualifiedTeachersList = Array.from(qualifiedTeachersMap.values());
        const teacherSupply = qualifiedTeachersList.length; // Audio 2 & 3: Supply is count of teachers!

        // Safety Backup & Shortage Calculation (Audio: Configurable % buffer based on demand)
        const backupRequired = (demand > 0 && backupPercentage > 0) ? Math.ceil(demand * (backupPercentage / 100)) : 0;
        const targetRequiredSupply = demand + backupRequired;
        const directShortage = demand > teacherSupply ? (demand - teacherSupply) : 0;
        const isShortage = (teacherSupply < targetRequiredSupply) || (urgentNoTeacher > 0);
        const shortageValue = targetRequiredSupply > teacherSupply ? (targetRequiredSupply - teacherSupply) : 0;
        const bufferValue = teacherSupply >= targetRequiredSupply ? (teacherSupply - targetRequiredSupply) : 0;

        if (isShortage) {
          hasAnyShortage = true;
          rowTotalShortage += shortageValue;
        }

        rowTotalDemand += demand;
        rowTotalSupply += teacherSupply;
        rowTotalUrgentNoTeacher += urgentNoTeacher;

        // Build demand subject breakdown (Audio: "ഏതൊക്കെ സബ്ജക്റ്റ് ആണ് ആ ഡിമാൻഡ്? അത് കാണിക്കണം")
        const subjectBreakdownMap = new Map();
        matchingDemos.forEach(d => {
          const sId = (d.subjectId || '').trim();
          const sLabel = d.label || `${d.stage} - ${d.subjectName} (${d.board})`;
          const key = sId || sLabel;
          if (!subjectBreakdownMap.has(key)) {
            subjectBreakdownMap.set(key, {
              subjectId: sId,
              subjectLabel: sLabel,
              subjectName: d.subjectName,
              stage: d.stage,
              board: d.board,
              count: 0,
              urgentCount: 0,
              convertedCount: 0,
              scheduledCount: 0,
              demos: []
            });
          }
          const entry = subjectBreakdownMap.get(key);
          entry.count++;
          if (d.isUrgentPending) entry.urgentCount++;
          if (d.status === 'Converted to Sale') entry.convertedCount++;
          if (d.status === 'Scheduled') entry.scheduledCount++;
          entry.demos.push(d);
        });
        const demandSubjectsList = Array.from(subjectBreakdownMap.values()).sort((a, b) => b.count - a.count);

        // Subjects that have student demand but ZERO teachers available in Edstaq
        const zeroSupplySubjects = demandSubjectsList.filter(ds => {
          const hasTeacher = qualifiedTeachersList.some(qt => 
            (qt.matchedSubjectId && qt.matchedSubjectId === ds.subjectId) ||
            (qt.qualifiedSubjects && qt.qualifiedSubjects.some(qs => qs.id === ds.subjectId))
          );
          return !hasTeacher;
        });

        cells[colKey] = {
          colKey,
          colLabel: columnDefs.find(c => c.key === colKey)?.label || colKey,
          subjectName: sub.subjectName,
          columnDimension,
          boardFilter,
          levelFilter,
          classFilter,
          demand,
          supply: teacherSupply,
          backupRequired,
          backupPercentage,
          targetRequiredSupply,
          directShortage,
          shortage: shortageValue,
          buffer: bufferValue,
          isShortage,
          urgentNoTeacher,
          teachersCount: teacherSupply,
          qualifiedTeachers: qualifiedTeachersList,
          demos: matchingDemos,
          demandSubjectsList,
          zeroSupplySubjects
        };
      });

      if (hasAnyShortage) {
        shortageSubjectCount++;
      }

      // Row-level teachers, demos and subject breakdown
      const rowQualifiedTeachersMap = new Map();
      const rowAllDemos = [];
      Object.values(cells).forEach(c => {
        (c.qualifiedTeachers || []).forEach(qt => {
          if (!rowQualifiedTeachersMap.has(qt.teacherId)) {
            rowQualifiedTeachersMap.set(qt.teacherId, qt);
          }
        });
        rowAllDemos.push(...(c.demos || []));
      });
      const rowQualifiedTeachers = Array.from(rowQualifiedTeachersMap.values());
      const rowTeacherSupply = rowQualifiedTeachers.length;

      const rowSubjectBreakdownMap = new Map();
      rowAllDemos.forEach(d => {
        const sId = (d.subjectId || '').trim();
        const sLabel = d.label || `${d.stage} - ${d.subjectName} (${d.board})`;
        const key = sId || sLabel;
        if (!rowSubjectBreakdownMap.has(key)) {
          rowSubjectBreakdownMap.set(key, {
            subjectId: sId,
            subjectLabel: sLabel,
            subjectName: d.subjectName,
            stage: d.stage,
            board: d.board,
            count: 0,
            urgentCount: 0,
            convertedCount: 0,
            scheduledCount: 0,
            demos: []
          });
        }
        const entry = rowSubjectBreakdownMap.get(key);
        entry.count++;
        if (d.isUrgentPending) entry.urgentCount++;
        if (d.status === 'Converted to Sale') entry.convertedCount++;
        if (d.status === 'Scheduled') entry.scheduledCount++;
        entry.demos.push(d);
      });
      const rowDemandSubjectsList = Array.from(rowSubjectBreakdownMap.values()).sort((a, b) => b.count - a.count);
      const rowZeroSupplySubjects = rowDemandSubjectsList.filter(ds => {
        return !rowQualifiedTeachers.some(qt => 
          (qt.matchedSubjectId && qt.matchedSubjectId === ds.subjectId) ||
          (qt.qualifiedSubjects && qt.qualifiedSubjects.some(qs => qs.id === ds.subjectId))
        );
      });

      const rowBackupRequired = (rowTotalDemand > 0 && backupPercentage > 0) ? Math.ceil(rowTotalDemand * (backupPercentage / 100)) : 0;
      const rowTargetRequiredSupply = rowTotalDemand + rowBackupRequired;
      const rowDirectShortage = rowTotalDemand > rowTeacherSupply ? (rowTotalDemand - rowTeacherSupply) : 0;
      const rowTotalShortageVal = rowTargetRequiredSupply > rowTeacherSupply ? (rowTargetRequiredSupply - rowTeacherSupply) : 0;
      const rowTotalBufferVal = rowTeacherSupply >= rowTargetRequiredSupply ? (rowTeacherSupply - rowTargetRequiredSupply) : 0;
      const rowIsShortage = (rowTeacherSupply < rowTargetRequiredSupply) || (rowTotalUrgentNoTeacher > 0);

      const totalCellData = {
        colKey: 'TOTAL_ROW',
        colLabel: 'All Classes/Levels (Row Total)',
        subjectName: sub.subjectName,
        demand: rowTotalDemand,
        supply: rowTeacherSupply,
        backupRequired: rowBackupRequired,
        backupPercentage,
        targetRequiredSupply: rowTargetRequiredSupply,
        directShortage: rowDirectShortage,
        shortage: rowTotalShortageVal,
        buffer: rowTotalBufferVal,
        isShortage: rowIsShortage,
        urgentNoTeacher: rowTotalUrgentNoTeacher,
        teachersCount: rowTeacherSupply,
        qualifiedTeachers: rowQualifiedTeachers,
        demos: rowAllDemos,
        demandSubjectsList: rowDemandSubjectsList,
        zeroSupplySubjects: rowZeroSupplySubjects,
        isRowTotal: true
      };

      return {
        subjectName: sub.subjectName,
        cells,
        rowTotalDemand,
        rowTotalSupply: rowTeacherSupply,
        rowTotalBackupRequired: rowBackupRequired,
        rowTotalShortage: rowTotalShortageVal,
        rowTotalBuffer: rowTotalBufferVal,
        rowTotalUrgentNoTeacher,
        hasAnyShortage,
        totalCellData
      };
    });

    // Column Totals across all rows
    const colTotals = {};
    let gDemand = 0;
    let gSupply = 0;
    let gShortage = 0;
    let gUrgentNoTeacher = 0;

    colKeys.forEach(colKey => {
      let cDemand = 0;
      let cSupply = 0;
      let cShortage = 0;
      let cUrgentNoTeacher = 0;

      const colQualifiedTeachersMap = new Map();
      const colAllDemos = [];

      rows.forEach(r => {
        const c = r.cells[colKey];
        if (c) {
          cDemand += c.demand;
          cSupply += c.supply;
          cShortage += c.shortage;
          cUrgentNoTeacher += c.urgentNoTeacher;
          (c.qualifiedTeachers || []).forEach(qt => {
            if (!colQualifiedTeachersMap.has(qt.teacherId)) {
              colQualifiedTeachersMap.set(qt.teacherId, qt);
            }
          });
          colAllDemos.push(...(c.demos || []));
        }
      });

      const colQualifiedTeachers = Array.from(colQualifiedTeachersMap.values());
      const colTeacherSupply = colQualifiedTeachers.length;

      const colSubjectBreakdownMap = new Map();
      colAllDemos.forEach(d => {
        const sId = (d.subjectId || '').trim();
        const sLabel = d.label || `${d.stage} - ${d.subjectName} (${d.board})`;
        const key = sId || sLabel;
        if (!colSubjectBreakdownMap.has(key)) {
          colSubjectBreakdownMap.set(key, {
            subjectId: sId,
            subjectLabel: sLabel,
            subjectName: d.subjectName,
            stage: d.stage,
            board: d.board,
            count: 0,
            urgentCount: 0,
            convertedCount: 0,
            scheduledCount: 0,
            demos: []
          });
        }
        const entry = colSubjectBreakdownMap.get(key);
        entry.count++;
        if (d.isUrgentPending) entry.urgentCount++;
        if (d.status === 'Converted to Sale') entry.convertedCount++;
        if (d.status === 'Scheduled') entry.scheduledCount++;
        entry.demos.push(d);
      });
      const colDemandSubjectsList = Array.from(colSubjectBreakdownMap.values()).sort((a, b) => b.count - a.count);
      const colZeroSupplySubjects = colDemandSubjectsList.filter(ds => {
        return !colQualifiedTeachers.some(qt => 
          (qt.matchedSubjectId && qt.matchedSubjectId === ds.subjectId) ||
          (qt.qualifiedSubjects && qt.qualifiedSubjects.some(qs => qs.id === ds.subjectId))
        );
      });

      const colBackupRequired = (cDemand > 0 && backupPercentage > 0) ? Math.ceil(cDemand * (backupPercentage / 100)) : 0;
      const colTargetRequiredSupply = cDemand + colBackupRequired;
      const colDirectShortage = cDemand > colTeacherSupply ? (cDemand - colTeacherSupply) : 0;
      const colShortageVal = colTargetRequiredSupply > colTeacherSupply ? (colTargetRequiredSupply - colTeacherSupply) : 0;
      const colBufferVal = colTeacherSupply >= colTargetRequiredSupply ? (colTeacherSupply - colTargetRequiredSupply) : 0;
      const colIsShortage = (colTeacherSupply < colTargetRequiredSupply) || (cUrgentNoTeacher > 0);

      colTotals[colKey] = {
        demand: cDemand,
        supply: colTeacherSupply,
        backupRequired: colBackupRequired,
        backupPercentage,
        targetRequiredSupply: colTargetRequiredSupply,
        directShortage: colDirectShortage,
        shortage: colShortageVal,
        buffer: colBufferVal,
        urgentNoTeacher: cUrgentNoTeacher,
        hasShortage: colIsShortage,
        cellData: {
          colKey,
          colLabel: columnDefs.find(c => c.key === colKey)?.label || colKey,
          subjectName: 'All Subjects',
          demand: cDemand,
          supply: colTeacherSupply,
          backupRequired: colBackupRequired,
          backupPercentage,
          targetRequiredSupply: colTargetRequiredSupply,
          directShortage: colDirectShortage,
          shortage: colShortageVal,
          buffer: colBufferVal,
          isShortage: colIsShortage,
          urgentNoTeacher: cUrgentNoTeacher,
          teachersCount: colTeacherSupply,
          qualifiedTeachers: colQualifiedTeachers,
          demos: colAllDemos,
          demandSubjectsList: colDemandSubjectsList,
          zeroSupplySubjects: colZeroSupplySubjects,
          isColTotal: true
        }
      };

      gDemand += cDemand;
      gSupply += colTeacherSupply;
      gShortage += colShortageVal;
      gUrgentNoTeacher += cUrgentNoTeacher;
    });

    // Grand Total unique teachers and subject breakdown
    const allUniqueTeachersMap = new Map();
    rows.forEach(r => {
      (r.totalCellData?.qualifiedTeachers || []).forEach(qt => {
        if (!allUniqueTeachersMap.has(qt.teacherId)) {
          allUniqueTeachersMap.set(qt.teacherId, qt);
        }
      });
    });
    const allUniqueTeachers = Array.from(allUniqueTeachersMap.values());
    const grandTeacherSupply = allUniqueTeachers.length;

    const grandSubjectBreakdownMap = new Map();
    filteredDemos.forEach(d => {
      const sId = (d.subjectId || '').trim();
      const sLabel = d.label || `${d.stage} - ${d.subjectName} (${d.board})`;
      const key = sId || sLabel;
      if (!grandSubjectBreakdownMap.has(key)) {
        grandSubjectBreakdownMap.set(key, {
          subjectId: sId,
          subjectLabel: sLabel,
          subjectName: d.subjectName,
          stage: d.stage,
          board: d.board,
          count: 0,
          urgentCount: 0,
          convertedCount: 0,
          scheduledCount: 0,
          demos: []
        });
      }
      const entry = grandSubjectBreakdownMap.get(key);
      entry.count++;
      if (d.isUrgentPending) entry.urgentCount++;
      if (d.status === 'Converted to Sale') entry.convertedCount++;
      if (d.status === 'Scheduled') entry.scheduledCount++;
      entry.demos.push(d);
    });
    const grandDemandSubjectsList = Array.from(grandSubjectBreakdownMap.values()).sort((a, b) => b.count - a.count);
    const grandZeroSupplySubjects = grandDemandSubjectsList.filter(ds => {
      return !allUniqueTeachers.some(qt => 
        (qt.matchedSubjectId && qt.matchedSubjectId === ds.subjectId) ||
        (qt.qualifiedSubjects && qt.qualifiedSubjects.some(qs => qs.id === ds.subjectId))
      );
    });

    const grandBackupRequired = (gDemand > 0 && backupPercentage > 0) ? Math.ceil(gDemand * (backupPercentage / 100)) : 0;
    const grandTargetRequiredSupply = gDemand + grandBackupRequired;
    const grandDirectShortage = gDemand > grandTeacherSupply ? (gDemand - grandTeacherSupply) : 0;
    const grandShortageVal = grandTargetRequiredSupply > grandTeacherSupply ? (grandTargetRequiredSupply - grandTeacherSupply) : 0;
    const grandBufferVal = grandTeacherSupply >= grandTargetRequiredSupply ? (grandTeacherSupply - grandTargetRequiredSupply) : 0;

    return {
      pivotRows: rows,
      columnTotals: colTotals,
      grandTotal: {
        demand: gDemand,
        supply: grandTeacherSupply,
        backupRequired: grandBackupRequired,
        backupPercentage,
        targetRequiredSupply: grandTargetRequiredSupply,
        directShortage: grandDirectShortage,
        shortage: grandShortageVal,
        buffer: grandBufferVal,
        urgentNoTeacher: gUrgentNoTeacher,
        cellData: {
          colKey: 'GRAND_TOTAL',
          colLabel: 'All Classes & Dimensions',
          subjectName: 'Grand Total (All Subjects)',
          demand: gDemand,
          supply: grandTeacherSupply,
          backupRequired: grandBackupRequired,
          backupPercentage,
          targetRequiredSupply: grandTargetRequiredSupply,
          directShortage: grandDirectShortage,
          shortage: grandShortageVal,
          buffer: grandBufferVal,
          isShortage: grandShortageVal > 0 || gUrgentNoTeacher > 0,
          urgentNoTeacher: gUrgentNoTeacher,
          teachersCount: grandTeacherSupply,
          qualifiedTeachers: allUniqueTeachers,
          demos: filteredDemos,
          demandSubjectsList: grandDemandSubjectsList,
          zeroSupplySubjects: grandZeroSupplySubjects,
          isGrandTotal: true
        }
      },
      totalShortageSubjectCount: shortageSubjectCount
    };
  }, [filteredDemos, columnDimension, columnDefs, detailedRows, boardFilter, levelFilter, classFilter, backupPercentage]);

  // Filtered Rows by "Show Shortage Only" and "Subject Search"
  const displayRows = useMemo(() => {
    return pivotRows.filter(r => {
      if (showShortageOnly && !r.hasAnyShortage) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!r.subjectName.toLowerCase().includes(q)) return false;
      }
      return true;
    }).sort((a, b) => {
      // Prioritize subjects with shortages, then highest total demand
      if (a.hasAnyShortage && !b.hasAnyShortage) return -1;
      if (!a.hasAnyShortage && b.hasAnyShortage) return 1;
      return b.rowTotalDemand - a.rowTotalDemand;
    });
  }, [pivotRows, showShortageOnly, searchQuery]);

  // Helper to extract matching subjects for a teacher under the clicked cell scope (Audio 2 & 3)
  const getTeacherMatchingSubjects = (qt, cell) => {
    if (!qt || !cell) return [];
    const allSubs = qt.qualifiedSubjects || [];
    if (allSubs.length === 0 && qt.matchedSubjectLabel) {
      return [{ id: qt.matchedSubjectId, label: qt.matchedSubjectLabel, name: qt.matchedSubjectName }];
    }

    const matches = allSubs.filter(sub => {
      // 1. Subject name match (if cell is row-specific, not grand total)
      if (cell.subjectName && !cell.isGrandTotal) {
        if ((sub.name || '').trim().toUpperCase() !== (cell.subjectName || '').trim().toUpperCase()) {
          return false;
        }
      }
      // 2. Column dimension match
      if (cell.colKey && cell.colKey !== 'GRAND_TOTAL') {
        if (cell.columnDimension === 'class' && sub.stage !== cell.colKey) {
          return false;
        }
        if (cell.columnDimension === 'level' && sub.level !== cell.colKey) {
          return false;
        }
        if (cell.columnDimension === 'board' && sub.board !== cell.colKey) {
          return false;
        }
        if (cell.columnDimension === 'department') {
          const dDept = (sub.department || '').trim() || 'General';
          if (dDept !== cell.colKey) return false;
        }
      }
      // 3. Secondary cross-filters
      if (cell.boardFilter && sub.board !== cell.boardFilter) return false;
      if (cell.levelFilter && sub.level !== cell.levelFilter) return false;
      if (cell.classFilter && sub.stage !== cell.classFilter) return false;

      return true;
    });

    if (matches.length > 0) return matches;
    if (qt.matchedSubjectLabel) {
      return [{ id: qt.matchedSubjectId, label: qt.matchedSubjectLabel, name: qt.matchedSubjectName }];
    }
    return allSubs;
  };

  // Status counts for selected cell in modal (Audio 1: Count of inquiries by status)
  const demoStatusCounts = useMemo(() => {
    if (!selectedCellDrilldown?.demos) return {};
    const counts = {
      'Converted to Sale': 0,
      'Scheduled': 0,
      'Follow up': 0,
      'Rejected': 0,
      'Completed': 0
    };
    selectedCellDrilldown.demos.forEach(d => {
      const s = d.status || 'Other';
      if (counts[s] !== undefined) {
        counts[s]++;
      } else {
        counts[s] = (counts[s] || 0) + 1;
      }
    });
    return counts;
  }, [selectedCellDrilldown]);

  // Unpivoted Flat List for List View (Audio 2: Unpivoted version of pivot table with Safety Backup)
  const unpivotedList = useMemo(() => {
    const list = [];
    pivotRows.forEach(row => {
      columnDefs.forEach(col => {
        const cell = row.cells[col.key];
        if (!cell) return;
        // Include any cell that has activity (demand > 0 or supply > 0)
        if (cell.demand > 0 || cell.supply > 0) {
          const itemPriority = calculateHiringPriority({
            ...cell,
            demand: cell.demand,
            supply: cell.supply,
            shortage: cell.shortage,
            directShortage: cell.directShortage,
            backupRequired: cell.backupRequired,
            urgentNoTeacher: cell.urgentNoTeacher,
            isShortage: cell.isShortage,
            cellData: cell
          });

          list.push({
            id: `${row.subjectName}_${col.key}`,
            subjectName: row.subjectName,
            dimensionKey: col.key,
            dimensionLabel: col.label,
            shortLabel: col.shortLabel,
            demand: cell.demand,
            supply: cell.supply,
            backupRequired: cell.backupRequired || 0,
            backupPercentage: cell.backupPercentage || backupPercentage,
            targetRequiredSupply: cell.targetRequiredSupply || (cell.demand + (cell.backupRequired || 0)),
            directShortage: cell.directShortage || 0,
            shortage: cell.shortage,
            buffer: cell.buffer,
            isShortage: cell.isShortage,
            urgentNoTeacher: cell.urgentNoTeacher,
            priority: itemPriority,
            priorityScore: itemPriority.score,
            cellData: cell
          });
        }
      });
    });
    return list;
  }, [pivotRows, columnDefs, backupPercentage]);

  const filteredUnpivotedList = useMemo(() => {
    let result = unpivotedList.filter(item => {
      if (showShortageOnly && !item.isShortage) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!item.subjectName.toLowerCase().includes(q) && !item.dimensionLabel.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });

    result.sort((a, b) => {
      let valA = a[listSortKey];
      let valB = b[listSortKey];
      if (listSortKey === 'priority') {
        valA = a.priorityScore || 0;
        valB = b.priorityScore || 0;
      }
      if (listSortKey === 'shortage') {
        valA = a.isShortage ? a.shortage : -a.buffer;
        valB = b.isShortage ? b.shortage : -b.buffer;
      }
      if (listSortKey === 'backupRequired') {
        valA = a.backupRequired || 0;
        valB = b.backupRequired || 0;
      }
      if (typeof valA === 'string') {
        const cmp = valA.localeCompare(valB);
        return listSortDirection === 'asc' ? cmp : -cmp;
      }
      const numA = Number(valA) || 0;
      const numB = Number(valB) || 0;
      return listSortDirection === 'asc' ? numA - numB : numB - numA;
    });

    return result;
  }, [unpivotedList, showShortageOnly, searchQuery, listSortKey, listSortDirection]);

  const dimensionHeaderLabel = columnDimension === 'class' ? 'Class' : 
                               columnDimension === 'level' ? 'Level' : 
                               columnDimension === 'board' ? 'Board' : 'Department';

  // Selection helpers for List View (Audio 2: Multi-select & Excel Export)
  const isAllSelected = filteredUnpivotedList.length > 0 && selectedRowIds.size === filteredUnpivotedList.length;
  const isIndeterminate = selectedRowIds.size > 0 && selectedRowIds.size < filteredUnpivotedList.length;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedRowIds(new Set());
    } else {
      setSelectedRowIds(new Set(filteredUnpivotedList.map(item => item.id)));
    }
  };

  const handleToggleSelectRow = (id) => {
    setSelectedRowIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Comprehensive Export Functionality (Generates single 'Hiring Action Plan' sheet matching the on-screen table)
  const handleExportData = (overrideItems = null, format = 'xlsx') => {
    const targetItems = overrideItems 
      ? overrideItems 
      : (selectedRowIds.size > 0
          ? filteredUnpivotedList.filter(item => selectedRowIds.has(item.id))
          : filteredUnpivotedList);

    if (targetItems.length === 0) {
      alert('No records available to export.');
      return;
    }

    // Generate rich 16-Column Data exactly matching the user's specification:
    // 1. Subject Name, 2. Level, 3. Classes, 4. Boards, 5. Levels, 6. Departments,
    // 7. Hiring Priority, 8. Demand, 9. Supply, 10. Backup, 11. Net Balance, 12. No Teacher,
    // 13. Student Demand Overview, 14. Syllabus / Subject Breakdown, 15. Which Teachers Are Available, 16. Ready-to-Send Brief for Media & HR
    const sheetData = targetItems.map(item => {
      const cell = item.cellData || {};
      const brief = generateHiringBrief(cell);

      // 1. Subject Name
      const subjectName = item.subjectName || '';

      // 2. Level (Full label e.g. UP (Upper Primary))
      const levelLabel = item.dimensionLabel || '';

      // 3. Classes (e.g. Class 5, Class 6, Class 7)
      const classesStr = brief && brief.includedClasses && brief.includedClasses.length > 0
        ? brief.includedClasses.join(', ')
        : (item.dimensionLabel || '');

      // 4. Boards (e.g. CBSE, Kerala)
      const subjectBoards = Array.from(new Set(
        (detailedRows || [])
          .filter(dr => (dr.subjectName || '').trim().toUpperCase() === subjectName.trim().toUpperCase())
          .map(dr => dr.board)
          .filter(Boolean)
      )).sort();
      const demoBoards = Array.from(new Set((cell.demos || []).map(d => d.board).filter(Boolean))).sort();
      const boardsStr = subjectBoards.length > 0
        ? subjectBoards.join(', ')
        : (demoBoards.length > 0 ? demoBoards.join(', ') : (brief?.boardsStr || 'CBSE, Kerala'));

      // 5. Levels (Short key e.g. UP, HS, LP)
      let levelsKey = item.dimensionKey || item.shortLabel || '';
      if (!levelsKey && cell.demos && cell.demos.length > 0) {
        levelsKey = Array.from(new Set(cell.demos.map(d => d.level).filter(Boolean))).join(', ');
      }

      // 6. Departments (e.g. —)
      const deptSet = new Set();
      (cell.demos || []).forEach(d => { if (d.department) deptSet.add(d.department); });
      (cell.qualifiedTeachers || []).forEach(qt => {
        (qt.qualifiedSubjects || []).forEach(qs => { if (qs.department) deptSet.add(qs.department); });
      });
      const departmentsStr = deptSet.size > 0 ? Array.from(deptSet).sort().join(', ') : '—';

      // 7. Hiring Priority (e.g. P1 - Critical)
      const hiringPriority = item.priority?.label || 'P4 - Balanced';

      // 8. Demand
      const demandVal = item.demand;

      // 9. Supply
      const supplyVal = item.supply;

      // 10. Backup (e.g. +2 or 0)
      const backupVal = item.backupRequired > 0 ? `+${item.backupRequired}` : 0;

      // 11. Net Balance (e.g. -14 or +2)
      const netBal = item.isShortage ? -item.shortage : `+${item.buffer}`;

      // 12. No Teacher (e.g. 1 No Tchr or 0)
      const noTchr = item.urgentNoTeacher > 0 ? `${item.urgentNoTeacher} No Tchr` : '0';

      // 13. Student Demand Overview
      const statusCounts = {
        'Converted to Sale': 0,
        'Scheduled': 0,
        'Follow up': 0,
        'Completed': 0,
        'Rejected': 0
      };
      (cell.demos || []).forEach(d => {
        const s = d.status || 'Other';
        if (statusCounts[s] !== undefined) {
          statusCounts[s]++;
        }
      });
      const studentDemandOverview = `Converted to Sale: ${statusCounts['Converted to Sale']} | Scheduled: ${statusCounts['Scheduled']} | Follow up: ${statusCounts['Follow up']} | Completed: ${statusCounts['Completed']} | Rejected: ${statusCounts['Rejected']}`;

      // 14. Syllabus / Subject Breakdown
      const syllabusLines = (cell.demandSubjectsList || []).map(ds => {
        const matchingTeachers = (cell.qualifiedTeachers || []).filter(qt =>
          (qt.matchedSubjectId && qt.matchedSubjectId === ds.subjectId) ||
          (qt.qualifiedSubjects && qt.qualifiedSubjects.some(qs => qs.id === ds.subjectId))
        );
        const teacherSupplyCount = matchingTeachers.length;
        const isZeroSupply = teacherSupplyCount === 0 || (cell.zeroSupplySubjects || []).some(zs => 
          (zs.subjectId && zs.subjectId === ds.subjectId) || (zs.subjectLabel === ds.subjectLabel)
        );

        let statusStr = 'Covered';
        if (isZeroSupply) {
          statusStr = 'Zero-Supply';
        } else if (ds.urgentCount > 0) {
          statusStr = `Urgent (${ds.urgentCount} Unassigned)`;
        }

        const sId = ds.subjectId ? `[${ds.subjectId}] ` : '';
        return `${sId}${ds.subjectLabel} | Inquiries: ${ds.count} | Supply: ${teacherSupplyCount} | Status: ${statusStr}`;
      });
      const syllabusBreakdown = syllabusLines.length > 0 ? syllabusLines.join('\n') : 'None';

      // 15. Which Teachers Are Available
      let whichTeachersAvailable = '0 Teachers Available (Immediate Hiring Needed)';
      if (cell.qualifiedTeachers && cell.qualifiedTeachers.length > 0) {
        whichTeachersAvailable = cell.qualifiedTeachers.map(qt => {
          const cap = qt.possibleSessions !== undefined ? qt.possibleSessions : (qt.sessionsCount || 0);
          return `${qt.teacherName} (ID: ${qt.teacherId}) - Capacity: ${cap} sessions (Next 7 Days)`;
        }).join('\n');
      }

      // 16. Ready-to-Send Brief for Media & HR
      const readyToSendBrief = brief?.fullTextNote || '';

      return {
        'Subject Name': subjectName,
        'Level': levelLabel,
        'Classes': classesStr,
        'Boards': boardsStr,
        'Levels': levelsKey,
        'Departments': departmentsStr,
        'Hiring Priority': hiringPriority,
        'Demand': demandVal,
        'Supply': supplyVal,
        'Backup': backupVal,
        'Net Balance': netBal,
        'No Teacher': noTchr,
        'Student Demand Overview': studentDemandOverview,
        'Syllabus / Subject Breakdown': syllabusBreakdown,
        'Which Teachers Are Available': whichTeachersAvailable,
        'Ready-to-Send Brief for Media & HR': readyToSendBrief
      };
    });

    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `Edstaq_Hiring_Action_Plan_${columnDimension}_${dateStr}.xlsx`;

    try {
      setExportingStatus(`Generating ${fileName}...`);

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(sheetData);

      // Professional column widths for clean readability in Excel
      ws['!cols'] = [
        { wch: 18 }, // Subject Name
        { wch: 22 }, // Level
        { wch: 28 }, // Classes
        { wch: 16 }, // Boards
        { wch: 10 }, // Levels
        { wch: 14 }, // Departments
        { wch: 16 }, // Hiring Priority
        { wch: 10 }, // Demand
        { wch: 10 }, // Supply
        { wch: 10 }, // Backup
        { wch: 12 }, // Net Balance
        { wch: 14 }, // No Teacher
        { wch: 45 }, // Student Demand Overview
        { wch: 60 }, // Syllabus / Subject Breakdown
        { wch: 45 }, // Which Teachers Are Available
        { wch: 60 }  // Ready-to-Send Brief for Media & HR
      ];

      // Single 'Hiring Action Plan' sheet as requested
      XLSX.utils.book_append_sheet(wb, ws, 'Hiring Action Plan');

      // Method 1: Data URI Base64 (Reliable, fast, forces exact .xlsx filename without Chrome blob bug)
      try {
        const wboutBase64 = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
        const dataUri = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${wboutBase64}`;
        const link = document.createElement('a');
        link.href = dataUri;
        link.download = fileName;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          if (document.body.contains(link)) document.body.removeChild(link);
        }, 1000);
        setExportingStatus(`Downloaded ${fileName}`);
        setTimeout(() => setExportingStatus(null), 4000);
        return;
      } catch (dataUriErr) {
        console.warn('Data URI download failed, attempting XLSX.writeFile', dataUriErr);
      }

      // Method 2: SheetJS built-in writeFile
      try {
        XLSX.writeFile(wb, fileName);
        setExportingStatus(`Downloaded ${fileName}`);
        setTimeout(() => setExportingStatus(null), 4000);
        return;
      } catch (writeFileErr) {
        console.warn('XLSX.writeFile failed, falling back to Blob', writeFileErr);
      }

      // Method 3: Standard octet-stream Blob
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/octet-stream' });
      saveAs(blob, fileName);
      setExportingStatus(`Downloaded ${fileName}`);
      setTimeout(() => setExportingStatus(null), 4000);
    } catch (err) {
      console.error('Excel export error:', err);
      alert('Excel export error: ' + (err.message || err));
      setExportingStatus(null);
    }
  };

  const handleExportToExcel = (overrideItems = null) => handleExportData(overrideItems, 'xlsx');

  const currentHiringBrief = useMemo(() => {
    return generateHiringBrief(selectedCellDrilldown);
  }, [selectedCellDrilldown]);

  const modalHiringRequirements = useMemo(() => {
    return generateHiringRequirements(selectedCellDrilldown);
  }, [selectedCellDrilldown]);

  return (
    <div className="supply-demand-container" style={{ paddingBottom: '3.5rem' }}>
      
      {/* 1. TOP 4 EXECUTIVE KPI CARDS */}
      <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: '1.5rem' }}>
        
        {/* Urgent Allocation Card (P1 Priority) */}
        <div 
          className="metric-card urgent-kpi-card" 
          style={{ 
            borderColor: '#fca5a5', 
            background: 'linear-gradient(135deg, #fff5f5 0%, #ffffff 100%)',
            boxShadow: '0 4px 12px rgba(220, 38, 38, 0.08)'
          }}
        >
          <div className="metric-icon-box" style={{ background: '#dc2626', color: '#ffffff' }}>
            <AlertTriangle size={22} />
          </div>
          <div className="metric-info">
            <span className="metric-label" style={{ color: '#991b1b', fontWeight: 700 }}>
              Urgent Allocation Needed
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
              <span className="metric-value" style={{ color: '#b91c1c' }}>
                {dynamicKpis.urgentPendingNoTeacher}
              </span>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#dc2626' }}>
                Active Demos
              </span>
            </div>
            <span className="metric-sub" style={{ color: '#7f1d1d', fontWeight: 600 }}>
              Scheduled without Teacher assigned!
            </span>
            <div style={{ fontSize: '0.72rem', color: '#991b1b', marginTop: '0.2rem', opacity: 0.85 }}>
              + {dynamicKpis.lostNoTeacher} historical lost to shortage
            </div>
          </div>
        </div>

        {/* Total Inquiries & Conversion Rate */}
        <div className="metric-card">
          <div className="metric-icon-box royal">
            <TrendingUp size={22} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Demo Book Inquiries</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
              <span className="metric-value">{dynamicKpis.totalDemos}</span>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#16a34a' }}>
                ({dynamicKpis.conversionRate}% closed)
              </span>
            </div>
            <span className="metric-sub">
              {dynamicKpis.totalConverted} Converted • {forecastPeriod !== 'all' ? 'Window Demos' : `${kpis.totalScheduled} Scheduled`}
            </span>
          </div>
        </div>

        {/* 5th KPI: Active Teachers (Audio 4: Positioned immediately before Teacher Capacity) */}
        <div className="metric-card">
          <div className="metric-icon-box" style={{ background: '#e0f2fe', color: '#0284c7' }}>
            <UserCheck size={22} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Active Teachers</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
              <span className="metric-value">{kpis?.totalActiveTeachers || 0}</span>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                Registered
              </span>
            </div>
            <span className="metric-sub">
              Active tutors registered in Edstaq
            </span>
          </div>
        </div>

        {/* Real Teacher Supply (Audio 2 & 3: Supply is count of qualified teachers with >= 1 session) */}
        <div className="metric-card">
          <div className="metric-icon-box indigo">
            <Users size={22} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Teacher Capacity</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
              <span className="metric-value">{kpis.totalAvailableTeachers || 0}</span>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                Teachers Available
              </span>
            </div>
            <span className="metric-sub">
              {kpis.totalAvailableTeacherSessions} open sessions • {kpis.totalHighFragilityTeachers} High Fragility (R &ge; 3.5)
            </span>
          </div>
        </div>

        {/* Critical Deficit / Gap Count */}
        <div className="metric-card">
          <div className="metric-icon-box" style={{ background: '#fef3c7', color: '#b45309' }}>
            <Briefcase size={22} />
          </div>
          <div className="metric-info">
            <span className="metric-label">Deficit Gap Roles</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
              <span className="metric-value" style={{ color: '#b45309' }}>
                {totalShortageSubjectCount}
              </span>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#92400e' }}>
                Subjects in Shortage
              </span>
            </div>
            <span className="metric-sub">
              Demand exceeds available qualified teachers
            </span>
          </div>
        </div>
      </div>

      {/* 2. MODERN PIVOT TABLE TOOLBAR & CROSS-FILTERS */}
      <div className="pivot-toolbar-card">
        
        {/* Tier 1: Report Parameters & Configuration */}
        <div className="toolbar-tier toolbar-tier-config">
          {/* Shortage For Lookback Dropdown */}
          <div className="forecast-filter-box">
            <div className="forecast-filter-label">
              <Calendar size={13} />
              <span>SHORTAGE FOR:</span>
            </div>
            <select
              value={forecastPeriod}
              onChange={e => setForecastPeriod(e.target.value)}
              className="forecast-period-select"
              title="Select forecast lookback period for demand"
            >
              <option value="all">Lifetime (All Inquiries)</option>
              <option value="1_month">Next 1 Month (Past 30d Demand)</option>
              <option value="2_months">Next 2 Months (Past 60d Demand)</option>
              <option value="3_months">Next 3 Months (Past 90d Demand)</option>
              <option value="6_months">Next 6 Months (Past 180d Demand)</option>
              <option value="9_months">Next 9 Months (Past 270d Demand)</option>
              <option value="1_year">Next 1 Year (Past 365d Demand)</option>
            </select>
          </div>

          {/* Dimension Switcher */}
          <div className="dimension-selector-wrapper">
            <div className="dimension-header-tag">
              <Layers size={14} />
              <span>COLUMNS:</span>
            </div>
            <div className="dimension-pills">
              <button
                type="button"
                className={`dim-pill-btn ${columnDimension === 'class' ? 'active' : ''}`}
                onClick={() => { setColumnDimension('class'); setSelectedRowIds(new Set()); }}
              >
                <span className="dim-icon">🎓</span>
                <span>Classes (1 - 12)</span>
              </button>

              <button
                type="button"
                className={`dim-pill-btn ${columnDimension === 'level' ? 'active' : ''}`}
                onClick={() => { setColumnDimension('level'); setSelectedRowIds(new Set()); }}
              >
                <span className="dim-icon">🏫</span>
                <span>Level (LP, UP, HS, HSS)</span>
              </button>

              <button
                type="button"
                className={`dim-pill-btn ${columnDimension === 'board' ? 'active' : ''}`}
                onClick={() => { setColumnDimension('board'); setSelectedRowIds(new Set()); }}
              >
                <span className="dim-icon">🏛</span>
                <span>Board (CBSE / Kerala)</span>
              </button>

              <button
                type="button"
                className={`dim-pill-btn ${columnDimension === 'department' ? 'active' : ''}`}
                onClick={() => { setColumnDimension('department'); setSelectedRowIds(new Set()); }}
              >
                <span className="dim-icon">📂</span>
                <span>Department</span>
              </button>
            </div>
          </div>

          {/* Safety Backup Reserve Buffer Selector */}
          <div className="dimension-selector-wrapper" style={{ marginLeft: 'auto' }}>
            <div className="dimension-header-tag" style={{ background: '#eef2ff', borderColor: '#c7d2fe', color: '#4338ca' }}>
              <ShieldCheck size={14} />
              <span>SAFETY BACKUP:</span>
            </div>
            <div className="dimension-pills">
              {[
                { val: 0, label: '0%' },
                { val: 5, label: '5%' },
                { val: 10, label: '10%' },
                { val: 15, label: '15%' },
                { val: 20, label: '20%' }
              ].map(item => (
                <button
                  key={item.val}
                  type="button"
                  className={`dim-pill-btn ${backupPercentage === item.val ? 'active' : ''}`}
                  style={backupPercentage === item.val ? { background: '#4f46e5', borderColor: '#4338ca', color: '#ffffff' } : {}}
                  onClick={() => setBackupPercentage(item.val)}
                  title={`Set safety backup reserve to ${item.val}% of student demand`}
                >
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tier 2: View Controls, Shortage Toggle & Quick Search */}
        <div className="toolbar-tier toolbar-tier-actions">
          <div className="toolbar-tier-left">
            {/* View Switcher: Pivot View vs List View */}
            <div className="view-tabs" style={{ background: '#f1f5f9', padding: '0.2rem', gap: '0.2rem', borderRadius: '10px' }}>
              <button
                type="button"
                className={`view-tab ${viewMode === 'pivot' ? 'active' : ''}`}
                onClick={() => setViewMode('pivot')}
                title="Pivot Table Matrix View"
                style={{ padding: '0.4rem 0.85rem', fontSize: '0.82rem' }}
              >
                <Layers size={14} />
                <span>Pivot View</span>
              </button>
              <button
                type="button"
                className={`view-tab ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="Unpivoted Flat List View"
                style={{ padding: '0.4rem 0.85rem', fontSize: '0.82rem' }}
              >
                <ListFilter size={14} />
                <span>List View</span>
                <span style={{
                  fontSize: '0.72rem',
                  padding: '0.08rem 0.45rem',
                  borderRadius: '10px',
                  background: viewMode === 'list' ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                  color: viewMode === 'list' ? '#ffffff' : '#475569',
                  marginLeft: '4px',
                  fontWeight: 800
                }}>
                  {filteredUnpivotedList.length}
                </span>
              </button>
            </div>

            {/* Shortage Toggle Button */}
            <button
              type="button"
              className={`shortage-badge-btn ${showShortageOnly ? 'active' : ''}`}
              onClick={() => setShowShortageOnly(prev => !prev)}
              title={showShortageOnly ? 'Click to show all subjects' : 'Filter to only subjects with a teacher shortage'}
            >
              <AlertCircle size={15} className={showShortageOnly ? 'spin-slow' : ''} />
              <span>{showShortageOnly ? 'Showing Shortage Only' : 'Show Shortage Only'}</span>
              <span className="shortage-badge-counter">{totalShortageSubjectCount}</span>
            </button>
          </div>

          <div className="toolbar-tier-right">
            {/* Premium SaaS Search Input */}
            <div className="premium-search-container">
              <div className="search-icon-circle">
                <Search size={14} />
              </div>
              <input
                type="text"
                placeholder="Search subject (e.g. Maths, Science)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="premium-search-input"
              />
              {searchQuery ? (
                <button type="button" onClick={() => setSearchQuery('')} className="premium-search-clear-btn" title="Clear search">
                  ×
                </button>
              ) : (
                <span className="search-keyboard-hint">Filter</span>
              )}
            </div>
          </div>
        </div>

        {/* Tier 3: Secondary Cross-Filters Row & Informative Legend */}
        <div className="toolbar-tier toolbar-tier-filters">
          <div className="cross-filters-group">
            <div className="cross-filters-label">
              <SlidersHorizontal size={13} />
              <span>Cross Filters:</span>
            </div>

            {/* Board Quick-Filter Pills */}
            {columnDimension !== 'board' && (
              <div className="filter-pill-group">
                <span className="filter-group-title">Board:</span>
                <button
                  type="button"
                  className={`quick-board-pill ${boardFilter === '' ? 'active' : ''}`}
                  onClick={() => setBoardFilter('')}
                >
                  All Boards
                </button>
                <button
                  type="button"
                  className={`quick-board-pill ${boardFilter === 'CBSE' ? 'active' : ''}`}
                  onClick={() => setBoardFilter('CBSE')}
                >
                  CBSE
                </button>
                <button
                  type="button"
                  className={`quick-board-pill ${boardFilter === 'Kerala' ? 'active' : ''}`}
                  onClick={() => setBoardFilter('Kerala')}
                >
                  Kerala State
                </button>
              </div>
            )}

            {/* Level Quick Pills */}
            {columnDimension !== 'level' && (
              <div className="filter-pill-group">
                <span className="filter-group-title">Level:</span>
                <button
                  type="button"
                  className={`quick-board-pill ${levelFilter === '' ? 'active' : ''}`}
                  onClick={() => setLevelFilter('')}
                >
                  All
                </button>
                {['LP', 'UP', 'HS', 'HSS'].map(lvl => (
                  <button
                    key={lvl}
                    type="button"
                    className={`quick-board-pill ${levelFilter === lvl ? 'active' : ''}`}
                    onClick={() => setLevelFilter(lvl)}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            )}

            {/* Class Filter Dropdown (Shown when Class is NOT the column axis) */}
            {columnDimension !== 'class' && (
              <div className="cross-filter-item">
                <label className="filter-dropdown-label">Class:</label>
                <select
                  value={classFilter}
                  onChange={e => setClassFilter(e.target.value)}
                  className={`cross-filter-select ${classFilter ? 'has-value' : ''}`}
                >
                  <option value="">All Classes (Stage)</option>
                  {filterOptions.classes.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Reset Filters Button */}
            {activeSecondaryFilterCount > 0 && (
              <button
                type="button"
                className="cross-filter-reset-btn"
                onClick={handleResetFilters}
                title="Reset all filters"
              >
                <RotateCcw size={12} />
                <span>Reset ({activeSecondaryFilterCount})</span>
              </button>
            )}
          </div>

          {/* Informative Cell Guide Legend */}
          <div className="cell-legend-inline">
            <span className="legend-tag"><strong>D:</strong> Demand</span>
            <span className="legend-tag"><strong>S:</strong> Supply</span>
            {backupPercentage > 0 && (
              <span className="legend-tag" style={{ background: '#eef2ff', color: '#4338ca', border: '1px solid #c7d2fe' }}>
                <ShieldCheck size={11} style={{ display: 'inline', verticalAlign: '-1px', marginRight: '3px' }} />
                <strong>B:</strong> Backup ({backupPercentage}%)
              </span>
            )}
            <span className="legend-tag shortage"><strong>Shortage:</strong> S &lt; {backupPercentage > 0 ? '(D + B)' : 'D'}</span>
            <span className="legend-tag click-hint">💡 Click any cell for student &amp; teacher details</span>
          </div>
        </div>
      </div>

      {/* 3. SLEEK REDESIGNED PIVOT TABLE OR LIST VIEW */}
      {viewMode === 'pivot' ? (
        <div className="pivot-table-card">
          <div className="pivot-table-scroll-container">
            <table className="pivot-grid-table">
            <thead>
              <tr>
                {/* Sticky Left Subject Name Header */}
                <th className="pivot-th-subject-corner">
                  <div className="th-corner-content">
                    <span className="th-title">Subject Name</span>
                    <span className="th-count">{displayRows.length} subjects</span>
                  </div>
                </th>

                {/* Column Headers (Audio 1: Demos count removed from column headers) */}
                {columnDefs.map(col => (
                  <th key={col.key} className="pivot-th-col">
                    <div className="th-col-content">
                      <span className="th-col-name">{col.label}</span>
                    </div>
                  </th>
                ))}

                {/* Row Total Header */}
                <th className="pivot-th-total">
                  <div className="th-col-content">
                    <span className="th-col-name">Total Row</span>
                    <span className="th-col-sub">Demand vs Supply</span>
                  </div>
                </th>
              </tr>
            </thead>

            <tbody>
              {displayRows.length === 0 ? (
                <tr>
                  <td colSpan={columnDefs.length + 2} className="pivot-empty-state-cell">
                    <div className="empty-state-box">
                      <p>No subjects match your current filter criteria.</p>
                      <button type="button" className="btn btn-secondary" onClick={handleResetFilters}>
                        Clear Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                displayRows.map(row => {
                  return (
                    <tr key={row.subjectName} className={row.hasAnyShortage ? 'tr-has-shortage' : 'tr-balanced'}>
                      {/* Left Sticky Subject Name Cell */}
                      <td className="pivot-td-subject">
                        <div className="subject-name-cell-wrapper">
                          <span className="subject-cell-title">{row.subjectName}</span>
                          {row.hasAnyShortage && (
                            <span className="subject-shortage-dot" title="Shortage present in this row"></span>
                          )}
                        </div>
                      </td>

                      {/* Dynamic Cells */}
                      {columnDefs.map(col => {
                        const cell = row.cells[col.key];
                        
                        // Empty cell (no demand and no supply)
                        if (!cell || (cell.demand === 0 && cell.supply === 0)) {
                          return (
                            <td key={col.key} className="pivot-td-cell empty">
                              <span className="cell-empty-dash">—</span>
                            </td>
                          );
                        }

                        return (
                          <td 
                            key={col.key} 
                            className={`pivot-td-cell data ${cell.isShortage ? 'is-shortage' : 'is-met'}`}
                            onClick={() => {
                              setExpandedTeacherIds(new Set());
                              setSelectedCellDrilldown(cell);
                            }}
                            title={`Click to inspect details: ${row.subjectName} (${col.label})`}
                          >
                            <div className="cell-card-inner">
                              {/* Top Stats: D (Demand), S (Supply), B (Safety Backup) */}
                              <div className="cell-stats-bar">
                                <div className="cell-stat-item demand" title={`Demand: ${cell.demand} demo requests`}>
                                  <span className="stat-key">D:</span>
                                  <span className="stat-val">{cell.demand}</span>
                                </div>
                                <div className="cell-stat-divider"></div>
                                <div className="cell-stat-item supply" title={`Supply: ${cell.supply} available qualified teachers`}>
                                  <span className="stat-key">S:</span>
                                  <span className="stat-val">{cell.supply}</span>
                                </div>
                                {cell.backupRequired > 0 && (
                                  <>
                                    <div className="cell-stat-divider"></div>
                                    <div className="cell-stat-item backup" title={`Safety Backup: ${cell.backupRequired} standby teacher(s) (${cell.backupPercentage || backupPercentage}%)`}>
                                      <span className="stat-key" style={{ color: '#4f46e5' }}>B:</span>
                                      <span className="stat-val" style={{ color: '#4338ca' }}>{cell.backupRequired}</span>
                                    </div>
                                  </>
                                )}
                              </div>

                              {/* Shortage Status Badge (Audio 2: Head icon without BUF/Shortage text; Text request: remove 🚨) */}
                              <div className="cell-status-footer">
                                {cell.urgentNoTeacher > 0 ? (
                                  <div className="cell-shortage-badge urgent" title={`${cell.urgentNoTeacher} active scheduled demo(s) with NO teacher assigned!`}>
                                    <span className="pulse-alert-dot"></span>
                                    <span>{cell.urgentNoTeacher} No Tchr</span>
                                  </div>
                                ) : cell.isShortage ? (
                                  <div className="cell-shortage-badge shortage" title={`Shortage of ${cell.shortage} teachers (Direct: ${cell.directShortage || 0} + Backup: ${cell.backupRequired || 0})`}>
                                    <span>-{cell.shortage}</span>
                                    <User size={11} style={{ display: 'inline', verticalAlign: '-1px', marginLeft: '3px' }} />
                                  </div>
                                ) : (
                                  <div className="cell-shortage-badge met" title={`Buffer of +${cell.buffer} available teachers above demand and backup`}>
                                    <span>+{cell.buffer}</span>
                                    <User size={11} style={{ display: 'inline', verticalAlign: '-1px', marginLeft: '3px' }} />
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        );
                      })}

                      {/* Right Total Row Cell (Clickable) */}
                      <td 
                        className="pivot-td-total"
                        onClick={() => setSelectedCellDrilldown(row.totalCellData)}
                        style={{ cursor: 'pointer' }}
                        title={`Click to inspect total row: ${row.subjectName} across all columns`}
                      >
                        <div className="cell-card-inner total">
                          <div className="cell-stats-bar">
                            <div className="cell-stat-item demand">
                              <span className="stat-key">D:</span>
                              <span className="stat-val">{row.rowTotalDemand}</span>
                            </div>
                            <div className="cell-stat-divider"></div>
                            <div className="cell-stat-item supply">
                              <span className="stat-key">S:</span>
                              <span className="stat-val">{row.rowTotalSupply}</span>
                            </div>
                            {row.rowTotalBackupRequired > 0 && (
                              <>
                                <div className="cell-stat-divider"></div>
                                <div className="cell-stat-item backup" title={`Total Safety Backup: ${row.rowTotalBackupRequired} teacher(s)`}>
                                  <span className="stat-key" style={{ color: '#4f46e5' }}>B:</span>
                                  <span className="stat-val" style={{ color: '#4338ca' }}>{row.rowTotalBackupRequired}</span>
                                </div>
                              </>
                            )}
                          </div>
                          <div className="cell-status-footer">
                            {row.rowTotalUrgentNoTeacher > 0 ? (
                              <div className="cell-shortage-badge urgent">
                                <span className="pulse-alert-dot"></span>
                                <span>{row.rowTotalUrgentNoTeacher} No Tchr</span>
                              </div>
                            ) : row.rowTotalShortage > 0 ? (
                              <div className="cell-shortage-badge shortage" title={`Shortage of ${row.rowTotalShortage} teachers`}>
                                <span>-{row.rowTotalShortage}</span>
                                <User size={11} style={{ display: 'inline', verticalAlign: '-1px', marginLeft: '3px' }} />
                              </div>
                            ) : (
                              <div className="cell-shortage-badge met" title={`Buffer of +${row.rowTotalBuffer} available teachers`}>
                                <span>+{row.rowTotalBuffer}</span>
                                <User size={11} style={{ display: 'inline', verticalAlign: '-1px', marginLeft: '3px' }} />
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Bottom Summary Row */}
            <tfoot>
              <tr className="pivot-tr-summary">
                <td className="pivot-td-subject summary">
                  <div className="subject-name-cell-wrapper">
                    <span className="subject-cell-title" style={{ fontWeight: 800 }}>Total (All Subjects)</span>
                  </div>
                </td>

                {columnDefs.map(col => {
                  const ct = columnTotals[col.key] || { demand: 0, supply: 0, shortage: 0, urgentNoTeacher: 0 };
                  return (
                    <td 
                      key={col.key} 
                      className="pivot-td-summary-cell"
                      onClick={() => ct.cellData && setSelectedCellDrilldown(ct.cellData)}
                      style={{ cursor: 'pointer' }}
                      title={`Click to inspect column summary: ${col.label}`}
                    >
                      <div className="cell-card-inner">
                        <div className="cell-stats-bar">
                          <div className="cell-stat-item demand">
                            <span className="stat-key">D:</span>
                            <span className="stat-val">{ct.demand}</span>
                          </div>
                          <div className="cell-stat-divider"></div>
                          <div className="cell-stat-item supply">
                            <span className="stat-key">S:</span>
                            <span className="stat-val">{ct.supply}</span>
                          </div>
                          {ct.backupRequired > 0 && (
                            <>
                              <div className="cell-stat-divider"></div>
                              <div className="cell-stat-item backup" title={`Column Safety Backup: ${ct.backupRequired} teacher(s)`}>
                                <span className="stat-key" style={{ color: '#4f46e5' }}>B:</span>
                                <span className="stat-val" style={{ color: '#4338ca' }}>{ct.backupRequired}</span>
                              </div>
                            </>
                          )}
                        </div>
                        <div className="cell-status-footer">
                          {ct.urgentNoTeacher > 0 ? (
                            <div className="cell-shortage-badge urgent">
                              <span className="pulse-alert-dot"></span>
                              <span>{ct.urgentNoTeacher} No Tchr</span>
                            </div>
                          ) : ct.shortage > 0 ? (
                            <div className="cell-shortage-badge shortage" title={`Shortage of ${ct.shortage} teachers`}>
                              <span>-{ct.shortage}</span>
                              <User size={11} style={{ display: 'inline', verticalAlign: '-1px', marginLeft: '3px' }} />
                            </div>
                          ) : (
                            <div className="cell-shortage-badge met" title={`Buffer of +${ct.buffer} teachers`}>
                              <span>+{ct.buffer}</span>
                              <User size={11} style={{ display: 'inline', verticalAlign: '-1px', marginLeft: '3px' }} />
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  );
                })}

                {/* Grand Total Corner (Clickable) */}
                <td 
                  className="pivot-td-total summary"
                  onClick={() => setSelectedCellDrilldown(grandTotal.cellData)}
                  style={{ cursor: 'pointer' }}
                  title="Click to inspect Grand Total across all subjects and dimensions"
                >
                  <div className="cell-card-inner total">
                    <div className="cell-stats-bar">
                      <div className="cell-stat-item demand" style={{ color: '#0f172a' }}>
                        <span className="stat-key">D:</span>
                        <span className="stat-val">{grandTotal.demand}</span>
                      </div>
                      <div className="cell-stat-divider"></div>
                      <div className="cell-stat-item supply" style={{ color: '#0284c7' }}>
                        <span className="stat-key">S:</span>
                        <span className="stat-val">{grandTotal.supply}</span>
                      </div>
                      {grandTotal.backupRequired > 0 && (
                        <>
                          <div className="cell-stat-divider"></div>
                          <div className="cell-stat-item backup" title={`Grand Total Safety Backup: ${grandTotal.backupRequired} teacher(s)`}>
                            <span className="stat-key" style={{ color: '#4f46e5' }}>B:</span>
                            <span className="stat-val" style={{ color: '#4338ca' }}>{grandTotal.backupRequired}</span>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="cell-status-footer">
                      {grandTotal.urgentNoTeacher > 0 ? (
                        <div className="cell-shortage-badge urgent">
                          <span className="pulse-alert-dot"></span>
                          <span>{grandTotal.urgentNoTeacher} No Tchr</span>
                        </div>
                      ) : grandTotal.shortage > 0 ? (
                        <div className="cell-shortage-badge shortage" title={`Shortage of ${grandTotal.shortage} teachers`}>
                          <span>-{grandTotal.shortage}</span>
                          <User size={11} style={{ display: 'inline', verticalAlign: '-1px', marginLeft: '3px' }} />
                        </div>
                      ) : (
                        <div className="cell-shortage-badge met" title={`Buffer of +${grandTotal.buffer} teachers`}>
                          <span>+{grandTotal.buffer}</span>
                          <User size={11} style={{ display: 'inline', verticalAlign: '-1px', marginLeft: '3px' }} />
                        </div>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
      ) : (
        /* LIST VIEW TABLE (Audio 2: Unpivoted Flat Table with Multi-Select & Excel Export) */
        <div className="pivot-table-card list-view-card">
          
          {/* Batch Selection & Export Action Bar (Audio 2) */}
          <div className="list-view-selection-bar" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.75rem 1.25rem',
            background: selectedRowIds.size > 0 ? '#eff6ff' : '#ffffff',
            borderBottom: '1px solid var(--border-color)',
            transition: 'background 0.2s ease',
            flexWrap: 'wrap',
            gap: '0.6rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.84rem', color: '#0f172a' }}>
                <input 
                  type="checkbox"
                  checked={isAllSelected}
                  ref={el => { if (el) el.indeterminate = isIndeterminate; }}
                  onChange={handleToggleSelectAll}
                  style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#2563eb' }}
                />
                <span>Select All ({filteredUnpivotedList.length})</span>
              </label>

              {selectedRowIds.size > 0 && (
                <span style={{
                  background: '#dbeafe',
                  color: '#1d4ed8',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '12px'
                }}>
                  {selectedRowIds.size} selected
                </span>
              )}

              {selectedRowIds.size > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedRowIds(new Set())}
                  style={{ fontSize: '0.78rem', color: '#64748b', textDecoration: 'underline', cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
                >
                  Clear Selection
                </button>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <button
                type="button"
                className="btn btn-sm"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  background: '#16a34a',
                  color: '#ffffff',
                  border: '1px solid #15803d',
                  fontWeight: 700,
                  padding: '0.44rem 0.95rem',
                  borderRadius: '6px',
                  boxShadow: '0 1px 3px rgba(22, 163, 74, 0.2)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onClick={() => handleExportData(null, 'xlsx')}
                title="Download formatted multi-sheet Excel (.xlsx) workbook"
              >
                <FileSpreadsheet size={15} />
                <span>
                  Export to Excel {selectedRowIds.size > 0 ? `(${selectedRowIds.size} Selected)` : `(All ${filteredUnpivotedList.length})`}
                </span>
              </button>
            </div>
          </div>

          <div className="pivot-table-scroll-container">
            <table className="responsive-table data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ width: '46px', textAlign: 'center' }}>
                    <input 
                      type="checkbox"
                      checked={isAllSelected}
                      ref={el => { if (el) el.indeterminate = isIndeterminate; }}
                      onChange={handleToggleSelectAll}
                      style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#2563eb' }}
                      title="Select All Rows"
                    />
                  </th>
                  <th className={`sortable-th ${listSortKey === 'subjectName' ? 'active-sort' : ''}`} onClick={() => handleListSort('subjectName')}>
                    <div className="th-sort-wrapper">
                      <span>Subject Name</span>
                      <span className="sort-icon-box">
                        {listSortKey === 'subjectName' ? (listSortDirection === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />) : <ArrowUpDown size={12} className="idle" />}
                      </span>
                    </div>
                  </th>
                  <th className={`sortable-th ${listSortKey === 'dimensionLabel' ? 'active-sort' : ''}`} onClick={() => handleListSort('dimensionLabel')}>
                    <div className="th-sort-wrapper">
                      <span>{dimensionHeaderLabel}</span>
                      <span className="sort-icon-box">
                        {listSortKey === 'dimensionLabel' ? (listSortDirection === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />) : <ArrowUpDown size={12} className="idle" />}
                      </span>
                    </div>
                  </th>
                  <th className={`sortable-th ${listSortKey === 'priority' ? 'active-sort' : ''}`} onClick={() => handleListSort('priority')} style={{ textAlign: 'center', minWidth: '135px' }}>
                    <div className="th-sort-wrapper" style={{ justifyContent: 'center' }}>
                      <span>Hiring Priority</span>
                      <span className="sort-icon-box">
                        {listSortKey === 'priority' ? (listSortDirection === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />) : <ArrowUpDown size={12} className="idle" />}
                      </span>
                    </div>
                  </th>
                  <th className={`sortable-th ${listSortKey === 'demand' ? 'active-sort' : ''}`} onClick={() => handleListSort('demand')} style={{ textAlign: 'center' }}>
                    <div className="th-sort-wrapper" style={{ justifyContent: 'center' }}>
                      <span>Demand (D)</span>
                      <span className="sort-icon-box">
                        {listSortKey === 'demand' ? (listSortDirection === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />) : <ArrowUpDown size={12} className="idle" />}
                      </span>
                    </div>
                  </th>
                  <th className={`sortable-th ${listSortKey === 'supply' ? 'active-sort' : ''}`} onClick={() => handleListSort('supply')} style={{ textAlign: 'center' }}>
                    <div className="th-sort-wrapper" style={{ justifyContent: 'center' }}>
                      <span>Supply (S)</span>
                      <span className="sort-icon-box">
                        {listSortKey === 'supply' ? (listSortDirection === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />) : <ArrowUpDown size={12} className="idle" />}
                      </span>
                    </div>
                  </th>
                  <th className={`sortable-th ${listSortKey === 'backupRequired' ? 'active-sort' : ''}`} onClick={() => handleListSort('backupRequired')} style={{ textAlign: 'center' }}>
                    <div className="th-sort-wrapper" style={{ justifyContent: 'center' }}>
                      <span>Backup (B)</span>
                      <span className="sort-icon-box">
                        {listSortKey === 'backupRequired' ? (listSortDirection === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />) : <ArrowUpDown size={12} className="idle" />}
                      </span>
                    </div>
                  </th>
                  <th className={`sortable-th ${listSortKey === 'shortage' ? 'active-sort' : ''}`} onClick={() => handleListSort('shortage')} style={{ textAlign: 'center' }}>
                    <div className="th-sort-wrapper" style={{ justifyContent: 'center' }}>
                      <span>Net Balance</span>
                      <span className="sort-icon-box">
                        {listSortKey === 'shortage' ? (listSortDirection === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />) : <ArrowUpDown size={12} className="idle" />}
                      </span>
                    </div>
                  </th>
                  <th className={`sortable-th ${listSortKey === 'urgentNoTeacher' ? 'active-sort' : ''}`} onClick={() => handleListSort('urgentNoTeacher')} style={{ textAlign: 'center' }}>
                    <div className="th-sort-wrapper" style={{ justifyContent: 'center' }}>
                      <span>No Teacher</span>
                      <span className="sort-icon-box">
                        {listSortKey === 'urgentNoTeacher' ? (listSortDirection === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />) : <ArrowUpDown size={12} className="idle" />}
                      </span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUnpivotedList.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="pivot-empty-state-cell" style={{ textAlign: 'center', padding: '3.5rem' }}>
                      <div className="empty-state-box">
                        <p>No records match your filter criteria.</p>
                        <button type="button" className="btn btn-secondary" onClick={handleResetFilters}>
                          Clear Filters
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUnpivotedList.map(item => {
                    const isSelected = selectedRowIds.has(item.id);
                    return (
                      <tr 
                        key={item.id} 
                        className={`${item.isShortage ? 'tr-has-shortage' : 'tr-balanced'} ${isSelected ? 'tr-selected' : ''}`}
                        onClick={() => {
                          setExpandedTeacherIds(new Set());
                          setSelectedCellDrilldown(item.cellData);
                        }}
                        style={{ cursor: 'pointer' }}
                        title="Click row to inspect complete student demand, teacher supply, and hiring requirements"
                      >
                        <td style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                          <input 
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectRow(item.id)}
                            style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#2563eb' }}
                            title="Select for Excel Export"
                          />
                        </td>
                        <td style={{ fontWeight: 800, color: '#0f172a' }}>
                          {item.subjectName}
                        </td>
                        <td>
                          <span className="teacher-id-chip" style={{ fontWeight: 700 }}>
                            {item.dimensionLabel}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {item.priority && (
                            <span 
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                padding: '0.22rem 0.65rem',
                                borderRadius: '12px',
                                fontSize: '0.74rem',
                                fontWeight: 800,
                                background: item.priority.bg,
                                color: item.priority.color,
                                border: `1px solid ${item.priority.border}`,
                                whiteSpace: 'nowrap'
                              }}
                              title={item.priority.fullReason}
                            >
                              <span style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                background: item.priority.color
                              }} />
                              {item.priority.label}
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 800, color: '#0f172a' }}>
                          <span style={{ fontSize: '0.92rem' }}>{item.demand}</span>
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 800, color: '#0284c7' }}>
                          <span style={{ fontSize: '0.92rem' }}>{item.supply}</span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {item.backupRequired > 0 ? (
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              background: '#eef2ff',
                              color: '#4338ca',
                              border: '1px solid #c7d2fe',
                              padding: '0.15rem 0.5rem',
                              borderRadius: '6px',
                              fontWeight: 800,
                              fontSize: '0.82rem'
                            }} title={`Safety backup reserve: +${item.backupRequired} teacher(s) (${item.backupPercentage || backupPercentage}% buffer on ${item.demand} inquiries)`}>
                              <ShieldCheck size={12} />
                              <span>+{item.backupRequired}</span>
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>0</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {item.isShortage ? (
                            <span 
                              className="cell-shortage-badge shortage" 
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                              title={`Net Shortage: -${item.shortage} (Direct Deficit: ${item.directShortage || 0} + Backup Reserve: ${item.backupRequired || 0})`}
                            >
                              <span>-{item.shortage}</span>
                              <User size={11} />
                            </span>
                          ) : (
                            <span 
                              className="cell-shortage-badge met" 
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                              title={`Net Surplus: +${item.buffer} available teachers above demand and backup reserve`}
                            >
                              <span>+{item.buffer}</span>
                              <User size={11} />
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {item.urgentNoTeacher > 0 ? (
                            <span className="cell-shortage-badge urgent" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <span className="pulse-alert-dot"></span>
                              <span>{item.urgentNoTeacher} No Tchr</span>
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. CELL POP-UP DRILLDOWN MODAL */}
      {selectedCellDrilldown && (
        <div className="modal-overlay" onClick={() => setSelectedCellDrilldown(null)}>
          <div className="modal-content wide pivot-drilldown-modal" onClick={e => e.stopPropagation()} style={{ width: '94vw', maxWidth: '1150px' }}>
            
            {/* Modal Header */}
            <div className="modal-header" style={{ padding: '1.2rem 1.6rem', borderBottom: '1px solid var(--border-color)', background: '#f8fafc' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div className="metric-icon-box royal" style={{ width: '42px', height: '42px', borderRadius: '10px' }}>
                  <BookOpen size={20} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                      {selectedCellDrilldown.subjectName}
                    </h3>
                    <span className="teacher-id-chip" style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '0.82rem', padding: '0.22rem 0.6rem', fontWeight: 700 }}>
                      {selectedCellDrilldown.colLabel}
                    </span>
                    {boardFilter && (
                      <span className="teacher-id-chip" style={{ background: '#f1f5f9', color: '#475569', fontSize: '0.8rem' }}>
                        Board: {boardFilter}
                      </span>
                    )}
                  </div>
                  
                  {/* Summary Metric Pills */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginTop: '0.4rem', flexWrap: 'wrap', fontSize: '0.82rem' }}>
                    <span style={{ color: '#0f172a' }}>
                      Demand: <strong>{selectedCellDrilldown.demand} Inquiries</strong>
                    </span>
                    <span style={{ color: '#cbd5e1' }}>•</span>
                    <span style={{ color: '#0284c7' }}>
                      Supply: <strong>{selectedCellDrilldown.supply} Teachers</strong>
                    </span>
                    {selectedCellDrilldown.backupRequired > 0 && (
                      <>
                        <span style={{ color: '#cbd5e1' }}>•</span>
                        <span style={{ color: '#4338ca', background: '#eef2ff', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>
                          Backup Reserve: +{selectedCellDrilldown.backupRequired} ({selectedCellDrilldown.backupPercentage || backupPercentage}%)
                        </span>
                      </>
                    )}
                    <span style={{ color: '#cbd5e1' }}>•</span>
                    {selectedCellDrilldown.isShortage ? (
                      <span style={{ color: '#dc2626', fontWeight: 800, background: '#fee2e2', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                        Shortage: -{selectedCellDrilldown.shortage} Teachers {selectedCellDrilldown.backupRequired > 0 ? `(${selectedCellDrilldown.directShortage || 0} Direct + ${selectedCellDrilldown.backupRequired} Backup)` : ''}
                      </span>
                    ) : (
                      <span style={{ color: '#16a34a', fontWeight: 800, background: '#dcfce7', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                        Buffer: +{selectedCellDrilldown.buffer} Teachers
                      </span>
                    )}
                    {selectedCellDrilldown.urgentNoTeacher > 0 && (
                      <span style={{ color: '#b91c1c', fontWeight: 800, background: '#fef2f2', border: '1px solid #fecaca', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                        🚨 {selectedCellDrilldown.urgentNoTeacher} Active Demos Waiting (No Teacher)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button 
                type="button" 
                className="close-btn" 
                onClick={() => setSelectedCellDrilldown(null)}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto', padding: '1.6rem', display: 'flex', flexDirection: 'column', gap: '1.6rem' }}>
              
              {/* 1. SHORTAGE INTELLIGENCE & GAP ANALYSIS (Clean & Actionable) */}
              {selectedCellDrilldown.isShortage ? (
                <div style={{
                  background: '#ffffff',
                  border: '1.5px solid #fecaca',
                  borderLeft: '5px solid #ef4444',
                  borderRadius: '10px',
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem',
                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.05)'
                }}>
                  {/* Clean Title */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertTriangle size={18} style={{ color: '#dc2626' }} />
                    <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#991b1b' }}>
                      Hiring & Capacity Action Plan
                    </h4>
                  </div>

                  {/* Concise Recommendation Line */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.82rem',
                    color: '#78350f',
                    background: '#fefce8',
                    padding: '0.5rem 0.85rem',
                    borderRadius: '6px',
                    border: '1px solid #fef08a'
                  }}>
                    <Sparkles size={15} style={{ color: '#d97706', flexShrink: 0 }} />
                    <span>
                      <strong>Recruitment Target:</strong> Hire at least <strong>{currentHiringBrief?.targetHeadcount || Math.max(selectedCellDrilldown.shortage, selectedCellDrilldown.urgentNoTeacher, 1)} teacher(s)</strong> to eliminate current student deficit and maintain backup reserve.
                    </span>
                  </div>
                </div>
              ) : (
                <div style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderLeft: '4px solid #22c55e',
                  borderRadius: '10px',
                  padding: '0.85rem 1.1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  color: '#166534',
                  fontSize: '0.86rem'
                }}>
                  <CheckCircle2 size={18} className="text-success" />
                  <span>
                    <strong>Capacity Met:</strong> Supply ({selectedCellDrilldown.supply} teachers) covers demand ({selectedCellDrilldown.demand} inquiries) and safety reserve ({selectedCellDrilldown.backupRequired || 0} teachers) with surplus buffer of <strong>+{selectedCellDrilldown.buffer}</strong>.
                  </span>
                </div>
              )}

              {/* 2. DEMAND BREAKDOWN — STATUS COUNTS & SUBJECT COMPOSITION (Audio 1: Only show count by status, student rows table not needed) */}
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <h4 style={{ fontSize: '1.02rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                      1. Student Demand Overview
                    </h4>
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Inquiries count by current status and syllabus combinations ({selectedCellDrilldown.demand} total inquiries)
                    </p>
                  </div>
                </div>

                {/* Status Count Cards (Audio 1: ഓരോ സ്റ്റാറ്റസിലും എത്ര കൗണ്ട് ഉണ്ട് എന്ന് മാത്രം മതി) */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', marginBottom: '0.6rem' }}>
                    Inquiries by Status:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))', gap: '0.65rem' }}>
                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '0.65rem 0.85rem' }}>
                      <div style={{ fontSize: '0.72rem', color: '#166534', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Converted to Sale</div>
                      <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#15803d', marginTop: '0.2rem' }}>{demoStatusCounts['Converted to Sale'] || 0}</div>
                    </div>
                    <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px', padding: '0.65rem 0.85rem' }}>
                      <div style={{ fontSize: '0.72rem', color: '#0369a1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Scheduled</div>
                      <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0284c7', marginTop: '0.2rem' }}>{demoStatusCounts['Scheduled'] || 0}</div>
                    </div>
                    <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '0.65rem 0.85rem' }}>
                      <div style={{ fontSize: '0.72rem', color: '#b45309', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Follow up</div>
                      <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#d97706', marginTop: '0.2rem' }}>{demoStatusCounts['Follow up'] || 0}</div>
                    </div>
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '0.65rem 0.85rem' }}>
                      <div style={{ fontSize: '0.72rem', color: '#b91c1c', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Rejected</div>
                      <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#dc2626', marginTop: '0.2rem' }}>{demoStatusCounts['Rejected'] || 0}</div>
                    </div>
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.65rem 0.85rem' }}>
                      <div style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>Completed</div>
                      <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#334155', marginTop: '0.2rem' }}>{demoStatusCounts['Completed'] || 0}</div>
                    </div>
                    {Object.entries(demoStatusCounts).filter(([k, v]) => !['Converted to Sale', 'Scheduled', 'Follow up', 'Rejected', 'Completed'].includes(k) && v > 0).map(([k, v]) => (
                      <div key={k} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.65rem 0.85rem' }}>
                        <div style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>{k}</div>
                        <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#334155', marginTop: '0.2rem' }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Subject Composition Table */}
                <div style={{ marginTop: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>
                      Syllabus / Subject Breakdown:
                    </div>
                    {selectedCellDrilldown.zeroSupplySubjects && selectedCellDrilldown.zeroSupplySubjects.length > 0 && (
                      <span style={{
                        background: '#ffe4e6',
                        color: '#be123c',
                        border: '1px solid #fecdd3',
                        padding: '0.15rem 0.55rem',
                        borderRadius: '4px',
                        fontWeight: 700,
                        fontSize: '0.74rem'
                      }}>
                        ⚠️ {selectedCellDrilldown.zeroSupplySubjects.length} Zero-Supply Syllabi (0 Teachers in Database)
                      </span>
                    )}
                  </div>

                  {(!selectedCellDrilldown.demandSubjectsList || selectedCellDrilldown.demandSubjectsList.length === 0) ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic', margin: 0 }}>
                      No student demo inquiries recorded for this cell under the selected filters.
                    </p>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table className="responsive-table compact" style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                        <thead style={{ background: '#f8fafc' }}>
                          <tr>
                            <th>Subject ID</th>
                            <th>Subject / Syllabus Combination</th>
                            <th>Board</th>
                            <th>Class</th>
                            <th>Inquiries Count</th>
                            <th>Teacher Supply</th>
                            <th>Share</th>
                            <th>Allocation Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedCellDrilldown.demandSubjectsList.map(ds => {
                            const pct = selectedCellDrilldown.demand > 0 ? ((ds.count / selectedCellDrilldown.demand) * 100).toFixed(0) : 0;
                            const matchingTeachers = (selectedCellDrilldown.qualifiedTeachers || []).filter(qt =>
                              (qt.matchedSubjectId && qt.matchedSubjectId === ds.subjectId) ||
                              (qt.qualifiedSubjects && qt.qualifiedSubjects.some(qs => qs.id === ds.subjectId))
                            );
                            const teacherSupplyCount = matchingTeachers.length;
                            const isZeroSupply = teacherSupplyCount === 0 || (selectedCellDrilldown.zeroSupplySubjects || []).some(zs => 
                              (zs.subjectId && zs.subjectId === ds.subjectId) || (zs.subjectLabel === ds.subjectLabel)
                            );

                            return (
                              <tr key={ds.subjectId || ds.subjectLabel} style={isZeroSupply ? { background: '#fff5f5' } : {}}>
                                <td>
                                  <span className="teacher-id-chip" style={{ fontWeight: 800 }}>{ds.subjectId || 'N/A'}</span>
                                </td>
                                <td style={{ fontWeight: 800, color: '#0f172a' }}>
                                  <span>{ds.subjectLabel}</span>
                                </td>
                                <td>
                                  <span className="quick-board-pill active" style={{ padding: '0.15rem 0.5rem', fontSize: '0.74rem' }}>
                                    {ds.board || '—'}
                                  </span>
                                </td>
                                <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{ds.stage || '—'}</td>
                                <td style={{ fontWeight: 800, color: '#0284c7' }}>{ds.count} inquiries</td>
                                <td>
                                  {isZeroSupply ? (
                                    <span style={{
                                      background: '#ffe4e6',
                                      color: '#be123c',
                                      border: '1px solid #fecdd3',
                                      padding: '0.15rem 0.5rem',
                                      borderRadius: '4px',
                                      fontWeight: 800,
                                      fontSize: '0.74rem',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px'
                                    }}>
                                      0 Teachers
                                    </span>
                                  ) : (
                                    <span style={{ fontWeight: 800, color: '#0284c7', fontSize: '0.82rem' }}>
                                      {teacherSupplyCount} Teacher{teacherSupplyCount > 1 ? 's' : ''}
                                    </span>
                                  )}
                                </td>
                                <td style={{ width: '110px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <div style={{ flex: 1, background: '#f1f5f9', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                                      <div style={{ width: `${pct}%`, background: '#0284c7', height: '100%' }}></div>
                                    </div>
                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', width: '28px' }}>{pct}%</span>
                                  </div>
                                </td>
                                <td>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                    {isZeroSupply ? (
                                      <span style={{
                                        color: '#be123c',
                                        fontWeight: 800,
                                        fontSize: '0.74rem',
                                        background: '#ffe4e6',
                                        border: '1px solid #fecdd3',
                                        padding: '0.14rem 0.48rem',
                                        borderRadius: '4px',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '3px'
                                      }}>
                                        ⚠️ Zero-Supply
                                      </span>
                                    ) : (
                                      <span style={{ color: '#16a34a', fontWeight: 700, fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                        ✓ Covered
                                      </span>
                                    )}
                                    {ds.urgentCount > 0 && (
                                      <span style={{
                                        color: '#dc2626',
                                        fontWeight: 800,
                                        fontSize: '0.74rem',
                                        background: '#fee2e2',
                                        border: '1px solid #fca5a5',
                                        padding: '0.12rem 0.45rem',
                                        borderRadius: '4px',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '3px'
                                      }}>
                                        🚨 {ds.urgentCount} Unassigned
                                      </span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. SUPPLY BREAKDOWN — WHICH TEACHERS ARE IN OUR SUPPLY? (Audio 2 & 3: Sessions for 7 days + Matching Subjects with +X more expander) */}
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <h4 style={{ fontSize: '1.02rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                      2. Teacher Supply Breakdown — Which Teachers are Available?
                    </h4>
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Tutors qualified to take this subject with at least 1 bookable open session ({selectedCellDrilldown.qualifiedTeachers?.length || 0} teachers)
                    </p>
                  </div>
                </div>

                {(!selectedCellDrilldown.qualifiedTeachers || selectedCellDrilldown.qualifiedTeachers.length === 0) ? (
                  <div style={{ background: '#fef2f2', border: '1.5px dashed #f87171', borderRadius: '8px', padding: '1.2rem', color: '#b91c1c', fontSize: '0.86rem' }}>
                    ⚠️ <strong>Zero Qualified Teachers:</strong> No active teacher in the database is currently qualified to take this subject combination with open availability! Immediate recruitment is required.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '0.85rem' }}>
                    {selectedCellDrilldown.qualifiedTeachers.map(qt => {
                      const matchingSubs = getTeacherMatchingSubjects(qt, selectedCellDrilldown);
                      const isExpanded = expandedTeacherIds.has(qt.teacherId);
                      const displayedSubs = (matchingSubs.length <= 2 || isExpanded) ? matchingSubs : matchingSubs.slice(0, 2);
                      const remainingCount = matchingSubs.length - 2;

                      return (
                        <div key={qt.teacherId} style={{
                          background: '#ffffff',
                          border: '1.5px solid #e2e8f0',
                          borderRadius: '10px',
                          padding: '1rem',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.45rem'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>{qt.teacherName}</span>
                            <span className="teacher-id-chip" style={{ fontWeight: 800 }}>{qt.teacherId}</span>
                          </div>

                          {qt.phone && (
                            <div style={{ fontSize: '0.76rem', color: '#0284c7' }}>
                              <a href={`tel:${qt.phone}`} style={{ color: '#0284c7', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                <Phone size={10} /> {qt.phone}
                              </a>
                            </div>
                          )}

                          {/* Sessions for 7 days (Audio 2) */}
                          <div style={{ fontSize: '0.8rem', color: '#0f172a', fontWeight: 600 }}>
                            Available Capacity: <strong style={{ color: '#0284c7', fontWeight: 800 }}>{qt.possibleSessions} sessions (Next 7 Days)</strong>
                          </div>

                          {qt.teachLanguages && qt.teachLanguages.length > 0 && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              Languages: <strong>{qt.teachLanguages.join(', ')}</strong>
                            </div>
                          )}

                          {/* Matching Subjects Badges with +X more expander (Audio 2 & 3) */}
                          <div style={{ marginTop: '0.2rem' }}>
                            <div style={{ fontSize: '0.73rem', color: '#64748b', fontWeight: 700, marginBottom: '0.3rem' }}>
                              Qualified Subjects under this Filter ({matchingSubs.length}):
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center' }}>
                              {displayedSubs.map(s => (
                                <span
                                  key={s.id || s.label}
                                  style={{
                                    background: '#f8fafc',
                                    color: '#334155',
                                    border: '1px solid #cbd5e1',
                                    padding: '0.2rem 0.5rem',
                                    borderRadius: '5px',
                                    fontSize: '0.73rem',
                                    fontWeight: 600
                                  }}
                                  title={s.label || s.name}
                                >
                                  {s.label || `${s.stage} - ${s.name} (${s.board})`}
                                </span>
                              ))}

                              {matchingSubs.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => toggleTeacherExpand(qt.teacherId)}
                                  style={{
                                    background: isExpanded ? '#fee2e2' : '#e0f2fe',
                                    color: isExpanded ? '#b91c1c' : '#0369a1',
                                    border: isExpanded ? '1px solid #fca5a5' : '1px solid #bae6fd',
                                    padding: '0.2rem 0.55rem',
                                    borderRadius: '5px',
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease'
                                  }}
                                >
                                  {isExpanded ? '▲ Show less' : `+${remainingCount} more`}
                                </button>
                              )}
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                            <span className={`fragility-chip ${qt.isHighFragility ? 'high-risk' : 'stable'}`} style={{ padding: '0.15rem 0.5rem', fontSize: '0.72rem' }}>
                              <span className="fragility-value">{qt.fragilityScore}</span>
                              <span className="fragility-label">{qt.isHighFragility ? 'High Risk' : 'Stable'}</span>
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 4. TEACHER RECRUITMENT INTELLIGENCE & MEDIA BRIEF (Audio 1 & 2) */}
              <div style={{
                background: '#ffffff',
                border: '1.5px solid #cbd5e1',
                borderRadius: '12px',
                padding: '1.35rem 1.5rem',
                boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.15rem'
              }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.6rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '8px',
                      background: '#ecfdf5',
                      color: '#059669',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid #a7f3d0'
                    }}>
                      <UserPlus size={20} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 800, color: '#0f172a' }}>
                        4. Teacher Recruitment Intelligence &amp; Media Brief
                      </h4>
                      <span style={{ fontSize: '0.76rem', color: '#64748b' }}>
                        Actionable recruitment specifications for Media Team (posters/ads) &amp; HR Team
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                    {currentHiringBrief && currentHiringBrief.shortage > 0 && (
                      <span style={{
                        background: '#fef2f2',
                        color: '#b91c1c',
                        border: '1px solid #fecaca',
                        padding: '0.22rem 0.65rem',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 800
                      }}>
                        Target: Hire {currentHiringBrief.targetHeadcount} Teacher(s) {currentHiringBrief.backupRequired > 0 ? `(${currentHiringBrief.directShortage || 0} Direct + ${currentHiringBrief.backupRequired} Backup)` : ''}
                      </span>
                    )}
                    {currentHiringBrief && currentHiringBrief.urgentNoTeacher > 0 && (
                      <span style={{
                        background: '#fee2e2',
                        color: '#b91c1c',
                        border: '1px solid #fca5a5',
                        padding: '0.22rem 0.65rem',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}>
                        <span className="pulse-alert-dot" style={{ width: '6px', height: '6px' }}></span>
                        <span>{currentHiringBrief.urgentNoTeacher} Urgent Demo(s) Unassigned</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Key Metadata Badges Grid (Audio 1: Stages/Classes, Boards, Headcount, Deficit & Safety Backup) */}
                {currentHiringBrief && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                    gap: '0.75rem',
                    background: '#f8fafc',
                    padding: '0.9rem',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0'
                  }}>
                    {/* Stages / Classes Included */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        🎓 Included Classes / Stages:
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', alignItems: 'center' }}>
                        {currentHiringBrief.includedClasses.map(cls => {
                          const count = currentHiringBrief.activeClassCountMap[cls] || 0;
                          return (
                            <span 
                              key={cls}
                              style={{
                                background: count > 0 ? '#e0f2fe' : '#ffffff',
                                color: count > 0 ? '#0369a1' : '#475569',
                                border: `1px solid ${count > 0 ? '#7dd3fc' : '#cbd5e1'}`,
                                padding: '0.15rem 0.5rem',
                                borderRadius: '4px',
                                fontSize: '0.74rem',
                                fontWeight: 700
                              }}
                              title={count > 0 ? `${count} active student inquiries in this class` : 'Included under stage'}
                            >
                              {cls} {count > 0 && <span style={{ opacity: 0.85, fontWeight: 800 }}>({count})</span>}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Target Boards */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        🏛️ Target Boards:
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', alignItems: 'center' }}>
                        {currentHiringBrief.boardsList.map(brd => (
                          <span 
                            key={brd}
                            style={{
                              background: '#f0fdf4',
                              color: '#15803d',
                              border: '1px solid #86efac',
                              padding: '0.15rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.74rem',
                              fontWeight: 700
                            }}
                          >
                            {brd} ({currentHiringBrief.boardCountMap[brd] || 0})
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Safety Backup Reserve Card (Audio Update) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        🛡️ Safety Backup Reserve:
                      </span>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#4338ca' }}>
                        {currentHiringBrief.backupRequired > 0 ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <ShieldCheck size={14} />
                            <span>+{currentHiringBrief.backupRequired} Standby Teacher(s) ({currentHiringBrief.backupPercentage}% Buffer)</span>
                          </span>
                        ) : (
                          <span style={{ color: '#64748b' }}>0% (No Reserve)</span>
                        )}
                      </div>
                    </div>

                    {/* Headcount & Balance */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        👥 Vacancy / Net Deficit:
                      </span>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>
                        {currentHiringBrief.shortage > 0 ? (
                          <span style={{ color: '#b91c1c' }}>
                            -{currentHiringBrief.shortage} Teachers Total ({currentHiringBrief.directShortage || 0} Direct + {currentHiringBrief.backupRequired || 0} Safety Reserve)
                          </span>
                        ) : (
                          <span style={{ color: '#166534' }}>
                            +{currentHiringBrief.supply - (currentHiringBrief.demand + (currentHiringBrief.backupRequired || 0))} Buffer ({currentHiringBrief.supply} Available Teachers)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Schedule / Slot Commitment */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        ⏰ Slot Commitment:
                      </span>
                      <div style={{ fontSize: '0.78rem', color: '#334155', fontWeight: 600 }}>
                        Min 1-2 open slots/week (4:00 PM – 9:00 PM IST)
                      </div>
                    </div>
                  </div>
                )}

                {/* Formatted Text Note Box for Media & HR Team with One-Click Copy (Audio 1) */}
                {currentHiringBrief && (
                  <div style={{
                    marginTop: '0.4rem',
                    background: '#0f172a',
                    borderRadius: '8px',
                    padding: '1rem',
                    color: '#f8fafc',
                    boxShadow: '0 4px 12px rgba(15, 23, 42, 0.12)'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '0.75rem',
                      borderBottom: '1px solid #334155',
                      paddingBottom: '0.6rem',
                      flexWrap: 'wrap',
                      gap: '0.5rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <FileText size={16} style={{ color: '#38bdf8' }} />
                        <span style={{ fontSize: '0.84rem', fontWeight: 800, color: '#f1f5f9' }}>
                          📋 Ready-to-Send Brief for Media &amp; HR Team
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (navigator.clipboard) {
                            navigator.clipboard.writeText(currentHiringBrief.fullTextNote);
                            setCopiedBrief(true);
                            setTimeout(() => setCopiedBrief(false), 2200);
                          }
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          background: copiedBrief ? '#16a34a' : '#334155',
                          color: '#ffffff',
                          border: `1px solid ${copiedBrief ? '#22c55e' : '#475569'}`,
                          padding: '0.35rem 0.8rem',
                          borderRadius: '6px',
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        title="Copy text note to clipboard to paste into WhatsApp, Email, or Slack for Media/HR team"
                      >
                        {copiedBrief ? <Check size={14} /> : <Copy size={14} />}
                        <span>{copiedBrief ? '✓ Copied to Clipboard!' : 'Copy Hiring Brief'}</span>
                      </button>
                    </div>

                    <pre style={{
                      margin: 0,
                      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                      fontSize: '0.77rem',
                      lineHeight: '1.5',
                      color: '#e2e8f0',
                      whiteSpace: 'pre-wrap',
                      maxHeight: '260px',
                      overflowY: 'auto',
                      paddingRight: '0.5rem'
                    }}>
                      {currentHiringBrief.fullTextNote}
                    </pre>
                  </div>
                )}

              </div>

            </div>

            {/* Modal Footer */}
            <div className="modal-footer" style={{ padding: '0.9rem 1.6rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', background: '#f8fafc', flexWrap: 'wrap', gap: '0.5rem' }}>
              <button 
                type="button" 
                className="btn btn-sm" 
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  background: '#16a34a',
                  color: '#ffffff',
                  border: '1px solid #15803d',
                  fontWeight: 700,
                  padding: '0.44rem 0.95rem',
                  borderRadius: '6px',
                  boxShadow: '0 1px 3px rgba(22, 163, 74, 0.2)',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  const itemPriority = calculateHiringPriority({
                    ...selectedCellDrilldown,
                    cellData: selectedCellDrilldown
                  });
                  handleExportData([{
                    id: `${selectedCellDrilldown.subjectName}_${selectedCellDrilldown.colKey}`,
                    subjectName: selectedCellDrilldown.subjectName,
                    dimensionLabel: selectedCellDrilldown.colLabel || selectedCellDrilldown.dimensionLabel || 'All',
                    demand: selectedCellDrilldown.demand,
                    supply: selectedCellDrilldown.supply,
                    shortage: selectedCellDrilldown.shortage,
                    buffer: selectedCellDrilldown.buffer,
                    backupRequired: selectedCellDrilldown.backupRequired || 0,
                    backupPercentage: selectedCellDrilldown.backupPercentage || backupPercentage,
                    isShortage: selectedCellDrilldown.isShortage,
                    urgentNoTeacher: selectedCellDrilldown.urgentNoTeacher,
                    priority: itemPriority,
                    priorityScore: itemPriority.score,
                    cellData: selectedCellDrilldown
                  }], 'xlsx');
                }}
                title="Export this subject's complete details and hiring specification to Excel"
              >
                <FileSpreadsheet size={15} />
                <span>Export this Report to Excel</span>
              </button>

              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => {
                  setExpandedTeacherIds(new Set());
                  setSelectedCellDrilldown(null);
                }}
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Export Status Toast */}
      {exportingStatus && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: '#0f172a',
          color: '#ffffff',
          padding: '0.8rem 1.4rem',
          borderRadius: '8px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          zIndex: 99999,
          fontSize: '0.88rem',
          fontWeight: 700
        }}>
          <FileSpreadsheet size={18} style={{ color: '#22c55e' }} />
          <span>{exportingStatus}</span>
        </div>
      )}

    </div>
  );
}
