import fs from 'fs';
import Papa from 'papaparse';

const teachers = Papa.parse(fs.readFileSync('schema/HR & Sales - Teacher.csv', 'utf8'), { header: true }).data;
const subjects = Papa.parse(fs.readFileSync('schema/HR & Sales - Subjects.csv', 'utf8'), { header: true }).data;
const demoReport = JSON.parse(fs.readFileSync('scratch/demo_report.json', 'utf8'));

// Build Subject ID -> Details Map
const subMap = {};
subjects.forEach(s => {
  const sid = (s['Subject ID'] || '').trim();
  if (sid) {
    subMap[sid] = {
      name: (s['Subject Name'] || '').trim(),
      stage: (s['Stage'] || '').trim(),
      level: (s['Level'] || '').trim(),
      board: (s['Board'] || '').trim(),
      label: (s['Label'] || sid).trim()
    };
  }
});

// Map active teachers to subjects and levels
const subjectTeacherCount = {};
const levelTeacherSet = {
  LP: new Set(),
  UP: new Set(),
  HS: new Set(),
  HSS: new Set()
};

const activeTeachers = teachers.filter(t => (t.Status || '').trim().toLowerCase() === 'active');

activeTeachers.forEach(t => {
  const tId = (t['Teacher ID'] || '').trim();
  const sIds = (t['Subjects ID(s)'] || '').split(/[,;]/).map(s => s.trim()).filter(Boolean);
  
  sIds.forEach(sid => {
    subjectTeacherCount[sid] = (subjectTeacherCount[sid] || 0) + 1;
    const subInfo = subMap[sid];
    if (subInfo && subInfo.level && levelTeacherSet[subInfo.level]) {
      levelTeacherSet[subInfo.level].add(tId);
    }
  });
});

console.log('Total Active Teachers:', activeTeachers.length);
console.log('\n--- ACTIVE TEACHERS BY LEVEL ---');
for (const [lvl, set] of Object.entries(levelTeacherSet)) {
  console.log(`${lvl}: ${set.size} active teachers can teach this level`);
}

console.log('\n--- SUPPLY VS DEMAND FOR TOP DEMANDED SUBJECTS ---');
demoReport.topSubjects.slice(0, 20).forEach(s => {
  const currentTeachers = subjectTeacherCount[s.subId] || 0;
  console.log(`${s.subId} (${s.label}): Demand=${s.total} demos | Active Qualified Teachers=${currentTeachers}`);
});
