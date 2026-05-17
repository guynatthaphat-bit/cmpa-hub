// LINE Messaging API helper
// Sends push messages to a user or group ID configured via environment variables.
// Silently fails (logs warning) if env vars are missing — never throws.

export async function sendLineMessage(message: string): Promise<void> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN
  const to = process.env.LINE_ADMIN_NOTIFY_ID

  if (!token || !to) {
    console.warn('[LINE] LINE_CHANNEL_ACCESS_TOKEN or LINE_ADMIN_NOTIFY_ID is not set — skipping LINE notification')
    return
  }

  try {
    const res = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        messages: [{ type: 'text', text: message }],
      }),
    })

    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.warn(`[LINE] Push message failed: ${res.status} ${res.statusText}`, body)
    }
  } catch (err) {
    console.warn('[LINE] Push message threw an error:', err)
  }
}
