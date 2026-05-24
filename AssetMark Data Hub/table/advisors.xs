table "advisors" {
  auth = false
  schema {
    int id
    text first_name filters=trim
    text last_name filters=trim
    text region filters=trim
    date joined_date
  }
  index = [
    {type: "primary", field: [{name: "id"}]},
    {type: "btree", field: [{name: "region"}]}
  ]
  guid = "kfbhAEzlgwFcpZ5FxRmZdnuCfWI"
}
