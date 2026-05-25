query "pulse/me" verb=GET {
  api_group = "Advisor Pulse"
  description = "Returns the ranked client attention list for the authenticated advisor."
  auth = "user"

  input {
  }

  stack {
    db.get user {
      field_name = "id"
      field_value = $auth.id
      output = ["id", "name", "email", "advisor_id"]
    } as $user

    precondition ($user.advisor_id != null) {
      error_type = "inputerror"
      error = "This user is not linked to an advisor id."
    }

    function.run "advisor_pulse/build_list" {
      input = { advisor_id: $user.advisor_id }
    } as $ranked
  }

  response = $ranked
  guid = "7UniLL2OvzT_79weZexMQnaUPY8"
}
