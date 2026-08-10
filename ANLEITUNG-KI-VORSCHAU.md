# Anleitung: KI-Vorschau einrichten (Cloudflare Worker + Pollinations.ai)

Die Website kann aus einem hochgeladenen Foto oder aus den eingegebenen Texten per KI eine Vorschau des Produktergebnisses erzeugen. Der Code dafür ist bereits im Repository (`assets/js/ai-preview.js`, `product.html`, `cf-worker/`). Der Bilddienst dahinter ist **Pollinations.ai** — ein kostenloser Open-Source-Dienst, für den kein eigener Account und kein API-Key nötig ist. Du musst nur **zwei Dinge einmalig in deinem Cloudflare-Konto einrichten**: den Worker selbst und einen kleinen Zwischenspeicher (KV-Namespace).

Hintergrund, warum das nötig ist: Google Gemini hat seinen kostenlosen Bild-API-Zugang inzwischen komplett abgeschafft (0 Anfragen erlaubt) — deshalb der Wechsel zu Pollinations.ai, das echt kostenlos bleibt. Einziger technischer Unterschied: Pollinations braucht öffentlich erreichbare Bild-URLs statt hochgeladener Dateien. Der Worker löst das automatisch, indem er hochgeladene Fotos für 10 Minuten in einem eigenen kleinen Cloudflare-Speicher (KV) zwischenlagert.

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

## Schritt 2: KV-Namespace für die Bild-Zwischenspeicherung anlegen

Das ist der neue Schritt gegenüber der vorherigen Einrichtung — Pollinations.ai braucht abrufbare Bild-URLs, deshalb legt der Worker hochgeladene Fotos kurz (10 Minuten) in einem eigenen Speicher ab.

1. Im Cloudflare-Dashboard: **Workers & Pages** → im linken Menü **KV** (unter "Storage & Databases").
2. **Create a namespace** → Name z. B. `studio-rb-ai-tmp` → **Add**.
3. Zurück zu deinem Worker `studio-rb-ai` → **Settings** → **Variables and Secrets** (bzw. **Bindings**, je nach Dashboard-Version) → Abschnitt **KV Namespace Bindings** → **Add binding**.
4. **Variable name**: genau `AI_TMP` eintragen (muss exakt so heißen, das ist im Code hinterlegt).
5. **KV namespace**: den gerade erstellten `studio-rb-ai-tmp` auswählen.
6. Speichern/Deploy.

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

Falls eine Fehlermeldung erscheint: meist liegt es am fehlenden KV-Binding (Schritt 2, Name muss exakt `AI_TMP` sein) oder daran, dass die Custom Domain noch nicht aktiv ist (Schritt 3). Sag mir Bescheid, ich helfe beim Debuggen — schau dazu am besten im Worker unter **Logs** nach der genauen Fehlermeldung und schick mir den Text.

---

## Optional: Wasserzeichen entfernen / höheres Limit

Pollinations.ai fügt anonymen Anfragen standardmäßig ein kleines Wasserzeichen hinzu und erlaubt nur eine Anfrage alle 15 Sekunden (für unsere Website völlig ausreichend). Wer möchte, kann sich kostenlos unter [auth.pollinations.ai](https://auth.pollinations.ai) registrieren und einen Token bekommen, der beides verbessert — das ist aber optional und nicht notwendig, damit die Funktion läuft.

## Wie du den Prompt pro Produkt steuerst

In `assets/data/produkte.csv` gibt es die Spalte **"KI Prompt"**. Trag dort für ein Produkt z. B. ein:

> Zeige das Motiv als Lasergravur auf einer hellen Erle-Holzplatte, fotorealistisch, natürliche Maserung sichtbar.

Leer lassen ist ok — dann verwendet die Website einen generischen Standard-Prompt aus Produktname und Beschreibung.

## Wie das Sitzungslimit funktioniert

Jede:r Besucher:in kann pro Browser-Sitzung maximal **5 KI-Vorschauen** erzeugen (auch über "Nochmals anpassen" gezählt). Bei Bedarf kann das Limit später in `assets/js/ai-preview.js` (Konstante `AI_SESSION_LIMIT`) angepasst werden.
