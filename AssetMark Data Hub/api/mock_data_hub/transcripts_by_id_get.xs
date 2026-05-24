query "transcripts/{transcript_id}" verb=GET {
  api_group = "Mock Data Hub"
  auth = "none"
  input {
    int transcript_id
  }
  stack {
    db.get "call_transcripts" {
      field_name = "id"
      field_value = $input.transcript_id
    } as $transcript
    precondition ($transcript != null) {
      error_type = "notfound"
      error = "Transcript not found"
    }
  }
  response = $transcript
  guid = "9u11k4Lfkl1ADdPkgwbH2zMRxTw"
}
