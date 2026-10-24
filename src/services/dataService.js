import Papa from 'papaparse';
import { timeStringToMinutes, minutesToTimeString, subtractIntervals } from '../utils/timeUtils';
import { normalizeWeekday, getRollingWindowDates, isAllocationActiveOnDate } from '../utils/dateUtils';

const BASE_URL = (import.meta.env.BASE_URL || './').replace(/\/$/, '') + '/';

export const CSV_PATHS = {
  TEACHERS: `${BASE_URL}data/HR & Sales - Teacher.csv`,
  TEACHER_AVAILABILITY: `${BASE_URL}data/HR & Sales - Teacher Availability.csv`,
  SUBJECTS: `${BASE_URL}data/HR & Sales - Subjects.csv`,
  TEACHER_ASSIGN: `${BASE_URL}data/Classroom & Session Mng - Teacher Assign.csv`,
  CLASS_MASTER: `${BASE_URL}data/Classroom & Session Mng - Class Master.csv`,
  TEACHER_REVIEWS: `${BASE_URL}data/HR & Sales - Teacher Review.csv`,
  DEMO_BOOK: `${BASE_URL}data/lead_demo_book.csv`
};

/**
 * Parses a remote or local CSV file via PapaParse
 */
export async function fetchCsv(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch CSV: ${response.statusText} (${url})`);
  }
  const text = await response.text();
  return new Promise((resolve, reject) => {
    Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: results => resolve(results.data),
      error: error => reject(error)
    });
  });
}

export const DEFAULT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxiWHvLqSj9_mxStlaLoik9r1c_SEpBVQUUbd-fHWtEneeSBsvka-6NRnOVRcCNCDFg/exec';

/**
 * Computes average ratings per session and overall teacher rating from review logs.
 *
 * Requirements:
 * 1. For each session: compute average rating from all student reviews for that session.
 * 2. For each teacher: compute average rating across all reviewed sessions (average rating per session).
 * 3. Output rating details: { avgRating, sessionsCount, totalReviewsCount, hasReviews, sessions }
 */
export function computeTeacherReviewMetrics(teacherReviews = [], teachers = [], classMaster = []) {
  // Session to Teacher ID mapping (fallback in case review row has only Session Id)
  const sessionTeacherMap = new Map();
  if (Array.isArray(classMaster)) {
    classMaster.forEach(c => {
      const sId = (c['Session ID'] || c['Session Id'] || '').trim();
      const tId = (c['Teacher ID'] || c['Teacher Id'] || '').trim();
      if (sId && tId) sessionTeacherMap.set(sId, tId);
    });
  }

  // Group reviews: teacherId -> Map(sessionId -> array of student review records)
  const teacherReviewsMap = new Map();

  if (Array.isArray(teacherReviews)) {
    teacherReviews.forEach(r => {
      const sessionId = (r['Session Id'] || r['Session ID'] || r['session_id'] || r.sessionId || '').trim();
      let teacherId = (r['Teacher Id'] || r['Teacher ID'] || r['teacher_id'] || r.teacherId || '').trim();

      // Fallback: Resolve teacherId from classMaster if omitted
      if (!teacherId && sessionId && sessionTeacherMap.has(sessionId)) {
        teacherId = sessionTeacherMap.get(sessionId);
      }
      if (!teacherId) return;

      const rawRating = r['Rating'] || r['rating'] || r['Ratings'] || r['Star'];
      const rating = parseFloat(rawRating);
      if (isNaN(rating) || rating <= 0) return;

      const studentId = (r['Student Id'] || r['Student ID'] || r['student_id'] || r.studentId || '').trim();
      const comment = (r['Comment'] || r['comment'] || r['Comments'] || r['Remarks'] || '').trim();
      const timestamp = (r['Timestamp'] || r['timestamp'] || r['Date'] || '').trim();

      if (!teacherReviewsMap.has(teacherId)) {
        teacherReviewsMap.set(teacherId, new Map());
      }

      const sessionsMap = teacherReviewsMap.get(teacherId);
      if (!sessionsMap.has(sessionId)) {
        sessionsMap.set(sessionId, []);
      }

      sessionsMap.get(sessionId).push({
        sessionId,
        studentId,
        teacherId,
        rating,
        comment,
        timestamp
      });
    });
  }

  const teacherMetricsMap = new Map();

  // Process all teachers
  teachers.forEach(t => {
    const teacherId = (t['Teacher ID'] || t.teacherId || '').trim();
    if (!teacherId) return;

    const sessionsMap = teacherReviewsMap.get(teacherId);

    if (!sessionsMap || sessionsMap.size === 0) {
      teacherMetricsMap.set(teacherId, {
        teacherId,
        hasReviews: false,
        avgRating: 0,
        formattedRating: '—',
        sessionsCount: 0,
        totalReviewsCount: 0,
        sessions: []
      });
      return;
    }

    let sumSessionAverages = 0;
    let totalReviewsCount = 0;
    const sessionDetails = [];

    sessionsMap.forEach((revs, sId) => {
      const sessionSum = revs.reduce((acc, cur) => acc + cur.rating, 0);
      const sessionAvg = sessionSum / revs.length;
      sumSessionAverages += sessionAvg;
      totalReviewsCount += revs.length;

      sessionDetails.push({
        sessionId: sId,
        sessionAvg: parseFloat(sessionAvg.toFixed(2)),
        reviewCount: revs.length,
        reviews: revs
      });
    });

    const sessionsCount = sessionsMap.size;
    // Step 2: Average rating per session across all reviewed sessions
    const avgRatingPerSession = sessionsCount > 0 ? (sumSessionAverages / sessionsCount) : 0;
    const roundedRating = parseFloat(avgRatingPerSession.toFixed(1));

    teacherMetricsMap.set(teacherId, {
      teacherId,
      hasReviews: true,
      avgRating: roundedRating,
      formattedRating: roundedRating.toFixed(1),
      sessionsCount,
      totalReviewsCount,
      sessions: sessionDetails
    });
  });

  return teacherMetricsMap;
}

/**
 * Extracts unique students catalog from Class Master and Teacher Assign datasets
 * Returns array of { id, name, class, label }
 */
export function extractStudentsCatalog(classMaster = [], teacherAssign = []) {
  const studentsMap = new Map();

  const processRow = (row) => {
    const sId = (row['Student ID'] || row['Student Id'] || row.studentId || '').trim();
    if (!sId) return;

    const classRoom = (row['Class Room ID'] || row['Class Room Id'] || row.classRoomId || '').trim();
    const subLabel = (row['Subject label'] || row['Subject Label'] || '').trim();

    let studentName = '';
    let studentClass = '';

    if (classRoom) {
      let clean = classRoom.replace(/^edstaq\s*/i, '').trim();
      const classMatch = clean.match(/^c(?:lass)?\s*[-]?\s*(\d{1,2})\s+(.+)$/i);
      if (classMatch) {
        studentClass = `Class ${classMatch[1]}`;
        studentName = classMatch[2].replace(/\(.*?\)/g, '').trim();
      } else {
        studentName = clean.replace(/\(.*?\)/g, '').trim();
      }
    }

    if (!studentClass && subLabel) {
      const subMatch = subLabel.match(/Class\s*(\d{1,2})/i);
      if (subMatch) {
        studentClass = `Class ${subMatch[1]}`;
      }
    }

    if (!studentsMap.has(sId)) {
      studentsMap.set(sId, {
        id: sId,
        name: studentName || `Student ${sId}`,
        class: studentClass || 'Standard',
        label: `${studentName || sId} (${sId}) ${studentClass ? '• ' + studentClass : ''}`
      });
    } else {
      const existing = studentsMap.get(sId);
      if ((!existing.name || existing.name.startsWith('Student STD')) && studentName) {
        existing.name = studentName;
        existing.label = `${studentName} (${sId}) ${existing.class ? '• ' + existing.class : ''}`;
      }
      if ((!existing.class || existing.class === 'Standard') && studentClass) {
        existing.class = studentClass;
        existing.label = `${existing.name} (${sId}) • ${studentClass}`;
      }
    }
  };

  (classMaster || []).forEach(processRow);
  (teacherAssign || []).forEach(processRow);

  return Array.from(studentsMap.values()).sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
}

/**
 * Loads all datasets from either live Google Apps Script Database API or local CSVs
 */
export async function loadAllData(options = {}) {
  const { 
    dataSource = 'script', 
    scriptUrl = DEFAULT_SCRIPT_URL 
  } = options;

  const targetUrl = scriptUrl || DEFAULT_SCRIPT_URL;
  let result = null;

  if (dataSource === 'script' || targetUrl) {
    const cleanUrl = targetUrl.includes('?') ? `${targetUrl}&action=all` : `${targetUrl}?action=all`;
    const res = await fetch(cleanUrl);
    if (!res.ok) {
      throw new Error(`Database connection error: ${res.statusText}`);
    }
    const json = await res.json();
    if (json.status !== 'success') {
      throw new Error(json.message || 'Error returned from database provider');
    }
    let demoBook = json.data.demoBook || json.data.leadDemoBook || [];
    if (!Array.isArray(demoBook) || demoBook.length === 0) {
      try {
        demoBook = await fetchCsv(CSV_PATHS.DEMO_BOOK);
      } catch (e) {
        console.warn('Demo book fallback local load error:', e);
      }
    }

    result = {
      teachers: json.data.teachers || [],
      teacherAvailability: json.data.teacherAvailability || [],
      subjects: json.data.subjects || [],
      teacherAssign: json.data.teacherAssign || [],
      classMaster: json.data.classMaster || [],
      teacherReviews: json.data.teacherReviews || json.data.teachingReviews || json.data.reviews || [],
      teacherDeclines: json.data.teacherDeclines || json.data.declines || [],
      demoBook
    };
  } else {
    // Fallback: Local CSVs
    const [teachers, teacherAvailability, subjects, teacherAssign, classMaster, demoBook] = await Promise.all([
      fetchCsv(CSV_PATHS.TEACHERS),
      fetchCsv(CSV_PATHS.TEACHER_AVAILABILITY),
      fetchCsv(CSV_PATHS.SUBJECTS),
      fetchCsv(CSV_PATHS.TEACHER_ASSIGN),
      fetchCsv(CSV_PATHS.CLASS_MASTER),
      fetchCsv(CSV_PATHS.DEMO_BOOK).catch(() => [])
    ]);

    result = { 
      teachers, 
      teacherAvailability, 
      subjects, 
      teacherAssign, 
      classMaster, 
      teacherReviews: [],
      teacherDeclines: [],
      demoBook: demoBook || []
    };
  }

  return result;
}

/**
 * Posts a new teacher decline record to Google Apps Script
 */
export async function postTeacherDecline(options = {}, declineRecord) {
  const { scriptUrl = DEFAULT_SCRIPT_URL } = options;
  const targetUrl = scriptUrl || DEFAULT_SCRIPT_URL;
  try {
    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'add_decline',
        ...declineRecord
      })
    });
    return await res.json();
  } catch (err) {
    console.warn('Could not post decline to Google Script directly (persisting locally):', err);
    return { status: 'fallback', message: err.message };
  }
}

/**
 * Posts a new teacher assignment / allocation record to Google Apps Script
 */
export async function postTeacherAssign(options = {}, assignRecord) {
  const { scriptUrl = DEFAULT_SCRIPT_URL } = options;
  const targetUrl = scriptUrl || DEFAULT_SCRIPT_URL;
  try {
    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        action: 'add_assign',
        ...assignRecord
      })
    });
    return await res.json();
  } catch (err) {
    console.warn('Could not post allocation to Google Script directly (persisting locally):', err);
    return { status: 'fallback', message: err.message };
  }
}

/**
 * Main Engine: Calculates Teacher Remaining Availability & Vacancy Metrics
 *
 * @param {Object} rawData - { teachers, teacherAvailability, subjects, teacherAssign }
 * @param {Object} settings - { windowDays: 7, refDate: Date, minDuration: 0 }
 */
export function processTeacherRemainingAvailability(rawData, settings = {}) {
  const {
    windowDays = 7,
    refDate = new Date(),
    minDuration = 0 // minutes
  } = settings;

  const {
    teachers = [],
    teacherAvailability = [],
    subjects = [],
    teacherAssign = [],
    classMaster = [],
    teacherReviews = [],
    teacherDeclines = []
  } = rawData;

  // Compute Teacher Review Metrics (average rating per session & overall teacher averages)
  const reviewMetricsMap = computeTeacherReviewMetrics(teacherReviews, teachers, classMaster);

  // Group teacher declines by Teacher ID
  const declinesByTeacher = new Map();
  (teacherDeclines || []).forEach(dec => {
    const tId = (dec['Teacher ID'] || dec['Teacher Id'] || dec.teacherId || '').trim();
    if (!tId) return;
    if (!declinesByTeacher.has(tId)) {
      declinesByTeacher.set(tId, []);
    }
    const isPolicyViolation = dec['Policy Violation'] === true ||
      String(dec['Policy Violation'] || dec.policyViolation || '').toLowerCase() === 'true' ||
      String(dec['Policy Violation'] || dec.policyViolation || '').toLowerCase() === 'yes';

    declinesByTeacher.get(tId).push({
      id: dec.id || dec['Decline ID'] || `DEC_${tId}_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: dec.timestamp || dec['Timestamp'] || new Date().toISOString(),
      teacherId: tId,
      teacherName: dec['Teacher Name'] || dec.teacherName || '',
      reason: dec.reason || dec['Reason'] || 'Unavailable',
      policyViolation: isPolicyViolation,
      note: dec.note || dec['Student / Subject Note'] || dec['Notes'] || '',
      remarks: dec.remarks || dec['Remarks'] || ''
    });
  });

  // Catalog collectors for filter options
  const catalog = {
    categories: new Set(),
    boards: new Set(),
    levels: new Set(),
    stages: new Set(),
    departments: new Set(),
    subjectNames: new Set(),
    subjectLabels: new Set(),
    subjectIds: new Set(),
    teachLanguages: new Set()
  };

  // 1. Build lookup map for Subjects by Subject ID
  const subjectsMap = new Map();
  subjects.forEach(sub => {
    const id = (sub['Subject ID'] || '').trim();
    if (id) {
      const category = (sub.Category || '').trim();
      const board = (sub.Board || '').trim();
      const level = (sub.Level || '').trim();
      const department = (sub.Department || '').trim();
      const stage = (sub.Stage || '').trim();
      const name = (sub['Subject Name'] || '').trim();
      const code = (sub['Subject Code'] || '').trim();
      const description = (sub['Subject Description'] || '').trim();
      const label = (sub.Label || '').trim() || name;
      const status = (sub.Status || '').trim();

      if (id) catalog.subjectIds.add(id);
      if (category) catalog.categories.add(category);
      if (board) catalog.boards.add(board);
      if (level) catalog.levels.add(level);
      if (stage) catalog.stages.add(stage);
      if (department) catalog.departments.add(department);
      if (name) catalog.subjectNames.add(name);
      if (label) catalog.subjectLabels.add(label);

      subjectsMap.set(id, {
        id,
        category,
        board,
        level,
        department,
        stage,
        name,
        code,
        description,
        label,
        status
      });
    }
  });

  // 2. Filter Active Teachers only
  const activeTeachers = teachers.filter(t => {
    const st = (t.Status || '').trim().toLowerCase();
    return st === 'active';
  });

  // 3. Generate rolling window dates
  const windowDates = getRollingWindowDates(refDate, windowDays);

  // 4. Map Availability per Teacher
  const availByTeacher = new Map();
  teacherAvailability.forEach(av => {
    const tId = (av['Teacher ID'] || '').trim();
    if (!tId) return;
    if (!availByTeacher.has(tId)) {
      availByTeacher.set(tId, []);
    }

    const weekday = normalizeWeekday(av.Weekday);
    const startMins = timeStringToMinutes(av['Start Time']);
    const endMins = timeStringToMinutes(av['End Time']);

    if (weekday && startMins >= 0 && endMins > startMins) {
      availByTeacher.get(tId).push({
        id: (av['Available ID'] || '').trim(),
        teacherId: tId,
        weekday,
        startMins,
        endMins,
        startTimeStr: minutesToTimeString(startMins),
        endTimeStr: minutesToTimeString(endMins),
        duration: endMins - startMins
      });
    }
  });

  // 5. Map Allocations (Teacher Assign) per Teacher
  const assignByTeacher = new Map();
  teacherAssign.forEach(asg => {
    const tId = (asg['Teacher ID'] || '').trim();
    if (!tId) return;
    if (!assignByTeacher.has(tId)) {
      assignByTeacher.set(tId, []);
    }
    assignByTeacher.get(tId).push(asg);
  });

  // Intermediate flat table: all unoccupied slots across the rolling window
  const rawRemainingSlotsTable = [];
  // Aggregated summaries per teacher
  const teacherSummaries = [];

  // Process each active teacher
  for (const t of activeTeachers) {
    const teacherId = (t['Teacher ID'] || '').trim();
    const teacherName = (t.Name || '').trim();
    const contact = (t.Contact || '').trim();
    const mail = (t.Mail || '').trim();
    const reviewMetrics = reviewMetricsMap.get(teacherId) || {
      teacherId,
      hasReviews: false,
      avgRating: 0,
      formattedRating: '—',
      sessionsCount: 0,
      totalReviewsCount: 0,
      sessions: []
    };
    // Rating is strictly computed from Teacher Review per session. Registration rating is completely ignored.
    const rating = reviewMetrics.hasReviews ? reviewMetrics.avgRating : 0;
    const wage = parseFloat(t['Teacher wage / session']) || 0;

    // Declines summary for this teacher
    const teacherDeclinesList = declinesByTeacher.get(teacherId) || [];
    const declinesCount = teacherDeclinesList.length;
    const policyViolationsCount = teacherDeclinesList.filter(d => d.policyViolation).length;
    const hasPolicyViolation = policyViolationsCount > 0;

    // Parse Teach Lang (Teaching Languages)
    const rawTeachLang = (t['Teach Lang'] || '').trim();
    const teachLanguages = rawTeachLang
      .split(',')
      .map(l => l.trim())
      .filter(Boolean);

    teachLanguages.forEach(lang => {
      catalog.teachLanguages.add(lang);
    });

    // Resolve qualified subjects for this teacher
    const rawSubIds = (t['Subjects ID(s)'] || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const qualifiedSubjects = [];
    const teacherBoards = new Set();
    const teacherLevels = new Set();
    const teacherStages = new Set();
    const teacherCategories = new Set();
    const teacherDepartments = new Set();
    const teacherNames = new Set();
    const teacherLabels = new Set();
    const teacherSubjectIds = new Set();

    for (const sid of rawSubIds) {
      const sub = subjectsMap.get(sid);
      if (sub) {
        qualifiedSubjects.push(sub);
        teacherSubjectIds.add(sub.id);
        if (sub.board) teacherBoards.add(sub.board);
        if (sub.level) teacherLevels.add(sub.level);
        if (sub.stage) teacherStages.add(sub.stage);
        if (sub.category) teacherCategories.add(sub.category);
        if (sub.department) teacherDepartments.add(sub.department);
        if (sub.name) teacherNames.add(sub.name);
        if (sub.label) teacherLabels.add(sub.label);
      }
    }

    // Availability slots for this teacher
    const teacherAvails = availByTeacher.get(teacherId) || [];
    // Active allocations for this teacher
    const teacherAllocs = assignByTeacher.get(teacherId) || [];

    let totalAvailSlotsCount = 0;
    let totalAvailMinutes = 0;
    let totalBookedSlotsCount = 0;
    let totalBookedMinutes = 0;
    let totalActiveSlotsCount = 0;
    let totalActiveMinutes = 0;
    let totalHoldSlotsCount = 0;
    let totalHoldMinutes = 0;

    const teacherRemainingSlots = [];
    const teacherBookedInstances = [];

    // Evaluate day by day across the rolling window
    for (const dateObj of windowDates) {
      // 1. Available windows on this weekday
      const dayAvails = teacherAvails.filter(av => av.weekday === dateObj.weekday);
      // 2. Active allocations on this specific date
      const dayAllocs = teacherAllocs.filter(asg => isAllocationActiveOnDate(asg, dateObj));

      // If no availability and no allocations on this date, skip
      if (dayAvails.length === 0 && dayAllocs.length === 0) continue;

      if (dayAvails.length > 0) {
        totalAvailSlotsCount += dayAvails.length;
        dayAvails.forEach(av => {
          totalAvailMinutes += av.duration;
        });
      }

      // Map allocations to time intervals [startMins, endMins]
      const occupiedIntervals = [];
      for (const asg of dayAllocs) {
        const sMins = timeStringToMinutes(asg['Start Time']);
        const eMins = timeStringToMinutes(asg['End Time']);
        if (sMins >= 0 && eMins > sMins) {
          occupiedIntervals.push({
            start: sMins,
            end: eMins,
            id: asg['Teacher Assign ID'],
            raw: asg
          });

          const dur = eMins - sMins;
          totalBookedSlotsCount++;
          totalBookedMinutes += dur;

          const asgStatus = (asg.Status || 'Active').trim().toLowerCase();
          if (asgStatus === 'hold') {
            totalHoldSlotsCount++;
            totalHoldMinutes += dur;
          } else {
            totalActiveSlotsCount++;
            totalActiveMinutes += dur;
          }

          teacherBookedInstances.push({
            assignId: asg['Teacher Assign ID'],
            date: dateObj.dateStr,
            weekday: dateObj.weekday,
            startTimeStr: minutesToTimeString(sMins),
            endTimeStr: minutesToTimeString(eMins),
            startMins: sMins,
            endMins: eMins,
            duration: eMins - sMins,
            studentId: asg['Student ID'],
            classRoomId: asg['Class Room ID'],
            meetLink: asg['Meet Link'],
            subjectId: asg['Subject ID'],
            subjectLabel: subjectsMap.get(asg['Subject ID'])?.label || asg['Subject ID'],
            status: asg.Status || 'Active'
          });
        }
      }

      // 3. Perform Interval Subtraction if teacher had availability!
      if (dayAvails.length > 0) {
        const availableWindows = dayAvails.map(av => ({
          start: av.startMins,
          end: av.endMins,
          id: av.id,
          raw: av
        }));

        const freeIntervals = subtractIntervals(availableWindows, occupiedIntervals);

        // 4. Save each remaining free interval
        for (const free of freeIntervals) {
          if (free.duration < minDuration) continue;

        const slotId = `SLOT_${teacherId}_${dateObj.dateStr.replace(/-/g, '')}_${free.start}_${free.end}`;
        const slotStartStr = minutesToTimeString(free.start);
        const slotEndStr = minutesToTimeString(free.end);

        const slotRecord = {
          slot_id: slotId,
          teacher_id: teacherId,
          teacher_name: teacherName,
          teacher_contact: contact,
          teacher_mail: mail,
          rating,
          rating_details: reviewMetrics,
          wage_per_session: wage,
          teach_languages: teachLanguages,
          raw_teach_lang: rawTeachLang,

          date: dateObj.dateStr,
          date_formatted: dateObj.label,
          weekday: dateObj.weekday,
          slot_start_time: slotStartStr,
          slot_end_time: slotEndStr,
          slot_start_mins: free.start,
          slot_end_mins: free.end,
          duration_minutes: free.duration,

          orig_avail_id: free.origAvailId,
          orig_window_start: minutesToTimeString(free.origStart),
          orig_window_end: minutesToTimeString(free.origEnd),
          is_split: free.isSplit,
          cut_by_assign_id: free.cutByAssignId,

          subject_ids: Array.from(teacherSubjectIds),
          boards: Array.from(teacherBoards),
          levels: Array.from(teacherLevels),
          stages: Array.from(teacherStages),
          categories: Array.from(teacherCategories),
          departments: Array.from(teacherDepartments),
          subject_names: Array.from(teacherNames),
          subject_labels: Array.from(teacherLabels),
          qualified_subjects: qualifiedSubjects
        };

        rawRemainingSlotsTable.push(slotRecord);
        teacherRemainingSlots.push(slotRecord);
      }
    }
  }

    const remainingMinutes = teacherRemainingSlots.reduce((acc, s) => acc + s.duration_minutes, 0);

    // Calculate Vacancy Percentage and Status (Green / Yellow / Red)
    const vacancyPercentage = totalAvailMinutes > 0
      ? Math.round((remainingMinutes / totalAvailMinutes) * 100)
      : 0;

    let vacancyStatus = 'none'; // 'vacant' | 'partial' | 'filled' | 'none'
    let vacancyLabel = 'No Slots';
    let vacancyColor = 'gray';

    if (totalAvailMinutes > 0) {
      if (vacancyPercentage >= 60) {
        vacancyStatus = 'vacant';
        vacancyLabel = 'Vacant';
        vacancyColor = 'green';
      } else if (vacancyPercentage >= 15) {
        vacancyStatus = 'partial';
        vacancyLabel = 'Partially Booked';
        vacancyColor = 'yellow';
      } else {
        vacancyStatus = 'filled';
        vacancyLabel = 'Filled';
        vacancyColor = 'red';
      }
    }

    // Attach vacancy status to slot records for filtering
    teacherRemainingSlots.forEach(s => {
      s.vacancy_status = vacancyStatus;
      s.vacancy_percentage = vacancyPercentage;
    });

    // Build the aggregated teacher record
    teacherSummaries.push({
      teacherId,
      teacherName,
      contact,
      mail,
      rating,
      ratingDetails: reviewMetrics,
      wage,
      declines: teacherDeclinesList,
      declinesCount,
      hasPolicyViolation,
      policyViolationsCount,
      teachLanguages,
      rawTeachLang,

      vacancyPercentage,
      vacancyStatus,
      vacancyLabel,
      vacancyColor,

      qualifiedSubjects,
      subjectIds: Array.from(teacherSubjectIds),
      boards: Array.from(teacherBoards),
      levels: Array.from(teacherLevels),
      stages: Array.from(teacherStages),
      categories: Array.from(teacherCategories),
      departments: Array.from(teacherDepartments),
      subjectNames: Array.from(teacherNames),
      subjectLabels: Array.from(teacherLabels),

      totalSlotsCount: totalAvailSlotsCount,
      totalMinutes: totalAvailMinutes,
      bookedSlotsCount: totalBookedSlotsCount,
      bookedMinutes: totalBookedMinutes,
      activeSlotsCount: totalActiveSlotsCount,
      activeMinutes: totalActiveMinutes,
      holdSlotsCount: totalHoldSlotsCount,
      holdMinutes: totalHoldMinutes,
      remainingSlotsCount: teacherRemainingSlots.length,
      remainingMinutes,

      remainingSlots: teacherRemainingSlots,
      bookedInstances: teacherBookedInstances
    });
  }

  // Direct Teacher Assign Analysis (as requested: exact counts of active/hold assignment IDs and unique teachers)
  const activeAssigns = teacherAssign.filter(a => (a.Status || '').trim().toLowerCase() === 'active');
  const holdAssigns = teacherAssign.filter(a => (a.Status || '').trim().toLowerCase() === 'hold');

  const activeTeacherIds = new Set(activeAssigns.map(a => (a['Teacher ID'] || '').trim()).filter(Boolean));
  const holdTeacherIds = new Set(holdAssigns.map(a => (a['Teacher ID'] || '').trim()).filter(Boolean));

  let activeTotalMins = 0;
  activeAssigns.forEach(a => {
    const sM = timeStringToMinutes(a['Start Time']);
    const eM = timeStringToMinutes(a['End Time']);
    const dur = (sM >= 0 && eM > sM) ? (eM - sM) : 75;
    activeTotalMins += dur;
  });

  let holdTotalMins = 0;
  holdAssigns.forEach(a => {
    const sM = timeStringToMinutes(a['Start Time']);
    const eM = timeStringToMinutes(a['End Time']);
    const dur = (sM >= 0 && eM > sM) ? (eM - sM) : 75;
    holdTotalMins += dur;
  });

  const assignmentStats = {
    active: {
      teachersCount: activeTeacherIds.size,
      classesCount: activeAssigns.length,
      totalMinutes: activeTotalMins,
      teacherIds: Array.from(activeTeacherIds)
    },
    hold: {
      teachersCount: holdTeacherIds.size,
      classesCount: holdAssigns.length,
      totalMinutes: holdTotalMins,
      teacherIds: Array.from(holdTeacherIds)
    }
  };

  return {
    rawRemainingSlotsTable,
    teacherSummaries,
    windowDates,
    assignmentStats,
    studentsCatalog: extractStudentsCatalog(classMaster, teacherAssign),
    allSubjects: subjects,
    catalog: {
      categories: Array.from(catalog.categories).sort(),
      boards: Array.from(catalog.boards).sort(),
      levels: Array.from(catalog.levels).sort(),
      stages: Array.from(catalog.stages).sort(),
      departments: Array.from(catalog.departments).sort(),
      subjectNames: Array.from(catalog.subjectNames).sort(),
      subjectLabels: Array.from(catalog.subjectLabels).sort(),
      subjectIds: Array.from(catalog.subjectIds).sort(),
      teachLanguages: Array.from(catalog.teachLanguages).sort()
    }
  };
}

/**
 * Maps subject name to standard Department classification
 */
export function getDepartmentForSubject(subjectName = '', category = '') {
  const u = (subjectName || '').toUpperCase();
  if (u.includes('MATH')) return 'Mathematics';
  if (u.includes('SCIENCE') || u.includes('PHYSIC') || u.includes('CHEMIS') || u.includes('BIOLOG')) return 'Science';
  if (u.includes('ENGLISH') || u.includes('MALAYALAM') || u.includes('HINDI') || u.includes('ARABIC') || u.includes('SANSKRIT') || u.includes('URDU') || u.includes('FRENCH') || u.includes('GERMAN')) return 'Languages';
  if (u.includes('SOCIAL') || u.includes('HISTORY') || u.includes('GEOGRAPHY') || u.includes('CIVIC') || u.includes('POLITIC') || u.includes('ECONOM')) return 'Social Studies';
  if (u.includes('IT') || u.includes('COMPUTER') || u.includes('CODING') || u.includes('AI')) return 'Computer & IT';
  if (u.includes('COMMERCE') || u.includes('ACCOUNT') || u.includes('BUSINESS')) return 'Commerce';
  return 'General Academic';
}

/**
 * Robust date parser for Demo Book dates (handles YYYY-MM-DD and DD/MM/YYYY)
 */
export function parseDemoDate(dateStr) {
  if (!dateStr) return null;
  const s = String(dateStr).trim();
  if (s.includes('/')) {
    const parts = s.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return isNaN(d.getTime()) ? null : d;
    }
  } else if (s.includes('-')) {
    const parts = s.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return isNaN(d.getTime()) ? null : d;
    }
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Computes Market Demand (Demo Book) vs Teacher Supply Analytics
 * Features:
 * - Demand = Number of demo requests (Audio 2 & 3)
 * - Supply = Count of unique qualified teachers with at least 1 available session (Audio 2 & 3)
 * - Lookback/Forecast Period filtering (Audio 4: Next 1 Month, Next 2 Months... Lifetime)
 * - Urgent pending demos without teachers highlighted with top priority (Audio 1)
 */
export function processSupplyDemandAnalytics(rawData = {}, teacherSummaries = [], settings = {}) {
  const { demoBook = [], subjects = [] } = rawData;

  // 1. Build Subjects Map (Raw Department is empty in DB - Audio 1)
  const subjectMap = new Map();
  subjects.forEach(s => {
    const id = (s['Subject ID'] || s.id || '').trim();
    if (id) {
      const rawBoard = (s.Board || s.board || 'Other').trim();
      const board = rawBoard.toUpperCase() === 'KERALA' ? 'Kerala' : rawBoard;
      const rawDept = (s.Department || s.department || '').trim();
      subjectMap.set(id, {
        id,
        name: s['Subject Name'] || s.name || 'Unknown',
        stage: s.Stage || s.stage || 'General',
        board,
        level: s.Level || s.level || 'General',
        department: rawDept,
        label: s.Label || s.label || `${s.Stage} - ${s['Subject Name']} (${board})`
      });
    }
  });

  // 2. Process Demo Requests (Demand)
  const processedDemos = [];
  let urgentPendingNoTeacherCount = 0;
  let lostNoTeacherCount = 0;
  let totalConvertedCount = 0;
  let totalRejectedCount = 0;
  let totalScheduledCount = 0;
  let totalCompletedCount = 0;
  let totalFollowupCount = 0;
  let maxDemoDate = null;

  demoBook.forEach((d, idx) => {
    const subId = (d['Subject ID'] || d['Subject Id'] || d['subject id'] || '').trim();
    const sub = subjectMap.get(subId) || {
      id: subId,
      name: 'Unknown Subject',
      stage: 'Unknown Class',
      board: 'Unknown Board',
      level: 'General',
      department: '',
      label: subId
    };

    const status = (d['Demo Status'] || d['Demo status'] || d['Status'] || 'Unknown').trim();
    const teacherId = (d['Teacher ID'] || d['Teacher Id'] || d['teacher id'] || '').trim();
    const isTeacherMissing = !teacherId;
    const isUrgentPending = isTeacherMissing && (status === 'Scheduled' || status === 'Follow up');
    const isLostNoTeacher = isTeacherMissing && status === 'Rejected';

    if (isUrgentPending) urgentPendingNoTeacherCount++;
    if (isLostNoTeacher) lostNoTeacherCount++;
    if (status === 'Converted to Sale') totalConvertedCount++;
    else if (status === 'Rejected') totalRejectedCount++;
    else if (status === 'Scheduled') totalScheduledCount++;
    else if (status === 'Completed') totalCompletedCount++;
    else if (status === 'Follow up') totalFollowupCount++;

    const rawDateStr = (d['Slot Date'] || d['Slot date'] || d['Date'] || d['date'] || '').trim();
    const parsedDate = parseDemoDate(rawDateStr);
    if (parsedDate && !isNaN(parsedDate.getTime())) {
      if (!maxDemoDate || parsedDate > maxDemoDate) {
        maxDemoDate = parsedDate;
      }
    }

    processedDemos.push({
      demoId: d['Demo ID'] || d['Demo Id'] || `DMO_${idx}`,
      studentName: d['Student Name'] || d['Student name'] || 'Anonymous',
      phone: d['Phone Number'] || d['Phone number'] || '',
      subjectId: subId,
      subjectName: sub.name,
      stage: sub.stage,
      board: sub.board,
      level: sub.level,
      department: sub.department,
      label: sub.label,
      teacherId,
      isTeacherMissing,
      isUrgentPending,
      isLostNoTeacher,
      status,
      slotDate: rawDateStr,
      parsedDate,
      slotTime: d['Slot Time'] || '',
      slotEndTime: d['Slot End Time'] || '',
      medium: d['Medium'] || '',
      teachingLanguage: d['Teaching Language'] || '',
      meetingLink: d['Meeting Link'] || '',
      feedback: d['Feedback'] || '',
      note: d['Note'] || '',
      responsible: d['Responsible'] || '',
      teachRate: d['Teach Rate'] || '',
      entityId: d['Entity ID'] || ''
    });
  });

  // 3. Process Teacher Supply (Audio 2 & 3: Teachers with at least 1 available session)
  const teacherSupplyMap = new Map();
  const allActiveTeachers = (teacherSummaries || []).filter(t => 
    (t.status || 'Active').toLowerCase() === 'active'
  );
  const activeTeachers = allActiveTeachers.filter(t => (t.possibleSessions || 0) >= 1);

  let totalAvailableTeacherSessions = 0;
  let totalHighFragilityTeachers = 0;

  activeTeachers.forEach(t => {
    const possSessions = t.possibleSessions || 0;
    totalAvailableTeacherSessions += possSessions;
    const qualified = t.qualifiedSubjects || [];
    const n = qualified.length || 1;
    const fragilityScore = t.fragilityScore ?? (possSessions > 0 ? Number((n / possSessions).toFixed(2)) : null);
    const isHighFragility = fragilityScore !== null && fragilityScore >= 3.5;
    if (isHighFragility) totalHighFragilityTeachers++;

    qualified.forEach(q => {
      const sId = (q.id || '').trim();
      if (!sId) return;
      if (!teacherSupplyMap.has(sId)) {
        teacherSupplyMap.set(sId, []);
      }
      teacherSupplyMap.get(sId).push({
        teacherId: t.teacherId,
        teacherName: t.teacherName,
        phone: t.phone || t['Phone Number'] || '',
        teachLanguages: t.teachLanguages || [],
        possibleSessions: possSessions,
        totalSubjectsCount: n,
        fragilityScore,
        isHighFragility,
        matchedSubjectId: sId,
        matchedSubjectName: q.name,
        matchedSubjectLabel: q.label,
        matchedStage: q.stage,
        matchedBoard: q.board,
        qualifiedSubjects: t.qualifiedSubjects || []
      });
    });
  });

  // 4. Aggregator Function
  function aggregateBy(keyFn, dimensionName) {
    const groupMap = new Map();

    // Pre-populate with all known subjects from catalog so supply is always fully accounted for
    subjectMap.forEach(sub => {
      const dummyDemo = {
        stage: sub.stage,
        level: sub.level,
        board: sub.board,
        department: sub.department,
        subjectName: sub.name,
        subjectId: sub.id,
        label: sub.label
      };
      const key = keyFn(dummyDemo);
      if (key && !groupMap.has(key)) {
        groupMap.set(key, {
          key,
          dimension: dimensionName,
          title: key,
          stage: sub.stage,
          level: sub.level,
          board: sub.board,
          department: sub.department,
          subjectName: sub.name,
          subjectId: sub.id,
          label: sub.label,
          totalDemand: 0,
          activeDemand: 0,
          urgentMissingTeacher: 0,
          lostMissingTeacher: 0,
          convertedCount: 0,
          rejectedCount: 0,
          scheduledCount: 0,
          completedCount: 0,
          followupCount: 0,
          demos: [],
          subjectIds: new Set([sub.id])
        });
      } else if (key && groupMap.has(key)) {
        groupMap.get(key).subjectIds.add(sub.id);
      }
    });

    processedDemos.forEach(d => {
      const key = keyFn(d);
      if (!groupMap.has(key)) {
        groupMap.set(key, {
          key,
          dimension: dimensionName,
          title: key,
          stage: d.stage,
          level: d.level,
          board: d.board,
          department: d.department,
          subjectName: d.subjectName,
          subjectId: d.subjectId,
          label: d.label,
          totalDemand: 0,
          activeDemand: 0,
          urgentMissingTeacher: 0,
          lostMissingTeacher: 0,
          convertedCount: 0,
          rejectedCount: 0,
          scheduledCount: 0,
          completedCount: 0,
          followupCount: 0,
          demos: [],
          subjectIds: new Set()
        });
      }
      const g = groupMap.get(key);
      g.totalDemand++;
      if (d.status === 'Scheduled' || d.status === 'Follow up') g.activeDemand++;
      if (d.isUrgentPending) g.urgentMissingTeacher++;
      if (d.isLostNoTeacher) g.lostMissingTeacher++;
      if (d.status === 'Converted to Sale') g.convertedCount++;
      else if (d.status === 'Rejected') g.rejectedCount++;
      else if (d.status === 'Scheduled') g.scheduledCount++;
      else if (d.status === 'Completed') g.completedCount++;
      else if (d.status === 'Follow up') g.followupCount++;

      g.demos.push(d);
      if (d.subjectId) g.subjectIds.add(d.subjectId);
    });

    return Array.from(groupMap.values()).map(g => {
      const uniqueTeacherMap = new Map();

      g.subjectIds.forEach(sId => {
        const tSupplies = teacherSupplyMap.get(sId) || [];
        tSupplies.forEach(ts => {
          if (!uniqueTeacherMap.has(ts.teacherId)) {
            uniqueTeacherMap.set(ts.teacherId, ts);
          }
        });
      });

      const qualifiedTeachers = Array.from(uniqueTeacherMap.values());
      const availableTeachersCount = qualifiedTeachers.length; // Audio 2 & 3: Supply is count of teachers!
      const demand = g.totalDemand;
      const supply = availableTeachersCount;
      const shortage = Math.max(0, demand - supply);
      const buffer = Math.max(0, supply - demand);
      const highFragilityCount = qualifiedTeachers.filter(t => t.isHighFragility).length;
      const totalPossibleSessions = qualifiedTeachers.reduce((acc, t) => acc + t.possibleSessions, 0);
      const conversionRate = demand > 0 ? Number(((g.convertedCount / demand) * 100).toFixed(1)) : 0;

      let hiringStatus = 'STABLE';
      let urgencyScore = 0;

      if (g.urgentMissingTeacher > 0) {
        hiringStatus = 'URGENT';
        urgencyScore = 100 + (g.urgentMissingTeacher * 15) + shortage;
      } else if (shortage > 0) {
        hiringStatus = 'URGENT';
        urgencyScore = 50 + shortage * 5;
      } else if (g.activeDemand > 0 && highFragilityCount > 0 && (highFragilityCount / (availableTeachersCount || 1)) >= 0.5) {
        hiringStatus = 'FRAGILE';
        urgencyScore = 20 + g.activeDemand * 2;
      } else {
        hiringStatus = 'STABLE';
        urgencyScore = 0;
      }

      return {
        ...g,
        subjectIds: Array.from(g.subjectIds),
        qualifiedTeachers,
        availableTeachersCount,
        totalPossibleSessions,
        demand,
        supply,
        shortage,
        buffer,
        highFragilityCount,
        conversionRate,
        hiringStatus,
        urgencyScore
      };
    }).sort((a, b) => b.urgencyScore - a.urgencyScore || b.totalDemand - a.totalDemand);
  }

  // Dimensions
  const byClass = aggregateBy(d => d.stage, 'class');
  const bySubject = aggregateBy(d => d.subjectName, 'subject');
  const byBoard = aggregateBy(d => d.board, 'board');
  const byLevel = aggregateBy(d => d.level, 'level');
  const byDepartment = aggregateBy(d => d.department || 'General', 'department');

  // Detailed Granular Rows (Subject Level)
  const detailedRows = aggregateBy(d => d.label || d.subjectId, 'detailed');

  // 5. Strategic Hiring Action Plan (Audio 2 & 4)
  const hiringActionPlan = [];

  // P1: Urgent Pending Demos without Teacher Assigned (Audio 1 Priority)
  detailedRows.filter(r => r.urgentMissingTeacher > 0).forEach(g => {
    hiringActionPlan.push({
      id: `AP_P1_${g.key}`,
      priority: 'P1_CRITICAL',
      priorityLabel: 'Urgent Allocation (P1)',
      targetRole: g.title,
      stage: g.stage,
      board: g.board,
      level: g.level,
      department: g.department,
      trigger: `${g.urgentMissingTeacher} active demo(s) waiting with NO TEACHER assigned!`,
      recommendation: `Allocate available teacher or recruit urgently. Minimum required: ${Math.max(6, g.urgentMissingTeacher * 3)} sessions/week.`,
      urgencyScore: g.urgencyScore,
      activeDemand: g.activeDemand,
      effectiveSessions: g.effectiveSessions
    });
  });

  // P2: Deficit Areas (Active demand exceeds effective supply)
  detailedRows.filter(r => r.urgentMissingTeacher === 0 && r.netGap < 0).forEach(g => {
    hiringActionPlan.push({
      id: `AP_P2_${g.key}`,
      priority: 'P2_HIGH',
      priorityLabel: 'Deficit Gap (P2)',
      targetRole: g.title,
      stage: g.stage,
      board: g.board,
      level: g.level,
      department: g.department,
      trigger: `Demand (${g.activeDemand} active) exceeds effective supply (${g.effectiveSessions} sess). Deficit: ${Math.abs(g.netGap)} sessions.`,
      recommendation: `Hire dedicated teacher for ${g.title}. Target: min 8 sessions/week.`,
      urgencyScore: g.urgencyScore,
      activeDemand: g.activeDemand,
      effectiveSessions: g.effectiveSessions
    });
  });

  // P3: High Fragility Buffer
  detailedRows.filter(r => r.urgentMissingTeacher === 0 && r.netGap >= 0 && r.hiringStatus === 'FRAGILE').slice(0, 6).forEach(g => {
    hiringActionPlan.push({
      id: `AP_P3_${g.key}`,
      priority: 'P3_MODERATE',
      priorityLabel: 'Fragility Buffer (P3)',
      targetRole: g.title,
      stage: g.stage,
      board: g.board,
      level: g.level,
      department: g.department,
      trigger: `Relies heavily on ${g.highFragilityCount} high-risk generalist teacher(s). One booking collapses options.`,
      recommendation: `Recruit a dedicated teacher to relieve generalists and prevent single points of failure.`,
      urgencyScore: g.urgencyScore,
      activeDemand: g.activeDemand,
      effectiveSessions: g.effectiveSessions
    });
  });

  return {
    kpis: {
      totalDemos: processedDemos.length,
      urgentPendingNoTeacher: urgentPendingNoTeacherCount,
      lostNoTeacher: lostNoTeacherCount,
      totalConverted: totalConvertedCount,
      totalRejected: totalRejectedCount,
      totalScheduled: totalScheduledCount,
      totalCompleted: totalCompletedCount,
      totalFollowup: totalFollowupCount,
      overallConversionRate: processedDemos.length > 0 ? Number(((totalConvertedCount / processedDemos.length) * 100).toFixed(1)) : 0,
      totalActiveTeachers: allActiveTeachers.length,
      totalAvailableTeachers: activeTeachers.length,
      totalAvailableTeacherSessions,
      totalHighFragilityTeachers,
      totalUrgentDeficitAreas: detailedRows.filter(r => r.shortage > 0 || r.urgentMissingTeacher > 0).length,
      maxDemoDate
    },
    byClass,
    bySubject,
    byBoard,
    byLevel,
    byDepartment,
    detailedRows,
    hiringActionPlan,
    processedDemos,
    subjectCatalog: Array.from(subjectMap.values())
  };
}


