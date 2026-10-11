export interface ContextualPrompt {
  label: string;
  prompt: string;
}

export function getContextualPrompts(pathname: string): ContextualPrompt[] {
  // 1. General & Dashboard
  if (pathname === "/cms/dashboard" || pathname === "/cms") {
    return [
      { label: "📊 Health Check", prompt: "Tampilkan ringkasan eksekutif performa dan kesehatan seluruh situs CMS saat ini" },
      { label: "📬 Inquiries & Leads", prompt: "Apakah ada contact, hire request, atau service request baru yang belum dibaca?" },
      { label: "📝 Content Drafts", prompt: "Berapa banyak draft blog dan portfolio project yang belum dipublish?" },
    ];
  }
  if (pathname.includes("/cms/ai-knowledge")) {
    return [
      { label: "⚡ Skill Second Brain", prompt: "/my-second-brain Cross-check wawasan persona yang ada di Second Brain dan rangkum benang merahnya" },
      { label: "🧠 My Second Brain", prompt: "Tampilkan ringkasan seluruh dokumen knowledge aktif di My Second Brain per kategori" },
      { label: "➕ Tambah Persona / Impact", prompt: "Bantu saya tambahkan knowledge item baru ke kategori 'career-impact' dengan metrik terukur" },
      { label: "🏷️ 10 Kategori Knowledge", prompt: "Apa saja 10 kategori knowledge yang tersedia di My Second Brain dan bagaimana penggunaannya?" },
    ];
  }

  // 2. Career Hub
  if (pathname.includes("/cms/job-hunter")) {
    return [
      { label: "👀 Layar Ini", prompt: "Analisis lowongan kerja yang sedang tampil di layar ini dan berikan rekomendasi top 3" },
      { label: "⚡ ATS Feeds", prompt: "Ada lowongan remote baru apa saja di feed Ashby atau Greenhouse?" },
      { label: "🏢 Target Companies", prompt: "Tampilkan daftar perusahaan target ATS yang sedang dilacak" },
    ];
  }
  if (pathname.includes("/cms/job-outreaches")) {
    return [
      { label: "📈 Outreach Stats", prompt: "Bagaimana performa dan metrik konversi campaign Job Outreaches saat ini?" },
      { label: "✉️ Follow-up Due", prompt: "Tampilkan outreach yang statusnya butuh follow-up segera" },
      { label: "✍️ Draft Pitch", prompt: "Bantu saya buatkan cold pitch email baru untuk posisi Engineering Manager" },
    ];
  }
  if (pathname.includes("/cms/job-tracker")) {
    return [
      { label: "📊 Analytics", prompt: "Tampilkan analytics ringkasan Career Hub dan status lamaran saya saat ini" },
      { label: "🎯 AI CV Tailor", prompt: "Jalankan AI CV Tailor untuk lamaran terbaru dan hitung ATS match score menggunakan Second Brain" },
      { label: "📅 Interviews", prompt: "Apakah ada interview yang terjadwal dalam waktu dekat?" },
    ];
  }
  if (pathname.includes("/cms/frontend-mastery")) {
    return [
      { label: "⚡ Quick Drill", prompt: "Pilihkan satu topik JavaScript atau React coding drill yang paling krusial untuk saya latih sekarang" },
      { label: "📊 Mastery Progress", prompt: "Bagaimana progress saya di Frontend Mastery Gym sejauh ini? Berapa topik yang sudah mastered?" },
      { label: "🎯 Mock Interview", prompt: "Buatkan skenario mock interview frontend tingkat Senior/Staff untuk topik System Design" },
    ];
  }

  // 3. Finder Project Hub
  if (pathname.includes("/cms/project-hunter")) {
    return [
      { label: "🎯 Instant Audit", prompt: "Bantu audit instan website prospect baru dan hitung modernization opportunity score-nya" },
      { label: "🔎 Sourced Leads", prompt: "Tampilkan daftar prospect yang berstatus 'sourced' dan siap untuk diaudit" },
      { label: "🏢 Add Prospect", prompt: "Bantu saya tambahkan target company prospect baru ke Project Tracker" },
    ];
  }
  if (pathname.includes("/cms/project-tracker")) {
    return [
      { label: "📊 Pipeline Stats", prompt: "Tampilkan breakdown status pipeline prospect di Project Tracker saat ini" },
      { label: "⭐ Top Audits", prompt: "Tampilkan prospect yang memiliki skor audit tertinggi dan butuh dibuatkan pitch" },
      { label: "⚡ Run AI Audit", prompt: "Jalankan AI audit teknis & UX untuk prospect yang statusnya masih 'sourced'" },
    ];
  }
  if (pathname.includes("/cms/project-outreaches")) {
    return [
      { label: "🚀 Pitch Packs", prompt: "Tampilkan prospect yang berstatus 'pitch_ready' dan siap untuk dikirimi outreach" },
      { label: "✍️ Generate Pitch", prompt: "Generate modernization pitch pack (email, LinkedIn InMail, script Loom) untuk prospect terpilih" },
      { label: "✉️ Outreach Pipeline", prompt: "Berapa banyak outreach project yang statusnya sudah 'outreach_sent' atau 'negotiation'?" },
    ];
  }

  // 4. AI Assistant
  if (pathname.includes("/cms/ai-english-gym") || pathname.includes("/cms/ai-english-fluency")) {
    return [
      { label: "🔥 Habit Streak", prompt: "Berapa hari streak latihan berbicara bahasa Inggris saya dan total menit latihan?" },
      { label: "🎙️ Sesi Terakhir", prompt: "Tampilkan ringkasan hasil latihan speaking terakhir dan skor evaluasinya" },
      { label: "🥊 Pushback Challenge", prompt: "Berikan saya skenario tech drill pushback tingkat Staff Engineer sekarang" },
    ];
  }
  if (pathname.includes("/cms/ai-english-academy")) {
    return [
      { label: "🎓 Career Tracks", prompt: "Bagaimana progres unit dan lesson kurikulum developer English saya?" },
      { label: "📚 Vocabulary Deck", prompt: "Tampilkan daftar kosakata executive & technical English yang sedang saya pelajari" },
      { label: "🎯 CEFR Diagnostics", prompt: "Analisis estimasi CEFR standing saya dan area grammar/fluency yang perlu ditingkatkan" },
    ];
  }
  if (pathname.includes("/cms/ai-chat-logs")) {
    return [
      { label: "💬 Visitor Chats", prompt: "Apa saja pertanyaan atau interaksi terbaru dari pengunjung di web portofolio?" },
      { label: "🔍 Pertanyaan Populer", prompt: "Topik apa yang paling sering ditanyakan pengunjung web kepada bot AI?" },
      { label: "🧹 Clean Chats", prompt: "Tampilkan sesi chat yang hanya berisi pesan testing atau spam" },
    ];
  }

  // 5. Inbox & Leads
  if (pathname.includes("/cms/contacts")) {
    return [
      { label: "📬 Unread Messages", prompt: "Tampilkan pesan contact form yang statusnya masih 'new' dan belum dibaca" },
      { label: "✉️ Recent Contacts", prompt: "Tampilkan 5 pesan contact form terbaru beserta isi pesannya" },
      { label: "✓ Mark as Read", prompt: "Tandai pesan contact terbaru sebagai 'read'" },
    ];
  }
  if (pathname.includes("/cms/services") && !pathname.includes("/cms/service-catalog")) {
    return [
      { label: "🛠️ Service Orders", prompt: "Tampilkan ringkasan pesanan jasa freelance & konsultasi teknis yang baru masuk" },
      { label: "📋 Active Projects", prompt: "Tampilkan daftar service request aktif yang berstatus 'in-progress'" },
      { label: "💰 Budget Breakdown", prompt: "Berapa rata-rata budget project service request yang masuk?" },
    ];
  }
  if (pathname.includes("/cms/hire-requests")) {
    return [
      { label: "🏢 Hire Inquiries", prompt: "Tampilkan daftar permohonan hire / penawaran kerja yang baru masuk" },
      { label: "💼 Roles Offered", prompt: "Posisi dan company apa saja yang menawarkan pekerjaan di hire requests?" },
      { label: "🎯 Pipeline Status", prompt: "Tampilkan breakdown status hire requests (reviewed, interviewing, offered)" },
    ];
  }

  // 6. Site Architecture
  if (pathname.includes("/cms/site")) {
    return [
      { label: "🌐 Site Settings", prompt: "Tampilkan ringkasan konfigurasi Site Settings saat ini (SEO, brand, fitur)" },
      { label: "⚙️ Toggle Features", prompt: "Apakah fitur enableBlog dan enableAiChat sedang aktif di site settings?" },
      { label: "🎨 Branding", prompt: "Apa warna themeColor dan tagline yang sedang digunakan di situs?" },
    ];
  }
  if (pathname.includes("/cms/pages")) {
    return [
      { label: "📄 Page Copy List", prompt: "Tampilkan daftar halaman yang copy text-nya sudah tersimpan di database" },
      { label: "🏠 Home Hero Copy", prompt: "Tampilkan teks hero section dan CTA untuk halaman 'home'" },
      { label: "✍️ Review Copy", prompt: "Review apakah ada copy text halaman yang perlu di-update" },
    ];
  }
  if (pathname.includes("/cms/legal")) {
    return [
      { label: "⚖️ Legal Pages", prompt: "Tampilkan daftar halaman legal & policy yang aktif (Privacy Policy, Terms, dll.)" },
      { label: "📜 Privacy Policy", prompt: "Tampilkan isi dan tanggal update terakhir untuk halaman Privacy Policy" },
      { label: "➕ Tambah Policy", prompt: "Bantu saya buatkan draft halaman legal baru (mis: Cookie Policy)" },
    ];
  }

  // 7. Content & Catalog
  if (pathname.includes("/cms/blogs")) {
    return [
      { label: "📝 Blog Articles", prompt: "Tampilkan daftar artikel blog, jumlah views, dan status publikasinya" },
      { label: "✍️ Draft via Second Brain", prompt: "Buatkan draft artikel blog MDX baru yang digrounding opini arsitektur di My Second Brain" },
      { label: "🔄 Sync ke Second Brain", prompt: "Sinkronkan wawasan dan opini teknis dari artikel blog terbaru ke My Second Brain" },
    ];
  }
  if (pathname.includes("/cms/projects")) {
    return [
      { label: "💼 Portfolio Projects", prompt: "Tampilkan daftar portfolio projects dan teknologi yang digunakan" },
      { label: "🚀 Draft Case Study", prompt: "Bantu buatkan case study arsitektur proyek MDX mendalam berdasarkan verified Second Brain" },
      { label: "🔄 Sync ke Second Brain", prompt: "Sinkronkan tantangan arsitektur dan trade-off project terpilih ke My Second Brain" },
    ];
  }
  if (pathname.includes("/cms/resume")) {
    return [
      { label: "🎓 Resume Timeline", prompt: "Tampilkan seluruh riwayat work experience dan education yang terdaftar" },
      { label: "✨ Polish via Second Brain", prompt: "Poles deskripsi pengalaman kerja terbaru saya menggunakan formula Google XYZ dan pencapaian Second Brain" },
      { label: "🔄 Sync ke Second Brain", prompt: "Sinkronkan pencapaian peran kerja saat ini ke My Second Brain kategori career-impact" },
    ];
  }
  if (pathname.includes("/cms/skills")) {
    return [
      { label: "⚡ Skills List", prompt: "Tampilkan seluruh technical skills yang terdaftar di database dan urutannya" },
      { label: "➕ Tambah Skill", prompt: "Tambahkan skill baru ke daftar portfolio (misal: 'Google Gemini AI')" },
      { label: "🧹 Clean Skills", prompt: "Cek apakah ada skill duplikat atau yang belum dipublish" },
    ];
  }
  if (pathname.includes("/cms/service-catalog")) {
    return [
      { label: "🛠️ Service Offerings", prompt: "Tampilkan daftar paket layanan yang ada di Service Catalog dan price label-nya" },
      { label: "🏠 Homepage Services", prompt: "Layanan apa saja yang diset tampil di homepage (showOnHome)?" },
      { label: "➕ Tambah Layanan", prompt: "Bantu saya buatkan paket layanan baru untuk konsultasi arsitektur cloud" },
    ];
  }
  if (pathname.includes("/cms/faqs")) {
    return [
      { label: "❓ FAQs List", prompt: "Tampilkan daftar seluruh pertanyaan dan jawaban FAQ yang aktif" },
      { label: "➕ Tambah FAQ", prompt: "Bantu saya tambahkan FAQ baru seputar proses kerja dan estimasi project" },
      { label: "✏️ Update FAQ", prompt: "Periksa apakah ada FAQ yang jawabannya perlu diperbarui" },
    ];
  }
  if (pathname.includes("/cms/process-steps")) {
    return [
      { label: "🔄 Process Steps", prompt: "Tampilkan tahapan proses kerja (Process Steps) untuk services dan hire-me" },
      { label: "🛠️ Services Steps", prompt: "Tampilkan urutan langkah kerja spesifik untuk layanan freelance/project" },
      { label: "➕ Tambah Step", prompt: "Bantu saya buatkan tahapan proses kerja baru" },
    ];
  }
  if (pathname.includes("/cms/testimonials")) {
    return [
      { label: "💬 Testimonials", prompt: "Tampilkan daftar testimoni klien yang sudah ada beserta rating dan author-nya" },
      { label: "⭐ Published Testimonials", prompt: "Testimoni mana saja yang sudah dipublish di halaman /hire-me?" },
      { label: "➕ Tambah Testimoni", prompt: "Bantu saya catat testimoni baru dari klien" },
    ];
  }
  if (pathname.includes("/cms/availability")) {
    return [
      { label: "📅 Availability Slots", prompt: "Tampilkan status ketersediaan booking slot bulanan untuk klien" },
      { label: "🟢 Open Slots", prompt: "Bulan apa saja yang saat ini statusnya masih 'available'?" },
      { label: "➕ Tambah Slot", prompt: "Tambahkan slot ketersediaan baru untuk kuartal mendatang" },
    ];
  }

  // 8. Account & System
  if (pathname.includes("/cms/profile")) {
    return [
      { label: "👤 Admin Profile", prompt: "Tampilkan data profil admin saya saat ini (display name, bio, social links)" },
      { label: "✏️ Update Bio", prompt: "Bantu perbarui ringkasan bio profil saya agar lebih profesional" },
      { label: "🔗 Social Links", prompt: "Periksa link GitHub, LinkedIn, dan Twitter yang tersimpan di profil" },
    ];
  }
  if (pathname.includes("/cms/settings")) {
    return [
      { label: "⚙️ System Preferences", prompt: "Tampilkan pengaturan preferensi CMS saya (theme, notifikasi, timezone)" },
      { label: "🔔 Notifikasi", prompt: "Apakah notifikasi email untuk lead baru saat ini aktif?" },
      { label: "🕒 Timezone & Format", prompt: "Format tanggal dan timezone apa yang sedang diterapkan di CMS?" },
    ];
  }

  return [
    { label: "📊 CMS Overview", prompt: "Tampilkan health check metrik dan ringkasan seluruh modul di CMS" },
    { label: "🧠 My Second Brain", prompt: "Tampilkan ringkasan status persona dan dokumen knowledge di My Second Brain" },
    { label: "🎯 Career Hub", prompt: "Berapa banyak total lamaran aktif dan status pipeline saya di Career Hub?" },
    { label: "🚀 Project Hub", prompt: "Tampilkan ringkasan prospect client di Finder Project Hub" },
    { label: "📬 Inbox Leads", prompt: "Cek apakah ada kontak atau hire request baru yang belum saya review?" },
  ];
}
