query "auth/signup" verb=POST {
  api_group = "Authentication"
  description = "Register a demo user linked to a hub advisor id."
  auth = "none"

  input {
    text name filters=trim|min:1
    email email filters=trim|lower
    text password filters=min:8
    int advisor_id? {
      description = "Mock Data Hub advisor id for pulse results"
    }
  }

  stack {
    db.get user {
      field_name = "email"
      field_value = $input.email
    } as $existing_user

    precondition ($existing_user == null) {
      error_type = "inputerror"
      error = "An account with this email already exists."
    }

    db.add user {
      data = {
        name: $input.name
        email: $input.email
        password: $input.password
        advisor_id: $input.advisor_id
        created_at: now
      }
    } as $new_user

    security.create_auth_token {
      table = "user"
      extras = {}
      expiration = 86400
      id = $new_user.id
    } as $authToken
  }

  response = {
    authToken: $authToken
    user: {
      id: $new_user.id
      name: $new_user.name
      email: $new_user.email
      advisor_id: $new_user.advisor_id
    }
  }
  guid = "7KBg1HJcjfUjtDdbImEz5OzT0Mw"
}
