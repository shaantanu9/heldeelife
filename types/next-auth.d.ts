import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      phoneNumber?: string | null
      image?: string | null
      role?: 'user' | 'admin'
    }
  }

  interface User {
    id: string
    email: string
    name?: string | null
    phoneNumber?: string | null
    role?: 'user' | 'admin'
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    email: string
    name?: string | null
    phoneNumber?: string | null
    role?: 'user' | 'admin'
  }
}
