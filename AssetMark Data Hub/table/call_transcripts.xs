table "call_transcripts" {
  auth = false
  schema {
    int id
    int engagement_event_id
    int client_id
    text transcript
    text? sentiment_label filters=trim
  }
  index = [
    {type: "primary", field: [{name: "id"}]},
    {type: "btree", field: [{name: "client_id"}]},
    {type: "btree", field: [{name: "engagement_event_id"}]}
  ]
  guid = "qMcs8WayAPAh-MqHWf4-1IgTGXY"
}
