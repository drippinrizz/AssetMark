query "auth/me" verb=GET {
  api_group = "Authentication"
  description = "Return the authenticated demo user."
  auth = "user"

  input {
  }

  stack {
    db.get user {
      field_name = "id"
      field_value = $auth.id
      output = ["id", "name", "email", "advisor_id", "created_at"]
    } as $user
  }

  response = $user
  guid = "7o4S9larnmrmD3iQ-7lgF_Vsw98"
}
