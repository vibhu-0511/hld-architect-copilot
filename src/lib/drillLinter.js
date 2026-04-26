// Architecture linter v1. Operates on the drill state produced by DrillWizard.
// Each rule produces a Finding with a vault citation. Findings are sorted by
// severity (high → medium → low). Citations are validated against the indexed
// vault by the consumer (UI shows them as SourceNoteLinks; missing notes are
// disabled).

const REQUIRED_CONSTRAINTS = [
  "qpsRead",
  "qpsWrite",
  "latencyP95",
  "consistency",
  "cost",
  "team",
];

const CONSTRAINT_LABELS = {
  qpsRead: "read QPS",
  qpsWrite: "write QPS",
  latencyP95: "p95 latency target",
  consistency: "consistency tier",
  durability: "durability tier",
  cost: "cost ceiling",
  team: "team size",
  growth: "growth assumption",
};

function nonEmpty(value) {
  if (value == null) return false;
  return String(value).trim().length > 0;
}

function asInt(value) {
  if (value == null) return NaN;
  const n = parseInt(String(value).replace(/[^\d-]/g, ""), 10);
  return Number.isFinite(n) ? n : NaN;
}

const SEVERITY_RANK = { high: 0, medium: 1, low: 2 };

export function lintDrill(state) {
  const findings = [];
  const constraints = state.constraints || {};
  const components = state.components || [];

  // R1 — required constraints incomplete
  const missing = REQUIRED_CONSTRAINTS.filter((k) => !nonEmpty(constraints[k]));
  if (missing.length > 0) {
    findings.push({
      id: "missing-constraints",
      severity: "high",
      title: "Constraints incomplete",
      detail: `Missing: ${missing.map((k) => CONSTRAINT_LABELS[k] || k).join(", ")}. Without these, every later decision is a guess.`,
      suggestedFix:
        "Fill all required constraint fields. Even guessed numbers beat blanks — they make the trade-off visible.",
      citations: [
        "10_hld/hld_thinking_system.md",
        "07_interview_framework/the_four_step_framework.md",
      ],
    });
  }

  // R2 — component without justification (or too short)
  for (const c of components) {
    const just = (c.justification || "").trim();
    if (just.length < 12) {
      findings.push({
        id: `unjustified-${c.id}`,
        severity: "high",
        title: `${c.name} has no real justification`,
        detail:
          'Every component must answer "what bottleneck or risk does this remove?" — yours is empty or one or two words.',
        suggestedFix:
          "Write one sentence linking this component to a specific constraint or failure mode.",
        citations: ["10_hld/hld_review_checklist.md"],
      });
    }
  }

  // R3 — cache without invalidation strategy
  const cache = components.find((c) => c.paletteId === "cache");
  if (cache) {
    const text = (cache.justification || "").toLowerCase();
    const hasInvalidationLanguage = /(invalidat|ttl|stale|expir|fresh|write-through|write through|write-back)/.test(text);
    if (!hasInvalidationLanguage) {
      findings.push({
        id: "cache-no-invalidation",
        severity: "medium",
        title: "Cache without invalidation strategy",
        detail:
          "Justification doesn't mention TTL, invalidation, write-through, or staleness. Caches silently serve wrong data without it.",
        suggestedFix:
          "Mention TTL, invalidation trigger, or staleness tolerance in the justification.",
        citations: [
          "02_building_blocks/caching.md",
          "06_trade_offs/consistency_vs_availability.md",
        ],
      });
    }
  }

  // R4 — queue / pub-sub without operational controls
  const asyncComp = components.find(
    (c) => c.paletteId === "message-queue" || c.paletteId === "pub-sub",
  );
  if (asyncComp) {
    const text = (asyncComp.justification || "").toLowerCase();
    const hasControls = /(dlq|consumer|retry|backpressure|back pressure|lag|idempoten|poison|replay)/.test(text);
    if (!hasControls) {
      findings.push({
        id: "queue-no-controls",
        severity: "medium",
        title: "Queue without operational controls",
        detail:
          "Justification doesn't mention DLQ, retries, lag, or consumer behavior. Queues hide overload until they don't.",
        suggestedFix:
          "Mention max retries, DLQ destination, lag alert, or idempotent consumer.",
        citations: [
          "03_design_patterns/back_pressure.md",
          "02_building_blocks/message_queues.md",
        ],
      });
    }
  }

  // R5 — high write QPS only against single SQL primary
  const writeQps = asInt(constraints.qpsWrite);
  if (Number.isFinite(writeQps) && writeQps > 5000) {
    const hasSql = components.some((c) => c.paletteId === "sql-database");
    const hasShard = components.some(
      (c) => c.paletteId === "sql-shard" || c.paletteId === "kv-store",
    );
    if (hasSql && !hasShard) {
      findings.push({
        id: "sql-write-bottleneck",
        severity: "medium",
        title: "Write QPS will overwhelm a single SQL primary",
        detail: `Write QPS estimated at ${writeQps.toLocaleString()}. Single SQL primary becomes a bottleneck above ~5K writes/s on commodity hardware.`,
        suggestedFix:
          "Consider sharding, a write-optimized store, or partitioning by access pattern.",
        citations: [
          "03_design_patterns/sharding.md",
          "06_trade_offs/sql_vs_nosql.md",
        ],
      });
    }
  }

  // R6 — strong consistency mixed with cache
  if (constraints.consistency === "strong") {
    const hasCache = components.some((c) => c.paletteId === "cache");
    if (hasCache) {
      findings.push({
        id: "strong-with-cache",
        severity: "medium",
        title: "Strong consistency + cache",
        detail:
          "You picked strong consistency but added a cache. Caches naturally drift unless invalidation is airtight.",
        suggestedFix:
          "Either accept eventual consistency for cached data, or document a strict invalidation/write-through path.",
        citations: [
          "06_trade_offs/consistency_vs_availability.md",
          "02_building_blocks/caching.md",
        ],
      });
    }
  }

  // R7 — too many services for the team
  const teamSize = asInt(constraints.team);
  const apiServers = components.filter((c) => c.paletteId === "api-server").length;
  if (Number.isFinite(teamSize) && teamSize < 8 && apiServers > 2) {
    findings.push({
      id: "microservices-small-team",
      severity: "low",
      title: "Too many services for the team",
      detail: `${apiServers} API services with a team of ${teamSize}. Multiple services add deploy, observability, and on-call overhead that small teams pay disproportionately.`,
      suggestedFix:
        "Start with a modular monolith. Split when team and traffic measurably justify it.",
      citations: ["04_system_evolutions/from_monolith_to_microservices.md"],
    });
  }

  // R8 — async-shaped work mentioned but no async path
  const text = components.map((c) => (c.justification || "").toLowerCase()).join(" ");
  const mentionsAsync = /(notification|email|sms|push|analytics|webhook|export|report|audit|fanout|side effect)/.test(text);
  const hasAsync = components.some((c) => c.paletteId === "message-queue" || c.paletteId === "pub-sub");
  if (mentionsAsync && !hasAsync) {
    findings.push({
      id: "sync-side-effects",
      severity: "medium",
      title: "Likely-async work on the synchronous path",
      detail:
        "Your justifications mention notifications, analytics, webhooks, or other side effects, but you have no queue or pub/sub.",
      suggestedFix:
        "Move non-critical side effects behind a queue. Keep the user-facing path small.",
      citations: [
        "02_building_blocks/message_queues.md",
        "03_design_patterns/pub_sub.md",
      ],
    });
  }

  findings.sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);
  return findings;
}

// Diff against expected components for the case. Used in the review screen.
export function diffComponents(chosenIds, expectedIds) {
  const chosen = new Set(chosenIds);
  const expected = new Set(expectedIds);
  const covered = expectedIds.filter((id) => chosen.has(id));
  const missed = expectedIds.filter((id) => !chosen.has(id));
  const extra = chosenIds.filter((id) => !expected.has(id));
  return { covered, missed, extra };
}
