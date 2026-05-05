// Modal idarəsi — <dialog> elementlərinin açılışı, bağlanışı, ESC dəstəyi.

/** Modal-ı açır. */
export function openModal(id) {
  const dlg = typeof id === "string" ? document.getElementById(id) : id;
  if (!dlg) return;
  if (typeof dlg.showModal === "function" && !dlg.open) {
    dlg.showModal();
  } else if (typeof dlg.show === "function" && !dlg.open) {
    dlg.show();
  }
}

/** Modal-ı bağlayır. */
export function closeModal(id) {
  const dlg = typeof id === "string" ? document.getElementById(id) : id;
  if (!dlg || !dlg.open) return;
  dlg.close();
}

/** Bütün `[data-close]` düymələrinə avtomatik bağlama bağlayır. */
export function wireDataCloseButtons(root = document) {
  root.querySelectorAll("[data-close]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const dlg = btn.closest("dialog");
      if (dlg) dlg.close();
    });
  });
}
