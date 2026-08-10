# Anleitung: KI-Vorschau einrichten (Cloudflare Worker + Google Gemini)

Die Website kann aus einem hochgeladenen Foto oder aus den eingegebenen Texten per KI eine Vorschau des Produktergebnisses erzeugen. Der Code dafür ist bereits im Repository (`assets/js/ai-preview.js`, `product.html`, `cf-worker/`). Der Bilddienst dahinter ist **Google Gemini** (Modell `gemini-2.5-flash-image`). Der kostenlose Zugang zu diesem Modell hat ein Kontingent von 0 Anfragen — es funktioniert also nur mit **aktiviertem Billing** im Google-Cloud-Projekt (Kosten liegen im Cent-Bereich pro erzeugtem Bild).

Du musst **zwei Dinge einmalig einrichten**: den Worker selbst und einen Gemini-API-Key als Secret.

---

## Schritt 1: Cloudflare Worker deployen

Falls du den Worker `studio-rb-ai` schon aus einer früheren Einrichtung hast, kannst du direkt zu **Schritt 1b** springen und nur den Code aktualisieren.

1. Logge dich in dein **Cloudflare-Dashboard** ein (dasselbe Konto wie für die DNS-Einstellungen von studio-rb.net).
2. Im Menü links: **Workers & Pages** → **Create** → **Create Worker**.
3. Gib dem Worker den Namen `studio-rb-ai` und klicke auf **Deploy** (erstmal mit dem Standard-"Hello World"-Code, den ersetzen wir gleich).

### Schritt 1b: Code einfügen

1. Klicke auf **Edit code** (öffnet den Online-Editor).
2. Lösche den vorhandenen Code und ersetze ihn durch den kompletten Inhalt der Datei **`cf-worker/index.js`** aus diesem Repository (auf GitHub öffnen, gesamten Inhalt kopieren, im Cloudflare-Editor einfügen).
3. Klicke auf **Deploy**.

## Schritt 2: Gemini-API-Key als Secret hinterlegen

1. Falls noch nicht vorhanden: Gehe zu **[aistudio.google.com](https://aistudio.google.com)** → API-Key-Bereich → Key erstellen (bzw. bestehenden Key verwenden).
2. Stelle sicher, dass für das verknüpfte Google-Cloud-Projekt **Billing aktiviert** ist (Google Cloud Console → Billing → Zahlungsmethode hinterlegen). Ohne aktives Billing liefert Gemini für dieses Modell einen 429-Fehler ("Kontingent überschritten").
3. Kopiere den Key — trag ihn nirgendwo im Chat mit mir ein, nur Fehlermeldungen teilen.
4. Zurück in deinem Worker `studio-rb-ai` → **Settings** → **Variables and Secrets** → **Add**.
5. Name: `GEMINI_API_KEY`, Typ: **Secret**.
6. Wert: der Key aus Schritt 1.
7. Speichern/Deploy.

## Schritt 3: Eigene Domain für den Worker einrichten

Falls noch nicht geschehen (aus einer früheren Einrichtung ist das evtl. schon erledigt):

1. Im Worker: **Settings** → **Domains & Routes** → **Add** → **Custom Domain**.
2. Trage `ai.studio-rb.net` ein und bestätige.
3. Cloudflare legt automatisch den passenden DNS-Eintrag an und stellt automatisch ein SSL-Zertifikat aus. Das kann ein paar Minuten dauern.

## Schritt 4: Testen

1. Warte 2–3 Minuten nach Schritt 3 (falls neu eingerichtet).
2. Öffne eine beliebige Produktseite auf studio-rb.net, z. B. `studio-rb.net/product.html?product=schluesselanhaenger`.
3. Klicke auf **"KI Vorschau generieren"** (auch ohne Foto-Upload möglich, dann nur mit deinem eingegebenen Text).
4. Nach ein paar Sekunden sollte ein generiertes Bild erscheinen, darunter die Buttons **"Gut"** und **"Nochmals anpassen"**.

Falls eine Fehlermeldung erscheint: meist liegt es am fehlenden/falschen Secret (Schritt 2), an fehlendem Billing im Google-Cloud-Projekt (429-Fehler) oder daran, dass die Custom Domain noch nicht aktiv ist (Schritt 3). Sag mir Bescheid, ich helfe beim Debuggen — schau dazu am besten im Worker unter **Observability/Logs** nach der genauen Fehlermeldung und schick mir den Text.

---

## Wie du den Prompt pro Produkt steuerst

In `assets/data/produkte.csv` gibt es die Spalte **"KI Prompt"**. Trag dort für ein Produkt z. B. ein:

> Zeige das Motiv als Lasergravur auf einer hellen Erle-Holzplatte, fotorealistisch, natürliche Maserung sichtbar.

Leer lassen ist ok — dann verwendet die Website einen generischen Standard-Prompt aus Produktname und Beschreibung.

## Wie das Sitzungslimit funktioniert

Jede:r Besucher:in kann pro Browser-Sitzung maximal **5 KI-Vorschauen** erzeugen (auch über "Nochmals anpassen" gezählt). Bei Bedarf kann das Limit später in `assets/js/ai-preview.js` (Konstante `AI_SESSION_LIMIT`) angepasst werden.
