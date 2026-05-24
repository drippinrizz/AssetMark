query "advisors" verb=GET {
  api_group = "Mock Data Hub"
  auth = "none"
  input {
  }
  stack {
    db.query "advisors" {
      sort = { id: "asc" }
    } as $advisors
  }
  response = $advisors
  guid = "sMDmhzqkWxT-px0NZbzcuwJE7qA"
}
