# Okul Üniforma Kontrol Sistemi (ÜniKontrol)

**ÜniKontrol**, okullarda nöbetçi öğretmenlerin 5-10 saniye içinde öğrenci arayıp kılık-kıyafet/üniforma ihlali kaydedebildiği, yönetimin ise kayıtları anlık analiz edebildiği, filtreleyebildiği ve raporlayabildiği (PDF, Excel, CSV), mobil öncelikli, modern, PWA/IndexedDB offline destekli ve dinamik QR girişli tam kapsamlı bir okul yönetim sistemidir.

---

## 🚀 Öne Çıkan Özellikler

1. **Ultra-Hızlı Mobil Öğretmen Deneyimi:**
   - Sayfa açıldığında otomatik odaklı numeric tuş takımı (`inputmode="numeric"`).
   - Anlık debounce ile öğrenci numarası veya isimden canlı arama.
   - Tek dokunuşla çalışan 4 büyük ihlal butonu:
     - 🟡 **ÜST FORMA EKSİK**
     - 🟠 **ALT FORMA EKSİK**
     - 🔴 **TAMAMEN SİVİL / UYGUNSUZ**
     - ⚫ **DİĞER İHLAL**
   - 5 saniyelik **Geri Al (Undo)** bildirim desteği.
   - Aynı gün mükerrer kayıt kontrolü ve uyarı mekanizması.
   - Her işlemden sonra anında bir sonraki öğrenci için otomatik sıfırlama.

2. **Dinamik & Güvenli QR Kod Girişi:**
   - Masaüstü veya tabletten 60 saniyelik tek kullanımlık şifreli QR kod üretimi.
   - Öğretmenin cep telefonu kamerası ile okuttuğu anda şifresiz hızlı oturum açma (`/mobile-login?token=...`).

3. **PWA & Offline Senkronizasyon:**
   - İnternet bağlantısı kesildiğinde dahi IndexedDB önbelleğindeki öğrencileri arama ve ihlal kaydetme.
   - `client_transaction_id` ile mükerrerliği önleyen kuyruk yapısı.
   - Bağlantı sağlandığında arka planda otomatik senkronizasyon.
   - Canlı durum rozeti: 🟢 Çevrimiçi, 🟠 Senkronizasyon Bekliyor, 🔴 Çevrimdışı.

4. **Kapsamlı Yönetici Paneli & Analitikler:**
   - **Dashboard:** Günlük ve haftalık KPI kartları, Recharts günlük trend, ihlal türleri donut grafiği ve sınıf dağılım grafiği.
   - **Özel Takip Listesi:** Haftalık 2+ ve 3+ ihlali olan öğrencilerin yönetsel takibi ve 🔴 Tekrarlayan İhlal rozeti.
   - **Haftalık Takvim:** Pazartesi - Cuma sekme yapısı ve gün bazlı ihlal kartları.
   - **Raporlama & Çoklu Format Dışa Aktarma:** PDF (okul başlıklı & tablolu), Excel (XLSX) ve CSV formatlarında anında dışa aktarma.
   - **Toplu İçe Aktarma (CSV / Excel):** Sürükle-bırak yükleme, Zod validasyonu, canlı ilerleme çubuğu, hatalı satır özeti ve Hata CSV'si indirme.
   - **Öğrenci & Öğretmen Yönetimi:** Öğrenci profili, kronolojik ihlal geçmişi zaman çizelgesi, soft-delete ve şifre sıfırlama.
   - **Audit Log & Güvenlik:** Tüm kritik işlemler için IP, kullanıcı, eski/yeni JSON değer kaydı.
   - **Günü Kapat:** Gün sonu kapanışı ve özet raporlama.

---

## 🛠️ Teknoloji Yığını

- **Frontend & Framework:** Next.js (App Router), React 18, TypeScript, Tailwind CSS
- **Veritabanı & ORM:** SQLite / PostgreSQL, Prisma ORM
- **State & Offline Storage:** Zustand, TanStack React Query, IndexedDB
- **Grafikler & İkonlar:** Recharts, Lucide React
- **Export & Import:** jsPDF, jspdf-autotable, SheetJS (xlsx), ExcelJS
- **Güvenlik & Doğrulama:** JWT (`jose`), bcryptjs, Zod, QRCode
- **Bildirimler:** Sonner Toast

---

## 💻 Kurulum & Çalıştırma

### 1. Bağımlılıkları Yükleyin:
```bash
npm install
```

### 2. Ortam Değişkenleri (`.env`):
```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="unikontrol-secret-key-super-secure-production-ready-2026"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_USE_MOCK_API="false"
```

### 3. Veritabanını Oluşturun ve Şemayı Eşitleyin:
```bash
npx prisma db push
```

### 4. Örnek Verileri (Seed Data) Yükleyin:
```bash
npm run prisma:seed
```
*Bu komut 1 Yönetici, 5 Nöbetçi Öğretmen, tüm sınıf seviyelerinde 120 Öğrenci ve 50'den fazla gerçekçi ihlal kaydı oluşturur.*

### 5. Geliştirme Sunucusunu Başlatın:
```bash
npm run dev
```
Uygulama `http://localhost:3000` adresinde çalışacaktır.

---

## 👥 Demo Giriş Bilgileri

| Rol | Kullanıcı Adı | Şifre | Açıklama |
|---|---|---|---|
| **Yönetici (Admin)** | `rotali` | `571632` | Tüm dashboard, raporlar, import ve ayar yetkileri |
| **Nöbetçi Öğretmen** | `sivasmai` | `767943` | Ultra-hızlı arama ve ihlal giriş ekranı |
| **Nöbetçi Öğretmen 2** | `ogretmen1` | `123456` | Nöbetçi öğretmen hesabı |

---

## 🧪 Testleri Çalıştırma

```bash
npm run test
```
Vitest ile öğrenci arama, tekrarlayan ihlal hesabı, CSV validasyonu ve RBAC yetki testleri koşturulur.

---

## 📦 Production Build

```bash
npm run build
npm start
```
