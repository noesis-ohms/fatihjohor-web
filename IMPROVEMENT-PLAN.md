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
| 0.2 | Sitemap + canonical host | SEO | Sitemap ada 58 URL live; semua URL map ke fail. Sitemap dan `robots.txt` kini guna apex `klinikalfatihjohor.com`, selari dengan canonical dan redirect. |
| 0.3 | `robots.txt` + canonical | SEO | Robots membenarkan crawl; semak canonical supaya setiap halaman indeks guna host dan URL yang sepadan. `og-home.html` ialah template capture noindex. |
| 0.4 | Login asas Dash | Dash | Cek `admin.html` & booking pages untuk asas auth sebelum deploy awam. |

**Output F0:** Deploy berjaya, sitemap bersih, canonical OK.

---

### FASA 1 — Contact Conversion (Minggu 1, ~1-2 hari)
**Matlamat: jadikan call/WhatsApp sebagai tindakan utama; tiada automasi booking/backend. Layout kekal.**

| # | Tugasan | Kategori | Detail lengkap |
|---|---|---|---|
| 1.1 | CTA panggilan | Conversion | Audit page utama, service, panel dan OH: tambah/baiki `tel:` link pada CTA sedia ada sahaja. Pastikan nombor tepat ikut cawangan; jangan tambah CTA berulang. |
| 1.2 | WhatsApp ikut cawangan | Conversion | Pastikan setiap CTA WhatsApp membawa ke nombor cawangan yang betul (Teratai vs Tropika), dengan mesej awal yang ringkas dan relevan. |
| 1.3 | Contact consistency | Local SEO | Semak NAP (nama/alamat/telefon) pada halaman cawangan dan schema; banding dengan Google Business Profile rasmi sebelum ubah fakta. |

**Nota skop:** Supabase, SQL, reminder automatik dan appointment workflow dikecualikan buat masa ini. Website conversion melalui call dan WhatsApp sahaja.

---

### FASA 2 — Local SEO & Visibility (Minggu 2, ~2-3 hari)
**Matlamat: kuatkan signal lokasi dan topical relevance tanpa mengubah layout.**

| # | Tugasan | Kategori | Detail lengkap |
|---|---|---|---|
| 2.1 | NAP + MedicalClinic schema | SEO | Pastikan setiap branch page ada alamat, nombor, jam operasi dan `MedicalClinic` JSON-LD yang konsisten dengan Google Business Profile. Jangan reka geo/alamat. |
| 2.2 | Canonical, sitemap, redirects | SEO | Satu host canonical sahaja; sitemap hanya URL live yang boleh di-index; buang URL redirect/duplikat. |
| 2.3 | Link dalaman ke service pages | SEO | Dari home, servis, artikel dan panel/OH, pautkan secara kontekstual ke halaman servis/cawangan yang relevan. Kekalkan komposisi/layout. |
| 2.4 | Kandungan topical B2B/local | SEO | Kembangkan artikel sedia ada sekitar klinik Skudai/Kempas, panel klinik syarikat Johor dan occupational health; fact-check tuntutan kesihatan. |

**Output F2:** Signal local konsisten, halaman penting mudah ditemui crawler/pengunjung, dan topik tempatan/B2B lebih lengkap.

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

## Keutamaan Eksekusi (susun ikut SEO visibility)

1. **Local NAP + MedicalClinic schema** — audit data sebenar setiap cawangan dan selaraskan dengan Google Business Profile.
2. **Canonical/sitemap/redirect hygiene** — host apex kini konsisten; terus sahkan tiada URL redirect/duplikat.
3. **Call/WhatsApp contact paths** — pastikan nombor tepat ikut cawangan pada halaman utama, service, panel dan OH.
4. **Internal links + topical content** — kukuhkan service pages, panel korporat Johor dan occupational health.
5. **Core Web Vitals** — baiki isu performance yang terukur; jangan minify atau ubah assets tanpa baseline.

---

## Metrik Kejayaan (visibility, bukan page count)

- ✅ Sitemap URL valid, canonical host seragam, tiada redirect sources
- ✅ Google Search Console: impressions/clicks/CTR mengikut query dan landing page
- ✅ Local keyword visibility untuk Skudai, Taman Teratai, Setia Tropika/Kempas
- ✅ NAP/schema branch pages sepadan dengan Google Business Profile
- ✅ Call/WhatsApp CTA tepat ke cawangan yang dimaksudkan
- ✅ Organic visits/clicks ke panel korporat dan occupational-health pages


---

*Dokumen hidup — dikemaskini selepas setiap fasa selesai. Dibina untuk perbincangan berterusan Agent Ali + Robert.*
