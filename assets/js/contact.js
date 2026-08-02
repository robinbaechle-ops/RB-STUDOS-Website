function initContactForm() {
  const form = document.getElementById("contact-form");
  const status = document.getElementById("form-status");
  if (!form) return;

  form.addEventListener("submit", (evt) => {
    evt.preventDefault();

    const firstName = form.firstName.value.trim();
    const lastName = form.lastName.value.trim();
    const email = form.email.value.trim();
    const message = form.message.value.trim();

    const subject = `Kontaktanfrage von ${firstName} ${lastName}`;
    const body = `${message}\n\n---\n${firstName} ${lastName}\n${email}`;
    const mailto = `mailto:info@studio-rb.net?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    window.location.href = mailto;

    status.hidden = false;
    status.textContent = "Dein E-Mail-Programm sollte sich jetzt mit deiner Nachricht öffnen. Falls nicht, schreib direkt an info@studio-rb.net.";
  });
}

document.addEventListener("DOMContentLoaded", initContactForm);
