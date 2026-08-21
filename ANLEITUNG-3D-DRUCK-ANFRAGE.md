# Anleitung: 3D-Druck-Preisanfrage einrichten (Resend)

Auf der 3D-Druck-Seite gibt es jetzt ein Formular, über das Kunden eine eigene 3D-Datei hochladen und eine Preisanfrage stellen können. Der Code dafür ist bereits im Repository — genau wie bei der KI-Vorschau nutzt das denselben Cloudflare Worker (`studio-rb-ai`), nur unter einem zweiten Pfad (`/print-request`). Du musst nur noch einmalig einen E-Mail-Versand-Dienst anbinden.

---

## Schritt 1: Resend-Konto erstellen (kostenlos)

1. Gehe auf **[resend.com](https://resend.com)** und erstelle ein kostenloses Konto (3.000 E-Mails/Monat gratis, völlig ausreichend für Preisanfragen).
2. Im Resend-Dashboard: **Domains** → **Add Domain** → `studio-rb.net` eintragen.
3. Resend zeigt dir daraufhin 2–3 DNS-Einträge (meist TXT/MX/CNAME für SPF, DKIM, manchmal DMARC). Trag diese bei **Cloudflare** unter deiner Domain → **DNS → Records** ein, genauso wie ihr das schon bei der ursprünglichen DNS-Einrichtung gemacht habt. **Wichtig:** Diese neuen Einträge auf **"DNS only"** (graue Wolke) stellen, nicht proxied.
4. Zurück in Resend auf **Verify** klicken (kann ein paar Minuten dauern, bis DNS propagiert ist).

## Schritt 2: API-Key erstellen

1. In Resend: **API Keys** → **Create API Key**.
2. Name z. B. `studio-rb-worker`, Berechtigung "Sending access" reicht.
3. Kopiere den Key — er wird nur einmal angezeigt. Trag ihn nirgendwo im Chat ein.

## Schritt 3: Worker-Code aktualisieren

Der Worker-Code wurde erweitert (neue Funktion `/print-request`). Du musst die aktuelle Version einmal neu einspielen:

1. Cloudflare-Dashboard → **Workers & Pages** → `studio-rb-ai` → **Edit code**.
2. Kompletten Inhalt löschen und durch den aktuellen Inhalt von **`cf-worker/index.js`** aus dem Repository ersetzen.
3. **Deploy** klicken.

## Schritt 4: Secret hinterlegen

1. Im Worker: **Settings → Variables and Secrets → Add**.
2. Name: `RESEND_API_KEY`, Typ: **Secret**, Wert: der Key aus Schritt 2.
3. Speichern.

## Schritt 5: Testen

1. Öffne `studio-rb.net/3d-druck.html`, scroll zu "Eigene 3D-Datei hochladen & Preis anfragen".
2. Fülle Name, E-Mail aus, wähle eine kleine Testdatei (z. B. eine kleine STL-Datei) und klicke **"Anfrage senden"**.
3. Nach kurzer Zeit sollte "Danke! Wir melden uns mit einem Preisangebot." erscheinen — und du solltest eine E-Mail mit der Datei im Anhang an `robinbaechle@googlemail.com` bekommen.

Falls eine Fehlermeldung erscheint: meist liegt es an der DNS-Verifizierung in Resend (Schritt 1, kann etwas dauern) oder am fehlenden/falschen Secret (Schritt 4). Schick mir die Fehlermeldung, nie den API-Key.

## Grenzen

- **Maximale Dateigröße: ca. 15 MB.** Größere Dateien lehnt das Formular mit einer Fehlermeldung ab — für sehr große Dateien bittet der Hinweistext die Kundschaft, uns stattdessen über das normale Kontaktformular einen Cloud-Link (z. B. WeTransfer, Google Drive) zu schicken.
- Erlaubte Dateitypen im Auswahldialog: `.stl`, `.3mf`, `.obj`, `.step`, `.stp`.
