const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const xlsx = require('xlsx');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('Synchronizing database schema and records safely...');

  // 1. Safe System Settings (upsert)
  const defaultSettings = [
    { key: 'school_name', value: 'Sivas Mehmet Akif İnan Ortaokulu' },
    { key: 'school_logo_url', value: '/logo.png' },
    { key: 'repeat_violation_threshold', value: '2' },
    { key: 'special_followup_threshold', value: '3' },
    { key: 'qr_validity_seconds', value: '60' },
    { key: 'day_closure_time', value: '17:00' },
  ];
  for (const s of defaultSettings) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
  }

  // 2. Safe Violation Types (upsert)
  const defaultTypes = [
    { code: 'UPPER_UNIFORM_MISSING', name: 'Üst Forma Eksik', color: '#f59e0b', icon: 'Shirt', sort_order: 1 },
    { code: 'LOWER_UNIFORM_MISSING', name: 'Alt Forma Eksik', color: '#f97316', icon: 'Scissors', sort_order: 2 },
    { code: 'PHYSICAL_EDUCATION_UNIFORM', name: 'Beden Eğitimi Eşofman İhlali', color: '#4f46e5', icon: 'Activity', sort_order: 3 },
    { code: 'CIVIL_CLOTHES', name: 'Tamamen Sivil / Uygunsuz', color: '#e11d48', icon: 'UserX', sort_order: 4 },
    { code: 'INAPPROPRIATE_CLOTHING', name: 'Kılık-Kıyafet Uygunsuz', color: '#9333ea', icon: 'AlertCircle', sort_order: 5 },
    { code: 'OTHER', name: 'Diğer İhlal', color: '#475569', icon: 'MoreHorizontal', sort_order: 6 },
  ];
  for (const t of defaultTypes) {
    await prisma.violationType.upsert({
      where: { code: t.code },
      update: { name: t.name, color: t.color, icon: t.icon, sort_order: t.sort_order },
      create: t,
    });
  }

  // 3. Safe Users (Admin: idaremai / 767943, Teachers: sivasmai / 767943)
  const adminPassword = await bcrypt.hash('767943', 10);
  const mainTeacherPassword = await bcrypt.hash('767943', 10);
  const teacherPassword = await bcrypt.hash('123456', 10);

  const admin = await prisma.user.upsert({
    where: { username: 'idaremai' },
    update: { active: true },
    create: {
      username: 'idaremai',
      name: 'İdare',
      surname: 'Yönetici',
      role: 'ADMIN',
      password_hash: adminPassword,
      active: true,
    },
  });

  const mainTeacher = await prisma.user.upsert({
    where: { username: 'sivasmai' },
    update: { active: true },
    create: {
      username: 'sivasmai',
      name: 'Nöbetçi',
      surname: 'Öğretmen',
      role: 'TEACHER',
      password_hash: mainTeacherPassword,
      active: true,
    },
  });

  const otherTeachers = [
    { username: 'ogretmen1', name: 'Ahmet', surname: 'Kaya', role: 'TEACHER' },
    { username: 'ogretmen2', name: 'Zeynep', surname: 'Demir', role: 'TEACHER' },
    { username: 'ogretmen3', name: 'Mehmet', surname: 'Çelik', role: 'TEACHER' },
    { username: 'ogretmen4', name: 'Elif', surname: 'Yıldız', role: 'TEACHER' },
  ];

  const createdTeachers = [mainTeacher];
  for (const t of otherTeachers) {
    const user = await prisma.user.upsert({
      where: { username: t.username },
      update: { active: true },
      create: {
        username: t.username,
        name: t.name,
        surname: t.surname,
        role: t.role,
        password_hash: teacherPassword,
        active: true,
      },
    });
    createdTeachers.push(user);
  }

  // 4. Read and sync 8A sınıfı.xlsx or sınıf.xlsx
  const fs = require('fs');
  let excelPath = path.join(__dirname, '../8A sınıfı.xlsx');
  if (!fs.existsSync(excelPath)) {
    excelPath = path.join(__dirname, '../sınıf.xlsx');
  }

  const workbook = xlsx.readFile(excelPath);
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

  console.log(`Processing ${rawRows.length} rows from ${path.basename(excelPath)}...`);

  const createdStudents = [];
  const seenNos = new Set();

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || row.length < 2) continue;

    // Detect if this is the header row
    const rowFirstCell = String(row[0] || '').trim().toLowerCase();
    if (rowFirstCell.includes('sınıf') || rowFirstCell.includes('sinif') || rowFirstCell.includes('sıra') || rowFirstCell === 'no') {
      continue;
    }

    let classStr = String(row[0] || '8/A').trim();
    let noStr = '';
    let nameStr = '';

    // If format is [ "8/A", 1, "Ahmet", "Yılmaz" ]
    if (row.length >= 4 && /^\d+$/.test(String(row[1] || '').trim()) && typeof row[2] === 'string' && typeof row[3] === 'string') {
      noStr = String(row[1]).trim();
      nameStr = (String(row[2]).trim() + ' ' + String(row[3]).trim()).trim();
    }
    // If format is [ "8/A", 1, "AHMET BAŞER", 290 ]
    else if (typeof row[3] === 'number' && Number.isInteger(row[3]) && typeof row[2] === 'string') {
      noStr = String(row[3]).trim();
      nameStr = String(row[2]).trim();
    }
    // If format is [ "8/A", 290, "AHMET BAŞER" ]
    else if (/^\d+$/.test(String(row[1] || '').trim()) && typeof row[2] === 'string') {
      noStr = String(row[1]).trim();
      nameStr = String(row[2]).trim();
    }

    if (!noStr || !nameStr || !/^\d+$/.test(noStr) || seenNos.has(noStr)) {
      continue;
    }

    // Parse class and branch (8/A)
    let grade = '8';
    let branch = 'A';

    if (classStr) {
      const match = classStr.match(/^(\d+)[-/ ]?([A-Za-zĞÜŞİÖÇğüşıöç]?)$/);
      if (match) {
        grade = match[1] || '8';
        branch = (match[2] || 'A').toUpperCase();
      }
    }

    seenNos.add(noStr);
    const avatarSeed = encodeURIComponent(nameStr.toLowerCase().replace(/\s+/g, '-'));

    // Infer gender
    const femaleKeywords = [
      'AYŞE', 'FATMA', 'EMİNE', 'ZEYNEP', 'HATİCE', 'ELİF', 'MERVE', 'BÜŞRA',
      'SELİN', 'GAMZE', 'TUĞBA', 'KÜBRA', 'EBRU', 'YASEMİN', 'ESRA', 'DUYGU',
      'ÖZLEM', 'SEDA', 'RABİA', 'HİLAL', 'ASLI', 'GİZEM', 'MELİKE', 'PELİN',
      'SİMGE', 'İREM', 'DAMLA', 'ECE', 'EZGİ', 'DERYA', 'BURCU', 'AYLİN',
      'HANDE', 'ŞEVVAL', 'BEYZA', 'ALEYNA', 'CEREN', 'SENA', 'NİHAL', 'SİBEL',
      'FİLİZ', 'NERMİN', 'SEMRA', 'RÜYA', 'BEGÜM', 'SELEN', 'NİSA', 'NUR',
      'EBRAR', 'ECRİN', 'ŞERİFE', 'İLAYDA', 'HAYRUNNİSA', 'NİSANUR', 'RÜMEYSA', 'ZEHRANUR'
    ];
    const isFemale = femaleKeywords.some((kw) => nameStr.toLocaleUpperCase('tr-TR').includes(kw));

    const student = await prisma.student.upsert({
      where: { ogrenci_no: noStr },
      update: {
        ad_soyad: nameStr,
        sinif: grade,
        sube: branch,
        aktif: true,
      },
      create: {
        ogrenci_no: noStr,
        ad_soyad: nameStr,
        sinif: grade,
        sube: branch,
        cinsiyet: isFemale ? 'KIZ' : 'ERKEK',
        veli_telefon: `05${Math.floor(300000000 + Math.random() * 699999999)}`,
        profil_resmi_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${avatarSeed}`,
        aktif: true,
      },
    });
    createdStudents.push(student);
  }

  console.log(`Successfully synced ${createdStudents.length} students from ${path.basename(excelPath)} (8/A)!`);

  // 5. Sample Violations (Only create if database has NO existing violations, protecting user records)
  const existingViolationCount = await prisma.violation.count();
  let violationCount = existingViolationCount;

  if (existingViolationCount === 0 && createdStudents.length >= 3) {
    const now = new Date();
    const istanbulFormatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Istanbul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const todayStr = istanbulFormatter.format(now); // YYYY-MM-DD

    const [curY, curM, curD] = todayStr.split('-').map(Number);
    const curDateObj = new Date(curY, curM - 1, curD);
    const dayOfWeek = curDateObj.getDay();
    const distanceToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const dates = [];
    for (let i = 0; i <= distanceToMonday; i++) {
      const d = new Date(curY, curM - 1, curD - distanceToMonday + i);
      const yStr = d.getFullYear();
      const mStr = String(d.getMonth() + 1).padStart(2, '0');
      const dStr = String(d.getDate()).padStart(2, '0');
      const formatted = `${yStr}-${mStr}-${dStr}`;
      if (formatted <= todayStr) {
        dates.push(formatted);
      }
    }

    if (!dates.includes(todayStr)) {
      dates.push(todayStr);
    }

    const violationTypes = [
      'UPPER_UNIFORM_MISSING',
      'LOWER_UNIFORM_MISSING',
      'PHYSICAL_EDUCATION_UNIFORM',
      'CIVIL_CLOTHES',
      'INAPPROPRIATE_CLOTHING',
      'OTHER'
    ];

    const sampleNotes = [
      'Mont ile okul forması kapatılmış.',
      'Kapüşonlu sivil sweatshirt giyilmiş.',
      'Kot pantolon ve sivil tişört.',
      'Beden eğitimi dersi olmadığı halde eşofman giyilmiş.',
      'Okul arması olmayan sivil polar hırka.',
      '',
      null,
    ];

    const sampleTimes = ['08:15', '08:24', '08:35', '08:42', '08:55', '09:10', '10:05'];

    // Student 0 (Ahmet Yılmaz)
    const ahmetDates = dates.length > 1 ? [dates[0], dates[dates.length - 1]] : [dates[0]];
    for (let i = 0; i < ahmetDates.length; i++) {
      await prisma.violation.create({
        data: {
          student_id: createdStudents[0].id,
          teacher_id: createdTeachers[i % createdTeachers.length].id,
          duty_teacher_name: 'Nöbetçi Öğretmen',
          duty_location: 'Ana Giriş Kapısı',
          type: violationTypes[i % 3],
          note: sampleNotes[i % sampleNotes.length],
          date: ahmetDates[i],
          time: sampleTimes[i],
          client_transaction_id: `seed-sinif-${createdStudents[0].id}-${i}`,
        },
      });
      violationCount++;
    }

    // Student 1 (Mehmet Demir)
    const mehmetDates = dates.length > 1 ? [dates[0], dates[dates.length - 1]] : [dates[0]];
    for (let i = 0; i < mehmetDates.length; i++) {
      await prisma.violation.create({
        data: {
          student_id: createdStudents[1].id,
          teacher_id: createdTeachers[(i + 1) % createdTeachers.length].id,
          duty_teacher_name: 'Nöbetçi Öğretmen',
          duty_location: 'Zemin Kat Koridor',
          type: violationTypes[1],
          note: sampleNotes[1],
          date: mehmetDates[i],
          time: sampleTimes[i + 1],
          client_transaction_id: `seed-sinif-${createdStudents[1].id}-${i}`,
        },
      });
      violationCount++;
    }

    // Student 2 (Mustafa Kaya)
    await prisma.violation.create({
      data: {
        student_id: createdStudents[2].id,
        teacher_id: createdTeachers[0].id,
        duty_teacher_name: 'Nöbetçi Öğretmen',
        duty_location: 'Ana Giriş Kapısı',
        type: 'CIVIL_CLOTHES',
        note: 'Sivil sweatshirt giyilmiş.',
        date: todayStr,
        time: '08:30',
        client_transaction_id: `seed-sinif-${createdStudents[2].id}-0`,
      },
    });
    violationCount++;
  }

  // Initial Audit Log
  await prisma.auditLog.create({
    data: {
      action: 'SYSTEM_INITIALIZED',
      entity_type: 'SETTING',
      entity_id: 'init',
      new_value: JSON.stringify({ message: 'Güncellenen sınıf.xlsx (8/A) veritabanına aktarıldı.' }),
      ip_address: '127.0.0.1',
      user_agent: 'Node/SeedScript',
    },
  });

  console.log(`Seed completed successfully!`);
  console.log(`Total students in DB: ${createdStudents.length}`);
  console.log(`Total sample violations: ${violationCount}`);
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
