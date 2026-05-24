table "account_applications" {
  auth = false
  schema {
    int id
    int client_id
    text custodian filters=trim
    text account_type filters=trim
    text status filters=trim
    timestamp status_changed_at
    timestamp created_at
  }
  index = [
    {type: "primary", field: [{name: "id"}]},
    {type: "btree", field: [{name: "client_id"}]},
    {type: "btree", field: [{name: "status"}]}
  ]
  guid = "pyjutlgrxz-t3BDMsdG9cNP3_js"
}
