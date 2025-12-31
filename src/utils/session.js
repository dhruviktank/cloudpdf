// session.js
export function getSessionId() {
  let sessionId = localStorage.getItem("sessionId");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem("sessionId", sessionId);
  }
  return sessionId;
}

export function clearSessionId() {
  localStorage.removeItem("sessionId");
}

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "https://48wc3410yf.execute-api.us-east-1.amazonaws.com";

export async function updateSession(sessionId) {
  try {
    const res = await fetch(`${API_BASE}/session/init`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-session-id": sessionId,
      },
      body: JSON.stringify({ sessionId, action: "initSession" }),
    });

    const data = await res.json();
  } catch (err) {
    console.error("Error updating session:", err);
  }
}
