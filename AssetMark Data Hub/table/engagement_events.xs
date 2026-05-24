table "engagement_events" {
  auth = false
  schema {
    int id
    int client_id
    int advisor_id
    text event_type filters=trim
    timestamp occurred_at
    int? duration_minutes
    text? notes
  }
  index = [
    {type: "primary", field: [{name: "id"}]},
    {type: "btree", field: [{name: "client_id"}]},
    {type: "btree", field: [{name: "advisor_id"}]},
    {type: "btree", field: [{name: "occurred_at"}]}
  ]
  guid = "41y9vnkAqD3xUSa2kyDLyVL4Aiw"
}
