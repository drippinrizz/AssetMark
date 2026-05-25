// Empty baseline for cohort resets — env only, no APIs.
workspace "AssetMark Advisor Pulse Demo" {
  description = "Advisor Pulse API demo that queries the Mock Data Hub."
  env = {
    MOCK_DATA_HUB_BASE_URL: "https://xxmf-qrth-inat.n7d.xano.io/api:assetmark-mock-data-hub"
  }
  acceptance = { ai_terms: false }
  preferences = {
    internal_docs: false
    track_performance: true
    sql_names: false
    sql_columns: true
  }
}
