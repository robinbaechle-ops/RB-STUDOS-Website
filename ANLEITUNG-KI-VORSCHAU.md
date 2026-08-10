# Anleitung: KI-Vorschau einrichten (Cloudflare Worker + Google Gemini)

Die Website kann aus einem hochgeladenen Foto oder aus den eingegebenen Texten per KI eine Vorschau des Produktergebnisses erzeugen. Der Code dafür ist bereits im Repository (`assets/js/ai-preview.js`, `product.html`, `cf-worker/`), aber **zwei Dinge musst du einmalig selbst in deinen eigenen Konten einrichten**, weil dafür Zugangsdaten nötig sind, die niemals in den Chat oder ins Repository gehören.

---

## Schritt 1: Google-API-Key erstellen (kostenlos)

1. Gehe auf **[aistudio.google.com](https://aistudio.google.com)** und melde dich mit einem Google-Konto an.
2. Klicke auf **"Get API key"** → **"Create API key"**.
3. Kopiere den Key — du brauchst ihn gleich in Schritt 2. Trage ihn nirgendwo im Chat mit mir ein.
4. Das ist der kostenlose Tarif (Ratenlimits, siehe unsere vorige Absprache zum KI-Training-Hinweis in AGB/Datenschutz).

## Schritt 2: Cloudflare Worker deployen

Der Worker ist der kleine Baustein, der deinen Google-Key geheim hält und die Anfragen der Website an Google weiterleitet.

1. Logge dich in dein **Cloudflare-Dashboard** ein (dasselbe Konto wie für die DNS-Einstellungen von studio-rb.net).
2. Im Menü links: **Workers & Pages** → **Create** → **Create Worker**.
3. Gib dem Worker den Namen `studio-rb-ai` und klicke auf **Deploy** (erstmal mit dem Standard-"Hello World"-Code, den ersetzen wir gleich).
4. Klicke danach auf **Edit code** (öffnet den Online-Editor).
5. Lösche den vorhandenen Beispielcode und ersetze ihn durch den Inhalt der Datei **`cf-worker/index.js`** aus diesem Repository (öffne die Datei auf GitHub, kopiere den gesamten Inhalt, füge ihn im Cloudflare-Editor ein).
6. Klicke auf **Deploy**, um den Worker zu veröffentlichen.

## Schritt 3: API-Key als Secret hinterlegen

1. Im Worker: **Settings** → **Variables and Secrets** → **Add**.
2. Name: `GEMINI_API_KEY`, Typ: **Secret** (nicht "Text" — Secrets werden verschlüsselt gespeichert und sind später nicht mehr im Klartext einsehbar).
3. Wert: der Key aus Schritt 1.
4. Speichern. Der Worker hat den Key jetzt zur Verfügung, ohne dass er irgendwo im Code oder in der Website sichtbar ist.

## Schritt 4: Eigene Domain für den Worker einrichten

Damit die Website den Worker unter `ai.studio-rb.net` erreichen kann (schon so im Code hinterlegt):

1. Im Worker: **Settings** → **Domains & Routes** → **Add** → **Custom Domain**.
2. Trage `ai.studio-rb.net` ein und bestätige.
3. Cloudflare legt automatisch den passenden DNS-Eintrag an (da die Domain ja schon bei Cloudflare liegt) und stellt automatisch ein SSL-Zertifikat aus. Das kann ein paar Minuten dauern.

## Schritt 5: Testen

1. Warte 2–3 Minuten nach Schritt 4.
2. Öffne eine beliebige Produktseite auf studio-rb.net, z. B. `studio-rb.net/product.html?product=schluesselanhaenger`.
3. Scrolle zu "KI-Vorschau (optional)", klicke auf **"KI-Vorschau erzeugen"** (auch ohne Foto-Upload möglich, dann nur mit deinem eingegebenen Text).
4. Nach ein paar Sekunden sollte ein generiertes Bild erscheinen, darunter die Buttons **"Gut"** und **"Nochmals anpassen"**.

Falls eine Fehlermeldung erscheint: meist liegt es an einem fehlenden/falschen Secret (Schritt 3) oder daran, dass die Custom Domain noch nicht aktiv ist (Schritt 4). Sag mir Bescheid, ich helfe beim Debuggen — dafür brauche ich aber nie deinen API-Key, nur die Fehlermeldung.

---

## Wie du den Prompt pro Produkt steuerst

In `assets/data/produkte.csv` gibt es die Spalte **"KI Prompt"**. Trag dort für ein Produkt z. B. ein:

> Zeige das Motiv als Lasergravur auf einer hellen Erle-Holzplatte, fotorealistisch, natürliche Maserung sichtbar.

Leer lassen ist ok — dann verwendet die Website einen generischen Standard-Prompt aus Produktname und Beschreibung.

## Wie das Sitzungslimit funktioniert

Jede:r Besucher:in kann pro Browser-Sitzung maximal **5 KI-Vorschauen** erzeugen (auch über "Nochmals anpassen" gezählt). Das hält die Kosten im Rahmen, ohne dass ein zusätzlicher Anmelde- oder Captcha-Schritt nötig ist. Bei Bedarf kann das Limit später in `assets/js/ai-preview.js` (Konstante `AI_SESSION_LIMIT`) angepasst werden.
