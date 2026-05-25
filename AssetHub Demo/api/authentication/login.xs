query "auth/login" verb=POST {
  api_group = "Authentication"
  description = "Log in with email and password."
  auth = "none"

  input {
    email email filters=trim|lower
    text password
  }

  stack {
    db.get user {
      field_name = "email"
      field_value = $input.email
    } as $user

    precondition ($user != null) {
      error_type = "accessdenied"
      error = "Invalid email or password."
    }

    security.check_password {
      text_password = $input.password
      hash_password = $user.password
    } as $password_valid

    precondition ($password_valid) {
      error_type = "accessdenied"
      error = "Invalid email or password."
    }

    security.create_auth_token {
      table = "user"
      extras = {}
      expiration = 86400
      id = $user.id
    } as $authToken
  }

  response = {
    authToken: $authToken
    user: {
      id: $user.id
      name: $user.name
      email: $user.email
      advisor_id: $user.advisor_id
    }
  }
  guid = "YCMrHrVO5q3Bi08zExuIZpC0CqU"
}
