// ======== CONFIGURA TU ENDPOINT (Apps Script /exec) ========
const ENDPOINT_URL = "https://script.google.com/macros/s/AKfycbxQelLZJNtMcUy8Kp86fqQ6Hd28FU7ES7XsHfiB9Aj1CZqyPV4VYr5wFbo3NK9XwWTx/exec";

// Carga mensajes/labels desde customize.json (opcional)
fetch("customize.json")
  .then(r => r.json())
  .then(cfg => {
    // Inserta textos si existen
    const map = [
      "voteHeading", "voteSubtext", "optionA", "optionB", "optionC", "submitLabel"
    ];
    map.forEach(key => {
      const el = document.querySelector(`[data-node-name="${key}"]`);
      if (el && cfg[key]) el.innerText = cfg[key];
    });

    // Guarda mensajes para feedback
    window._voteMsgs = {
      success: cfg.successMsg || "¡Voto registrado! Gracias por participar.",
      duplicate: cfg.duplicateMsg || "Este correo ya registró un voto. Solo se permite uno por correo.",
      invalidDomain: cfg.invalidDomainMsg || "Solo se aceptan correos @genteutil.net o @genteutilsa.com.",
      invalidInput: cfg.invalidInputMsg || "Datos inválidos. Verifica el correo y la opción seleccionada.",
      genericError: cfg.genericErrorMsg || "No se pudo registrar el voto. Intenta de nuevo más tarde.",
      networkError: cfg.networkErrorMsg || "Error de red. Verifica tu conexión e inténtalo nuevamente.",
      originError: cfg.originErrorMsg || "Origen no permitido. Revisa la configuración de CORS del backend."
    };
  })
  .finally(setupVote);

// Lógica del formulario
function setupVote() {
  const form = document.getElementById("voteForm");
  const submitBtn = document.getElementById("submitBtn");
  const msg = document.getElementById("msg");

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const allowedDomainRegex = /@(genteutil\.net|genteutilsa\.com)$/i;

  function showMessage(text, ok = true) {
    msg.textContent = text;
    msg.className = "msg " + (ok ? "ok" : "err");
    msg.style.display = "block";
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.style.display = "none";

    const email = (document.getElementById("email").value || "").trim().toLowerCase();
    const choice = document.getElementById("choice").value;

    if (!email || !emailRegex.test(email) || !choice) {
      showMessage((window._voteMsgs && _voteMsgs.invalidInput) || "Datos inválidos. Verifica el correo y la opción seleccionada.", false);
      return;
    }
    if (!allowedDomainRegex.test(email)) {
      showMessage((window._voteMsgs && _voteMsgs.invalidDomain) || "Solo se aceptan correos @genteutil.net o @genteutilsa.com.", false);
      return;
    }

    submitBtn.disabled = true;
    const originalLabel = submitBtn.innerText;
    submitBtn.innerText = "Enviando...";

    try {
      const res = await fetch(ENDPOINT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        mode: "cors",
        body: JSON.stringify({ email, choice })
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.status === "ok") {
        showMessage((window._voteMsgs && _voteMsgs.success) || "¡Voto registrado! Gracias por participar.", true);
        form.reset();
      } else if (data.error === "DUPLICATE_EMAIL") {
        showMessage((window._voteMsgs && _voteMsgs.duplicate) || "Este correo ya registró un voto. Solo se permite uno por correo.", false);
      } else if (data.error === "INVALID_DOMAIN") {
        showMessage((window._voteMsgs && _voteMsgs.invalidDomain) || "Solo se aceptan correos @genteutil.net o @genteutilsa.com.", false);
      } else if (data.error === "INVALID_INPUT") {
        showMessage((window._voteMsgs && _voteMsgs.invalidInput) || "Datos inválidos. Verifica el correo y la opción seleccionada.", false);
      } else if (data.error === "ORIGIN_NOT_ALLOWED") {
        showMessage((window._voteMsgs && _voteMsgs.originError) || "Origen no permitido. Revisa la configuración de CORS del backend.", false);
      } else {
        showMessage((window._voteMsgs && _voteMsgs.genericError) || "No se pudo registrar el voto. Intenta de nuevo más tarde.", false);
      }
    } catch (err) {
      showMessage((window._voteMsgs && _voteMsgs.networkError) || "Error de red. Verifica tu conexión e inténtalo nuevamente.", false);
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerText = originalLabel || "Enviar voto";
    }
  });
}
