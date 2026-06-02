/**
 * Liveness route for container health checks (0.8). Static, dependency-free.
 */
export const dynamic = 'force-static';

export function GET(): Response {
  return Response.json({ status: 'ok', service: 'web' });
}
