query "transcripts" verb=GET {
  api_group = "Mock Data Hub"
  auth = "none"
  input {
    int client_id?
  }
  stack {
    db.query "call_transcripts" {
      where = $db.call_transcripts.client_id ==? $input.client_id
      sort = { id: "desc" }
    } as $transcripts
  }
  response = $transcripts
  guid = "vbnfzZrt0BuSo7em9TEQzY5cyLI"
}
