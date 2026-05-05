// Sadə alt-toast bildiriş mexanizmi.

let toastEl = null;
let timer = null;

export function setToastElement(el) {
  toastEl = el;
}

/** Bir toast göstərir, müəyyən vaxtdan sonra avtomatik bağlanır. */
export function showToast(message, durationMs = 2400) {
  if (!toastEl) toastEl = document.getElementById("toast");
  if (!toastEl) return;

  toastEl.textContent = message;
  toastEl.classList.add("toast--show");

  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    toastEl.classList.remove("toast--show");
  }, durationMs);
}
