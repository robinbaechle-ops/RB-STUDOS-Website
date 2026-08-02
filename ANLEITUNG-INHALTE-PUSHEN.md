# Anleitung: Neue Inhalte pushen

Diese Anleitung zeigt, wie du Änderungen (z. B. ein neues Produkt aus dem Designer-Werkzeug) ins Repository bekommst — ganz ohne Terminal, direkt im Browser auf github.com.

**Wichtiger Hinweis vorab:** Aktuell gibt es noch keine öffentlich erreichbare Live-Website (kein Hosting eingerichtet). Ein "Push" bringt deine Änderung ins Repository — das ist die Voraussetzung, aber nicht automatisch eine live sichtbare Seite. Wenn ihr so weit seid, richten wir das Hosting (z. B. GitHub Pages) separat ein.

Arbeite außerdem auf dem Branch **`claude/laser-engraving-website-jiijfe`** — nicht auf `main`. Prüfe das oben links auf GitHub im Branch-Dropdown, bevor du etwas änderst.

---

## Weg A — Direkt auf github.com (empfohlen, kein Programm nötig)

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

## Weg B — Mit Git auf dem eigenen Rechner (optional, für später)

Falls du irgendwann lieber lokal arbeitest:

```bash
git clone <repo-url>
cd RB-STUDOS-Website
git checkout claude/laser-engraving-website-jiijfe

# Foto ablegen
cp ~/Downloads/namensschild-eiche.jpg assets/products/

# products.js im Editor bearbeiten, dann:
git add assets/products/namensschild-eiche.jpg assets/js/products.js
git commit -m "Produkt Namensschild Eiche hinzufügen"
git push origin claude/laser-engraving-website-jiijfe
```

---

## Kurzform

1. Foto → `assets/products/` hochladen.
2. Code-Block aus dem Designer-Werkzeug → in `assets/js/products.js` einfügen.
3. Commit-Message schreiben, committen.
4. Bei Unsicherheit: Screenshot oder Link schicken, ich prüfe es.
