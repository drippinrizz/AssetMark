query "clients/{client_id}" verb=GET {
  api_group = "Mock Data Hub"
  auth = "none"
  input {
    int client_id
  }
  stack {
    db.get "clients" {
      field_name = "id"
      field_value = $input.client_id
    } as $client
    precondition ($client != null) {
      error_type = "notfound"
      error = "Client not found"
    }
    db.query "account_applications" {
      where = $db.account_applications.client_id == $input.client_id
      sort = { created_at: "desc" }
    } as $applications
    db.query "engagement_events" {
      where = $db.engagement_events.client_id == $input.client_id
      sort = { occurred_at: "desc" }
    } as $events
    var $result {
      value = $client|set:"applications":$applications|set:"recent_events":($events|slice:0:10)
    }
  }
  response = $result
  guid = "4-sngfImCuutritsUSGcWaUvMuE"
}
