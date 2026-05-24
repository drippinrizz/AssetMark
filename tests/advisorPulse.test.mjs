import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import {
  buildMockHubClient,
  computeAdvisorPulse,
  getAdvisorPulse,
} from "../src/advisorPulse.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(readFileSync(join(__dirname, "fixtures", "mock-data-hub-seed.json"), "utf8"));
const now = data.generated_at;

describe("Advisor Pulse scoring", () => {
  it("flags stalled applications, negative transcripts, high-value stale clients, and 30+ day contact gaps", () => {
    const result = computeAdvisorPulse({
      advisorId: 3,
      clients: data.clients,
      applications: data.account_applications,
      events: data.engagement_events,
      transcripts: data.call_transcripts,
      now,
    });

    const byClientId = new Map(result.map((entry) => [entry.client_id, entry]));

    assert.equal(byClientId.get(47).reason, "stalled_application");
    assert.equal(byClientId.get(47).days_since_last_contact, 18);
    assert.equal(byClientId.get(112).reason, "negative_sentiment");
    assert.equal(byClientId.get(112).priority_score, 95);
    assert.equal(byClientId.get(89).reason, "high_value_stale");
    assert.equal(byClientId.get(133).reason, "no_recent_contact");
  });

  it("ranks highest priority cases first and keeps the response contract stable", () => {
    const result = getAdvisorPulse({
      advisorId: 3,
      hubClient: buildMockHubClient(data),
      now,
    });

    assert.ok(result.length >= 4);
    assert.deepEqual(Object.keys(result[0]), [
      "client_id",
      "advisor_id",
      "name",
      "reason",
      "reason_detail",
      "days_since_last_contact",
      "priority_score",
    ]);
    assert.equal(result[0].client_id, 47);

    for (let i = 1; i < result.length; i += 1) {
      assert.ok(result[i - 1].priority_score >= result[i].priority_score);
    }
  });

  it("can query the seeded hub through the same client boundary used by the demo service", () => {
    const hubClient = buildMockHubClient(data);

    assert.equal(hubClient.listClients({ advisorId: 3 }).some((client) => client.id === 47), true);
    assert.equal(hubClient.listApplications({ clientId: 47, status: "needs_info" }).length, 1);
    assert.equal(hubClient.listEvents({ clientId: 112 })[0].id, 2);
    assert.equal(hubClient.listTranscripts({ clientId: 112 })[0].sentiment_label, "negative");
  });
});
