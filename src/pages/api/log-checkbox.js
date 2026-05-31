// DEPRECATED: This endpoint is no longer used. Use /api/log-checkpoint instead.
// Keeping this file as a no-op to prevent errors if any old code calls it.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  console.warn('DEPRECATED: log-checkbox API called. Use /api/log-checkpoint instead.')

  return res.status(200).json({
    success: true,
    message: 'This endpoint is deprecated. Use /api/log-checkpoint instead.',
  })
}
