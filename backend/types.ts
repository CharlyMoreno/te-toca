export type User = {
  id: string
  display_name: string
}

export type AppEnv = {
  Bindings: {
    DB: D1Database
    HOUSE_PRESENCE: DurableObjectNamespace
  }
  Variables: {
    user: User
    sessionHash: string
  }
}
