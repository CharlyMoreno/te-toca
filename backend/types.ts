export type User = {
  id: string
  display_name: string
}

export type AppEnv = {
  Bindings: {
    DB: D1Database
  }
  Variables: {
    user: User
  }
}
