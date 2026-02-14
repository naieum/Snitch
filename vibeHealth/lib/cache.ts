import { getRedis } from "./redis";

// VULN [Cat 18]: Patient data cached without encryption, no TTL
export async function cachePatientData(
  patientId: string,
  data: Record<string, unknown>
) {
  try {
    const redis = getRedis();
    // VULN [Cat 18]: No TTL set - data persists indefinitely
    // VULN [Cat 18]: PHI stored unencrypted in cache
    await redis.set(`patient:${patientId}`, JSON.stringify(data));
  } catch {
    console.warn("Cache write failed - Redis unavailable");
  }
}

export async function getCachedPatient(patientId: string) {
  try {
    const redis = getRedis();
    const data = await redis.get(`patient:${patientId}`);
    return data ? JSON.parse(data as string) : null;
  } catch {
    console.warn("Cache read failed - Redis unavailable");
    return null;
  }
}

export async function cacheSessionData(
  sessionId: string,
  data: Record<string, unknown>
) {
  try {
    const redis = getRedis();
    // No TTL, no encryption
    await redis.set(`session:${sessionId}`, JSON.stringify(data));
  } catch {
    console.warn("Cache write failed");
  }
}
