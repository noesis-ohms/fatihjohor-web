# Klinik Al-Fatih Johor — Web Improvement Project Roadmap

> **Project:** Penambahbaikan web `fatihjohor-web` (static site, Netlify)
> **Disusun oleh:** Agent Ali (web/SEO teknikal) + Robert (strategi bisnes)
> **Prinsip teras:** **KEKALKAN LAYOUT SEDIA ADA.** Semua kerja pada kandungan, funnel, tracking, housekeeping & SEO — tiada ubah reka bentuk visual.
> **Repo:** https://github.com/noesis-ohms/fatihjohor-web · Local: `/opt/data/Website FatihJohor`

---

## Falsafah Project

- **Layout = aset.** 74 halaman, 29 service pages, 35 panel korporat — struktur sihat. Jangan sentuh reka bentuk.
- **Ukur, bukan teka.** Setiap perubahan wajib punya metrik: booking masuk, no-show, review, panel signed.
- **Kos rendah, nilai tinggi.** Keutamaan pada pembaikan sifar-kos (funnel, tracking, SEO) sebelum apa-apa kerja besar.

---

## Fasa & Timeline (berperingkat, boleh eksekusi satu-satu)

### FASA 0 — Housekeeping Kritikal (hari ini, ~jam)
**Matlamat: selamatkan deploy + asas kukuh.** Tiada kerja visual.

| # | Tugasan | Kategori | Detail lengkap |
|---|---|---|---|
| 0.1 | **Fix `netlify.toml` publish path** | Bug | Sekarang `publish = "/Users/farhanbinzulkifli/Downloads/klinik-phase38-booking"` (path Mac) — ini **memusnahkan deploy Netlify**. Tukar ke `.` atau folder build sebenar. **SELESAIKAN DULU.** |
| 0.2 | Sitemap bersih | SEO | `sitemap.xml` kini 59 URL — pastikan hanya URL live, buang entri yang redirect 301 (hair-loss→mens-health, fomema→servis, dll). SEO tak bocor. |
| 0.3 | `robots.txt` + canonical | SEO | Sahkan robots.txt benarkan indexing semua service page; tambah `<link rel="canonical">` pada setiap page. |
| 0.4 | Login asas Dash | Dash | Cek `admin.html` & booking pages untuk asas auth sebelum deploy awam. |

**Output F0:** Deploy berjaya, sitemap bersih, canonical OK.

---

### FASA 1 — Booking Funnel & Konversi (Minggu 1, ~2-3 hari)
**Matlamat: tutup lubang funnel, tingkatkan kadar real-booking, walaupun layout kekal.**

| # | Tugasan | Kategori | Detail lengkap |
|---|---|---|---|
| 1.1 | **Confirmation loop booking** | Funnel | Borang submit ke Supabase — pastikan ada (a) auto-email/WhatsApp ke klinik + patient bila submit, ATAU (b) redirect ke `appointment-review.html` dengan no. WhatsApp untuk pengesahan segera. Tanpa ini, tempahan senyap. |
| 1.2 | Anti no-show | Funnel | Tambah notis 24 jam sebelum appointment (trigger/email/WhatsApp). No-show GP 15-25%; recover 1% = RM jana terus (+/- RM4,500/tahun pada 1,000 appt & RM45 avg). |
| 1.3 | FAQ atas form | Conversion | Letak 3 soalan paling ditanya ATAS borang booking: (bayaran kad? panel mana diterima? terima Medicare/MADANI?). Tinggi conversion, tanpa ubah layout. |
| 1.4 | Tracking `source` | Tracking | Tambah hidden field `source` pada form booking supaya tahu halaman mana bawa paling banyak tempahan. |
| 1.5 | CTA jelas pada OH & panel | B2B | Halaman `occupational-health/` + 35 panel: tambah CTA "Hubungi untuk quotation" + email/WhatsApp dedicated (bukan borang je). |

**Output F1:** Setiap booking ada confirmation loop, no-show menurun, halaman sumber tempahan diketahui.

---

### FASA 2 — Aduan, Review & Retention (Minggu 2, ~2 hari)
**Matlamat: jadikan laman mesin maklum balas untuk perbaiki SOP klinik.**

| # | Tugasan | Kategori | Detail lengkap |
|---|---|---|---|
| 2.1 | `appointment-review.html` jadi pusat aduan | Retention | Guna untuk (a) rating + ulasan Google (link terus ke Google review), (b) capture defect quality (queue time, harga, parking, doktor). Data = asas perbaiki SOP. |
| 2.2 | SOP review WhatsApp automatik | Retention | Selepas appointment selesai → mesej auto 2-3 hari kemudian → link review. Jangan tanya setiap lawatan. |
| 2.3 | Laporan berkala | Retention | Agregat aduan (bulanan) untuk operasi + improvement. Retention 5% naik = net income naik 25-95%. |

**Output F2:** Laluan review + aduan berfungsi, data kualiti mula masuk.

---

### FASA 3 — SEO Berterusan & Relevan (Minggu 3-4, ~4-5 hari)
**Matlamat: kekal relevan dengan SEO yang disarankan Robert — local & panel.**

| # | Tugasan | Kategori | Detail lengkap |
|---|---|---|---|
| 3.1 | Local SEO (NAP) | SEO | Pastikan Name-Address-Phone konsisten merentas semua page + Google Business Profile. Fokus keyword local Johor: "klinik Skudai", "klinik Kempas", "panel TNB UTM". |
| 3.2 | Schema.org JSON-LD | SEO | Tambah structured data: `MedicalClinic`, `LocalBusiness`, `Physician`, `Service` pada halaman berkaitan — naikkan rich snippet. |
| 3.3 | Meta title/description unik | SEO | Pastikan 29 service page ada unique, keyword-targeted title & meta description. |
| 3.4 | Panel korporat SEO B2B | SEO | Halaman panel (35): target HR/occupational officer — "senarai panel diterima", "kalkulator panel". Recurring corporate revenue. |
| 3.5 | Blog content refresh | SEO | `blog-kesihatan/` (4 artikel) — sambung dengan keyword yang ada traction; link internal ke service page. |
| 3.6 | Performance (Core Web Vitals) | SEO | Lazy-load imej, `webp`, minify CSS/JS, cache. LCP/CLS < ambang Google. |

**Output F3:** Local SEO kukuh, rich snippet, panel B2B nampak, performance laju.

---

### FASA 4 — Tracking, Analitik & Iterasi Berterusan (Ongoing)
**Matlamat: ukur & ulang setiap bulan.**

| # | Tugasan | Kategori | Detail lengkap |
|---|---|---|---|
| 4.1 | Event tracking semua CTA | Tracking | Netlify Analytics event pada setiap Tempah, WhatsApp, klik panel. |
| 4.2 | Dashboard metrik | Tracking | Bilangan appointment, no-show, review, panel signed — bukan page count. |
| 4.3 | Ulasan bulanan | Iterasi | Robert + Agent Ali rujuk data → cadang iterasi seterusnya. |

---

## Keutamaan Eksekusi (susun dari mula)

1. **F0.1 fix netlify.toml publish path** — deploy rosak, sifar kos. SEGERA.
2. F1.1/F1.4 confirmation loop + tracking source — nilai funnel tertinggi.
3. F2.1/F2.2 review + aduan — retention.
4. F3.2/F3.3 schema + unique meta — SEO.
5. F4 tracking berterusan.

---

## Metrik Kejayaan (bukan page count — nilai sebenar)

- ✅ Deploy berjaya (F0)
- ✅ % tempahan dengan confirmation
- ✅ No-show % menurun
- ✅ Bilangan Google review / aduan diurus
- ✅ Bilangan panel korporat signed
- ✅ Local keyword ranking naik

---

*Dokumen hidup — dikemaskini selepas setiap fasa selesai. Dibina untuk perbincangan berterusan Agent Ali + Robert.*
