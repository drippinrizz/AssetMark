table user {
  auth = true
  description = "Advisor Pulse demo users linked to Mock Data Hub advisors."

  schema {
    int id
    timestamp created_at?=now {
      visibility = "private"
    }
    text name filters=trim
    email email filters=trim|lower
    password password filters=min:8
    int advisor_id? {
      description = "Mock Data Hub advisor id used by GET /pulse/me"
    }
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree|unique", field: [{name: "email", op: "asc"}]}
    {type: "btree", field: [{name: "advisor_id", op: "asc"}]}
  ]
  guid = "XOcgn6nzG9A3rcYonZyeZsAFwzU"
}
