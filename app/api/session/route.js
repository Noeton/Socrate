import { randomUUID } from 'crypto';

export async function GET() {
  // Générer un nouveau UUID à chaque demande
  // Le client le stockera en localStorage
  const userId = randomUUID();
  
  return Response.json({ userId, isGuest: true });
}
