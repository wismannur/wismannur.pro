import { and, asc, desc, eq, ilike, ne, or, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import type { AiKnowledgeItem } from "@/services/ai-knowledge/types";

const { aiKnowledgeItems, cmsCopilotSessions, cmsCopilotMessages } = schema;

export interface SecondBrainHistorySnippet {
  sessionId: string;
  sessionTitle: string;
  role: string;
  content: string;
  toolCallsSummary?: string[];
  createdAt: Date | string;
}

/**
 * Retrieve complete snapshot of all knowledge items in table ai_knowledge_items
 */
export async function getSecondBrainTableSnapshot(): Promise<AiKnowledgeItem[]> {
  const db = getDb();
  return db
    .select()
    .from(aiKnowledgeItems)
    .orderBy(
      asc(aiKnowledgeItems.category),
      asc(aiKnowledgeItems.sortOrder),
      desc(aiKnowledgeItems.updatedAt)
    );
}

/**
 * Search and retrieve past Copilot sessions & messages that discussed Second Brain
 */
export async function getSecondBrainCopilotHistory(
  currentSessionId?: string,
  searchKeyword?: string
): Promise<SecondBrainHistorySnippet[]> {
  const db = getDb();

  try {
    const searchConditions = [
      ilike(cmsCopilotMessages.content, "%second brain%"),
      ilike(cmsCopilotMessages.content, "%second-brain%"),
      ilike(cmsCopilotMessages.content, "%ai-knowledge%"),
      ilike(cmsCopilotMessages.content, "%ai_knowledge%"),
      ilike(cmsCopilotMessages.content, "%/my-second-brain%"),
      ilike(cmsCopilotSessions.title, "%second brain%"),
      sql`${cmsCopilotMessages.toolCalls}::text ILIKE '%ai_knowledge%'`,
      sql`${cmsCopilotMessages.toolCalls}::text ILIKE '%second_brain%'`,
    ];

    if (searchKeyword && searchKeyword.trim().length > 3) {
      searchConditions.push(ilike(cmsCopilotMessages.content, `%${searchKeyword.trim()}%`));
    }

    const whereCondition = currentSessionId
      ? and(
          ne(cmsCopilotMessages.sessionId, currentSessionId),
          or(...searchConditions)
        )
      : or(...searchConditions);

    const rows = await db
      .select({
        sessionId: cmsCopilotMessages.sessionId,
        sessionTitle: cmsCopilotSessions.title,
        role: cmsCopilotMessages.role,
        content: cmsCopilotMessages.content,
        toolCalls: cmsCopilotMessages.toolCalls,
        createdAt: cmsCopilotMessages.createdAt,
      })
      .from(cmsCopilotMessages)
      .innerJoin(cmsCopilotSessions, eq(cmsCopilotMessages.sessionId, cmsCopilotSessions.id))
      .where(whereCondition)
      .orderBy(desc(cmsCopilotMessages.createdAt))
      .limit(20);

    return rows.map((r) => {
      let toolCallsSummary: string[] | undefined;
      if (Array.isArray(r.toolCalls)) {
        toolCallsSummary = (r.toolCalls as Array<{ name?: string }>)
          .map((tc) => tc?.name)
          .filter((name): name is string => Boolean(name));
      }

      return {
        sessionId: r.sessionId,
        sessionTitle: r.sessionTitle,
        role: r.role,
        content: r.content,
        toolCallsSummary,
        createdAt: r.createdAt,
      };
    });
  } catch (err) {
    console.error("[Second Brain Skill History Retrieval Error]:", err);
    return [];
  }
}

/**
 * Builds high-density, structured Second Brain skill context for Gemini 3.8 Flash
 */
export async function buildSecondBrainSkillContext(params: {
  currentSessionId?: string;
  query?: string;
}): Promise<string> {
  const [items, history] = await Promise.all([
    getSecondBrainTableSnapshot(),
    getSecondBrainCopilotHistory(params.currentSessionId, params.query),
  ]);

  // Group items by category
  const categorized: Record<string, AiKnowledgeItem[]> = {};
  for (const item of items) {
    const cat = item.category || "general";
    if (!categorized[cat]) categorized[cat] = [];
    categorized[cat].push(item);
  }

  const tableSummaryLines: string[] = [];
  tableSummaryLines.push(
    `### 📚 TOTAL KNOWLEDGE ITEMS DI DATABASE: ${items.length} item wawasan dalam ${Object.keys(categorized).length} kategori.`
  );

  for (const [category, catItems] of Object.entries(categorized)) {
    tableSummaryLines.push(`\n#### KATEGORI: [${category.toUpperCase()}] (${catItems.length} item)`);
    for (const item of catItems) {
      const tagsStr = item.tags && item.tags.length > 0 ? ` [Tags: ${item.tags.join(", ")}]` : "";
      tableSummaryLines.push(`- **ID**: \`${item.id}\` | **Judul**: "${item.title}"${tagsStr}`);
      tableSummaryLines.push(`  **Status**: ${item.isPublished ? "Published" : "Draft"}`);
      tableSummaryLines.push(`  **Isi Wawasan**:`);
      tableSummaryLines.push(
        item.content
          .split("\n")
          .map((l) => `  > ${l}`)
          .join("\n")
      );
    }
  }

  const historySummaryLines: string[] = [];
  if (history.length === 0) {
    historySummaryLines.push("Belum ada riwayat percakapan lampau di sesi lain yang mendiskusikan Second Brain.");
  } else {
    // Group history by session ID
    const sessionsMap: Record<
      string,
      { title: string; date: string; turns: string[] }
    > = {};

    for (const h of history) {
      if (!sessionsMap[h.sessionId]) {
        sessionsMap[h.sessionId] = {
          title: h.sessionTitle,
          date: new Date(h.createdAt).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
          turns: [],
        };
      }
      const toolInfo =
        h.toolCallsSummary && h.toolCallsSummary.length > 0
          ? ` (Actions: ${h.toolCallsSummary.join(", ")})`
          : "";
      const snippet = h.content.length > 300 ? h.content.slice(0, 300) + "..." : h.content;
      sessionsMap[h.sessionId].turns.push(
        `• [${h.role.toUpperCase()}${toolInfo}]: "${snippet.replace(/\n+/g, " ")}"`
      );
    }

    for (const [sessId, sess] of Object.entries(sessionsMap)) {
      historySummaryLines.push(
        `- **Sesi: "${sess.title}"** (ID: \`${sessId}\`, Tanggal: ${sess.date}):`
      );
      for (const turn of sess.turns) {
        historySummaryLines.push(`  ${turn}`);
      }
    }
  }

  return `
================================================================================
🧠 ACTIVE SKILL ACTIVATED: /my-second-brain (Persona & Digital Twin Engine)
Kang Wisman Nur telah memanggil skill khusus: "/my-second-brain".
Berikut adalah LIVE & LENGKAP snapshot seluruh data table My Second Brain (ai_knowledge_items)
serta ringkasan riwayat percakapan sesi Copilot terdahulu yang berkaitan dengan Second Brain.
================================================================================

### [SOURCE 1: LIVE DATA TABLE MY SECOND BRAIN (ai_knowledge_items)]
${tableSummaryLines.join("\n")}

### [SOURCE 2: RIWAYAT SESI COPILOT TERDAHULU MENGENAI SECOND BRAIN]
${historySummaryLines.join("\n")}

================================================================================
PETUNJUK EKSEKUSI SKILL /my-second-brain UNTUK GEMINI 3.8 FLASH:

1. IDENTIFIKASI INTENT UTAMA KANG WISMAN:
   A. JIKA QUERY / PERTANYAAN (misalnya: "apa saja wawasan tentang CQRS?", "rangkum tech-opinions", "pernah ada cerita outage apa?"):
      - Jawab langsung secara komprehensif, padat, dan berbobot Senior Staff berdasarkan SOURCE 1 & SOURCE 2.
      - Kutip item-item yang relevan lengkap dengan Judul, Kategori, dan ID wawasan.
   B. JIKA BRAIN-DUMP / CERITA KARIR / PENGALAMAN / OPINI ARSITEKTUR BARU:
      - Jalankan protokol komparasi, identifikasi gap, dan drafting di bawah ini.

2. CROSS-CHECK MENYELURUH DENGAN DATA EKSISTING (SOURCE 1):
   - Periksa apakah ide, sistem arsitektur, proyek, atau pengalaman yang Kang Wisman sampaikan SUDAH pernah dicatat di table My Second Brain di atas.
   - Jika SUDAH ADA atau SEBAGIAN ADA: Sebutkan judul dan ID wawasan tersebut secara eksplisit. Jelaskan apa yang sudah tercatat dan apa nilai tambah / sudut pandang baru dari cerita Kang Wisman saat ini.
   - Jika BELUM ADA: Nyatakan dengan jelas bahwa ini adalah wawasan baru yang belum terdokumentasi di Second Brain.

3. SINTESIS DENGAN RIWAYAT SESI TERDAHULU (SOURCE 2):
   - Jika topik ini pernah didiskusikan di sesi Copilot sebelumnya (misalnya saat sesi brain dump atau drafting), sambungkan benang merahnya ("Di sesi [Judul Sesi], Kang Wisman sempat membahas tentang...").
   - Jika belum pernah dibahas di sesi lampau, fokus penuh pada wawasan baru yang sedang dibagikan.

4. PROACTIVE DRAFTING DENGAN STRUKTUR STANDAR EMAS (GOLD STANDARD):
   - Susun draft wawasan baru atau usulan revisi wawasan lama dengan format Markdown terstruktur:
     • 📌 **Judul Diusulkan**: (Executive, padat, berorientasi dampak nyata)
     • 🏷️ **Kategori**: (Pilih satu: career-impact, tech-opinions, case-studies, writing-voice, technical, philosophy, screening, projects, hiring, general)
     • 🏷️ **Tags**: (Daftar tags relevan)
     • 📝 **Draft Konten Markdown**:
       - **Konteks & Latar Belakang Masalah**
       - **Keputusan Arsitektur & Tindakan Nyata**
       - **Dampak Terverifikasi & Metrik** (hanya yang nyata)
       - **Trade-offs & Refleksi Senior Staff**
   - Tawarkan tindakan langsung:
     - "Apakah draft wawasan di atas ingin saya simpan ke database sekarang via create_ai_knowledge_item?"
     - (Atau jika updating item lama): "Apakah ingin memperbarui wawasan ID [ID] via update_ai_knowledge_item?"

5. STRICT ZERO-FABRICATION PROTOCOL:
   - DILARANG KERAS mengarang angka metrik, persentase, nama perusahaan, atau teknologi yang tidak pernah disebutkan oleh Kang Wisman. Semua penalaran harus 100% berakar pada fakta nyata. Jika metrik angka tidak diceritakan, jelaskan dampaknya secara arsitektural dan kualitatif.
================================================================================
`;
}
