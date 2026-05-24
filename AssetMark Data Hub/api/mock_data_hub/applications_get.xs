query "applications" verb=GET {
  api_group = "Mock Data Hub"
  auth = "none"
  input {
    int client_id?
    text status?
    int stale_days?=0
  }
  stack {
    db.query "account_applications" {
      where = $db.account_applications.client_id ==? $input.client_id && $db.account_applications.status ==? $input.status
      sort = { status_changed_at: "asc" }
    } as $applications
    conditional {
      if ($input.stale_days > 0) {
        var $threshold_ms {
          value = (now|to_ms) - ($input.stale_days * 86400000)
        }
        var.update $applications {
          value = $applications|filter:($$.status_changed_at|to_ms) <= $threshold_ms
        }
      }
    }
  }
  response = $applications
  guid = "b2p96_bbWbkrshVuaHieqcNE_d4"
}
