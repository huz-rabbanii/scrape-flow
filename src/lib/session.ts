import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';

const SESSION_COOKIE_NAME = 'scrape_session_id';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/**
 * Get the current user's ID if authenticated, or session ID for anonymous users.
 */
export async function getUserOrSessionId(): Promise<{ userId?: string; sessionId?: string }> {
  const session = await getServerSession(authOptions);
  
  if (session?.user) {
    return { userId: (session.user as any).id };
  }
  
  // Fallback to anonymous session
  const sessionId = await getSessionId();
  return { sessionId };
}

/**
 * Get or create a session ID for anonymous users.
 * Each browser gets a unique session ID stored in a cookie.
 */
export async function getSessionId(): Promise<string> {
  const cookieStore = await cookies();
  let sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  
  if (!sessionId) {
    sessionId = uuidv4();
    cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE,
      path: '/',
    });
  }
  
  return sessionId;
}

/**
 * Clear the session (for "Clear History" feature)
 */
export async function clearSession(): Promise<string> {
  const cookieStore = await cookies();
  const newSessionId = uuidv4();
  
  cookieStore.set(SESSION_COOKIE_NAME, newSessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });
  
  return newSessionId;
}
