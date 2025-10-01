let redirected = false;
export const safeFetch = async (file, action, data = {}) => {
  const url = file.startsWith("http") ? file : `http://localhost/HR-project/api/${file}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...data }),
    });
    const json = await res.json();

    if (json.error === "unauthorized" && !redirected) {
      redirected = true;
      if (!window.location.pathname.endsWith("auth.html")) {
        window.location.href = "auth.html";
      }
      return { success: false, redirected: true, message: json.message || "Unauthorized" };
    }

    return json;
  } catch (err) {
    return { success: false, error: "network_error", message: "Failed to connect to server." };
  }
};
