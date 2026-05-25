query "advisors/{advisor_id}/pulse" verb=GET {
  api_group = "Advisor Pulse"
  description = "Returns the ranked client attention list for one advisor."
  auth = "none"
  input {
    int advisor_id
    text hub_base_url?
  }
  stack {
    function.run "advisor_pulse/build_list" {
      input = {
        advisor_id: $input.advisor_id
        hub_base_url: $input.hub_base_url
      }
    } as $ranked
  }
  response = $ranked
  guid = "lmb2ACH8XYiFptgzsQnLFu8Pfcs"
}
