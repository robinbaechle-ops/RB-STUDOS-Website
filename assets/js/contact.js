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
    const mailto = `mailto:robinbaechle@googlemail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    window.location.href = mailto;

    status.hidden = false;
    status.textContent = "Dein E-Mail-Programm sollte sich jetzt mit deiner Nachricht öffnen. Falls nicht, schreib direkt an robinbaechle@googlemail.com.";
  });
}

document.addEventListener("DOMContentLoaded", initContactForm);
