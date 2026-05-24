table "clients" {
  auth = false
  schema {
    int id
    int advisor_id
    text first_name filters=trim
    text last_name filters=trim
    decimal household_assets_usd
    text risk_tolerance filters=trim
    date created_date
  }
  index = [
    {type: "primary", field: [{name: "id"}]},
    {type: "btree", field: [{name: "advisor_id"}]}
  ]
  guid = "96ua5AmaWP7qVwQdR4qNO7owW3A"
}
