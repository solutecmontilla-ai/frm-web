require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");

const BOT_TOKEN  = process.env.BOT_TOKEN;
const ADMIN_IDS  = (process.env.ADMIN_IDS || "").split(",").map((id) => parseInt(id.trim())).filter(Boolean);
const API_URL    = process.env.API_URL    || "http://127.0.0.1:3007";
const API_SECRET = process.env.API_SECRET;

if (!BOT_TOKEN)  { console.error("ERROR: BOT_TOKEN no configurado"); process.exit(1); }
if (!API_SECRET) { console.error("ERROR: API_SECRET no configurado"); process.exit(1); }

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// ─── Utilidades ────────────────────────────────────────────────────────────

function isAdmin(userId) { return ADMIN_IDS.includes(userId); }

function escapeMd(text) {
  return String(text).replace(/[_*[\]()~`>#+=|{}.!-]/g, "\\$&");
}

async function api(method, path, body = null) {
  const opts = {
    method,
    headers: { "Content-Type": "application/json", "x-admin-secret": API_SECRET },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API_URL}${path}`, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

function parseResult(text) {
  const m = text.match(/(\d+)\s*-\s*(\d+)/);
  if (!m) return null;
  const idx = text.indexOf(m[0]);
  return { home: text.slice(0, idx).trim(), homeScore: parseInt(m[1]), awayScore: parseInt(m[2]), away: text.slice(idx + m[0].length).trim() };
}

function parseScorers(text) {
  if (!text?.trim()) return [];
  const out = [];
  const re = /([^,()\n]+?)\s*\((\d+)\)/g;
  let m;
  while ((m = re.exec(text)) !== null) out.push({ name: m[1].trim(), goals: parseInt(m[2]) });
  if (out.length) return out;
  for (const part of text.split(",")) {
    const p = part.trim().match(/^(.+?)\s+(\d+)$/);
    if (p) out.push({ name: p[1].trim(), goals: parseInt(p[2]) });
  }
  return out;
}

// ─── Formatos ──────────────────────────────────────────────────────────────

function formatTabla(teams, torneo) {
  const label = torneo === "torneo40" ? "⚽ Liga FRM \\+40" : "🌙 Liga FRM \\+35";
  let msg = `*${label} — Tabla de Posiciones*\n\n`;
  msg += "`#  Equipo              PJ  G  E  P  GF GC DG  PTS`\n";
  msg += "`──────────────────────────────────────────────────`\n";
  for (const t of teams) {
    const pos  = String(t.position).padStart(2);
    const name = t.name.padEnd(18).slice(0, 18);
    const pj   = String(t.played).padStart(2);
    const g    = String(t.won).padStart(2);
    const e    = String(t.drawn).padStart(2);
    const p    = String(t.lost).padStart(2);
    const gf   = String(t.goalsFor).padStart(3);
    const gc   = String(t.goalsAgainst).padStart(3);
    const dg   = (t.goalDifference > 0 ? "+" + t.goalDifference : String(t.goalDifference)).padStart(3);
    const pts  = String(t.points).padStart(4);
    msg += `\`${pos} ${name}${pj} ${g} ${e} ${p}${gf}${gc}${dg} ${pts}\`\n`;
  }
  return msg;
}

function formatGoleadores(scorers, torneo) {
  const label = torneo === "torneo40" ? "⚽ Liga FRM \\+40" : "🌙 Liga FRM \\+35";
  let msg = `*${label} — Goleadores*\n\n`;
  scorers.slice(0, 20).forEach((s, i) => {
    const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}\\. `;
    msg += `${medal} *${escapeMd(s.name)}* \\(${escapeMd(s.team)}\\) — *${s.goals}* goles\n`;
  });
  return msg;
}

function formatAmarillas(jugadores, torneo) {
  const label = torneo === "torneo40" ? "⚽ Liga FRM \\+40" : "🌙 Liga FRM \\+35";
  let msg = `*${label} — Tarjetas Amarillas*\n\n`;
  jugadores.slice(0, 20).forEach((j, i) => {
    msg += `${i + 1}\\. *${escapeMd(j.name)}* \\(${escapeMd(j.team)}\\) — 🟨 *${j.tarjetas}*\n`;
  });
  return msg;
}

// ─── Handlers públicos ─────────────────────────────────────────────────────

bot.onText(/\/(start|ayuda|help)/, (msg) => {
  const chatId = msg.chat.id;
  const isAdm  = isAdmin(msg.from.id);
  let text = `🏆 *FRM Bot — Liga de Fútbol*\n\n*Comandos:*\n\n`;
  text += `📊 \`/tabla40\` \`/tabla35\`\n`;
  text += `⚽ \`/goles40\` \`/goles35\`\n`;
  text += `🟨 \`/amarillas40\` \`/amarillas35\`\n`;
  text += `📅 \`/proximos40\` \`/proximos35\`\n`;
  if (isAdm) {
    text += `\n*🔐 Admin:*\n\n`;
    text += `📝 \`/r40 Local M\\-V Visita J\\[N\\]\`\n`;
    text += `   _Goles: \\| LocalGoles \\| VisitaGoles_\n`;
    text += `   _Amarillas: \\|\\| NombreLocal \\| NombreVisita_\n`;
    text += `   _Ej: /r40 Real Maracay 3\\-1 Golazo J10 \\| Ruiz\\(2\\) \\| Briceño\\(1\\) \\|\\| López \\| García_\n\n`;
    text += `🏆 \`/playoff40 QF\\|SF\\|F Local M\\-V Visita \\[P pen1\\-pen2\\] \\[\\| Goles \\| Goles\\]\`\n`;
    text += `   _Ej: /playoff40 SF Real Maracay 1\\-1 Ágape P 7\\-6_\n\n`;
    text += `📅 \`/proximo40 Local vs Visita \\| Dia Hora Campo\`\n`;
    text += `🗑️ \`/borrarproximos40\` \`/borrarproximos35\`\n`;
  }
  bot.sendMessage(chatId, text, { parse_mode: "MarkdownV2" });
});

bot.onText(/\/tabla(40|35)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const torneo = `torneo${match[1]}`;
  try {
    const { teams } = await api("GET", `/api/${torneo}/tabla`);
    bot.sendMessage(chatId, formatTabla(teams, torneo), { parse_mode: "MarkdownV2" });
  } catch (e) { bot.sendMessage(chatId, `❌ ${e.message}`); }
});

bot.onText(/\/goles(40|35)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const torneo = `torneo${match[1]}`;
  try {
    const { scorers } = await api("GET", `/api/${torneo}/goleadores`);
    bot.sendMessage(chatId, formatGoleadores(scorers, torneo), { parse_mode: "MarkdownV2" });
  } catch (e) { bot.sendMessage(chatId, `❌ ${e.message}`); }
});

bot.onText(/\/amarillas(40|35)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const torneo = `torneo${match[1]}`;
  try {
    const { jugadores } = await api("GET", `/api/${torneo}/amarillas`);
    if (!jugadores.length) return bot.sendMessage(chatId, "🟨 Sin tarjetas registradas.");
    bot.sendMessage(chatId, formatAmarillas(jugadores, torneo), { parse_mode: "MarkdownV2" });
  } catch (e) { bot.sendMessage(chatId, `❌ ${e.message}`); }
});

bot.onText(/\/proximos(40|35)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const torneo = `torneo${match[1]}`;
  try {
    const data = await api("GET", `/api/${torneo}/proximos`);
    if (!data.matchdays?.length) return bot.sendMessage(chatId, "📅 Sin partidos programados.");
    let text = `*Próximos Partidos*\n\n`;
    for (const d of data.matchdays) {
      text += `📅 *${escapeMd(d.day)}* — 📍 ${escapeMd(d.venue)}\n`;
      for (const m of d.matches) text += `  ⚔️ ${escapeMd(m.homeTeam)} vs ${escapeMd(m.awayTeam)} 🕐 ${escapeMd(m.time)}\n`;
      text += "\n";
    }
    bot.sendMessage(chatId, text, { parse_mode: "MarkdownV2" });
  } catch (e) { bot.sendMessage(chatId, `❌ ${e.message}`); }
});

// ─── Admin: /r40 — resultado ───────────────────────────────────────────────
// Formato: /r40 Local M-V Visita J10 | GolesLocal | GolesVisita || AmaLocal | AmaVisita
bot.onText(/\/r(40|35)\s+(.+)/i, async (msg, match) => {
  const chatId = msg.chat.id;
  if (!isAdmin(msg.from.id)) return bot.sendMessage(chatId, "🔐 Solo administradores.");

  const torneo = `torneo${match[1]}`;
  const [golesPart, amarillasPart = ""] = match[2].split("||").map((s) => s.trim());
  const parts = golesPart.split("|").map((s) => s.trim());
  const resultPart    = parts[0];
  const golesLocalRaw  = parts[1] || "";
  const golesVisitaRaw = parts[2] || "";
  const [amarillasLocalRaw = "", amarillasVisitaRaw = ""] = amarillasPart.split("|").map((s) => s.trim());

  let jornada = null, jornadaLabel = null, resultText = resultPart;
  const jm = resultPart.match(/\s+(J\d+|QF|SF|F|j\d+)\s*$/i);
  if (jm) {
    const j = jm[1].toUpperCase();
    if (j === "QF")      { jornada = -1; jornadaLabel = "Cuartos de Final"; }
    else if (j === "SF") { jornada = -2; jornadaLabel = "Semifinales"; }
    else if (j === "F")  { jornada = -3; jornadaLabel = "Final"; }
    else { jornada = parseInt(j.slice(1)); jornadaLabel = `Fecha ${jornada}`; }
    resultText = resultPart.slice(0, jm.index).trim();
  }

  const parsed = parseResult(resultText);
  if (!parsed) return bot.sendMessage(chatId, `❌ Formato: /r${match[1]} Real Maracay 3-1 Golazo J10`);

  const golesLocal      = parseScorers(golesLocalRaw);
  const golesVisita     = parseScorers(golesVisitaRaw);
  const amarillasLocal  = amarillasLocalRaw  ? amarillasLocalRaw.split(",").map((s)  => s.trim()).filter(Boolean) : [];
  const amarillasVisita = amarillasVisitaRaw ? amarillasVisitaRaw.split(",").map((s) => s.trim()).filter(Boolean) : [];

  try {
    const { tabla } = await api("POST", "/api/admin/resultado", {
      torneo, localNombre: parsed.home, localGoles: parsed.homeScore,
      visitaNombre: parsed.away, visitaGoles: parsed.awayScore,
      jornada, jornadaLabel, golesLocal, golesVisita,
      amarillasLocal, amarillasVisita,
    });

    let reply = `✅ *Resultado registrado*${jornadaLabel ? ` — ${escapeMd(jornadaLabel)}` : ""}\n\n`;
    reply += `⚽ *${escapeMd(parsed.home)}* ${parsed.homeScore}\\-${parsed.awayScore} *${escapeMd(parsed.away)}*`;
    if (golesLocal.length)  reply += `\n🏠 ${golesLocal.map((g) => `${escapeMd(g.name)}\\(${g.goals}\\)`).join(", ")}`;
    if (golesVisita.length) reply += `\n✈️ ${golesVisita.map((g) => `${escapeMd(g.name)}\\(${g.goals}\\)`).join(", ")}`;
    if (amarillasLocal.length || amarillasVisita.length) {
      reply += `\n🟨`;
      if (amarillasLocal.length)  reply += ` ${escapeMd(parsed.home)}: ${amarillasLocal.map(escapeMd).join(", ")}`;
      if (amarillasVisita.length) reply += ` \\| ${escapeMd(parsed.away)}: ${amarillasVisita.map(escapeMd).join(", ")}`;
    }
    reply += `\n\n📊 Top 3:\n` + tabla.slice(0, 3).map((t) => `${t.position}\\. ${escapeMd(t.name)} — ${t.points} pts`).join("\n");
    bot.sendMessage(chatId, reply, { parse_mode: "MarkdownV2" });
  } catch (e) { bot.sendMessage(chatId, `❌ ${e.message}`); console.error(e); }
});

// ─── Admin: /playoff40 ─────────────────────────────────────────────────────
bot.onText(/\/playoff(40|35)\s+(QF|SF|F)\s+(.+)/i, async (msg, match) => {
  const chatId = msg.chat.id;
  if (!isAdmin(msg.from.id)) return bot.sendMessage(chatId, "🔐 Solo administradores.");

  const torneo = `torneo${match[1]}`;
  const fase   = match[2].toUpperCase();
  const parts  = match[3].split("|").map((s) => s.trim());
  const resultRaw      = parts[0];
  const golesLocalRaw  = parts[1] || "";
  const golesVisitaRaw = parts[2] || "";

  let penalesLocal = null, penalesVisita = null, resultText = resultRaw;
  const pm = resultRaw.match(/\s+[Pp]\s+(\d+)\s*-\s*(\d+)\s*$/);
  if (pm) {
    penalesLocal  = parseInt(pm[1]);
    penalesVisita = parseInt(pm[2]);
    resultText    = resultRaw.slice(0, pm.index).trim();
  }

  const parsed = parseResult(resultText);
  if (!parsed) return bot.sendMessage(chatId, `❌ Ej: /playoff${match[1]} SF Real Maracay 1-1 Ágape P 7-6`);

  try {
    const { ganador } = await api("POST", "/api/admin/playoff", {
      torneo, fase,
      localNombre: parsed.home, localGoles: parsed.homeScore,
      visitaNombre: parsed.away, visitaGoles: parsed.awayScore,
      penalesLocal, penalesVisita,
      golesLocal: parseScorers(golesLocalRaw),
      golesVisita: parseScorers(golesVisitaRaw),
    });

    const faseLabel = fase === "QF" ? "Cuartos de Final" : fase === "SF" ? "Semifinal" : "Final";
    const penStr    = penalesLocal !== null ? ` \\(${penalesLocal}\\-${penalesVisita} pen\\)` : "";
    let reply = `✅ *${escapeMd(faseLabel)} actualizado*\n\n`;
    reply += `⚽ *${escapeMd(parsed.home)}* ${parsed.homeScore}\\-${parsed.awayScore} *${escapeMd(parsed.away)}*${penStr}\n`;
    reply += `\n🏆 Avanza: *${escapeMd(ganador)}*`;
    bot.sendMessage(chatId, reply, { parse_mode: "MarkdownV2" });
  } catch (e) { bot.sendMessage(chatId, `❌ ${e.message}`); console.error(e); }
});

// ─── Admin: /proximo40 ─────────────────────────────────────────────────────
bot.onText(/\/proximo(40|35)\s+(.+)/i, async (msg, match) => {
  const chatId = msg.chat.id;
  if (!isAdmin(msg.from.id)) return bot.sendMessage(chatId, "🔐 Solo administradores.");

  const parts    = match[2].split("|").map((s) => s.trim());
  const vsMatch  = parts[0].match(/^(.+?)\s+vs\s+(.+)$/i);
  const schedMatch = (parts[1] || "").match(/^(\S+)\s+(\d{1,2}:\d{2}\s*[APMapm]*)\s*(.*)$/);
  if (!vsMatch || !schedMatch) return bot.sendMessage(chatId, `❌ Formato: /proximo${match[1]} Local vs Visita | Sabado 15:30 La Trinidad`);

  try {
    await api("POST", "/api/admin/proximo", {
      torneo: `torneo${match[1]}`,
      localNombre: vsMatch[1].trim(), visitaNombre: vsMatch[2].trim(),
      dia: schedMatch[1], hora: schedMatch[2].trim(), cancha: schedMatch[3].trim() || "La Trinidad",
    });
    bot.sendMessage(chatId,
      `✅ *${escapeMd(vsMatch[1])}* vs *${escapeMd(vsMatch[2])}* — ${escapeMd(schedMatch[1])} ${escapeMd(schedMatch[2])}`,
      { parse_mode: "MarkdownV2" }
    );
  } catch (e) { bot.sendMessage(chatId, `❌ ${e.message}`); }
});

// ─── Admin: /borrarproximos40 ──────────────────────────────────────────────
bot.onText(/\/borrarproximos(40|35)/i, async (msg, match) => {
  const chatId = msg.chat.id;
  if (!isAdmin(msg.from.id)) return bot.sendMessage(chatId, "🔐 Solo administradores.");
  try {
    await api("DELETE", `/api/admin/proximos/torneo${match[1]}`);
    bot.sendMessage(chatId, `✅ Programación \\+${match[1]} borrada\\.`, { parse_mode: "MarkdownV2" });
  } catch (e) { bot.sendMessage(chatId, `❌ ${e.message}`); }
});

// ─── Inicio ────────────────────────────────────────────────────────────────
console.log("🤖 FRM Bot iniciado");
console.log(`🔗 API: ${API_URL}`);
console.log(`👑 Admins: ${ADMIN_IDS.join(", ") || "ninguno"}`);

bot.on("polling_error", (error) => console.error("Polling error:", error.message));
