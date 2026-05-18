export function pickSubject(r, tone) {
  if (tone === "italian") return `Complimenti per ${r.company} — un caffè?`;
  if (tone === "spanish") return `Enhorabuena por ${r.company} — ¿un café?`;
  if (tone === "punchy") return `${r.company} — quick one`;
  if (tone === "thoughtful") return `A small thought on ${r.company}'s ${r.sector.split("/")[0].trim()} angle`;
  return `Saw the news on ${r.company} — would love to say hi`;
}

export function pickIntro(r, tone, name, angle) {
  if (tone === "italian") {
    return `Ciao ${name},\n\nho letto del round di ${r.company} (${r.summary.split(".")[0]}) — complimenti, signal molto interessante.`;
  }
  if (tone === "spanish") {
    return `Hola ${name},\n\nacabo de ver lo de ${r.company} (${r.summary.split(".")[0]}) — ¡enhorabuena!`;
  }
  if (tone === "punchy") {
    return `${name} — quick note. Saw ${r.company}'s signal today and wanted to reach out before the inbox storm.`;
  }
  if (tone === "thoughtful") {
    return `Hi ${name},\n\nI've been tracking the ${angle} closely and ${r.company}'s ${r.sector.toLowerCase()} approach caught my attention — particularly the ${stageDescriptor(r.stage)} timing.`;
  }
  return `Hi ${name},\n\nCongrats on ${r.company} — I came across the ${r.signalType.toLowerCase()} signal and wanted to introduce myself.`;
}

export function pickWhy(r, tone) {
  const sector = r.sector.toLowerCase();
  if (tone === "italian") return `Investo (privatamente) a early-stage in EU/UK, con un focus particolare sui fondatori del Sud Europa. ${r.summary}`;
  if (tone === "spanish") return `Invierto a título personal en early-stage en EU/UK, con foco en fundadores del Sur de Europa. ${r.summary}`;
  if (tone === "punchy") return `I back early-stage EU/UK founders, with a strong bias toward ${r.soeu ? "Southern European angles" : "technical founders shipping fast"}. ${r.summary.split(".")[0]}.`;
  if (tone === "thoughtful") return `Most ${sector} bets right now feel undifferentiated. Yours doesn't — the ${r.stage.toLowerCase()} positioning and ${r.hq.split(",")[0]} HQ are exactly where the curve bends. ${r.summary}`;
  return `I write small early-stage cheques into EU/UK/IE founders${r.soeu ? ", with a Southern European lens" : ""}. ${r.summary}`;
}

export function pickAsk(r, tone) {
  if (tone === "italian") return `Se ti capita 20 minuti nelle prossime due settimane — anche solo per conoscersi, niente pitch — sarei felicissimo.`;
  if (tone === "spanish") return `Si tienes 20 minutos libres en las próximas dos semanas — solo para conocernos, sin presentación — me encantaría.`;
  if (tone === "punchy") return `20 mins next week? I'll keep it short.`;
  if (tone === "thoughtful") return `No pitch on your end needed — happy to be useful first (warm intros, hiring, customer leads). 20-30 mins if you can spare it?`;
  return `Would love 20 mins to learn more about what you're building. Happy to share any reflections I have from other ${r.sector.split("/")[0].trim().toLowerCase()} bets I track.`;
}

export function stageDescriptor(s) {
  if (s === "Pre-seed" || s === "Stealth") return "pre-product";
  if (s === "Seed") return "post-product, pre-scale";
  return s.toLowerCase();
}

export function generateDraft(r, tone) {
  if (!r) return { subject: "", body: "" };
  const angle = r.soeu ? "Southern European founder ecosystem" : "European tech";
  const firstName = (r.founder.split(/[, &]/)[0] || r.founder).split(" ")[0];
  const intro = pickIntro(r, tone, firstName, angle);
  const why = pickWhy(r, tone);
  const ask = pickAsk(r, tone);
  return {
    subject: `Subject:  ${pickSubject(r, tone)}`,
    body: `${intro}\n\n${why}\n\n${ask}\n\nBest,\nNadhi\n\n— Found via ${r.source || "public signal"}: ${r.sourceUrl || ""}`,
  };
}
