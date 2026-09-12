const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

const prisma = new PrismaClient();

async function main() {
  console.log('Synchronizing database from MAİ SINIF.xls...');

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

  await prisma.user.upsert({
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

  await prisma.user.upsert({
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

  for (const t of otherTeachers) {
    await prisma.user.upsert({
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
  }

  // 4. Find Excel file: MAİ SINIF.xls or 8A sınıfı.xlsx or sınıf.xlsx
  let excelPath = path.join(__dirname, '../MAİ SINIF.xls');
  if (!fs.existsSync(excelPath)) {
    excelPath = path.join(__dirname, '../8A sınıfı.xlsx');
  }
  if (!fs.existsSync(excelPath)) {
    excelPath = path.join(__dirname, '../sınıf.xlsx');
  }

  const workbook = xlsx.readFile(excelPath);
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

  console.log(`Processing ${rawRows.length} rows from ${path.basename(excelPath)}...`);

  // Parse header to find column indices
  let headerIndex = -1;
  let noCol = -1;
  let sinifCol = -1;
  let adiCol = -1;
  let soyadiCol = -1;

  for (let i = 0; i < Math.min(5, rawRows.length); i++) {
    const row = rawRows[i];
    if (!Array.isArray(row)) continue;
    for (let c = 0; c < row.length; c++) {
      const cell = String(row[c] || '').trim().toLowerCase();
      if (cell.includes('öğrenci no') || cell === 'no' || cell === 'ogrenci no') noCol = c;
      if (cell.includes('sınıf') || cell.includes('sinif')) sinifCol = c;
      if (cell === 'adı' || cell === 'adi' || cell === 'ad') adiCol = c;
      if (cell === 'soyadı' || cell === 'soyadi' || cell === 'soyad') soyadiCol = c;
    }
    if (noCol !== -1 && (sinifCol !== -1 || adiCol !== -1)) {
      headerIndex = i;
      break;
    }
  }

  const femaleKeywords = [
    'AYŞE', 'FATMA', 'EMİNE', 'ZEYNEP', 'HATİCE', 'ELİF', 'MERVE', 'BÜŞRA',
    'SELİN', 'GAMZE', 'TUĞBA', 'KÜBRA', 'EBRU', 'YASEMİN', 'ESRA', 'DUYGU',
    'ÖZLEM', 'SEDA', 'RABİA', 'HİLAL', 'ASLI', 'GİZEM', 'MELİKE', 'PELİN',
    'SİMGE', 'İREM', 'DAMLA', 'ECE', 'EZGİ', 'DERYA', 'BURCU', 'AYLİN',
    'HANDE', 'ŞEVVAL', 'BEYZA', 'ALEYNA', 'CEREN', 'SENA', 'NİHAL', 'SİBEL',
    'FİLİZ', 'NERMİN', 'SEMRA', 'RÜYA', 'BEGÜM', 'SELEN', 'NİSA', 'NUR',
    'EBRAR', 'ECRİN', 'ŞERİFE', 'İLAYDA', 'HAYRUNNİSA', 'NİSANUR', 'RÜMEYSA',
    'ZEHRANUR', 'ZEHRA', 'SAHRA', 'AZRA', 'YAĞMUR', 'HİRANUR', 'ERVA', 'BELİNAY',
    'MEDİNE', 'BERRA', 'GÜL', 'SUDENAZ', 'DEFNE', 'ASYA', 'DURU', 'NEHİR'
  ];

  const seenNos = new Set();
  const validStudents = [];

  const startRow = headerIndex >= 0 ? headerIndex + 1 : 0;
  for (let i = startRow; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || row.length === 0) continue;

    let noStr = '';
    let sinifStr = '';
    let adStr = '';
    let soyadStr = '';

    if (noCol !== -1 && adiCol !== -1 && soyadiCol !== -1) {
      noStr = String(row[noCol] || '').trim();
      sinifStr = String(row[sinifCol] || '').trim();
      adStr = String(row[adiCol] || '').trim();
      soyadStr = String(row[soyadiCol] || '').trim();
    } else {
      // Fallback format heuristics
      if (row.length >= 4) {
        noStr = String(row[0] || '').trim();
        sinifStr = String(row[1] || '').trim();
        adStr = String(row[2] || '').trim();
        soyadStr = String(row[3] || '').trim();
      }
    }

    if (!noStr || !/^\d+$/.test(noStr)) continue;
    if (seenNos.has(noStr)) continue;

    const adSoyad = (adStr + ' ' + soyadStr).trim();
    if (!adSoyad) continue;

    let grade = '5';
    let branch = 'A';
    if (sinifStr.includes('/')) {
      const parts = sinifStr.split('/');
      grade = parts[0]?.trim() || '5';
      branch = parts[1]?.trim().toUpperCase() || 'A';
    } else {
      const match = sinifStr.match(/^(\d+)[-/ ]?([A-Za-zĞÜŞİÖÇğüşıöç]?)$/);
      if (match) {
        grade = match[1] || '5';
        branch = (match[2] || 'A').toUpperCase();
      }
    }

    seenNos.add(noStr);
    const isFemale = femaleKeywords.some((kw) => adSoyad.toLocaleUpperCase('tr-TR').includes(kw));
    const avatarSeed = encodeURIComponent(adSoyad.toLowerCase().replace(/\s+/g, '-'));

    validStudents.push({
      ogrenci_no: noStr,
      ad_soyad: adSoyad,
      sinif: grade,
      sube: branch,
      cinsiyet: isFemale ? 'KIZ' : 'ERKEK',
      veli_telefon: `05${Math.floor(300000000 + Math.random() * 699999999)}`,
      profil_resmi_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${avatarSeed}`,
      aktif: true,
    });
  }

  console.log(`Parsed ${validStudents.length} valid students from file.`);

  // Upsert all valid students
  for (const st of validStudents) {
    await prisma.student.upsert({
      where: { ogrenci_no: st.ogrenci_no },
      update: {
        ad_soyad: st.ad_soyad,
        sinif: st.sinif,
        sube: st.sube,
        cinsiyet: st.cinsiyet,
        aktif: true,
      },
      create: st,
    });
  }

  // Deactivate students that are not in MAİ SINIF
  await prisma.student.updateMany({
    where: {
      ogrenci_no: {
        notIn: Array.from(seenNos),
      },
    },
    data: {
      aktif: false,
    },
  });

  // User requested: "Önceki kayıtları sil" -> clear previous violations & logs
  await prisma.violation.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.qrSession.deleteMany();

  // Initial Clean Audit Log
  await prisma.auditLog.create({
    data: {
      action: 'SYSTEM_INITIALIZED',
      entity_type: 'STUDENT',
      entity_id: 'mai_sinif_sync',
      new_value: JSON.stringify({ message: `${validStudents.length} öğrenci MAİ SINIF dosyasından aktarıldı ve önceki ihlal kayıtları temizlendi.` }),
      ip_address: '127.0.0.1',
      user_agent: 'Node/SeedScript',
    },
  });

  const totalInDb = await prisma.student.count({ where: { aktif: true } });
  const totalViolations = await prisma.violation.count();

  console.log('==============================================');
  console.log(`✅ MAİ SINIF Senkronizasyonu Tamamlandı!`);
  console.log(`Aktif Öğrenci Sayısı: ${totalInDb}`);
  console.log(`Mevcut İhlal Kayıtları: ${totalViolations} (Temizlendi)`);
  console.log('==============================================');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
