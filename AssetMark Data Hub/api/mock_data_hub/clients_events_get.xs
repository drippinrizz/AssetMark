query "clients/{client_id}/events" verb=GET {
  api_group = "Mock Data Hub"
  auth = "none"
  input {
    int client_id
  }
  stack {
    db.query "engagement_events" {
      where = $db.engagement_events.client_id == $input.client_id
      sort = { occurred_at: "desc" }
    } as $events
  }
  response = $events
  guid = "F8KJpuIFjnxRloSYsGcJ06rbphA"
}
