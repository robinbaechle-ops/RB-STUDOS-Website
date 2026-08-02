# Anleitung: Neue Inhalte pushen

Diese Anleitung zeigt, wie du Änderungen (z. B. ein neues Produkt aus dem Designer-Werkzeug) ins Repository bekommst.

**Wichtiger Hinweis vorab:** Aktuell gibt es noch keine öffentlich erreichbare Live-Website (kein Hosting eingerichtet). Ein "Push" bringt deine Änderung ins Repository — das ist die Voraussetzung, aber nicht automatisch eine live sichtbare Seite. Wenn ihr so weit seid, richten wir das Hosting (z. B. GitHub Pages) separat ein.

Arbeite außerdem auf dem Branch **`claude/laser-engraving-website-jiijfe`** — nicht auf `main`. Prüfe das, bevor du etwas änderst.

---

## Projekt lokal einrichten

Damit du Fotos/Dateien bequem aus deinem Dateisystem statt über den Browser-Upload hinzufügen kannst, brauchst du eine lokale Kopie des Repos auf deinem Rechner. Zwei Wege — wähle einen:

### Option 1 — GitHub Desktop (empfohlen, kein Terminal nötig)

1. [GitHub Desktop](https://desktop.github.com) installieren und mit deinem GitHub-Account anmelden.
2. **File → Clone repository**, dann `robinbaechle-ops/RB-STUDOS-Website` auswählen (oder die URL einfügen), lokalen Ordner-Speicherort wählen (z. B. `Dokumente/RB-STUDOS-Website`), **Clone** klicken.
3. Oben in GitHub Desktop auf **Current Branch** klicken und zu `claude/laser-engraving-website-jiijfe` wechseln.
4. Fertig — der Ordner liegt jetzt lokal bei dir und ist ein normaler Ordner im Finder/Explorer.

### Option 2 — Git-Kommandozeile

```bash
git clone https://github.com/robinbaechle-ops/RB-STUDOS-Website.git
cd RB-STUDOS-Website
git checkout claude/laser-engraving-website-jiijfe
```

### Danach: Inhalte einfügen

- Fotos einfach per Finder/Explorer in `assets/products/` kopieren.
- `assets/js/products.js` mit einem Texteditor öffnen und den Code-Block aus dem Designer-Werkzeug einfügen (siehe unten).
- Das Designer-Werkzeug selbst funktioniert auch offline: `tools/designer.html` lokal per Doppelklick im Browser öffnen.

### Änderungen ansehen, bevor du sie hochlädst

Da die Website aus reinem HTML/CSS/JS ohne Build-Schritt besteht, reicht ein Doppelklick auf `index.html` (oder `laser.html`), um sie im Browser zu öffnen und die Änderungen direkt zu sehen — kein Server nötig.

### Änderungen hochladen (committen & pushen)

**Mit GitHub Desktop:** Die geänderten Dateien erscheinen automatisch links in der Liste. Unten eine kurze Beschreibung eintragen, **Commit to claude/laser-engraving-website-jiijfe** klicken, dann oben **Push origin** klicken.

**Mit der Kommandozeile:**
```bash
git add -A
git commit -m "Produkt Namensschild Eiche hinzufügen"
git push origin claude/laser-engraving-website-jiijfe
```

---

## Weg A — Direkt auf github.com (Alternative ganz ohne lokale Kopie)

### 1. Neues Produktfoto hochladen

1. Öffne das Repository auf github.com und wechsle oben links zum Branch `claude/laser-engraving-website-jiijfe`.
2. Navigiere zu `assets/products`.
3. Klicke auf **Add file → Upload files**.
4. Ziehe dein Foto (mit dem Dateinamen aus dem Designer-Werkzeug, z. B. `namensschild-eiche.jpg`) in das Upload-Feld.
5. Unten bei **Commit changes**: kurze Beschreibung eintragen (z. B. „Foto Namensschild Eiche hinzufügen“) und auf **Commit changes** klicken.

### 2. Neuen Produkt-Code einfügen

1. Navigiere zu `assets/js/products.js`.
2. Klicke oben rechts auf das Stift-Symbol (**Edit this file**).
3. Setze den Cursor direkt **vor** die letzte schließende geschweifte Klammer `};` am Ende der `PRODUCTS`-Liste (nach dem letzten Produkt-Eintrag).
4. Füge den Code-Block ein, den dir das Designer-Werkzeug (`tools/designer.html`) generiert hat.
5. Achte darauf, dass nach dem vorherigen Eintrag ein Komma steht, bevor dein neuer Block beginnt.
6. Unten bei **Commit changes**: Beschreibung eintragen (z. B. „Produkt Namensschild Eiche hinzufügen“) und committen.

### 3. Kontrolle

Öffne `laser.html` im Repository (oder lokal), um zu prüfen, ob das neue Produkt in `PRODUCTS` korrekt auftaucht — bzw. bitte mich kurz um einen Check.

---

## Kurzform

1. Foto → `assets/products/` hochladen.
2. Code-Block aus dem Designer-Werkzeug → in `assets/js/products.js` einfügen.
3. Commit-Message schreiben, committen.
4. Bei Unsicherheit: Screenshot oder Link schicken, ich prüfe es.
