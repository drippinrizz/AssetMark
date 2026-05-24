// Mock Snowflake-style customer 360 datasource for the Advisor Pulse training demo.
workspace "AssetMark Mock Data Hub" {
  description = "Mock Snowflake-style customer 360 datasource for the Advisor Pulse training demo."
  env = {
    DEMO_SOURCE: "mock_snowflake_customer_360"
  }
  acceptance = { ai_terms: false }
  preferences = {
    internal_docs: false
    track_performance: true
    sql_names: false
    sql_columns: true
  }
}
