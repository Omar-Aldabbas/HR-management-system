const apiBase = "http://localhost/HR-project/api";
const apiFile = `${apiBase}/personal-data.php`;

const personalForm = document.getElementById("personal-form");
const avatarInput = document.getElementById("avatar");
const avatarPreview = document.getElementById("avatar-preview");
const changeAvatarBtn = document.getElementById("change-avatar-btn");
const editBtn = document.getElementById("edit-btn");
const cancelBtn = document.getElementById("cancel-btn");
const saveBtn = document.getElementById("save-btn");
const inputs = Array.from(personalForm.querySelectorAll("input"));

const showEditable = (editable) => {
  inputs.forEach((i) => (i.readOnly = !editable));
  editBtn.classList.toggle("hidden", editable);
  cancelBtn.classList.toggle("hidden", !editable);
  saveBtn.classList.toggle("hidden", !editable);
  changeAvatarBtn.classList.toggle("hidden", !editable);
};

const loadUserData = async () => {
  const resRaw = await fetch(apiFile, {
    method: "POST",
    body: JSON.stringify({ action: "get" }),
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  const res = await resRaw.json();
  if (!res.success || !res.data) {
    window.location.href = "auth.html";
    return;
  }

  const user = res.data;
  avatarPreview.src = user.avatar
    ? `${apiBase.replace("/api", "")}/${user.avatar.replace(/^\/+/, "")}`
    : "default-avatar.png";

  personalForm.full_name.value = user.full_name || "";
  personalForm.email.value = user.email || "";
  personalForm.phone.value = user.phone || "";
  personalForm.address.value = user.address || "";
  personalForm.city.value = user.city || "";
  personalForm.state.value = user.state || "";
  personalForm.country.value = user.country || "";
  personalForm.postal_code.value = user.postal_code || "";
  personalForm.department.value = user.department || "";
  personalForm.position.value = user.position || "";
};

avatarInput.addEventListener("change", () => {
  const file = avatarInput.files[0];
  if (file) avatarPreview.src = URL.createObjectURL(file);
});

editBtn.addEventListener("click", () => showEditable(true));
cancelBtn.addEventListener("click", async () => {
  showEditable(false);
  await loadUserData();
});

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

personalForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = {
    full_name: personalForm.full_name.value,
    email: personalForm.email.value,
    phone: personalForm.phone.value,
    address: personalForm.address.value,
    city: personalForm.city.value,
    state: personalForm.state.value,
    country: personalForm.country.value,
    postal_code: personalForm.postal_code.value,
    department: personalForm.department.value,
    position: personalForm.position.value,
  };

  if (avatarInput.files[0]) {
    const base64 = await fileToBase64(avatarInput.files[0]);
    data.avatar = base64;
    data.avatar_name = avatarInput.files[0].name;
  }

  const resRaw = await fetch(apiFile, {
    method: "POST",
    body: JSON.stringify({ action: "update", ...data }),
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  const res = await resRaw.json();

  if (res.success) {
    await loadUserData();
    showEditable(false);
  } else {
    alert(res.message || "Failed to update data");
  }
});

saveBtn.addEventListener("click", async (e) => {
  e.preventDefault();
  personalForm.requestSubmit();
});

document.addEventListener("DOMContentLoaded", loadUserData);
