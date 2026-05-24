query "advisors/{advisor_id}" verb=GET {
  api_group = "Mock Data Hub"
  auth = "none"
  input {
    int advisor_id
  }
  stack {
    db.get "advisors" {
      field_name = "id"
      field_value = $input.advisor_id
    } as $advisor
    precondition ($advisor != null) {
      error_type = "notfound"
      error = "Advisor not found"
    }
    db.query "clients" {
      where = $db.clients.advisor_id == $input.advisor_id
      sort = { id: "asc" }
    } as $clients
    var $result {
      value = $advisor|set:"clients":$clients
    }
  }
  response = $result
  guid = "N6PBdeosY7dJbC4CUysARcH3KPk"
}
