// ======== CONFIGURA TU ENDPOINT (Apps Script /exec) ========
const ENDPOINT_URL = "https://script.google.com/macros/s/AKfycbxYHsL31ckTS2Cctqc1ec82pxkv5leeuzSlaHbxnas0i-QFrpTz3hssht52cYs_2wGp/exec";

document.addEventListener("DOMContentLoaded", () => {
  const domainKey = window.location.hostname + "_votoHalloween2025";
  if (localStorage.getItem(domainKey) === "true") {

    const msg = document.getElementById("msg");
    const submitBtn = document.getElementById("submitBtn");

    msg.textContent = "🎃 Ya registraste tu voto. ¡Gracias por participar!";
    msg.className = "msg ok";
    msg.style.display = "block";

    // Bloquear botón pero mantener visible el formulario
    submitBtn.disabled = true;
    submitBtn.style.opacity = "0.5";
    submitBtn.style.cursor = "not-allowed";
  }
});


// Validación de correo corporativo
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const allowedDomainRegex = /@(genteutil\.net|genteutilsa\.com)$/i;

const grid = document.getElementById("grid");
const form = document.getElementById("voteForm");
const submitBtn = document.getElementById("submitBtn");
const msg = document.getElementById("msg");

// Construir tarjetas
function renderGrid() {
  const frag = document.createDocumentFragment();

  CANDIDATES.forEach(c => {
    const card = document.createElement("label");
    card.className = "card";
    card.setAttribute("aria-label", c.name);

    // Radio
    const radioWrap = document.createElement("div");
    radioWrap.className = "radio-wrap";

    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "choice";
    radio.value = c.id;
    radio.className = "radio";
    radio.setAttribute("aria-checked", "false");

    radioWrap.appendChild(radio);

    // Figura / imagen o voto en blanco
    const figure = document.createElement("figure");
    if (c.blank) {
      figure.classList.add("blank");
      figure.textContent = "Voto en blanco";
    } else {
      const img = document.createElement("img");
      img.alt = `Disfraz de ${c.name} (ID: ${c.id}). Reemplaza con la foto en ${c.img}`;
      img.loading = "lazy";
      img.src = c.img; // si no existe, el alt explica dónde ponerla
      figure.appendChild(img);
    }

    // Nombre + disfraz
    const badge = document.createElement("div");
    badge.className = "badge-name";
    badge.innerHTML = `
      ${c.name}<br>
      ${c.costume ? `<strong class="costume">${c.costume}</strong>` : ""}
    `;

    // Orden visual
    card.appendChild(radioWrap);
    card.appendChild(figure);
    card.appendChild(badge);

    // Efecto visual seleccionado
    card.addEventListener("click", () => {
      document.querySelectorAll(".card").forEach(el => el.classList.remove("selected"));
      card.classList.add("selected");
      document.querySelectorAll('input[name="choice"]').forEach(r =>
        r.setAttribute("aria-checked", r.checked ? "true" : "false")
      );
    });

    frag.appendChild(card);
  });

  grid.appendChild(frag);
}

function showMessage(text, ok = true) {
  msg.textContent = text;
  msg.className = "msg " + (ok ? "ok" : "err");
  msg.style.display = "block";
}

// Envío del formulario
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  msg.style.display = "none";

  const email = (document.getElementById("email").value || "").trim().toLowerCase();
  const choiceInput = document.querySelector('input[name="choice"]:checked');
  const choice = choiceInput ? choiceInput.value : "";

  if (!email || !emailRegex.test(email) || !choice) {
    showMessage("Datos inválidos. Verifica el correo y selecciona un candidato.", false);
    return;
  }
  if (!allowedDomainRegex.test(email)) {
    showMessage("Solo se aceptan correos @genteutil.net o @genteutilsa.com.", false);
    return;
  }

  submitBtn.disabled = true;
  const originalLabel = submitBtn.textContent;
  submitBtn.textContent = "Enviando...";

  try {
    // Sin headers "Content-Type" para evitar preflight CORS
    const payload = JSON.stringify({ email, choice });
    const res = await fetch(ENDPOINT_URL, { method: "POST", body: payload });
    const text = await res.text();
    let data = {};
    try { data = JSON.parse(text); } catch (_) {}

    if (res.ok && data.status === "ok") {
    const domainKey = window.location.hostname + "_votoHalloween2025";
    localStorage.setItem(domainKey, "true");
    showMessage("✅ ¡Tu voto ha sido registrado con éxito! Gracias por participar.", true);

    form.reset();
    document.querySelectorAll(".card").forEach(el => el.classList.remove("selected"));

    submitBtn.disabled = true;
    submitBtn.style.opacity = "0.5";
    submitBtn.style.cursor = "not-allowed";

    // 🔁 Recargar la página después de que el mensaje sea visible y el fetch haya terminado
    setTimeout(() => {
      window.location.reload();
    }, 2000);
    
    return; // 👈 Esto evita que entre al bloque `finally` y re-habilite el botón
  }


 else if (data.error === "DUPLICATE_EMAIL") {
      showMessage("Este correo ya registró un voto. Solo se permite uno por correo.", false);
    } else if (data.error === "INVALID_DOMAIN") {
      showMessage("Solo se aceptan correos @genteutil.net o @genteutilsa.com.", false);
    } else if (data.error === "INVALID_INPUT") {
      showMessage("Datos inválidos. Revisa el correo y la opción.", false);
    } else {
      showMessage("No se pudo registrar el voto. Intenta de nuevo más tarde.", false);
    }
  } catch (err) {
    showMessage("Error de red. Intenta nuevamente.", false);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalLabel || "Enviar voto";
  }
});

renderGrid();