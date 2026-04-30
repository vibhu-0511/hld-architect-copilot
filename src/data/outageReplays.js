// Outage Replay drills — curated postmortem replays.
//
// Each replay is structured so the user can reason about the failure BEFORE
// reading the postmortem. The `preIncident` section is spoiler-free; it
// describes the architecture and a thin trigger hint. The `reveal` section is
// the postmortem.
//
// Predict prompts are intentionally identical across all replays so the user
// builds a habit of asking the same four questions every time.

export const PREDICT_PROMPTS = [
  {
    id: "rootCause",
    label: "Root cause",
    helper:
      "What single change, event, or hidden bug do you think kicked this off? Name the trigger, not the symptom.",
  },
  {
    id: "blastRadius",
    label: "Blast radius",
    helper:
      "How did the trigger propagate? Walk the dependency chain that took it from one bad thing to a user-visible outage.",
  },
  {
    id: "recovery",
    label: "Recovery time",
    helper:
      "How long do you think this took to fix, and what made recovery slow? (mins / hours / days?)",
  },
  {
    id: "prevention",
    label: "Prevention",
    helper:
      "What single architectural change would have prevented or contained this? Justify in one sentence.",
  },
];

export const OUTAGE_REPLAYS = [
  {
    id: "aws_s3_2017",
    path: "09_real_outages/amazon_s3_outage_2017.md",
    title: "Amazon S3 Outage",
    year: 2017,
    duration: "4 hours",
    impact:
      "Slack, Trello, Quora, IFTTT, AWS status page itself — all dark in US-East-1.",
    difficulty: "starter",
    preIncident: {
      summary:
        "Amazon S3 in US-East-1 — the largest object store in the world. A small team is doing routine maintenance to remove a few billing servers from the fleet.",
      components: [
        "S3 index subsystem (object metadata)",
        "S3 placement subsystem (write allocation)",
        "Billing servers (the maintenance target)",
        "AWS status dashboard (hosted on S3)",
        "Thousands of downstream services (Slack, Trello, Quora…)",
      ],
      normalState:
        "S3 serves billions of requests/sec across the region. Maintenance commands occasionally remove a handful of servers at a time.",
      triggerHint:
        "An engineer ran a normal-looking maintenance command. Something about how the command was typed had outsized consequences.",
    },
    reveal: {
      rootCause:
        "A typo in the maintenance command removed a much larger set of servers than intended. There was no rate limit and no \"are you sure?\" guard on the destructive operation.",
      blastRadius:
        "Removing those servers took down two foundational subsystems: the index (object → location lookup) and placement (where to write new objects). Without them, S3 couldn't read or write anything in US-East-1. Every service depending on S3 went dark — including AWS's own status page, which couldn't even tell users the truth because it lived on S3.",
      recovery:
        "~4 hours. The subsystems hadn't been fully restarted in years and brought up slowly with cold caches. The status page's circular dependency meant communication to customers was also blocked.",
      prevention:
        "Rate-limit destructive infra operations. Require quorum or confirmation for high-blast-radius commands. Host status pages on completely independent infrastructure (different cloud, even).",
    },
    keyLessons: [
      "Blast radius matters — one operator action shouldn't kill a region.",
      "Status pages must not depend on the system they're reporting on.",
      "If your business runs in one region, you go down with that region.",
    ],
    relatedNotes: [
      "09_real_outages/aws_us_east_1_outage_2021.md",
      "02_building_blocks/blob_storage.md",
      "06_trade_offs/consistency_vs_availability.md",
    ],
  },

  {
    id: "facebook_bgp_2021",
    path: "09_real_outages/facebook_bgp_outage_2021.md",
    title: "Facebook BGP Outage",
    year: 2021,
    duration: "6 hours",
    impact:
      "3.5B users lost FB, IG, WhatsApp, Messenger. Engineers locked out of their own data centers.",
    difficulty: "starter",
    preIncident: {
      summary:
        "Facebook's global backbone — the private network that interconnects their data centers and announces routes to the public internet via BGP. A scheduled maintenance window is starting.",
      components: [
        "Backbone routers (announce BGP routes)",
        "Authoritative DNS servers (facebook.com, instagram.com)",
        "Internal tooling (depends on the same DNS)",
        "Data center physical access systems (badges)",
        "Engineers' communication tools (also Facebook-hosted)",
      ],
      normalState:
        "BGP advertises FB's IP ranges to the internet. DNS resolves facebook.com → IP. Internal tools share that DNS.",
      triggerHint:
        "Engineers pushed a routine BGP configuration change during a maintenance window.",
    },
    reveal: {
      rootCause:
        "The BGP config change accidentally withdrew all routes to Facebook's authoritative DNS servers. The DNS servers were technically up — just unreachable from the internet.",
      blastRadius:
        "No DNS → no facebook.com / instagram.com / whatsapp.com resolution → every Facebook property simultaneously vanished from the internet. Worse: Facebook's *internal* tools (Slack-equivalent, deploy systems, even badge readers at data centers) shared the same DNS infrastructure. Engineers couldn't push a fix remotely because the tools to push fixes were down. They couldn't even physically enter the data centers — badge systems were offline.",
      recovery:
        "~6 hours. Required physically dispatching engineers to data centers, manually overriding badge systems, and reverting the BGP config from a console. Most of the 6 hours was access logistics, not the technical fix.",
      prevention:
        "Out-of-band recovery path that does not depend on the production system: separate DNS, separate VPN, separate physical access. The recovery path cannot share fate with the thing being recovered.",
    },
    keyLessons: [
      "Your recovery path cannot depend on the system that's broken.",
      "DNS is a near-universal SPOF — protect it like one.",
      "Internal tooling must be reachable when production is dark.",
    ],
    relatedNotes: [
      "01_fundamentals/networking_basics.md",
      "02_building_blocks/monitoring_and_logging.md",
    ],
  },

  {
    id: "cloudflare_regex_2019",
    path: "09_real_outages/cloudflare_regex_outage_2019.md",
    title: "Cloudflare Regex Outage",
    year: 2019,
    duration: "27 minutes",
    impact:
      "Millions of sites returned 502s globally. ~10% of the web went dark.",
    difficulty: "starter",
    preIncident: {
      summary:
        "Cloudflare's edge — 200+ city POPs running a Web Application Firewall (WAF) in front of customer sites. The security team is shipping a new WAF rule.",
      components: [
        "Edge servers (run WAF on every request)",
        "WAF rule engine (regex-based)",
        "Global config push pipeline",
        "Origin servers (customers')",
      ],
      normalState:
        "WAF rules are evaluated on every HTTP request. New rules are added regularly as new attack patterns emerge.",
      triggerHint:
        "A new WAF rule went out. It contained a complex-looking regex.",
    },
    reveal: {
      rootCause:
        "Catastrophic regex backtracking. The new rule contained a regex pattern whose worst-case complexity was exponential in input length; on certain HTTP request payloads, a single regex evaluation took seconds and pinned a CPU at 100%.",
      blastRadius:
        "The rule was pushed globally to all 200+ POPs at once with no canary. Every edge server simultaneously hit 100% CPU, dropping all customer traffic — not just the targeted attack pattern. ~10% of the entire HTTP web went down within seconds.",
      recovery:
        "~27 minutes. Identifying the regex as the cause was fast (CPU pinned right after deploy), then a global kill switch disabled the new WAF ruleset.",
      prevention:
        "Canary deploys for config — push to one POP, watch CPU/error rates, then expand. Per-rule CPU budgets so one rule can't starve others. Test regex patterns against pathological inputs before shipping.",
    },
    keyLessons: [
      "Config deploys are code deploys. They need canaries too.",
      "Test for performance, not just correctness.",
      "Resource isolation per rule/component prevents one bad input from killing the host.",
    ],
    relatedNotes: [
      "03_design_patterns/circuit_breaker.md",
      "02_building_blocks/monitoring_and_logging.md",
    ],
  },

  {
    id: "crowdstrike_2024",
    path: "09_real_outages/crowdstrike_global_outage_2024.md",
    title: "CrowdStrike Global Outage",
    year: 2024,
    duration: "Days to weeks",
    impact:
      "8.5M Windows machines BSOD'd globally. Airlines, hospitals, banks, 911. ~$5.4B+ damages.",
    difficulty: "core",
    preIncident: {
      summary:
        "CrowdStrike Falcon — endpoint security software running as a kernel-level driver on millions of Windows machines worldwide, including critical infrastructure. The threat team is pushing a new content update (a Channel File, not a code update).",
      components: [
        "Falcon kernel driver (Windows kernel, ring 0)",
        "Channel files (threat detection definitions)",
        "Auto-update channel (pushed to all customers)",
        "Customer endpoints (PCs, servers, kiosks, ATMs)",
      ],
      normalState:
        "Channel files update many times per day. Code updates go through review and staged rollout. Channel files are treated as low-risk \"data\" updates.",
      triggerHint:
        "A new Channel File (291) was published. The team treated it as a routine content update.",
    },
    reveal: {
      rootCause:
        "Channel File 291 contained a logic error that triggered an out-of-bounds read inside the Falcon kernel driver. Because the driver runs at ring 0, any crash takes down the whole OS.",
      blastRadius:
        "Pushed to 100% of customers simultaneously with no canary. Every Falcon-protected Windows machine that received the file crashed into BSOD on the next boot. Because the driver loads early in boot, machines entered an infinite BSOD loop and couldn't even start. Airlines, hospitals, payment terminals, 911 dispatch — all of them down at once.",
      recovery:
        "Days to weeks. The fix was known within ~80 minutes, but recovery required physical access to each machine to boot into Safe Mode and delete the bad file. 8.5M machines × manual remediation = enormous tail. Some machines weren't fixed for weeks because they were in remote/inaccessible locations.",
      prevention:
        "Canary even \"just config\" updates — kernel components especially. Make rollback automatic and remote (boot loader can detect repeated crashes and roll back to last-known-good). Treat content/data updates with the same review rigor as code.",
    },
    keyLessons: [
      "\"It's just a config update\" is the most dangerous sentence in deployment.",
      "Kernel-level components need extra safety, not less, because their blast radius is the whole machine.",
      "Manual recovery doesn't scale. If the only fix is hands-on, rollout was wrong.",
    ],
    relatedNotes: [
      "09_real_outages/cloudflare_regex_outage_2019.md",
      "03_design_patterns/circuit_breaker.md",
    ],
  },

  {
    id: "github_db_2018",
    path: "09_real_outages/github_database_incident_2018.md",
    title: "GitHub Database Incident",
    year: 2018,
    duration: "24 hours",
    impact:
      "Webhook deliveries delayed, GitHub Pages stale, partial UI degradation across the platform.",
    difficulty: "core",
    preIncident: {
      summary:
        "GitHub's MySQL fleet: a primary in one US data center, replicas in another DC across the country. Orchestrator runs automated failover when the primary is unreachable.",
      components: [
        "Primary MySQL (writes)",
        "Cross-DC MySQL replicas (reads + failover candidates)",
        "Orchestrator (detects primary failure, promotes a replica)",
        "Inter-DC network link",
        "Application layer (issues writes, expects strong reads)",
      ],
      normalState:
        "Replication is asynchronous; replicas lag by tens of milliseconds. Orchestrator promotes a replica if the primary is unreachable for a configured threshold.",
      triggerHint:
        "Routine 43-second network maintenance briefly disconnected the primary from the replicas.",
    },
    reveal: {
      rootCause:
        "Orchestrator's threshold was aggressive enough that a 43-second network blip looked like a primary failure. It promoted a remote replica to primary. When the original primary's network came back, both nodes accepted writes for a brief window — split brain.",
      blastRadius:
        "Writes diverged across the two \"primaries.\" When the split was detected, GitHub had to manually reconcile data — figuring out which writes happened on which node and merging them safely. Background pipelines (webhooks, GitHub Pages builds, email) were paused or replayed to avoid corruption. Total degraded service: ~24h.",
      recovery:
        "~24 hours. The fix wasn't restoring uptime — it was reconciling diverged data without losing or corrupting writes. That's careful, slow, mostly manual work.",
      prevention:
        "Fencing tokens so a demoted primary can't write after it's been replaced. Less aggressive failover thresholds, especially for known-brief network events. Better cross-DC topology awareness so replicas with high lag aren't candidates.",
    },
    keyLessons: [
      "Automated failover is a sharp tool — wrong threshold = self-inflicted split brain.",
      "Replication lag matters at the moment of promotion.",
      "After a split, the hard part is data reconciliation, not restarting servers.",
    ],
    relatedNotes: [
      "03_design_patterns/leader_election.md",
      "03_design_patterns/replication.md",
      "01_fundamentals/consistency_models.md",
    ],
  },

  {
    id: "gitlab_2017",
    path: "09_real_outages/gitlab_data_deletion_2017.md",
    title: "GitLab Database Deletion",
    year: 2017,
    duration: "~6 hours of data lost",
    impact:
      "300GB primary DB deleted. 6 hours of issues, MRs, and comments lost forever.",
    difficulty: "starter",
    preIncident: {
      summary:
        "GitLab.com's PostgreSQL: primary plus a replica that's been having replication lag issues. An on-call engineer is trying to fix the replica late at night.",
      components: [
        "Primary PostgreSQL (production data)",
        "Replica PostgreSQL (lagging)",
        "pg_dump backups (nightly)",
        "Disk snapshots (every 24 hours)",
        "Continuous archive (WAL shipping)",
        "S3 backups",
      ],
      normalState:
        "Five overlapping backup strategies are documented. Most have not been verified by an actual restore in months.",
      triggerHint:
        "The engineer wanted to clear and re-sync the replica's data directory.",
    },
    reveal: {
      rootCause:
        "Tired engineer, two SSH sessions in different terminals, ran `rm -rf` on the wrong host. Deleted the production primary's data directory.",
      blastRadius:
        "300GB instantly gone. Then the recovery story unraveled: pg_dump had been silently failing for months. The S3 backup bucket was empty — credentials expired. WAL archive had a gap. Only the disk snapshot survived, ~6 hours stale.",
      recovery:
        "Several hours to find a usable backup, then restore from the disk snapshot. ~6 hours of writes (issues, MRs, comments) were unrecoverable.",
      prevention:
        "Verify backups by actually restoring them on a schedule (nightly, automatic, alerting). Make it impossible to mistake the primary for the replica in interactive sessions (different shell prompts, different colors, sudo gates). Two-person rule for destructive commands on prod.",
    },
    keyLessons: [
      "An untested backup is not a backup.",
      "Five backup strategies, all silently broken, equal zero backups.",
      "Humans at 1am make mistakes — design the environment to make those mistakes impossible.",
    ],
    relatedNotes: [
      "03_design_patterns/replication.md",
      "02_building_blocks/databases_sql.md",
    ],
  },

  {
    id: "knight_capital_2012",
    path: "09_real_outages/knight_capital_2012.md",
    title: "Knight Capital Trading Disaster",
    year: 2012,
    duration: "45 minutes",
    impact: "$440M loss in 45 minutes. Knight Capital effectively ended.",
    difficulty: "core",
    preIncident: {
      summary:
        "Knight Capital was one of the largest US equity market makers — automated trading at thousands of orders per second. Today's deploy: a new feature called RLP that reuses an old configuration flag (\"Power Peg\") that hadn't been used in years.",
      components: [
        "8 production trading servers",
        "Order routing system",
        "Risk controls (position limits, kill switches)",
        "Old \"Power Peg\" code (dead, but still on disk)",
        "Configuration flags (one repurposed for RLP)",
      ],
      normalState:
        "Trading at high frequency. The Power Peg code path hasn't been used since 2003 but was never deleted. The deploy script copies the new binary to all 8 servers.",
      triggerHint:
        "The deploy ran. Eight servers needed the new code.",
    },
    reveal: {
      rootCause:
        "The deploy script silently failed on 1 of 8 servers. Server 8 still had the old binary. When the new config flag (intended for RLP) flipped, server 8 interpreted it as the old Power Peg flag and started running ancient code that bought aggressively at market with no limits.",
      blastRadius:
        "Server 8 began executing thousands of unintended orders per second — buying high, selling low, accumulating $7B in unwanted positions. The other 7 servers behaved correctly, which made the symptom confusing. Engineers tried to roll back, which made it worse — they redeployed the new binary but didn't kill the runaway trades fast enough.",
      recovery:
        "45 minutes from first bad trade to halt. By that point, $440M was gone. The company never recovered.",
      prevention:
        "Delete dead code. Don't reuse config flags. Verify every server post-deploy (binary checksums match expected). Pre-trade risk controls with an automatic kill switch that fires on anomalous order rates, not just position size.",
    },
    keyLessons: [
      "Dead code in production is a loaded gun.",
      "A partial deploy is worse than a failed deploy — divergent behavior is invisible until it isn't.",
      "Critical systems need real-time anomaly detection with auto-halt, not just position limits.",
    ],
    relatedNotes: [
      "03_design_patterns/circuit_breaker.md",
      "02_building_blocks/monitoring_and_logging.md",
    ],
  },

  {
    id: "tsb_2018",
    path: "09_real_outages/tsb_bank_migration_2018.md",
    title: "TSB Bank Migration Disaster",
    year: 2018,
    duration: "Weeks to months",
    impact:
      "1.9M customers locked out. Some saw OTHER customers' accounts. £366M cost. CEO resigned.",
    difficulty: "deep",
    preIncident: {
      summary:
        "TSB (UK retail bank) is migrating 5.4M customer accounts from the legacy Lloyds platform to a new core banking system built by their parent Sabadell. Plan: a single \"big bang\" weekend cutover.",
      components: [
        "Legacy Lloyds core banking platform",
        "New Sabadell core banking platform",
        "Mobile + web channels",
        "Customer service phone lines",
        "Migration ETL jobs (5.4M accounts)",
        "Authentication / session systems on both sides",
      ],
      normalState:
        "Customers expect 24/7 access to balances, payments, transfers. Banking regulations require strong customer isolation.",
      triggerHint:
        "Migration ran Sunday night. Systems went live Monday morning.",
    },
    reveal: {
      rootCause:
        "The new platform had not been load-tested at production scale. When 5.4M users hit it Monday morning, sessions, auth, and account lookups buckled. Worse, defective session handling caused some customers' sessions to be served other customers' account data — a regulatory catastrophe on top of an outage.",
      blastRadius:
        "1.9M customers locked out. Some who got in saw strangers' balances and transactions. Phone support was overwhelmed (hours-long holds). Fraud spiked as criminals exploited the chaos. There was no rollback plan — the legacy platform had been decommissioned the same weekend.",
      recovery:
        "Weeks. Some issues took months. Total cost £366M+; CEO resigned; regulator imposed a multi-year monitoring regime.",
      prevention:
        "Strangler fig migration — run both platforms in parallel, route 1% then 10% then 50% of traffic, with a rollback button at every stage. Load test at 1.5x peak before any cutover. Never decommission the old system until the new one has handled real traffic for weeks.",
    },
    keyLessons: [
      "Big bang migrations are how you blow up a company.",
      "Load test at production scale before cutover, not after.",
      "Always keep the legacy system live until the new one has earned trust.",
    ],
    relatedNotes: [
      "04_system_evolutions/from_monolith_to_microservices.md",
      "09_real_outages/knight_capital_2012.md",
    ],
  },

  {
    id: "fastly_2021",
    path: "09_real_outages/fastly_cdn_outage_2021.md",
    title: "Fastly CDN Outage",
    year: 2021,
    duration: "~1 hour",
    impact:
      "Amazon, Reddit, GitHub, NYT, BBC, UK gov — major chunks of the web returned 503s.",
    difficulty: "starter",
    preIncident: {
      summary:
        "Fastly's edge CDN, fronting a huge slice of the web. Customers configure their own caching/routing rules through Fastly's API.",
      components: [
        "Edge POPs (global)",
        "Configuration push system",
        "Customer config UI/API",
        "Origin servers (customers')",
      ],
      normalState:
        "Customers push config changes regularly. Fastly's software is supposed to handle any valid customer input.",
      triggerHint:
        "A customer pushed a perfectly valid configuration change.",
    },
    reveal: {
      rootCause:
        "A customer's valid config triggered a latent bug in Fastly's edge software that had been shipped weeks earlier but never exercised. The bug caused 85% of edge POPs to return 503s.",
      blastRadius:
        "Within seconds, the broken config propagated to most POPs globally. Sites with Fastly as their sole CDN went dark — Amazon, Reddit, GitHub, NYT, UK gov. Sites with a multi-CDN strategy stayed up.",
      recovery:
        "~1 hour. Fastly identified the issue in ~1 minute and pushed a fix in ~49 minutes. Most affected sites recovered shortly after.",
      prevention:
        "Multi-CDN with DNS-based failover so any single CDN's outage degrades — not collapses — your site. Internally for Fastly: fuzz-test config parsers, canary config-handling code paths, isolate POPs so one bad config can't take down 85% at once.",
    },
    keyLessons: [
      "If your site depends on one CDN, you own that CDN's outages.",
      "Latent bugs surface when novel valid inputs arrive — \"valid\" doesn't mean \"tested.\"",
      "Multi-CDN is cheap insurance for sites where uptime matters.",
    ],
    relatedNotes: [
      "02_building_blocks/cdn.md",
      "09_real_outages/amazon_s3_outage_2017.md",
    ],
  },

  {
    id: "roblox_2021",
    path: "09_real_outages/roblox_73h_outage_2021.md",
    title: "Roblox 73-Hour Outage",
    year: 2021,
    duration: "73 hours",
    impact:
      "50M+ daily users (mostly children) locked out for 3 days during a popular promotion.",
    difficulty: "deep",
    preIncident: {
      summary:
        "Roblox runs thousands of microservices that find each other through HashiCorp Consul (service discovery). Consul also stores config and does health checking. A new streaming feature is being gradually enabled.",
      components: [
        "Consul cluster (service discovery, KV store, health checks)",
        "Thousands of microservices that depend on Consul",
        "Streaming feature (newly enabled)",
        "Monitoring (also depends on Consul)",
      ],
      normalState:
        "Services query Consul on startup and periodically to find each other. Consul is treated as critical infra. Most engineers don't think about it daily.",
      triggerHint:
        "A routine Consul upgrade landed. The new streaming feature was scaled up shortly after.",
    },
    reveal: {
      rootCause:
        "The Consul upgrade enabled streaming-style updates by default. Under high load from the streaming feature, Consul nodes started spending all their CPU on streaming bookkeeping. Health checks slowed down and started failing.",
      blastRadius:
        "Failed health checks caused Consul to remove nodes from the cluster. Fewer nodes meant more load per remaining node — which then failed too. The cluster slowly cannibalized itself. Without service discovery, microservices couldn't find each other; new pods couldn't register; the platform died. Monitoring also depended on Consul, so engineers were debugging blind.",
      recovery:
        "73 hours. Most of that time was diagnosis — the failure mode was novel and monitoring was unreliable. Recovery required rebuilding the Consul cluster carefully under controlled load, with the streaming feature disabled.",
      prevention:
        "Treat service discovery as the most critical system you own — more redundancy and testing than the app, not less. Monitoring must run on infrastructure independent of what it monitors. Feature flags for backend infra changes (the streaming behavior) so they can be reverted instantly.",
    },
    keyLessons: [
      "Service discovery / config / DNS are the foundation — they need the most paranoia.",
      "If monitoring depends on the broken thing, you fly blind exactly when you most need to see.",
      "Cascading failures love positive feedback loops — every dropped node makes the next more likely.",
    ],
    relatedNotes: [
      "03_design_patterns/circuit_breaker.md",
      "03_design_patterns/leader_election.md",
      "02_building_blocks/monitoring_and_logging.md",
    ],
  },

  {
    id: "slack_db_2024",
    path: "09_real_outages/slack_database_incident_2024.md",
    title: "Slack Database Incident",
    year: 2024,
    duration: "Several hours",
    impact:
      "Messages stuck sending, channels not loading, \"connecting…\" spinner platform-wide.",
    difficulty: "core",
    preIncident: {
      summary:
        "Slack's MySQL fleet under planned maintenance. Application servers connect through bounded connection pools; a load balancer in front does health-check based routing.",
      components: [
        "MySQL primary + replicas",
        "Application servers (bounded connection pools)",
        "Load balancer (health checks)",
        "Maintenance task (running on prod tables)",
      ],
      normalState:
        "Apps hold tens of pooled DB connections. Health checks query the DB; if unhealthy, the LB drops the server.",
      triggerHint:
        "A planned database maintenance operation kicked off during low-traffic hours.",
    },
    reveal: {
      rootCause:
        "The maintenance op took unexpected locks on hot tables. Application reads piled up behind the locks. Each blocked query held a pooled connection, and the pools rapidly exhausted across all app servers.",
      blastRadius:
        "With pools full, app health checks (which themselves use the DB) started timing out. The load balancer marked servers unhealthy and removed them from rotation. Fewer servers meant the surviving ones got hit harder, exhausting their pools faster — a cascading collapse. Users saw spinners and \"connecting…\" everywhere.",
      recovery:
        "Several hours. Required killing the maintenance op, manually clearing locks, then ramping traffic back gradually so pools could refill before LB declared servers healthy.",
      prevention:
        "Run maintenance on a replica or with explicit lock budgets. Bounded query timeouts at the app layer so pooled connections release fast. Circuit breakers so the app sheds load rather than queueing forever. Health checks that don't depend on the same hot path as user traffic.",
    },
    keyLessons: [
      "Connection pools are the hidden back-pressure system; they fail silently then catastrophically.",
      "Maintenance operations can take production down — test on replicas first.",
      "Health checks that query the DB will lie when the DB is the problem.",
    ],
    relatedNotes: [
      "02_building_blocks/databases_sql.md",
      "03_design_patterns/circuit_breaker.md",
    ],
  },

  {
    id: "southwest_2022",
    path: "09_real_outages/southwest_airlines_2022.md",
    title: "Southwest Airlines Meltdown",
    year: 2022,
    duration: "10 days",
    impact:
      "16,700+ flights cancelled. 2M+ passengers stranded. ~$800M cost.",
    difficulty: "deep",
    preIncident: {
      summary:
        "Southwest runs point-to-point routing (no hubs). Crew assignments are tracked in SkySolver — a 30-year-old scheduling system. Crew availability changes are reported by phone calls between crew and operations.",
      components: [
        "SkySolver crew scheduling system (legacy)",
        "Phone-based crew check-in",
        "Point-to-point flight network",
        "Aircraft fleet",
      ],
      normalState:
        "Routine schedule changes are within SkySolver's capacity. Phone-based check-ins are slow but functional under normal disruptions.",
      triggerHint:
        "Winter Storm Elliott hit in late December 2022. Other airlines saw initial disruption but recovered within 1–2 days.",
    },
    reveal: {
      rootCause:
        "The storm cancelled enough flights that SkySolver's rebooking algorithm exceeded its scaling limits. The system couldn't reassign crews fast enough to keep up with cascading rebookings. Crews and aircraft were available, but the system couldn't match them to flights.",
      blastRadius:
        "Phone-based check-in collapsed under the load — crews waited hours to report availability. Point-to-point routing had no hub-based containment, so disruption in one city cascaded everywhere immediately. Other airlines used hub-and-spoke recovery to localize disruption; Southwest had no equivalent.",
      recovery:
        "10 days. Required essentially manual re-creation of the entire schedule. Other airlines were back to normal within 1–2 days.",
      prevention:
        "Modernize critical legacy systems before the worst-case scenario forces it. Capacity-test against extreme but plausible disruption (not just steady state). Build degraded-but-functioning modes — e.g., online crew check-in as a phone-line bypass.",
    },
    keyLessons: [
      "Tech debt in critical systems is a business survival risk, not an engineering preference.",
      "Steady-state capacity is the wrong number — measure worst-case rebooking spikes.",
      "Networks without natural containment (no hubs) require stronger system-level resilience.",
    ],
    relatedNotes: [
      "03_design_patterns/circuit_breaker.md",
      "06_trade_offs/simplicity_vs_scalability.md",
    ],
  },

  {
    id: "discord_db_2024",
    path: "09_real_outages/discord_message_outage_2024.md",
    title: "Discord Database Scaling Incident",
    year: 2024,
    duration: "Hours",
    impact:
      "Message sending degraded, \"message not found\" errors at peak.",
    difficulty: "deep",
    preIncident: {
      summary:
        "Discord stores trillions of messages in ScyllaDB. The partition key is channel_id — every message in a channel lives on the same partition.",
      components: [
        "ScyllaDB cluster (LSM-tree storage)",
        "Message Service (writes/reads)",
        "Partition key: channel_id",
        "Background compaction",
        "Replication across nodes",
      ],
      normalState:
        "Most channels have small-to-medium traffic. Compaction runs continuously to merge SSTables. Replication keeps up easily.",
      triggerHint:
        "A handful of very large servers (1M+ members) saw a traffic surge in their general-channel.",
    },
    reveal: {
      rootCause:
        "Hot partitions. A 1M+ member server's general channel hashes to a single partition; that partition's primary node became a bottleneck. Compaction on that node started competing with live reads/writes for I/O.",
      blastRadius:
        "Reads on that partition slowed → applications retried → load on the partition increased. Replication fell behind, so reads going to replicas saw stale data — including \"message not found\" for messages that had just been written. Other channels on the same nodes were collateral damage.",
      recovery:
        "Hours. Mitigations: throttle compaction during peak, route hot partition reads to specific replicas, and at the application layer split very-hot channels into sub-partitions.",
      prevention:
        "Choose partition keys that distribute load even in worst-case servers (sub-shard hot channels by time bucket or user-segment). Monitor per-partition load, not just per-node. Run compaction with I/O budgets so it can't starve live traffic.",
    },
    keyLessons: [
      "Partition key choice determines whether a system scales.",
      "\"Worst-case user\" defines your hot partition, not the average.",
      "Background work (compaction, GC, indexing) needs its own I/O budget.",
    ],
    relatedNotes: [
      "03_design_patterns/sharding.md",
      "02_building_blocks/databases_nosql.md",
    ],
  },

  {
    id: "aws_us_east_2021",
    path: "09_real_outages/aws_us_east_1_outage_2021.md",
    title: "AWS us-east-1 Outage",
    year: 2021,
    duration: "~7 hours",
    impact:
      "Netflix, Disney+, Slack, DoorDash, Venmo, Robinhood — much of the consumer internet stuttered.",
    difficulty: "core",
    preIncident: {
      summary:
        "AWS's oldest, biggest region — us-east-1. An automated capacity-management process is set to scale up internal networking devices to handle anticipated holiday-season load.",
      components: [
        "EC2, ECS, Lambda, DynamoDB, SQS (every major service)",
        "Internal AWS network fabric",
        "Automated networking-capacity controller",
        "AWS status page (depends on us-east-1)",
        "Customer workloads pinned to us-east-1",
      ],
      normalState:
        "Internal capacity scaling runs continuously, mostly invisible.",
      triggerHint:
        "The capacity controller kicked off an internal scale-up.",
    },
    reveal: {
      rootCause:
        "The capacity controller emitted a flood of connection-establishment requests that overwhelmed internal networking devices. The devices became congested, dropping inter-service traffic.",
      blastRadius:
        "EC2, Lambda, ECS, DynamoDB, SQS — basically every us-east-1 service degraded simultaneously. Customers' multi-AZ deployments inside us-east-1 didn't help because the impairment was at the regional network fabric level. The AWS status page was also degraded (same dependency story as 2017).",
      recovery:
        "~7 hours. Required throttling the runaway controller, draining congestion, and bringing services back gradually to avoid re-triggering the storm.",
      prevention:
        "Multi-region for any business that genuinely cares about uptime. Inside the cloud provider: rate-limit internal automation, design control planes with circuit breakers, never assume \"a region\" is a single failure domain.",
    },
    keyLessons: [
      "Even AWS's flagship region has multi-hour outages. Plan for it.",
      "Multi-AZ inside one region doesn't protect against regional control-plane failure.",
      "Internal automation is a frequent root cause — it can act faster than humans can stop it.",
    ],
    relatedNotes: [
      "09_real_outages/amazon_s3_outage_2017.md",
    ],
  },

  {
    id: "google_cloud_2022",
    path: "09_real_outages/google_cloud_outage_2022.md",
    title: "Google Cloud Outage",
    year: 2022,
    duration: "~12 hours (Paris) / hours (us-central1)",
    impact:
      "europe-west9 (Paris) hardware-down for ~12h after a cooling failure; us-central1 networking degraded after a config push.",
    difficulty: "core",
    preIncident: {
      summary:
        "Google Cloud's europe-west9 region in Paris is operating normally. The data center has water-based cooling sized for typical European summer conditions. Separately, the us-central1 region has a planned network configuration change scheduled.",
      components: [
        "Data center physical cooling (Paris)",
        "Network control plane (us-central1)",
        "Customer VMs and managed services",
        "Internal monitoring",
      ],
      normalState:
        "Cooling normally absorbs heat well within design limits. Network control-plane changes go through a review pipeline.",
      triggerHint:
        "Two distinct triggers in the same period: a heat anomaly hit Paris; a network config change shipped to us-central1.",
    },
    reveal: {
      rootCause:
        "Paris: a water-cooling system failure during an unusual high-temperature event meant heat couldn't be removed fast enough. Equipment had to be shut down to prevent damage. us-central1: a config push triggered a latent bug in the network control plane that incorrectly withdrew routes.",
      blastRadius:
        "Paris: customers running only in europe-west9 lost compute and managed services for ~12 hours. us-central1: services in that region lost network connectivity until the change was reverted.",
      recovery:
        "Paris: hours to restore cooling and bring equipment back safely. us-central1: rollback was complicated by the very networking change that broke it — took several hours.",
      prevention:
        "Multi-region deployment for anything critical, including across cloud providers if needed. Inside cloud: physical infra design for thermal extremes well above current climate norms; treat config pushes as code with canary + rollback paths that don't require the broken network.",
    },
    keyLessons: [
      "Physical infrastructure (cooling, power) still bites in 2020s cloud.",
      "All major cloud providers have multi-hour outages annually — plan accordingly.",
      "Config changes are the most common trigger for control-plane outages.",
    ],
    relatedNotes: [
      "09_real_outages/aws_us_east_1_outage_2021.md",
      "09_real_outages/facebook_bgp_outage_2021.md",
    ],
  },
];

export function getReplay(id) {
  return OUTAGE_REPLAYS.find((r) => r.id === id) || null;
}

export function getReplayByPath(path) {
  return OUTAGE_REPLAYS.find((r) => r.path === path) || null;
}
