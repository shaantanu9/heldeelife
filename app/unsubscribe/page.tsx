import { supabaseAdmin } from '@/lib/supabase/server'

interface UnsubscribePageProps {
  searchParams: Promise<{ email?: string }>
}

export default async function UnsubscribePage({ searchParams }: UnsubscribePageProps) {
  const { email } = await searchParams

  if (!email) {
    return (
      <main style={{ fontFamily: 'Arial, sans-serif', maxWidth: 480, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
        <h1 style={{ fontSize: 24, color: '#1a1a2e', marginBottom: 12 }}>Unsubscribe</h1>
        <p style={{ color: '#555', lineHeight: 1.6 }}>
          No email address was provided. Please use the unsubscribe link from your email.
        </p>
        <a href="/" style={{ display: 'inline-block', marginTop: 24, color: '#6366f1', textDecoration: 'none' }}>
          ← Back to HeldeeLife
        </a>
      </main>
    )
  }

  // Upsert: on conflict (email already unsubscribed) do nothing — idempotent
  const { error } = await supabaseAdmin
    .from('email_unsubscribes')
    .upsert({ email }, { onConflict: 'email', ignoreDuplicates: true })

  if (error) {
    console.error('Unsubscribe error:', error)
    return (
      <main style={{ fontFamily: 'Arial, sans-serif', maxWidth: 480, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
        <h1 style={{ fontSize: 24, color: '#1a1a2e', marginBottom: 12 }}>Something went wrong</h1>
        <p style={{ color: '#555', lineHeight: 1.6 }}>
          We could not process your request. Please try again or contact support.
        </p>
        <a href="/" style={{ display: 'inline-block', marginTop: 24, color: '#6366f1', textDecoration: 'none' }}>
          ← Back to HeldeeLife
        </a>
      </main>
    )
  }

  return (
    <main style={{ fontFamily: 'Arial, sans-serif', maxWidth: 480, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
      <h1 style={{ fontSize: 24, color: '#1a1a2e', marginBottom: 12 }}>You&apos;ve been unsubscribed</h1>
      <p style={{ color: '#555', lineHeight: 1.6 }}>
        <strong>{email}</strong> has been removed from cart recovery emails.
        You will no longer receive abandoned cart reminders from HeldeeLife.
      </p>
      <a href="/" style={{ display: 'inline-block', marginTop: 24, color: '#6366f1', textDecoration: 'none' }}>
        ← Back to HeldeeLife
      </a>
    </main>
  )
}
