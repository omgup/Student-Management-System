// app.js - SMS v4 common utilities (with Dark Mode, Sorting/Search, Charts)
const STORAGE_KEY = 'sms_v4';
const SESSION_KEY = 'sms_v4_current';

function seedIfNeeded(){
  if(!localStorage.getItem(STORAGE_KEY)){
    const data = {
      students: [
        { name: 'Om Gupta', roll: '0905CS241183', password: '1234567890', phone:'', address:'', subjects:['CS-303-T','CS-303-P'] }
      ],
      faculty: [
        { username: 'xyz', password: '1234567890', name: 'Faculty XYZ' }
      ],
      subjects: [
        { id:'ES-301-T', title:'Energy & Environmental Engineering [ES-301 B3] [T] 2025', intro:'Intro: energy sources, sustainability, environmental impact.' },
        { id:'CS-302-T', title:'Discrete Structure [CS-302 B3] [T] 2025', intro:'Logic, sets, relations, combinatorics, graphs.' },
        { id:'CS-303-T', title:'Data Structure [CS-303 B3] [T] 2025', intro:'Arrays, lists, stacks, queues, trees, graphs.' },
        { id:'CS-303-P', title:'Data Structure [CS-303 B3] [P] 2025', intro:'Lab: implement data structures in Java/C++.' },
        { id:'CS-304-T', title:'Digital Systems [CS-304 B3] [T] 2025', intro:'Boolean algebra, combinational and sequential logic.' },
        { id:'CS-304-P', title:'Digital Systems [CS-304 B3] [P] 2025', intro:'Practical circuits and simulations.' },
        { id:'CS-305-T', title:'Object Oriented Programming & Methodology [CS-305 B3] [T] 2025', intro:'OOP concepts and design principles.' },
        { id:'CS-305-P', title:'Object Oriented Programming & Methodology [CS-305 B3] [P] 2025', intro:'Practical OOP labs in Java.' },
        { id:'CS-306-P', title:'Computer Workshop-Java [CS-306 B3] [P] 2025', intro:'Java workshop and small projects.' }
      ],
      announcements: {},
      marks: {},
      attendance: {}
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
}

function getData(){ seedIfNeeded(); return JSON.parse(localStorage.getItem(STORAGE_KEY)); }
function saveData(d){ localStorage.setItem(STORAGE_KEY, JSON.stringify(d)); }
function getCurrent(){ const s = sessionStorage.getItem(SESSION_KEY); return s?JSON.parse(s):null; }
function setCurrent(u){ sessionStorage.setItem(SESSION_KEY, JSON.stringify(u)); }
function logout(){ sessionStorage.removeItem(SESSION_KEY); location.href='index.html'; }

function findSubject(ref){
  if(!ref) return null;
  const data = getData();
  const subjects = data.subjects || [];
  let s = subjects.find(x => x.id === ref || x.title === ref);
  if(s) return s;
  s = subjects.find(x => x.id && x.id.toLowerCase().includes(ref.toLowerCase()));
  if(s) return s;
  s = subjects.find(x => x.title && x.title.toLowerCase().includes(ref.toLowerCase()));
  return s || null;
}

function formatDate(d){ return (new Date(d)).toLocaleString(); }
function elt(tag, cls, txt){ const e = document.createElement(tag); if(cls) e.className = cls; if(txt!==undefined) e.textContent = txt; return e; }

/* ----------------- NEW FEATURES START ----------------- */

/* 1) Dark Mode */
function isDarkMode() {
  return localStorage.getItem('sms_dark_mode') === '1';
}
function applyDarkModeClass() {
  if (isDarkMode()) document.documentElement.classList.add('sms-dark');
  else document.documentElement.classList.remove('sms-dark');
}
function toggleDarkMode() {
  localStorage.setItem('sms_dark_mode', isDarkMode() ? '0' : '1');
  applyDarkModeClass();
}
function initDarkMode(toggleBtnId) {
  applyDarkModeClass();
  if (!toggleBtnId) return;
  const btn = document.getElementById(toggleBtnId);
  if (!btn) return;
  btn.addEventListener('click', () => {
    toggleDarkMode();
    updateBtn();
  });
  function updateBtn() {
    btn.textContent = isDarkMode() ? 'Light Mode' : 'Dark Mode';
  }
  updateBtn();
  window.addEventListener('storage', updateBtn);
}

/* 2) Search & Sorting Helpers */
function getStudentsArray() {
  const d = getData();
  return Array.isArray(d.students) ? d.students.slice() : [];
}

/** searchStudents(query)
 *  - query matched against name, roll, subjects (case-insensitive)
 */
function searchStudents(query) {
  if (!query) return getStudentsArray();
  const q = query.toString().toLowerCase();
  return getStudentsArray().filter(s => {
    if (!s) return false;
    if ((s.name||'').toLowerCase().includes(q)) return true;
    if ((s.roll||'').toString().toLowerCase().includes(q)) return true;
    if (Array.isArray(s.subjects) && s.subjects.join(' ').toLowerCase().includes(q)) return true;
    return false;
  });
}

/**
 * sortStudentsBy(field, dir='asc', renderCb)
 * field = 'name' | 'roll' | 'marks' | 'attendance'
 * dir = 'asc' | 'desc'
 */
function getStudentMarks(roll) {
  const d = getData();
  return (d.marks && d.marks[roll]) || {};
}
function getStudentAttendance(roll) {
  const d = getData();
  return (d.attendance && d.attendance[roll]) || { total:0, present:0 };
}
function sortStudentsBy(field, dir='asc', renderCb) {
  const students = getStudentsArray();
  const multiplier = dir === 'desc' ? -1 : 1;
  students.sort((a, b) => {
    if (!a) return -1*multiplier;
    if (!b) return 1*multiplier;
    if (field === 'name') {
      return (a.name||'').localeCompare(b.name||'') * multiplier;
    } else if (field === 'roll') {
      return (a.roll||'').toString().localeCompare((b.roll||'').toString()) * multiplier;
    } else if (field === 'marks') {
      const ma = Object.values(getStudentMarks(a.roll || '')).reduce((s,v)=>s+Number(v||0),0);
      const mb = Object.values(getStudentMarks(b.roll || '')).reduce((s,v)=>s+Number(v||0),0);
      return (ma - mb) * multiplier;
    } else if (field === 'attendance') {
      const aa = getStudentAttendance(a.roll || '');
      const ab = getStudentAttendance(b.roll || '');
      const ra = aa.total ? (aa.present/aa.total) : 0;
      const rb = ab.total ? (ab.present/ab.total) : 0;
      return (ra - rb) * multiplier;
    }
    return 0;
  });
  if (typeof renderCb === 'function') renderCb(students);
  return students;
}

/* 3) Chart rendering (Chart.js required)
   - renderMarksChart(canvasId, roll)
   - renderAttendanceChart(canvasId, roll)
*/
function seedSampleAcademicData() {
  const data = getData();
  // if marks/attendance not present, seed minimal demo data for first student
  if (!data.marks || Object.keys(data.marks).length === 0) {
    const s0 = (data.students && data.students[0] && (data.students[0].roll || data.students[0].id)) || 'demo';
    data.marks = {};
    data.marks[s0] = { 'CS-303-T': 78, 'CS-303-P': 82, 'CS-305-T': 69 };
  }
  if (!data.attendance || Object.keys(data.attendance).length === 0) {
    const s0 = (data.students && data.students[0] && (data.students[0].roll || data.students[0].id)) || 'demo';
    data.attendance = {};
    data.attendance[s0] = { total: 40, present: 36 };
  }
  saveData(data);
}

function renderMarksChart(canvasId, roll) {
  if (typeof Chart === 'undefined') {
    console.warn('Chart.js not found. Include Chart.js to render charts.');
    return null;
  }
  seedSampleAcademicData();
  const marks = getStudentMarks(roll || ((getStudentsArray()[0]||{}).roll));
  const labels = Object.keys(marks);
  const values = labels.map(k=>Number(marks[k]||0));
  const el = document.getElementById(canvasId);
  if (!el) { console.warn('Canvas not found:', canvasId); return null; }
  if (el._smsChart) el._smsChart.destroy();
  el._smsChart = new Chart(el.getContext('2d'), {
    type: 'bar',
    data: { labels, datasets: [{ label: 'Marks', data: values }] },
    options: { responsive: true, scales: { y: { beginAtZero: true, max: 100 } } }
  });
  return el._smsChart;
}

function renderAttendanceChart(canvasId, roll) {
  if (typeof Chart === 'undefined') {
    console.warn('Chart.js not found. Include Chart.js to render charts.');
    return null;
  }
  seedSampleAcademicData();
  const att = getStudentAttendance(roll || ((getStudentsArray()[0]||{}).roll));
  const present = Number(att.present||0);
  const absent = Math.max(0, Number(att.total||0) - present);
  const el = document.getElementById(canvasId);
  if (!el) { console.warn('Canvas not found:', canvasId); return null; }
  if (el._smsChart) el._smsChart.destroy();
  el._smsChart = new Chart(el.getContext('2d'), {
    type: 'pie',
    data: { labels: ['Present','Absent'], datasets: [{ data: [present, absent] }] },
    options: { responsive: true }
  });
  return el._smsChart;
}

/* 4) Render Utilities - student list & simple cards */
function renderStudentList(containerId, students) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  students.forEach(s => {
    const card = elt('div','sms-student-card');
    const title = elt('h4','', s.name + ' (' + (s.roll||'') + ')');
    const subj = elt('div','sms-student-subjects','Subjects: ' + ((s.subjects||[]).join(', ')));
    const marksSum = Object.values(getStudentMarks(s.roll||'')).reduce((a,b)=>a+Number(b||0),0);
    const att = getStudentAttendance(s.roll||'');
    const attStr = att.total ? (att.present + '/' + att.total) : 'N/A';
    const meta = elt('div','sms-student-meta','MarksSum: ' + marksSum + ' | Attendance: ' + attStr);
    card.appendChild(title);
    card.appendChild(subj);
    card.appendChild(meta);
    // optional: click to set as current user
    card.style.cursor = 'pointer';
    card.addEventListener('click', ()=>{ setCurrent(s); location.href='student.html'; });
    container.appendChild(card);
  });
}

/* 5) Simple login helper (bind a form) and auto-login fallback */
function attachLoginForm(formId, rollFieldId) {
  const form = document.getElementById(formId);
  if (!form) return;
  form.addEventListener('submit', function(ev){
    ev.preventDefault();
    const roll = (document.getElementById(rollFieldId) || {}).value || '';
    if(!roll) { alert('Enter roll or user id'); return; }
    const data = getData();
    const user = (data.students||[]).find(s => (s.roll||'').toString() === roll.toString() || (s.id||'') === roll.toString());
    if(user){
      setCurrent(user);
      location.href = 'student.html';
    } else {
      const found = (data.students||[]).find(s => s.name.toLowerCase().includes(roll.toLowerCase()));
      if(found){ setCurrent(found); location.href='student.html'; return; }
      alert('User not found. Try roll number or name.');
    }
  });
}
function autoLoginIfNone() {
  try {
    if(!getCurrent()){
      const d = getData();
      if(d.students && d.students.length) {
        setCurrent(d.students[0]);
      }
    }
  } catch(e){}
}

/* Export helpers on SMSV4 */
window.SMSV4 = Object.assign(window.SMSV4 || {}, {
  getData, saveData, getCurrent, setCurrent, logout, findSubject, formatDate, STORAGE_KEY, SESSION_KEY,
  // new features
  isDarkMode, applyDarkModeClass, toggleDarkMode, initDarkMode,
  getStudentsArray, searchStudents, sortStudentsBy,
  renderMarksChart, renderAttendanceChart, renderStudentList,
  attachLoginForm, autoLoginIfNone, seedSampleAcademicData
});

/* ----------------- NEW FEATURES END ----------------- */
