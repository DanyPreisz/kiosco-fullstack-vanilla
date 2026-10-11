import { api, setSession, clearSession, getToken } from "./api.js";
const authView = document.querySelector("#auth-view");
const appView = document.querySelector("#app-view");
const authForm = document.querySelector("#auth-form");
const authError = document.querySelector("#auth-error");
const authSubmit = document.querySelector("#auth-submit");
const listEl = document.querySelector("#list");
const form = document.querySelector("#move-form");
const formError = document.querySelector("#form-error");
const balanceEl = document.querySelector("#balance");
let mode = "login";
const showError = (el, message) => { el.hidden = !message; el.textContent = message || ""; };

function setMode(next) {
  mode = next;
  document.querySelectorAll(".tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.mode === mode));
  authSubmit.textContent = mode === "login" ? "Entrar" : "Crear cuenta";
}
async function refresh() {
  const data = await api("/api/moves");
  balanceEl.textContent = data.balance.toFixed(2);
  listEl.innerHTML = "";
  data.moves.forEach((m) => {
    const box = document.createElement("div");
    box.className = "move";
    box.innerHTML = `<strong>${m.type}</strong> \u00b7 ${m.desc} \u00b7 $${m.amount}`;
    const del = document.createElement("button");
    del.className = "ghost";
    del.textContent = "Borrar";
    del.addEventListener("click", async () => { await api(`/api/moves/${m.id}`, { method: "DELETE" }); await refresh(); });
    box.append(del);
    listEl.append(box);
  });
}
async function boot() {
  if (!getToken()) return;
  try {
    const { user } = await api("/api/auth/me");
    authView.classList.add("hidden");
    appView.classList.remove("hidden");
    document.querySelector("#user-name").textContent = user.username;
    await refresh();
  } catch { clearSession(); }
}
document.querySelectorAll(".tab").forEach((tab) => tab.addEventListener("click", () => setMode(tab.dataset.mode)));
authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  showError(authError, "");
  const fd = new FormData(authForm);
  try {
    const data = await api(mode === "login" ? "/api/auth/login" : "/api/auth/register", { method: "POST", body: JSON.stringify({ username: fd.get("username"), password: fd.get("password") }) });
    setSession(data.token);
    authForm.reset();
    await boot();
  } catch (err) { showError(authError, err.message); }
});
document.querySelector("#logout").addEventListener("click", () => { clearSession(); appView.classList.add("hidden"); authView.classList.remove("hidden"); });
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  showError(formError, "");
  try {
    await api("/api/moves", { method: "POST", body: JSON.stringify({ type: document.querySelector("#type").value, desc: document.querySelector("#desc").value.trim(), amount: document.querySelector("#amount").value }) });
    form.reset();
    await refresh();
  } catch (err) { showError(formError, err.message); }
});
boot();
