const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const xlsx = require('xlsx');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with updated sınıf.xlsx (8/A)...');

  // 1. Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.qrSession.deleteMany();
  await prisma.violation.deleteMany();
  await prisma.student.deleteMany();
  await prisma.user.deleteMany();
  await prisma.violationType.deleteMany();
  await prisma.systemSetting.deleteMany();

  // 2. Default System Settings
  await prisma.systemSetting.createMany({
    data: [
      { key: 'school_name', value: 'Sivas Mehmet Akif İnan Ortaokulu' },
      { key: 'school_logo_url', value: '/logo.png' },
      { key: 'repeat_violation_threshold', value: '2' },
      { key: 'special_followup_threshold', value: '3' },
      { key: 'qr_validity_seconds', value: '60' },
      { key: 'day_closure_time', value: '17:00' },
    ],
  });

  // 3. Violation Types
  await prisma.violationType.createMany({
    data: [
      { code: 'UPPER_UNIFORM_MISSING', name: 'Üst Forma Eksik', color: '#f59e0b', icon: 'Shirt', sort_order: 1 },
      { code: 'LOWER_UNIFORM_MISSING', name: 'Alt Forma Eksik', color: '#f97316', icon: 'Scissors', sort_order: 2 },
      { code: 'CIVIL_CLOTHES', name: 'Tamamen Sivil / Uygunsuz', color: '#e11d48', icon: 'UserX', sort_order: 3 },
      { code: 'INAPPROPRIATE_CLOTHING', name: 'Kılık-Kıyafet Uygunsuz', color: '#9333ea', icon: 'AlertCircle', sort_order: 4 },
      { code: 'OTHER', name: 'Diğer İhlal', color: '#475569', icon: 'MoreHorizontal', sort_order: 5 },
    ],
  });

  // 4. Users (Admin: idaremai / 767943, Teachers: sivasmai / 767943)
  const adminPassword = await bcrypt.hash('767943', 10);
  const mainTeacherPassword = await bcrypt.hash('767943', 10);
  const teacherPassword = await bcrypt.hash('123456', 10);

  const admin = await prisma.user.create({
    data: {
      username: 'idaremai',
      name: 'İdare',
      surname: 'Yönetici',
      role: 'ADMIN',
      password_hash: adminPassword,
      active: true,
    },
  });

  const mainTeacher = await prisma.user.create({
    data: {
      username: 'sivasmai',
      name: 'Sivas',
      surname: 'Nöbetçi Öğretmen',
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
    const user = await prisma.user.create({
      data: {
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

  // 5. Read 8A sınıfı.xlsx or sınıf.xlsx
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

    const student = await prisma.student.create({
      data: {
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

  console.log(`Successfully created ${createdStudents.length} real students from ${path.basename(excelPath)} (8/A)!`);

  // 6. Sample Violations for the real students
  const now = new Date();
  const dayOfWeek = now.getDay();
  const distanceToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const mondayObj = new Date(now);
  mondayObj.setDate(now.getDate() - distanceToMonday);

  const dates = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(mondayObj);
    d.setDate(mondayObj.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }

  const violationTypes = [
    'UPPER_UNIFORM_MISSING',
    'LOWER_UNIFORM_MISSING',
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

  let violationCount = 0;

  // Let's create realistic violations for students from sınıf.xlsx
  if (createdStudents.length >= 3) {
    // Student 0 (AHMET BAŞER - 290)
    for (let dayIdx = 0; dayIdx < 3; dayIdx++) {
      await prisma.violation.create({
        data: {
          student_id: createdStudents[0].id,
          teacher_id: createdTeachers[dayIdx % createdTeachers.length].id,
          duty_teacher_name: 'Sivas Nöbetçi Öğretmen',
          duty_location: 'Ana Giriş Kapısı',
          type: violationTypes[dayIdx % 3],
          note: sampleNotes[dayIdx % sampleNotes.length],
          date: dates[dayIdx],
          time: sampleTimes[dayIdx],
          client_transaction_id: `seed-sinif-${createdStudents[0].id}-${dayIdx}`,
        },
      });
      violationCount++;
    }

    // Student 1 (ELİF NUR ÇAŞUT - 363)
    for (let dayIdx = 0; dayIdx < 2; dayIdx++) {
      await prisma.violation.create({
        data: {
          student_id: createdStudents[1].id,
          teacher_id: createdTeachers[(dayIdx + 1) % createdTeachers.length].id,
          duty_teacher_name: 'Sivas Nöbetçi Öğretmen',
          duty_location: 'Zemin Kat Koridor',
          type: violationTypes[1],
          note: sampleNotes[1],
          date: dates[dayIdx],
          time: sampleTimes[dayIdx + 1],
          client_transaction_id: `seed-sinif-${createdStudents[1].id}-${dayIdx}`,
        },
      });
      violationCount++;
    }

    // Student 2 (ZEYNEP KAYA - 475)
    await prisma.violation.create({
      data: {
        student_id: createdStudents[2].id,
        teacher_id: createdTeachers[0].id,
        duty_teacher_name: 'Sivas Nöbetçi Öğretmen',
        duty_location: 'Ana Giriş Kapısı',
        type: 'CIVIL_CLOTHES',
        note: 'Sivil sweatshirt giyilmiş.',
        date: dates[0],
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
