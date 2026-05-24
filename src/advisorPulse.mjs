const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const DEFAULT_RULES = {
  staleApplicationDays: 14,
  staleContactDays: 30,
  highValueContactDays: 14,
  highValueThresholdUsd: 1_000_000,
};

export function daysBetween(now, then) {
  if (!then) return 999;
  return Math.floor((new Date(now).getTime() - new Date(then).getTime()) / MS_PER_DAY);
}

export function buildMockHubClient(data) {
  return {
    listClients({ advisorId } = {}) {
      return data.clients.filter((client) => advisorId == null || client.advisor_id === advisorId);
    },
    listApplications({ clientId, status } = {}) {
      return data.account_applications.filter((application) => {
        return (clientId == null || application.client_id === clientId)
          && (status == null || application.status === status);
      });
    },
    listEvents({ clientId } = {}) {
      return data.engagement_events
        .filter((event) => clientId == null || event.client_id === clientId)
        .sort((a, b) => new Date(b.occurred_at) - new Date(a.occurred_at));
    },
    listTranscripts({ clientId } = {}) {
      return data.call_transcripts
        .filter((transcript) => clientId == null || transcript.client_id === clientId)
        .sort((a, b) => b.id - a.id);
    },
  };
}

export function computeAdvisorPulse({
  advisorId,
  clients,
  applications,
  events,
  transcripts,
  now = new Date().toISOString(),
  rules = DEFAULT_RULES,
}) {
  const advisorClients = clients.filter((client) => client.advisor_id === advisorId);
  const flagged = [];

  for (const client of advisorClients) {
    const clientEvents = events
      .filter((event) => event.client_id === client.id)
      .sort((a, b) => new Date(b.occurred_at) - new Date(a.occurred_at));
    const lastEvent = clientEvents[0] ?? null;
    const daysSinceLastContact = daysBetween(now, lastEvent?.occurred_at);

    const stalledApplication = applications.find((application) => {
      return application.client_id === client.id
        && application.status === "needs_info"
        && daysBetween(now, application.status_changed_at) >= rules.staleApplicationDays;
    });

    if (stalledApplication) {
      flagged.push({
        client_id: client.id,
        advisor_id: client.advisor_id,
        name: `${client.first_name} ${client.last_name}`,
        reason: "stalled_application",
        reason_detail: `${stalledApplication.account_type} application at ${stalledApplication.custodian} has been in needs_info for ${daysBetween(now, stalledApplication.status_changed_at)} days.`,
        days_since_last_contact: daysSinceLastContact,
        priority_score: 90 + daysBetween(now, stalledApplication.status_changed_at),
      });
      continue;
    }

    const latestTranscript = transcripts
      .filter((transcript) => transcript.client_id === client.id)
      .sort((a, b) => b.id - a.id)[0] ?? null;

    if (latestTranscript?.sentiment_label === "negative") {
      flagged.push({
        client_id: client.id,
        advisor_id: client.advisor_id,
        name: `${client.first_name} ${client.last_name}`,
        reason: "negative_sentiment",
        reason_detail: "Most recent call transcript is labeled negative.",
        days_since_last_contact: daysSinceLastContact,
        priority_score: 95,
      });
      continue;
    }

    if (
      client.household_assets_usd > rules.highValueThresholdUsd
      && daysSinceLastContact >= rules.highValueContactDays
    ) {
      flagged.push({
        client_id: client.id,
        advisor_id: client.advisor_id,
        name: `${client.first_name} ${client.last_name}`,
        reason: "high_value_stale",
        reason_detail: "Household assets exceed $1M and the client has not been contacted in 14+ days.",
        days_since_last_contact: daysSinceLastContact,
        priority_score: 80 + Math.min(daysSinceLastContact, 30),
      });
      continue;
    }

    if (daysSinceLastContact >= rules.staleContactDays) {
      flagged.push({
        client_id: client.id,
        advisor_id: client.advisor_id,
        name: `${client.first_name} ${client.last_name}`,
        reason: "no_recent_contact",
        reason_detail: "No CRM engagement event in 30+ days.",
        days_since_last_contact: daysSinceLastContact,
        priority_score: 60 + Math.min(daysSinceLastContact, 30),
      });
    }
  }

  return flagged.sort((a, b) => {
    if (b.priority_score !== a.priority_score) return b.priority_score - a.priority_score;
    if (b.days_since_last_contact !== a.days_since_last_contact) {
      return b.days_since_last_contact - a.days_since_last_contact;
    }
    return a.client_id - b.client_id;
  });
}

export function getAdvisorPulse({ advisorId, hubClient, now, rules }) {
  const clients = hubClient.listClients({ advisorId });
  const applications = clients.flatMap((client) => hubClient.listApplications({ clientId: client.id }));
  const events = clients.flatMap((client) => hubClient.listEvents({ clientId: client.id }));
  const transcripts = clients.flatMap((client) => hubClient.listTranscripts({ clientId: client.id }));

  return computeAdvisorPulse({
    advisorId,
    clients,
    applications,
    events,
    transcripts,
    now,
    rules,
  });
}
