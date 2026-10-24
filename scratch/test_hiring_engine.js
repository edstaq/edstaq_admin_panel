import fs from 'fs';
import Papa from 'papaparse';

const teachers = Papa.parse(fs.readFileSync('public/data/HR & Sales - Teacher.csv', 'utf8'), { header: true }).data;
const subjects = Papa.parse(fs.readFileSync('public/data/HR & Sales - Subjects.csv', 'utf8'), { header: true }).data;
const avails = Papa.parse(fs.readFileSync('public/data/HR & Sales - Teacher Availability.csv', 'utf8'), { header: true }).data;
const demos = Papa.parse(fs.readFileSync('public/data/lead_demo_book.csv', 'utf8'), { header: true }).data;

export function computeHiringIntelligence({ demoRows = [], teachers = [], availability = [], subjects = [], options = {} }) {
  const bufferFactor = options.bufferFactor !== undefined ? options.bufferFactor : 0.30; // 30% default buffer

  // 1. Build Subjects Lookup Map
  const subjectMap = new Map();
  subjects.forEach(s => {
    const sId = (s['Subject ID'] || '').trim();
    if (sId) {
      subjectMap.set(sId, {
        id: sId,
        name: (s['Subject Name'] || '').trim(),
        stage: (s['Stage'] || '').trim(),
        level: (s['Level'] || '').trim(),
        board: (s['Board'] || '').trim(),
        label: (s['Label'] || sId).trim(),
        category: (s['Category'] || '').trim()
      });
    }
  });

  // 2. Build Teacher Capacity & Qualification Map
  // Active teachers only
  const activeTeachers = teachers.filter(t => (t.Status || '').trim().toLowerCase() === 'active');

  // Count available slots per teacher
  const teacherAvailMap = new Map();
  availability.forEach(a => {
    const tId = (a['Teacher ID'] || '').trim();
    if (!tId) return;
    if (!teacherAvailMap.has(tId)) {
      teacherAvailMap.set(tId, []);
    }
    teacherAvailMap.get(tId).push(a);
  });

  // Map each teacher's subjects and strain
  const teacherProfiles = [];
  const subjectTeachersMap = new Map(); // Subject ID -> Array of active teachers

  activeTeachers.forEach(t => {
    const tId = (t['Teacher ID'] || '').trim();
    const tName = (t['Name'] || tId).trim();
    const rawSubIds = (t['Subjects ID(s)'] || '').split(/[,;]/).map(s => s.trim()).filter(Boolean);
    const validSubIds = rawSubIds.filter(sid => subjectMap.has(sid));
    const teachLang = (t['Teach Lang'] || '').trim();

    const slots = teacherAvailMap.get(tId) || [];
    const totalWeeklySlots = slots.length;
    // Multi-subject strain factor: combinations / max(1, slots)
    const strainRatio = validSubIds.length / Math.max(1, totalWeeklySlots);
    const isHyperShared = validSubIds.length >= 8 && totalWeeklySlots <= 4;

    const profile = {
      teacherId: tId,
      name: tName,
      teachLang,
      qualifiedSubjectsCount: validSubIds.length,
      totalWeeklySlots,
      strainRatio: Number(strainRatio.toFixed(1)),
      isHyperShared,
      subjectIds: validSubIds
    };
    teacherProfiles.push(profile);

    validSubIds.forEach(sid => {
      if (!subjectTeachersMap.has(sid)) {
        subjectTeachersMap.set(sid, []);
      }
      subjectTeachersMap.get(sid).push(profile);
    });
  });

  // 3. Process Demand from Demo Book
  const subjectDemandMap = new Map();
  const levelStatsMap = {
    LP: { level: 'LP', title: 'Lower Primary (Classes 1-4)', demand: 0, sales: 0, rejected: 0, pipeline: 0, teachers: new Set() },
    UP: { level: 'UP', title: 'Upper Primary (Classes 5-7)', demand: 0, sales: 0, rejected: 0, pipeline: 0, teachers: new Set() },
    HS: { level: 'HS', title: 'High School (Classes 8-10)', demand: 0, sales: 0, rejected: 0, pipeline: 0, teachers: new Set() },
    HSS: { level: 'HSS', title: 'Higher Secondary (+1 & +2)', demand: 0, sales: 0, rejected: 0, pipeline: 0, teachers: new Set() },
    Other: { level: 'Other', title: 'Specialist / Other', demand: 0, sales: 0, rejected: 0, pipeline: 0, teachers: new Set() }
  };

  const boardStatsMap = {
    Kerala: { board: 'Kerala State Syllabus', demand: 0, sales: 0, rejected: 0, pipeline: 0 },
    CBSE: { board: 'CBSE Curriculum', demand: 0, sales: 0, rejected: 0, pipeline: 0 },
    Other: { board: 'Other / Open', demand: 0, sales: 0, rejected: 0, pipeline: 0 }
  };

  const languageStatsMap = {
    English: { medium: 'English Medium', demand: 0, sales: 0 },
    Malayalam: { medium: 'Malayalam Medium', demand: 0, sales: 0 },
    Mixed: { medium: 'Bilingual / Mixed', demand: 0, sales: 0 }
  };

  const rejectionsList = [];

  demoRows.forEach(demo => {
    const subId = (demo['Subject ID'] || '').trim();
    const status = (demo['Demo Status'] || '').trim();
    const medium = (demo['Medium'] || '').trim();
    const teachLang = (demo['Teaching Language'] || '').trim();
    const feedback = (demo['Feedback'] || '').trim();
    const note = (demo['Note'] || '').trim();

    const subInfo = subjectMap.get(subId) || {
      id: subId || 'UNKNOWN',
      name: 'Unlisted Subject',
      stage: 'Unknown',
      level: 'Other',
      board: 'Other',
      label: subId || 'Unlisted Subject'
    };

    // Initialize Subject Aggregate
    if (!subjectDemandMap.has(subId)) {
      const qualifiedTeachers = subjectTeachersMap.get(subId) || [];
      subjectDemandMap.set(subId, {
        subjectId: subId,
        subjectName: subInfo.name,
        stage: subInfo.stage,
        level: subInfo.level,
        board: subInfo.board,
        label: subInfo.label,
        totalDemos: 0,
        convertedSales: 0,
        rejected: 0,
        scheduled: 0,
        completed: 0,
        followUp: 0,
        qualifiedTeachers,
        qualifiedTeachersCount: qualifiedTeachers.length,
        hasHyperSharedTeacher: qualifiedTeachers.some(t => t.isHyperShared),
        teachingMediumDemand: { English: 0, Malayalam: 0, Mixed: 0 }
      });
    }

    const subAgg = subjectDemandMap.get(subId);
    subAgg.totalDemos++;

    const isSale = status.toLowerCase() === 'converted to sale';
    const isRej = status.toLowerCase() === 'rejected';
    const isSched = status.toLowerCase() === 'scheduled';
    const isComp = status.toLowerCase() === 'completed';
    const isFollow = status.toLowerCase() === 'follow up';

    if (isSale) subAgg.convertedSales++;
    else if (isRej) subAgg.rejected++;
    else if (isSched) subAgg.scheduled++;
    else if (isComp) subAgg.completed++;
    else if (isFollow) subAgg.followUp++;

    // Medium categorization
    const normLang = (teachLang || medium).toLowerCase();
    if (normLang.includes('mixed') || (normLang.includes('mal') && normLang.includes('eng'))) {
      subAgg.teachingMediumDemand.Mixed++;
      languageStatsMap.Mixed.demand++;
      if (isSale) languageStatsMap.Mixed.sales++;
    } else if (normLang.includes('mal')) {
      subAgg.teachingMediumDemand.Malayalam++;
      languageStatsMap.Malayalam.demand++;
      if (isSale) languageStatsMap.Malayalam.sales++;
    } else {
      subAgg.teachingMediumDemand.English++;
      languageStatsMap.English.demand++;
      if (isSale) languageStatsMap.English.sales++;
    }

    // Level roll-up
    const lvlKey = levelStatsMap[subInfo.level] ? subInfo.level : 'Other';
    const lvlAgg = levelStatsMap[lvlKey];
    lvlAgg.demand++;
    if (isSale) lvlAgg.sales++;
    else if (isRej) lvlAgg.rejected++;
    else lvlAgg.pipeline++;
    (subAgg.qualifiedTeachers || []).forEach(t => lvlAgg.teachers.add(t.teacherId));

    // Board roll-up
    const brdKey = (subInfo.board || '').toUpperCase().includes('CBSE') ? 'CBSE' : (subInfo.board || '').toUpperCase().includes('KERALA') ? 'Kerala' : 'Other';
    const brdAgg = boardStatsMap[brdKey] || boardStatsMap.Other;
    brdAgg.demand++;
    if (isSale) brdAgg.sales++;
    else if (isRej) brdAgg.rejected++;
    else brdAgg.pipeline++;

    // Rejection reasons tracking
    if (isRej && (feedback || note)) {
      const text = `${feedback} ${note}`.toLowerCase();
      let category = 'Other';
      if (text.includes('money') || text.includes('fee') || text.includes('pay') || text.includes('financ') || text.includes('1000') || text.includes('5500')) {
        category = 'Pricing & Affordability';
      } else if (text.includes('father') || text.includes('husband') || text.includes('parent') || text.includes('discuss')) {
        category = 'Decision Maker (Father) Pending';
      } else if (text.includes('exam') || text.includes('uss') || text.includes('kalolsavam') || text.includes('madrasa') || text.includes('vacation')) {
        category = 'Exam / Calendar Clash';
      } else if (text.includes('offline') || text.includes('home') || text.includes('xylem')) {
        category = 'Competitor / Offline Preference';
      } else if (text.includes('not interested') || text.includes('no')) {
        category = 'General Disinterest';
      }
      rejectionsList.push({
        studentName: demo['Student Name'],
        subjectLabel: subInfo.label,
        category,
        feedback,
        note
      });
    }
  });

  // 4. Compute Hiring Gaps, Buffers & Priority per Subject
  const subjectHiringList = Array.from(subjectDemandMap.values()).map(sub => {
    const { totalDemos, convertedSales, qualifiedTeachersCount, hasHyperSharedTeacher } = sub;

    // Determine Preferred Medium
    let preferredMedium = 'English Medium (Mixed Malayalam)';
    if (sub.teachingMediumDemand.Malayalam > sub.teachingMediumDemand.English && sub.teachingMediumDemand.Malayalam > sub.teachingMediumDemand.Mixed) {
      preferredMedium = 'Malayalam Medium';
    } else if (sub.teachingMediumDemand.English > sub.teachingMediumDemand.Malayalam && sub.teachingMediumDemand.English > sub.teachingMediumDemand.Mixed) {
      preferredMedium = 'English Medium';
    }

    // Calculate Immediate Hires Needed
    let hiresNeeded = 0;
    if (qualifiedTeachersCount === 0 && totalDemos >= 1) {
      hiresNeeded = Math.max(1, Math.ceil(totalDemos * 0.4));
    } else if (qualifiedTeachersCount <= 1 && totalDemos >= 3) {
      hiresNeeded = Math.max(1, Math.ceil((totalDemos - 1) * 0.3));
    } else if (qualifiedTeachersCount <= 2 && totalDemos >= 6) {
      hiresNeeded = 2;
    }

    // If teacher is hyper-shared (Maneesha case), bump hiring requirement by 1 to prevent phantom lock
    if (hasHyperSharedTeacher && hiresNeeded === 0 && totalDemos >= 2) {
      hiresNeeded = 1;
    }

    // Calculate Recommended Buffer / Reserve
    const bufferTarget = Math.max(1, Math.ceil(Math.max(1, hiresNeeded) * bufferFactor));

    // Urgency Score (0 - 100)
    let urgencyScore = 0;
    let urgencyBadge = 'balanced';

    if (qualifiedTeachersCount === 0 && totalDemos > 0) {
      urgencyScore += 50;
      urgencyScore += Math.min(30, totalDemos * 6);
      urgencyBadge = 'critical';
    } else if (hiresNeeded > 0) {
      urgencyScore += 30;
      urgencyScore += Math.min(30, totalDemos * 4);
      urgencyBadge = totalDemos >= 6 ? 'critical' : 'high';
    } else if (hasHyperSharedTeacher && totalDemos >= 2) {
      urgencyScore += 25;
      urgencyBadge = 'high';
    } else if (totalDemos >= 3) {
      urgencyScore += 15;
      urgencyBadge = 'moderate';
    }

    const conversionRate = totalDemos > 0 ? Number(((convertedSales / totalDemos) * 100).toFixed(1)) : 0;
    if (conversionRate >= 50) urgencyScore += 10;

    return {
      ...sub,
      preferredMedium,
      hiresNeeded,
      bufferTarget,
      urgencyScore,
      urgencyBadge,
      conversionRate
    };
  });

  // Sort by urgency descending
  subjectHiringList.sort((a, b) => b.urgencyScore - a.urgencyScore);

  // 5. Generate Top Priority Hiring Checklist for HR (P1, P2, P3...)
  const priorityChecklist = subjectHiringList
    .filter(s => s.hiresNeeded > 0 || s.urgencyBadge === 'critical' || s.urgencyBadge === 'high')
    .slice(0, 10)
    .map((s, idx) => ({
      priorityRank: `P${idx + 1}`,
      subjectId: s.subjectId,
      subjectName: s.subjectName,
      stage: s.stage,
      level: s.level,
      board: s.board,
      preferredMedium: s.preferredMedium,
      currentActiveTeachers: s.qualifiedTeachersCount,
      immediateHires: s.hiresNeeded,
      bufferReserve: s.bufferTarget,
      totalDemandDemos: s.totalDemos,
      urgencyBadge: s.urgencyBadge,
      hasHyperSharedTeacher: s.hasHyperSharedTeacher,
      jobSpecText: `Edstaq HR Hiring Spec: Seeking ${s.immediateHires} Teacher(s) for ${s.stage} ${s.subjectName} (${s.board}). Teaching medium: ${s.preferredMedium}. Active inbound demand: ${s.totalDemos} students.`
    }));

  // Hyper-Shared "Maneesha Dilemma" Teachers
  const hyperSharedTeachers = teacherProfiles.filter(t => t.isHyperShared || (t.qualifiedSubjectsCount >= 10 && t.totalWeeklySlots <= 4));

  // Totals for KPI Ribbon
  const totalInboundDemand = demoRows.length;
  const totalSales = demoRows.filter(d => (d['Demo Status'] || '').toLowerCase() === 'converted to sale').length;
  const totalImmediateHires = subjectHiringList.reduce((acc, s) => acc + s.hiresNeeded, 0);
  const totalBufferRecommended = subjectHiringList.filter(s => s.hiresNeeded > 0).reduce((acc, s) => acc + s.bufferTarget, 0);
  const criticalSubjectsCount = subjectHiringList.filter(s => s.urgencyBadge === 'critical').length;

  return {
    kpis: {
      totalInboundDemand,
      totalSales,
      conversionRate: Number(((totalSales / Math.max(1, totalInboundDemand)) * 100).toFixed(1)),
      activeTeachersCount: activeTeachers.length,
      totalImmediateHires,
      totalBufferRecommended,
      criticalSubjectsCount
    },
    priorityChecklist,
    subjectHiringList,
    levelStats: Object.values(levelStatsMap).map(l => ({ ...l, teachersCount: l.teachers.size })),
    boardStats: Object.values(boardStatsMap),
    languageStats: Object.values(languageStatsMap),
    hyperSharedTeachers,
    rejectionsList
  };
}

const result = computeHiringIntelligence({ demoRows: demos, teachers, availability: avails, subjects });
console.log('KPIs:', result.kpis);
console.log('\nTop 5 Priority Checklist:');
console.log(result.priorityChecklist.slice(0, 5));
console.log('\nHyper-Shared Teachers (Maneesha Dilemma):', result.hyperSharedTeachers.length);
