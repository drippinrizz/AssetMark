import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outputPath = join(root, "training-assets", "mock-data-hub-seed.json");
const fixturePath = join(root, "tests", "fixtures", "mock-data-hub-seed.json");
const NOW = new Date("2026-05-24T12:00:00.000Z");

const firstNames = [
  "Alex", "Jamie", "Taylor", "Morgan", "Jordan", "Avery", "Riley", "Casey", "Drew", "Skyler",
  "Maria", "Daniel", "Patricia", "Nina", "Ethan", "Priya", "Owen", "Grace", "Liam", "Sophia",
  "Mateo", "Chloe", "Noah", "Maya", "Elena", "Andre", "Hannah", "Victor", "Mei", "Caleb",
];
const lastNames = [
  "Vasquez", "Okafor", "Lim", "Nguyen", "Patel", "Brooks", "Chen", "Garcia", "Hughes", "Johnson",
  "Kim", "Martinez", "Nakamura", "Olsen", "Parker", "Quinn", "Reed", "Singh", "Turner", "Walker",
  "Young", "Bennett", "Carter", "Diaz", "Ellis", "Foster", "Green", "Hayes", "Ibrahim", "Keller",
];
const regions = ["Pacific", "Southeast", "Northeast", "Midwest"];
const custodians = ["Schwab", "Fidelity", "Pershing", "BetaNXT"];
const accountTypes = ["IRA", "Roth", "Joint", "Trust"];
const statuses = ["drafted", "submitted", "needs_info", "approved", "funded"];
const eventTypes = ["call", "email", "meeting", "portal_login"];
const riskTolerances = ["conservative", "moderate", "aggressive"];

let seed = 9142026;
function random() {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
}

function pick(values) {
  return values[Math.floor(random() * values.length)];
}

function daysAgo(days) {
  return new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

function dateDaysAgo(days) {
  return daysAgo(days).slice(0, 10);
}

function transcriptText(clientName, tone) {
  const snippets = {
    positive: `Advisor and ${clientName} reviewed next steps. Client said the onboarding flow is clear and they feel confident moving forward.`,
    neutral: `${clientName} asked for a status update on paperwork and requested a follow-up email with the current checklist.`,
    negative: `${clientName} expressed frustration that the account opening has stalled and said they have not heard back in weeks.`,
  };
  return snippets[tone];
}

const advisors = Array.from({ length: 25 }, (_, index) => ({
  id: index + 1,
  first_name: firstNames[(index * 3) % firstNames.length],
  last_name: lastNames[(index * 5 + 2) % lastNames.length],
  region: regions[index % regions.length],
  joined_date: dateDaysAgo(365 + Math.floor(random() * 1800)),
}));

const clients = [];
let clientId = 1;
for (const advisor of advisors) {
  const targetCount = advisor.id === 3 ? 12 : 9 + Math.floor(random() * 7);
  for (let i = 0; i < targetCount; i += 1) {
    clients.push({
      id: clientId,
      advisor_id: advisor.id,
      first_name: firstNames[(clientId * 7 + i) % firstNames.length],
      last_name: lastNames[(clientId * 11 + i) % lastNames.length],
      household_assets_usd: Math.round((120000 + random() * 2200000) / 1000) * 1000,
      risk_tolerance: pick(riskTolerances),
      created_date: dateDaysAgo(30 + Math.floor(random() * 720)),
    });
    clientId += 1;
  }
}

while (clients.length < 300) {
  const advisor = advisors[(clients.length + 4) % advisors.length];
  clients.push({
    id: clientId,
    advisor_id: advisor.id,
    first_name: firstNames[(clientId * 7) % firstNames.length],
    last_name: lastNames[(clientId * 11) % lastNames.length],
    household_assets_usd: Math.round((120000 + random() * 2200000) / 1000) * 1000,
    risk_tolerance: pick(riskTolerances),
    created_date: dateDaysAgo(30 + Math.floor(random() * 720)),
  });
  clientId += 1;
}

// Pin a few story-friendly records for the live demo.
const showcaseAdvisorId = 3;
const showcaseClients = [
  { id: 47, advisor_id: showcaseAdvisorId, first_name: "Maria", last_name: "Vasquez", household_assets_usd: 870000, risk_tolerance: "moderate", created_date: "2026-01-18" },
  { id: 112, advisor_id: showcaseAdvisorId, first_name: "Daniel", last_name: "Okafor", household_assets_usd: 640000, risk_tolerance: "conservative", created_date: "2026-02-09" },
  { id: 89, advisor_id: showcaseAdvisorId, first_name: "Patricia", last_name: "Lim", household_assets_usd: 1325000, risk_tolerance: "moderate", created_date: "2025-11-03" },
  { id: 133, advisor_id: showcaseAdvisorId, first_name: "Nina", last_name: "Patel", household_assets_usd: 425000, risk_tolerance: "aggressive", created_date: "2025-09-20" },
];
const showcaseClientIds = new Set(showcaseClients.map((client) => client.id));

for (const replacement of showcaseClients) {
  const idx = clients.findIndex((client) => client.id === replacement.id);
  if (idx >= 0) clients[idx] = replacement;
}

const accountApplications = [];
for (let id = 1; id <= 180; id += 1) {
  const client = clients[Math.floor(random() * clients.length)];
  const status = random() < 0.25 ? "needs_info" : pick(statuses);
  const changedDays = status === "needs_info"
    ? 3 + Math.floor(random() * 35)
    : 1 + Math.floor(random() * 60);

  accountApplications.push({
    id,
    client_id: client.id,
    custodian: pick(custodians),
    account_type: pick(accountTypes),
    status,
    status_changed_at: daysAgo(changedDays),
    created_at: daysAgo(changedDays + 5 + Math.floor(random() * 20)),
  });
}

const nonShowcaseApplications = accountApplications.filter((application) => !showcaseClientIds.has(application.client_id));
accountApplications.length = 0;
accountApplications.push(
  { id: 1, client_id: 47, custodian: "Schwab", account_type: "IRA", status: "needs_info", status_changed_at: daysAgo(45), created_at: daysAgo(53) },
  { id: 2, client_id: 112, custodian: "Fidelity", account_type: "Joint", status: "submitted", status_changed_at: daysAgo(3), created_at: daysAgo(12) },
  { id: 3, client_id: 89, custodian: "Pershing", account_type: "Trust", status: "approved", status_changed_at: daysAgo(7), created_at: daysAgo(21) },
  { id: 4, client_id: 133, custodian: "BetaNXT", account_type: "Roth", status: "funded", status_changed_at: daysAgo(2), created_at: daysAgo(18) },
);
accountApplications.push(...nonShowcaseApplications.slice(0, 176).map((application, index) => ({ ...application, id: index + 5 })));
for (const application of accountApplications) {
  const client = clients.find((candidate) => candidate.id === application.client_id);
  if (client?.advisor_id === showcaseAdvisorId && application.client_id !== 47 && application.status === "needs_info") {
    application.status = "submitted";
    application.status_changed_at = daysAgo(4);
  }
}

const engagementEvents = [];
for (let id = 1; id <= 1200; id += 1) {
  const client = clients[Math.floor(random() * clients.length)];
  const eventType = pick(eventTypes);
  engagementEvents.push({
    id,
    client_id: client.id,
    advisor_id: client.advisor_id,
    event_type: eventType,
    occurred_at: daysAgo(Math.floor(random() * 90)),
    duration_minutes: eventType === "call" || eventType === "meeting" ? 10 + Math.floor(random() * 50) : null,
    notes: eventType === "portal_login" ? "Client viewed onboarding checklist." : "Mock CRM activity imported from Snowflake-style hub.",
  });
}

const nonShowcaseEvents = engagementEvents.filter((event) => !showcaseClientIds.has(event.client_id));
engagementEvents.length = 0;
engagementEvents.push(
  { id: 1, client_id: 47, advisor_id: showcaseAdvisorId, event_type: "email", occurred_at: daysAgo(18), duration_minutes: null, notes: "Advisor requested missing beneficiary information." },
  { id: 2, client_id: 112, advisor_id: showcaseAdvisorId, event_type: "call", occurred_at: daysAgo(6), duration_minutes: 28, notes: "Client called about stalled paperwork." },
  { id: 3, client_id: 89, advisor_id: showcaseAdvisorId, event_type: "meeting", occurred_at: daysAgo(22), duration_minutes: 45, notes: "Portfolio review meeting." },
  { id: 4, client_id: 133, advisor_id: showcaseAdvisorId, event_type: "email", occurred_at: daysAgo(42), duration_minutes: null, notes: "Quarterly review invitation sent." },
  { id: 5, client_id: 47, advisor_id: showcaseAdvisorId, event_type: "call", occurred_at: daysAgo(35), duration_minutes: 17, notes: "Initial onboarding call." },
);
engagementEvents.push(...nonShowcaseEvents.slice(0, 1195).map((event, index) => ({ ...event, id: index + 6 })));
while (engagementEvents.length < 1200) {
  const client = clients.find((candidate) => !showcaseClientIds.has(candidate.id));
  engagementEvents.push({
    id: engagementEvents.length + 1,
    client_id: client.id,
    advisor_id: client.advisor_id,
    event_type: "email",
    occurred_at: daysAgo(12 + (engagementEvents.length % 70)),
    duration_minutes: null,
    notes: "Backfilled mock CRM activity imported from Snowflake-style hub.",
  });
}

const callEvents = engagementEvents.filter((event) => event.event_type === "call");
const callTranscripts = [];
for (let id = 1; id <= 45; id += 1) {
  const event = callEvents[(id * 13) % callEvents.length];
  const tone = id % 9 === 0 ? "negative" : id % 3 === 0 ? "positive" : "neutral";
  const client = clients.find((candidate) => candidate.id === event.client_id);
  callTranscripts.push({
    id,
    engagement_event_id: event.id,
    client_id: event.client_id,
    transcript: transcriptText(`${client.first_name} ${client.last_name}`, tone),
    sentiment_label: id % 7 === 0 ? null : tone,
  });
}

const nonShowcaseTranscripts = callTranscripts.filter((transcript) => !showcaseClientIds.has(transcript.client_id));
callTranscripts.length = 0;
callTranscripts.push(
  { id: 1, engagement_event_id: 2, client_id: 112, transcript: transcriptText("Daniel Okafor", "negative"), sentiment_label: "negative" },
  { id: 2, engagement_event_id: 5, client_id: 47, transcript: transcriptText("Maria Vasquez", "neutral"), sentiment_label: "neutral" },
  { id: 3, engagement_event_id: callEvents[6].id, client_id: callEvents[6].client_id, transcript: transcriptText("demo client", "positive"), sentiment_label: "positive" },
  { id: 4, engagement_event_id: callEvents[7].id, client_id: callEvents[7].client_id, transcript: transcriptText("demo client", "negative"), sentiment_label: "negative" },
);
callTranscripts.push(...nonShowcaseTranscripts.slice(0, 41).map((transcript, index) => ({ ...transcript, id: index + 5 })));

const data = {
  generated_at: NOW.toISOString(),
  source_system: "mock_snowflake_customer_360",
  base_url_placeholder: "https://xxmf-qrth-inat.n7d.xano.io/api:assetmark-mock-data-hub",
  advisors,
  clients,
  account_applications: accountApplications,
  engagement_events: engagementEvents,
  call_transcripts: callTranscripts,
};

mkdirSync(dirname(outputPath), { recursive: true });
mkdirSync(dirname(fixturePath), { recursive: true });
const body = `${JSON.stringify(data, null, 2)}\n`;
writeFileSync(outputPath, body);
writeFileSync(fixturePath, body);
console.log(`Wrote ${outputPath}`);
console.log(`Wrote ${fixturePath}`);
console.log(`Records: ${advisors.length} advisors, ${clients.length} clients, ${accountApplications.length} applications, ${engagementEvents.length} events, ${callTranscripts.length} transcripts`);
