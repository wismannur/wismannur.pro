import type { CurriculumTrack } from "./types";

export const CURRICULUM_TRACKS_BLUEPRINT: Omit<
  CurriculumTrack,
  "completedLessons" | "progressPercentage" | "totalLessons"
>[] = [
  // ==========================================================================
  // TRACK A2: JUNIOR DEVELOPER ONBOARDING & TECH BASICS
  // ==========================================================================
  {
    level: "A2",
    title: "Junior Developer Onboarding & Core Tech Basics",
    description:
      "Build basic speaking confidence, ask for help without hesitation, explain daily tasks in simple past and present, and describe basic bugs.",
    cefrBadge: "CEFR A2 • Pre-Intermediate",
    estimatedTime: "4 Weeks • 6 Lessons",
    units: [
      {
        id: "a2-unit-1",
        trackLevel: "A2",
        unitNumber: 1,
        title: "First Day & Dev Environment Setup",
        description:
          "Learn how to introduce yourself to teammates, ask for repository permissions, and clarify onboarding steps.",
        badge: "Onboarding & Access",
        lessons: [
          {
            id: "a2-u1-l1",
            unitId: "a2-unit-1",
            lessonNumber: 1,
            title: "Cloning the Repo & Asking for API Keys",
            subtitle: "Pairing with Sarah (Tech Lead) on your first morning",
            estimatedMinutes: 5,
            targetSkills: [
              "Polite requests with 'Could you...'",
              "Clarifying environment variables",
              "Simple past & present tense",
            ],
            dialogue: [
              {
                id: "d1",
                speaker: "Sarah",
                role: "Tech Lead",
                text: "Hi Wisman! Welcome to the team. Have you had a chance to clone the backend repository yet?",
                keyPhraseHighlight: "Have you had a chance to...",
                indonesianHint: "Frasa sopan untuk menanyakan 'apakah kamu sudah sempat...'",
              },
              {
                id: "d2",
                speaker: "Wisman",
                role: "Software Engineer",
                text: "Thanks Sarah! Yes, I cloned it, but I hit an issue with the local environment variables.",
                keyPhraseHighlight: "hit an issue with...",
                indonesianHint: "Mengalami kendala pada...",
              },
              {
                id: "d3",
                speaker: "Sarah",
                role: "Tech Lead",
                text: "Ah, right! You probably need the staging credentials. Could you ping David on Slack to invite you to 1Password?",
                keyPhraseHighlight: "Could you ping... on Slack?",
                indonesianHint: "Bisa tolong kirim pesan ke...",
              },
              {
                id: "d4",
                speaker: "Wisman",
                role: "Software Engineer",
                text: "Will do right away! Once I have the credentials, should I run the database seed script?",
                keyPhraseHighlight: "Will do right away!",
                indonesianHint: "Akan segera saya lakukan!",
              },
              {
                id: "d5",
                speaker: "Sarah",
                role: "Tech Lead",
                text: "Exactly. Run 'npm run db:seed' and let me know if any table migration fails.",
                keyPhraseHighlight: "let me know if...",
                indonesianHint: "Beri tahu saya jika...",
              },
            ],
            quiz: [
              {
                id: "q1",
                type: "cloze",
                question: "Lengkapi kalimat dengan frasa kerja yang tepat untuk menyatakan kendala:",
                sentenceWithBlank: "I cloned the project, but I ___ an issue with the docker container.",
                options: [
                  { id: "opt1", text: "hit", isCorrect: true, explanation: "'hit an issue' adalah idiom standar di tempat kerja untuk mengalami masalah teknis." },
                  { id: "opt2", text: "punched", isCorrect: false, explanation: "'punched' bersifat harfiah memukul fisik." },
                  { id: "opt3", text: "caught", isCorrect: false, explanation: "'caught' biasanya untuk menangkap bug atau bola, bukan kendala lingkungan dev." },
                ],
                explanation: "Gunakan 'hit an issue' atau 'hit a snag' saat melaporkan kendala teknis sederhana.",
              },
              {
                id: "q2",
                type: "pragmatic_tone",
                question: "Bagaimana cara paling natural dan profesional untuk meminta file konfigurasi ke rekan setim?",
                options: [
                  { id: "opt1", text: "Could you share the staging .env file when you have a moment?", isCorrect: true, explanation: "Sangat sopan, jelas, dan menggunakan modal 'Could you' serta 'when you have a moment'." },
                  { id: "opt2", text: "Give me the staging .env file now.", isCorrect: false, explanation: "Terlalu memaksa dan bernada kasar untuk komunikasi tim remote." },
                  { id: "opt3", text: "I want the .env file.", isCorrect: false, explanation: "Kurang sopan dan terdengar seperti perintah sepihak." },
                ],
                explanation: "Di lingkungan remote global, tambahkan 'when you have a moment' atau 'could you please...' untuk kesantunan profesional.",
              },
            ],
            rolePlay: {
              scenario: "Sarah asks you whether your local server is already running after configuring the environment variables.",
              characterName: "Sarah",
              characterRole: "Tech Lead",
              promptQuestion: "Wisman, were you able to get the staging API running locally without any errors?",
              sentenceStarters: [
                "Yes, everything is running smoothly on port 3000.",
                "I got the server up, but I'm seeing a connection warning with...",
                "Not quite yet, I'm currently verifying the database connection...",
              ],
              modelAnswer: "Yes Sarah, everything is up and running smoothly on port 3000. I tested the healthcheck endpoint and it returned 200 OK.",
            },
          },
          {
            id: "a2-u1-l2",
            unitId: "a2-unit-1",
            lessonNumber: 2,
            title: "Reading README & Clarifying Branching Rules",
            subtitle: "Understanding the team's Git workflow and PR naming conventions",
            estimatedMinutes: 5,
            targetSkills: [
              "Asking for clarification with 'Does this mean...?'",
              "Git branching terminology",
              "Prepositions of process (on, from, into)",
            ],
            dialogue: [
              {
                id: "d1",
                speaker: "David",
                role: "Senior Engineer",
                text: "Hey Wisman, just a heads-up: we always cut feature branches from 'dev', not 'main'.",
                keyPhraseHighlight: "just a heads-up",
                indonesianHint: "Sekadar pemberitahuan awal...",
              },
              {
                id: "d2",
                speaker: "Wisman",
                role: "Software Engineer",
                text: "Got it! And for the branch name, do we need to include the Jira ticket number?",
                keyPhraseHighlight: "Got it!",
                indonesianHint: "Paham!",
              },
              {
                id: "d3",
                speaker: "David",
                role: "Senior Engineer",
                text: "Yes, please. Follow the pattern 'feat/KB-1234-short-description'. That triggers our CI preview build automatically.",
                keyPhraseHighlight: "Follow the pattern...",
                indonesianHint: "Ikuti format/pola...",
              },
            ],
            quiz: [
              {
                id: "q1",
                type: "cloze",
                question: "Pilih idiom yang tepat untuk memberi kabar atau pemberitahuan awal kepada rekan tim:",
                sentenceWithBlank: "Just a ___, the staging server will restart in five minutes.",
                options: [
                  { id: "opt1", text: "heads-up", isCorrect: true, explanation: "'heads-up' adalah frasa paling umum untuk pemberitahuan singkat." },
                  { id: "opt2", text: "hands-down", isCorrect: false, explanation: "'hands-down' berarti tanpa diragukan lagi." },
                  { id: "opt3", text: "look-up", isCorrect: false, explanation: "'look-up' adalah mencari referensi/kata di kamus." },
                ],
                explanation: "'heads-up' digunakan setiap hari di Slack untuk mengabari hal penting secara cepat.",
              },
            ],
            rolePlay: {
              scenario: "David asks if you understand where to open your first Pull Request.",
              characterName: "David",
              characterRole: "Senior Engineer",
              promptQuestion: "Do you have any questions about where to open your PR once you finish your ticket?",
              sentenceStarters: [
                "No questions, David. I'll make sure to target the dev branch...",
                "Just to confirm, should the PR title match the Jira ticket name?",
              ],
              modelAnswer: "All clear David! I'll branch from dev and target dev for the PR, making sure to include the ticket ID in the title.",
            },
          },
        ],
      },
      {
        id: "a2-unit-2",
        trackLevel: "A2",
        unitNumber: 2,
        title: "Daily Standup Routine (A2 Fundamentals)",
        description:
          "Master the core Past Simple vs Present Continuous tenses to summarize daily tickets and express blockers cleanly.",
        badge: "Daily Standup Basics",
        lessons: [
          {
            id: "a2-u2-l1",
            unitId: "a2-unit-2",
            lessonNumber: 1,
            title: "What I Did Yesterday vs What I Do Today",
            subtitle: "Clear tense switching for basic daily updates",
            estimatedMinutes: 5,
            targetSkills: [
              "Past Simple (finished, fixed, updated)",
              "Present Continuous (working on, testing)",
              "Avoiding hesitation fillers",
            ],
            dialogue: [
              {
                id: "d1",
                speaker: "Alex",
                role: "Scrum Master",
                text: "Alright team, let's start the standup. Wisman, you're up first today!",
                keyPhraseHighlight: "you're up first",
                indonesianHint: "Giliranmu yang pertama...",
              },
              {
                id: "d2",
                speaker: "Wisman",
                role: "Software Engineer",
                text: "Sure! Yesterday, I finished the responsive layout for the profile card. Today, I am working on the form validation.",
                keyPhraseHighlight: "Yesterday, I finished... Today, I am working on...",
                indonesianHint: "Struktur standar: Kemarin saya selesaikan... Hari ini saya sedang mengerjakan...",
              },
              {
                id: "d3",
                speaker: "Alex",
                role: "Scrum Master",
                text: "Nice progress! Any blockers on the validation logic?",
                keyPhraseHighlight: "Any blockers on...?",
                indonesianHint: "Ada hambatan pada...?",
              },
              {
                id: "d4",
                speaker: "Wisman",
                role: "Software Engineer",
                text: "No blockers on my side. I plan to open the PR before lunch.",
                keyPhraseHighlight: "No blockers on my side.",
                indonesianHint: "Tidak ada hambatan dari pihak saya.",
              },
            ],
            quiz: [
              {
                id: "q1",
                type: "cloze",
                question: "Pilih bentuk kata kerja yang tepat untuk menceritakan pekerjaan kemarin:",
                sentenceWithBlank: "Yesterday, I ___ the unit tests for the auth module.",
                options: [
                  { id: "opt1", text: "completed", isCorrect: true, explanation: "Pekerjaan kemarin telah tuntas, gunakan Past Simple 'completed'." },
                  { id: "opt2", text: "am completing", isCorrect: false, explanation: "Present Continuous digunakan untuk hal yang sedang berlangsung saat ini." },
                  { id: "opt3", text: "complete", isCorrect: false, explanation: "Bentuk dasar tidak tepat untuk penanda waktu lampau 'yesterday'." },
                ],
                explanation: "Gunakan Past Simple (verb-2) secara konsisten saat menceritakan aktivitas 'yesterday'.",
              },
            ],
            rolePlay: {
              scenario: "Alex asks for your standup update during sprint kickoff.",
              characterName: "Alex",
              characterRole: "Scrum Master",
              promptQuestion: "Good morning Wisman! What did you work on yesterday, and what is your focus today?",
              sentenceStarters: [
                "Yesterday, I worked on the login bug and fixed the token expiration...",
                "Today, I am focusing on writing unit tests for...",
                "No blockers so far, aiming to finish the ticket by end of day.",
              ],
              modelAnswer: "Good morning Alex! Yesterday, I fixed the token expiration bug on the auth service. Today, I'm writing unit tests and testing edge cases. No blockers on my end!",
            },
          },
        ],
      },
    ],
  },

  // ==========================================================================
  // TRACK B1: AUTONOMOUS SOFTWARE ENGINEER (WORKPLACE & COLLABORATION)
  // ==========================================================================
  {
    level: "B1",
    title: "Autonomous Engineer & Workplace Collaboration",
    description:
      "Deliver high-impact standups, conduct assertive code reviews, communicate during outages, and negotiate deadlines with Product Managers.",
    cefrBadge: "CEFR B1 • Intermediate",
    estimatedTime: "6 Weeks • 8 Lessons",
    units: [
      {
        id: "b1-unit-1",
        trackLevel: "B1",
        unitNumber: 1,
        title: "High-Impact Standup & Blocker Escalation",
        description:
          "Transform standup from boring task lists into outcome-driven updates with proactive cross-functional escalation.",
        badge: "Standup Mastery",
        lessons: [
          {
            id: "b1-u1-l1",
            unitId: "b1-unit-1",
            lessonNumber: 1,
            title: "The 3-Point Standup: Impact over Activity",
            subtitle: "Delivering executive-ready updates in under 60 seconds",
            estimatedMinutes: 6,
            targetSkills: [
              "Outcome verbs (shipped, resolved, unblocked)",
              "Signposting (On my end, Moving forward)",
              "Conciseness ratio",
            ],
            dialogue: [
              {
                id: "d1",
                speaker: "Alex",
                role: "Scrum Master",
                text: "Wisman, let's hear your update for sprint ticket KB-4402.",
                keyPhraseHighlight: "let's hear your update",
                indonesianHint: "Mari kita dengarkan updatemu...",
              },
              {
                id: "d2",
                speaker: "Wisman",
                role: "Software Engineer",
                text: "Thanks Alex. On my end, yesterday I shipped the idempotent webhook handler, which resolved the duplicate payment issue.",
                keyPhraseHighlight: "On my end... shipped... resolved...",
                indonesianHint: "Dari sisi saya... meluncurkan... menyelesaikan masalah...",
              },
              {
                id: "d3",
                speaker: "Wisman",
                role: "Software Engineer",
                text: "Today, my main priority is load-testing the queue with 500 concurrent payloads.",
                keyPhraseHighlight: "my main priority is...",
                indonesianHint: "Prioritas utama saya adalah...",
              },
              {
                id: "d4",
                speaker: "Wisman",
                role: "Software Engineer",
                text: "As for blockers, I'm waiting on staging database credentials from DevOps. David, could we sync offline for five minutes to get that sorted?",
                keyPhraseHighlight: "sync offline... get that sorted",
                indonesianHint: "Diskusi di luar meeting (1-on-1)... menyelesaikan hal tersebut",
              },
              {
                id: "d5",
                speaker: "David",
                role: "Senior Backend",
                text: "Sure thing Wisman! Ping me right after this call and I'll grant you IAM access.",
                keyPhraseHighlight: "Sure thing! Ping me right after...",
                indonesianHint: "Tentu! Kirim pesan ke saya tepat setelah call ini...",
              },
            ],
            quiz: [
              {
                id: "q1",
                type: "pragmatic_tone",
                question: "Manakah cara terbaik untuk meminta rekan kerja membahas hal teknis mendalam tanpa membuang waktu peserta standup lainnya?",
                options: [
                  { id: "opt1", text: "Let's sync offline right after standup so we don't hold up the rest of the team.", isCorrect: true, explanation: "'sync offline' adalah idiom standar Silicon Valley agar tidak membuang waktu rapat bersama." },
                  { id: "opt2", text: "Stop the standup now, we must discuss this for 30 minutes.", isCorrect: false, explanation: "Anti-pattern standup terbesar adalah menyandera seluruh peserta rapat." },
                  { id: "opt3", text: "I will not talk about this.", isCorrect: false, explanation: "Terlalu pasif-agresif dan tidak komunikatif." },
                ],
                explanation: "Gunakan 'Let's sync offline' atau 'Let's take this offline' untuk menjaga standup tetap ringkas.",
              },
              {
                id: "q2",
                type: "cloze",
                question: "Lengkapi kalimat dengan frasa yang tepat untuk menyatakan penyelesaian masalah:",
                sentenceWithBlank: "We need to sync with DevOps to get the deployment permissions ___.",
                options: [
                  { id: "opt1", text: "sorted", isCorrect: true, explanation: "'get something sorted' berarti menyelesaikan/mengatur hingga beres." },
                  { id: "opt2", text: "cleared out", isCorrect: false, explanation: "'cleared out' berarti mengosongkan ruangan/data." },
                  { id: "opt3", text: "drained", isCorrect: false, explanation: "'drained' berarti terkuras energinya/airnya." },
                ],
                explanation: "'get that sorted' sangat lumrah dipakai oleh insinyur global.",
              },
            ],
            rolePlay: {
              scenario: "Alex asks you for a standup update while you have a blocker on an external Stripe webhook.",
              characterName: "Alex",
              characterRole: "Scrum Master",
              promptQuestion: "Wisman, how are things looking on the billing migration? Are we still tracking for Thursday?",
              sentenceStarters: [
                "On my end, I completed the schema migration yesterday...",
                "Today, I'm integrating the Stripe webhook, but I hit a snag with...",
                "I might need a quick hand from the backend team to unblock...",
              ],
              modelAnswer: "On my end, I completed the database schema migration yesterday. Today, I'm integrating the Stripe webhook, but I hit a minor snag with sandbox webhook signature verification. David, let's sync offline for five minutes right after standup to unblock this.",
            },
          },
        ],
      },
      {
        id: "b1-unit-2",
        trackLevel: "B1",
        unitNumber: 2,
        title: "Pull Request Reviews & Constructive Pushback",
        description:
          "Learn how to suggest architectural improvements in code reviews with empathy, nuance, and clear technical rationale.",
        badge: "Code Review Etiquette",
        lessons: [
          {
            id: "b1-u2-l1",
            unitId: "b1-unit-2",
            lessonNumber: 1,
            title: "Softening Feedback with 'What if we...?' and 'I'd suggest...'",
            subtitle: "Turning defensive debates into collaborative engineering improvements",
            estimatedMinutes: 6,
            targetSkills: [
              "Mitigating language (I wonder if, What if we, Non-blocking nit)",
              "Explaining performance consequences neutrally",
              "Responding gracefully to review comments",
            ],
            dialogue: [
              {
                id: "d1",
                speaker: "Sarah",
                role: "Tech Lead",
                text: "Hey Wisman, I left a few comments on your PR #204. Mostly non-blocking nits, but one question regarding database querying.",
                keyPhraseHighlight: "non-blocking nits",
                indonesianHint: "Catatan kecil yang tidak menghambat penggabungan PR (minor detail)",
              },
              {
                id: "d2",
                speaker: "Wisman",
                role: "Software Engineer",
                text: "Thanks Sarah! I saw your note. Were you concerned about the N+1 query problem inside the map loop?",
                keyPhraseHighlight: "Were you concerned about...",
                indonesianHint: "Apakah kamu mengkhawatirkan tentang...",
              },
              {
                id: "d3",
                speaker: "Sarah",
                role: "Tech Lead",
                text: "Spot on. If this table scales to 50,000 rows, that loop will degrade latency. What if we eager-load with a join instead?",
                keyPhraseHighlight: "Spot on... What if we...?",
                indonesianHint: "Tepat sekali... Bagaimana jika kita...?",
              },
              {
                id: "d4",
                speaker: "Wisman",
                role: "Software Engineer",
                text: "That makes total sense. I'll refactor it using a batch join query and push an updated commit shortly.",
                keyPhraseHighlight: "That makes total sense... shortly",
                indonesianHint: "Sangat masuk akal... segera",
              },
            ],
            quiz: [
              {
                id: "q1",
                type: "pragmatic_tone",
                question: "Pilih kalimat komentar PR yang paling konstruktif saat Anda menemukan potensi memory leak pada code rekan kerja:",
                options: [
                  { id: "opt1", text: "Nice work overall! I wonder if this event listener could cause a memory leak if the component unmounts. What if we clean it up in the return statement?", isCorrect: true, explanation: "Menggunakan pujian awal + pertanyaan eksploratif 'What if we' yang tidak menyinggung ego pembuat PR." },
                  { id: "opt2", text: "Your code is bad, it leaks memory. Rewrite it.", isCorrect: false, explanation: "Sangat toksik dan merusak moral tim." },
                  { id: "opt3", text: "Why did you write this terrible listener?", isCorrect: false, explanation: "Menyerang individu alih-alih mendiskusikan problem teknis." },
                ],
                explanation: "Di tim tech global, gunakan formula: Apresiasi + Observasi Risiko + Solusi Alternatif Berbentuk Pertanyaan.",
              },
            ],
            rolePlay: {
              scenario: "Sarah leaves a comment asking why you didn't memoize an expensive calculation in React.",
              characterName: "Sarah",
              characterRole: "Tech Lead",
              promptQuestion: "I noticed we aren't using useMemo for this filter operation. Could this cause unnecessary re-renders?",
              sentenceStarters: [
                "Good catch Sarah! In this case, the dataset is capped at 10 items, so...",
                "You're totally right. When the parent component re-renders, it might...",
                "I debated using useMemo here, but to avoid premature optimization...",
              ],
              modelAnswer: "Good catch Sarah! I initially omitted useMemo because the list is capped at 10 items, so the re-computation overhead is negligible. However, wrapping it in useMemo makes good sense to future-proof the component as the dataset grows. I'll push a commit for it now!",
            },
          },
        ],
      },
      {
        id: "b1-unit-3",
        trackLevel: "B1",
        unitNumber: 3,
        title: "Production Outages & Blameless Post-Mortems",
        description:
          "Communicate with clarity during live production emergencies (War Rooms) and write blameless post-mortem analyses.",
        badge: "Incident Management",
        lessons: [
          {
            id: "b1-u3-l1",
            unitId: "b1-unit-3",
            lessonNumber: 1,
            title: "Slack Incident Updates: Status, Impact, Next Steps",
            subtitle: "Providing high-signal updates to stakeholders during high-pressure downtime",
            estimatedMinutes: 6,
            targetSkills: [
              "Presenting current incident status objectively",
              "Explaining mitigation vs permanent fix",
              "Assuring stakeholders with calm executive English",
            ],
            dialogue: [
              {
                id: "d1",
                speaker: "Tom",
                role: "Product Manager",
                text: "Hey team, customer support is reporting 500 Internal Server Errors on the checkout flow. Are we investigating?",
                keyPhraseHighlight: "customer support is reporting...",
                indonesianHint: "Tim customer support melaporkan...",
              },
              {
                id: "d2",
                speaker: "Wisman",
                role: "Software Engineer",
                text: "Heads-up everyone: we've declared a P1 incident. The checkout service is experiencing database connection pool exhaustion.",
                keyPhraseHighlight: "we've declared a P1 incident... connection pool exhaustion",
                indonesianHint: "Kami menetapkan insiden prioritas 1... kehabisan kuota koneksi database",
              },
              {
                id: "d3",
                speaker: "Wisman",
                role: "Software Engineer",
                text: "As an immediate mitigation, we are increasing the connection pool limit and rolling back the latest release.",
                keyPhraseHighlight: "immediate mitigation... rolling back",
                indonesianHint: "Penanganan darurat segera... mengembalikan ke versi sebelumnya",
              },
              {
                id: "d4",
                speaker: "Tom",
                role: "Product Manager",
                text: "Understood. What is the expected time to recovery (TTR)?",
                keyPhraseHighlight: "time to recovery (TTR)",
                indonesianHint: "Estimasi waktu pemulihan sistem",
              },
              {
                id: "d5",
                speaker: "Wisman",
                role: "Software Engineer",
                text: "We anticipate services returning to normal within 10 minutes. I'll provide another update on this channel at 14:15 WIB.",
                keyPhraseHighlight: "We anticipate... I'll provide another update at...",
                indonesianHint: "Kami perkirakan... Saya akan memberikan kabar berikutnya pada jam...",
              },
            ],
            quiz: [
              {
                id: "q1",
                type: "cloze",
                question: "Pilih istilah teknis yang tepat untuk tindakan sementara menghentikan dampak buruk insiden:",
                sentenceWithBlank: "As an immediate ___, we enabled rate-limiting to protect the database.",
                options: [
                  { id: "opt1", text: "mitigation", isCorrect: true, explanation: "'mitigation' adalah langkah penanganan cepat/darurat sebelum akar masalah diperbaiki permanen." },
                  { id: "opt2", text: "elimination", isCorrect: false, explanation: "'elimination' berarti pemusnahan total." },
                  { id: "opt3", text: "complication", isCorrect: false, explanation: "'complication' berarti mempersulit." },
                ],
                explanation: "Di laporan insiden tech, 'mitigation' membedakan perbaikan darurat dari 'root-cause permanent fix'.",
              },
            ],
            rolePlay: {
              scenario: "A stakeholder panics in the Slack incident channel asking why checkout is failing.",
              characterName: "Tom",
              characterRole: "Product Manager",
              promptQuestion: "Wisman, clients are complaining about payment failures! What is happening and when will it be fixed?",
              sentenceStarters: [
                "We are actively investigating the issue. Right now, we've identified that...",
                "As an immediate step, we are restarting the worker nodes to restore service...",
                "We estimate full recovery within 15 minutes, and I'll keep this thread posted.",
              ],
              modelAnswer: "We are on top of it, Tom. We identified a connection timeout with our payment gateway. As an immediate mitigation, we are redirecting traffic to our fallback provider. We expect payments to recover within 10 to 15 minutes, and I'll share another status update here in 10 minutes.",
            },
          },
        ],
      },
    ],
  },

  // ==========================================================================
  // TRACK B2: SENIOR STAFF & INTERVIEW MASTERY
  // ==========================================================================
  {
    level: "B2",
    title: "Senior Staff Engineer & Global Interview Mastery",
    description:
      "Defend architectural trade-offs, lead System Design interview discussions, and articulate behavioral leadership challenges using the STAR method.",
    cefrBadge: "CEFR B2/Staff • Advanced Tech",
    estimatedTime: "8 Weeks • 6 Lessons",
    units: [
      {
        id: "b2-unit-1",
        trackLevel: "B2",
        unitNumber: 1,
        title: "Architectural Trade-Off Defense",
        description:
          "Articulate engineering choices with clarity: why you chose PostgreSQL over MongoDB, or why you decoupled a monolith.",
        badge: "Architecture & Trade-offs",
        lessons: [
          {
            id: "b2-u1-l1",
            unitId: "b2-unit-1",
            lessonNumber: 1,
            title: "Defending SQL vs NoSQL: ACID vs Eventual Consistency",
            subtitle: "Persuading Staff Engineers and Architects during RFC design reviews",
            estimatedMinutes: 7,
            targetSkills: [
              "Contrasting connectives (While X offers, Y guarantees)",
              "Quantifying trade-offs (latency vs consistency)",
              "Executive confidence",
            ],
            dialogue: [
              {
                id: "d1",
                speaker: "Alex",
                role: "Principal Architect",
                text: "Wisman, your design doc proposes PostgreSQL with JSONB columns. Why not just use MongoDB directly for the product catalog?",
                keyPhraseHighlight: "proposes... Why not just use...?",
                indonesianHint: "Mengusulkan... Mengapa tidak memakai saja...?",
              },
              {
                id: "d2",
                speaker: "Wisman",
                role: "Senior Engineer",
                text: "That's a fair question, Alex. While MongoDB offers schema flexibility, our billing and inventory services require strict ACID guarantees across transactions.",
                keyPhraseHighlight: "That's a fair question... While X offers..., Y requires strict...",
                indonesianHint: "Pertanyaan bagus... Meskipun X menawarkan..., Y memerlukan jaminan ketat...",
              },
              {
                id: "d3",
                speaker: "Wisman",
                role: "Senior Engineer",
                text: "Postgres gives us the best of both worlds: relational integrity for financial rows, and JSONB indexing for dynamic catalog attributes without introducing dual-database maintenance overhead.",
                keyPhraseHighlight: "best of both worlds... without introducing... overhead",
                indonesianHint: "Kelebihan dari kedua opsi... tanpa memunculkan beban pemeliharaan ganda",
              },
              {
                id: "d4",
                speaker: "Alex",
                role: "Principal Architect",
                text: "Well reasoned. How do you plan to handle read scaling once traffic spikes during flash sales?",
                keyPhraseHighlight: "Well reasoned... handle read scaling",
                indonesianHint: "Alasan yang solid... menangani lonjakan baca data",
              },
              {
                id: "d5",
                speaker: "Wisman",
                role: "Senior Engineer",
                text: "We'll deploy read replicas combined with a Redis caching layer using a Cache-Aside pattern with a 60-second TTL.",
                keyPhraseHighlight: "read replicas... Cache-Aside pattern with TTL",
                indonesianHint: "Replika baca... pola Cache-Aside dengan batas waktu kadaluarsa",
              },
            ],
            quiz: [
              {
                id: "q1",
                type: "pragmatic_tone",
                question: "Pilih frasa pembuka terbaik saat seorang Senior Staff menantang pilihan arsitektur Anda dalam interview atau design review:",
                options: [
                  { id: "opt1", text: "That's a valid concern. The reason we opted for X over Y comes down to three key trade-offs...", isCorrect: true, explanation: "Mengakui sudut pandang penanya secara tenang, lalu mengelaborasi 3 poin pertimbangan terstruktur." },
                  { id: "opt2", text: "You don't understand our architecture.", isCorrect: false, explanation: "Defensif dan tidak mencerminkan kedewasaan Staff-level." },
                  { id: "opt3", text: "MongoDB is just worse.", isCorrect: false, explanation: "Dogmatis dan tanpa analisis trade-off teknis." },
                ],
                explanation: "Di level Staff/Senior, argumen selalu berpusat pada trade-off (keuntungan vs kerugian), bukan dogmatisme teknologi.",
              },
            ],
            rolePlay: {
              scenario: "The interviewer asks why you chose an asynchronous queue (RabbitMQ/BullMQ) instead of handling tasks synchronously in the API endpoint.",
              characterName: "Alex",
              characterRole: "Principal Architect",
              promptQuestion: "Why did you introduce a message broker into this architecture? Doesn't it add unnecessary operational complexity?",
              sentenceStarters: [
                "That's a valid trade-off to consider, Alex. The main motivation was...",
                "By decoupling the ingestion from processing, we ensure that sudden traffic surges...",
                "If we handled this synchronously, any downstream latency in the third-party API would...",
              ],
              modelAnswer: "That's a valid concern regarding operational overhead, Alex. The primary driver was protecting our API response latency. By offloading PDF generation to a message broker, our customer-facing endpoint responds in under 50ms, while workers can scale horizontally and retry failed jobs with exponential backoff without risking request timeouts.",
            },
          },
        ],
      },
      {
        id: "b2-unit-2",
        trackLevel: "B2",
        unitNumber: 2,
        title: "Behavioral Leadership Interview (The STAR Method)",
        description:
          "Structure complex stories of technical disagreements and leadership challenges using Situation, Task, Action, and Result.",
        badge: "STAR Interview Mastery",
        lessons: [
          {
            id: "b2-u2-l1",
            unitId: "b2-unit-2",
            lessonNumber: 1,
            title: "Navigating a Strong Technical Disagreement with a Colleague",
            subtitle: "Demonstrating high emotional intelligence and data-driven alignment",
            estimatedMinutes: 7,
            targetSkills: [
              "The STAR narrative arc (Situation -> Task -> Action -> Result)",
              "Data-driven persuasion vs ego",
              "Disagree and commit principle",
            ],
            dialogue: [
              {
                id: "d1",
                speaker: "Hiring Manager",
                role: "Director of Engineering",
                text: "Tell me about a time you strongly disagreed with an engineering decision made by another senior engineer or your manager. How did you handle it?",
                keyPhraseHighlight: "Tell me about a time you strongly disagreed...",
                indonesianHint: "Pertanyaan behavioral klasik Big Tech tentang resolusi konflik",
              },
              {
                id: "d2",
                speaker: "Wisman",
                role: "Candidate",
                text: "In my previous project, our team was divided on whether to rewrite our core payment pipeline in Rust or optimize the existing Node.js service (Situation).",
                keyPhraseHighlight: "team was divided on whether to...",
                indonesianHint: "[Situation] Tim terbelah pandangan mengenai...",
              },
              {
                id: "d3",
                speaker: "Wisman",
                role: "Candidate",
                text: "As the lead engineer on the feature, my task was to resolve the deadlock so we wouldn't miss our Q3 release deadline (Task).",
                keyPhraseHighlight: "my task was to resolve the deadlock...",
                indonesianHint: "[Task] Tugas saya adalah memecahkan kebuntuan...",
              },
              {
                id: "d4",
                speaker: "Wisman",
                role: "Candidate",
                text: "Instead of debating theoretically, I set up a two-day benchmark POC comparing CPU usage and memory profiles under 10k RPS. I also calculated the engineer onboarding ramp-up cost for Rust (Action).",
                keyPhraseHighlight: "Instead of debating theoretically, I set up a benchmark POC... (Action)",
                indonesianHint: "[Action] Alih-alih berdebat teori, saya membuat POC benchmark objektif...",
              },
              {
                id: "d5",
                speaker: "Wisman",
                role: "Candidate",
                text: "The data showed Node.js with clustering solved our throughput target with zero hiring friction. The other engineer appreciated the objective metrics and agreed to proceed. We shipped on schedule with a 65% reduction in latency (Result).",
                keyPhraseHighlight: "The data showed... agreed to proceed... shipped on schedule (Result)",
                indonesianHint: "[Result] Data membuktikan... sepakat maju... rilis tepat waktu dengan penurunan latency 65%",
              },
            ],
            quiz: [
              {
                id: "q1",
                type: "pragmatic_tone",
                question: "Dalam metode STAR untuk interview behavioral, apa kesalahan terbesar yang sering dilakukan kandidat insinyur?",
                options: [
                  { id: "opt1", text: "Terlalu lama di 'Situation' (bercerita latar belakang teknis rumit) dan lupa menjelaskan 'Action' pribadi dan 'Result' yang terukur.", isCorrect: true, explanation: "Interviewer ingin mendengar APA yang ANDA lakukan (Action) dan apa DAMPAK terukurnya (Result)." },
                  { id: "opt2", text: "Menyebutkan nama teknologi yang dipakai.", isCorrect: false, explanation: "Menyebutkan teknologi adalah hal wajar." },
                  { id: "opt3", text: "Berbicara dengan suara tenang.", isCorrect: false, explanation: "Ketenangan adalah nilai plus." },
                ],
                explanation: "Alokasikan 70% waktu bicara Anda pada 'Action' (inisiatif Anda) dan 'Result' (metrik keberhasilan).",
              },
            ],
            rolePlay: {
              scenario: "The Director of Engineering asks you about a failure or mistake you made in production.",
              characterName: "Hiring Manager",
              characterRole: "Director of Engineering",
              promptQuestion: "Wisman, tell me about a time a release went wrong under your watch. What did you learn and how did you handle the aftermath?",
              sentenceStarters: [
                "Earlier in my career, I deployed a database migration that accidentally locked a table...",
                "My immediate action was to communicate with the on-call team and initiate a rollback...",
                "Following the incident, I wrote a blameless post-mortem and instituted automated migration checks...",
              ],
              modelAnswer: "A few years back, I deployed an index migration on a high-traffic table without the CONCURRENTLY flag, which caused query queuing and elevated error rates for about 8 minutes. My immediate action was rolling back the migration and stabilizing traffic. Once resolved, I led a blameless post-mortem and added automated CI linters to block non-concurrent index creation. That experience taught me the paramount value of defensive deployment procedures.",
            },
          },
        ],
      },
    ],
  },
];
