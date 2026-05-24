query "clients" verb=GET {
  api_group = "Mock Data Hub"
  auth = "none"
  input {
    int advisor_id?
  }
  stack {
    db.query "clients" {
      where = $db.clients.advisor_id ==? $input.advisor_id
      sort = { id: "asc" }
    } as $clients
  }
  response = $clients
  guid = "1lS2QnRynAvE9zCTTMxb09OR6ts"
}
