export async function safeFetch(url, data = {}, method = "POST", isFormData = false) {
  const options = { method, credentials: "include" };

  if (method === "POST") {
    if (isFormData) {
      options.body = data;
    } else {
      options.headers = { "Content-Type": "application/json" };
      options.body = JSON.stringify(data);
    }
  }

  const res = await fetch(url, options);
  return res.json();
}
