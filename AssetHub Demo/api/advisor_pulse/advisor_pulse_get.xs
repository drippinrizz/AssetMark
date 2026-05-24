query "advisors/{advisor_id}/pulse" verb=GET {
  api_group = "Advisor Pulse"
  description = "Returns the ranked client attention list for one advisor."
  auth = "none"
  input {
    int advisor_id
    text hub_base_url?
  }
  stack {
    var $hub_base_url {
      value = $input.hub_base_url ?? $env.MOCK_DATA_HUB_BASE_URL
    }
    precondition ($hub_base_url != null && $hub_base_url != "") {
      error_type = "inputerror"
      error = "Set MOCK_DATA_HUB_BASE_URL or pass hub_base_url."
    }
    api.request {
      url = $hub_base_url ~ "/clients?advisor_id=" ~ ($input.advisor_id|to_text)
      method = "GET"
      timeout = 30
    } as $clients_response
    var $clients {
      value = $clients_response.response.result
    }
    var $flagged {
      value = []
    }
    foreach ($clients) {
      each as $client {
        api.request {
          url = $hub_base_url ~ "/applications?client_id=" ~ ($client.id|to_text)
          method = "GET"
          timeout = 30
        } as $applications_response
        api.request {
          url = $hub_base_url ~ "/clients/" ~ ($client.id|to_text) ~ "/events"
          method = "GET"
          timeout = 30
        } as $events_response
        api.request {
          url = $hub_base_url ~ "/transcripts?client_id=" ~ ($client.id|to_text)
          method = "GET"
          timeout = 30
        } as $transcripts_response
        var $applications {
          value = $applications_response.response.result
        }
        var $events {
          value = $events_response.response.result
        }
        var $transcripts {
          value = $transcripts_response.response.result
        }
        var $last_event {
          value = $events|first
        }
        var $days_since_last_contact {
          value = ($last_event == null ? 999 : ((((now|to_ms) - $last_event.occurred_at) / 86400000)|floor))
        }
        array.find ($applications) if ($this.status == "needs_info" && (((now|to_ms) - $this.status_changed_at) / 86400000) >= 14) as $stalled_application
        conditional {
          if ($stalled_application != null) {
            var $days_stuck {
              value = (((now|to_ms) - $stalled_application.status_changed_at) / 86400000)|floor
            }
            var.update $flagged {
              value = $flagged|push:{
                client_id: $client.id,
                advisor_id: $client.advisor_id,
                name: $client.first_name ~ " " ~ $client.last_name,
                reason: "stalled_application",
                reason_detail: $stalled_application.account_type ~ " application at " ~ $stalled_application.custodian ~ " has been in needs_info for " ~ ($days_stuck|to_text) ~ " days.",
                days_since_last_contact: $days_since_last_contact,
                priority_score: 90 + $days_stuck
              }
            }
            continue
          }
        }
        var $latest_transcript {
          value = $transcripts|first
        }
        conditional {
          if ($latest_transcript != null && $latest_transcript.sentiment_label == "negative") {
            var.update $flagged {
              value = $flagged|push:{
                client_id: $client.id,
                advisor_id: $client.advisor_id,
                name: $client.first_name ~ " " ~ $client.last_name,
                reason: "negative_sentiment",
                reason_detail: "Most recent call transcript is labeled negative.",
                days_since_last_contact: $days_since_last_contact,
                priority_score: 95
              }
            }
            continue
          }
        }
        conditional {
          if ($client.household_assets_usd > 1000000 && $days_since_last_contact >= 14) {
            var.update $flagged {
              value = $flagged|push:{
                client_id: $client.id,
                advisor_id: $client.advisor_id,
                name: $client.first_name ~ " " ~ $client.last_name,
                reason: "high_value_stale",
                reason_detail: "Household assets exceed $1M and the client has not been contacted in 14+ days.",
                days_since_last_contact: $days_since_last_contact,
                priority_score: 80 + ($days_since_last_contact|min:30)
              }
            }
            continue
          }
        }
        conditional {
          if ($days_since_last_contact >= 30) {
            var.update $flagged {
              value = $flagged|push:{
                client_id: $client.id,
                advisor_id: $client.advisor_id,
                name: $client.first_name ~ " " ~ $client.last_name,
                reason: "no_recent_contact",
                reason_detail: "No CRM engagement event in 30+ days.",
                days_since_last_contact: $days_since_last_contact,
                priority_score: 60 + ($days_since_last_contact|min:30)
              }
            }
          }
        }
      }
    }
    var $ranked {
      value = []
    }
    array.filter ($flagged) if ($this.reason == "stalled_application") as $stalled_clients
    array.filter ($flagged) if ($this.reason == "negative_sentiment") as $negative_clients
    array.filter ($flagged) if ($this.reason == "high_value_stale") as $high_value_clients
    array.filter ($flagged) if ($this.reason == "no_recent_contact") as $stale_clients
    var.update $ranked {
      value = $ranked|merge:$stalled_clients
    }
    var.update $ranked {
      value = $ranked|merge:$negative_clients
    }
    var.update $ranked {
      value = $ranked|merge:$high_value_clients
    }
    var.update $ranked {
      value = $ranked|merge:$stale_clients
    }
  }
  response = $ranked
  guid = "lmb2ACH8XYiFptgzsQnLFu8Pfcs"
}
