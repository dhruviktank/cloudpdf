// session.js
export function getSessionId() {
  let sessionId = sessionStorage.getItem("sessionId");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem("sessionId", sessionId);
  }
  return sessionId;
}
export function clearSessionId() {
  sessionStorage.removeItem("sessionId");
}

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  "https://48wc3410yf.execute-api.us-east-1.amazonaws.com";

async function updateSession(sessionId) {
  try {
    const res = await fetch(`${API_BASE}/session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-session-id": sessionId,
      },
      body: JSON.stringify({ sessionId }),
    });

    const data = await res.json();
    if (res.ok) {
      console.log("Session updated:", data);
    } else {
      console.warn("Session update failed:", data);
    }
  } catch (err) {
    console.error("Error updating session:", err);
  }
}
