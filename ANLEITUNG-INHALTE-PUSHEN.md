# Anleitung: Neue Inhalte pushen

Diese Anleitung zeigt, wie du neue Produkte und andere Änderungen ins Repository bekommst.

**Wichtiger Hinweis vorab:** Aktuell gibt es noch keine öffentlich erreichbare Live-Website (kein Hosting eingerichtet). Ein "Push" bringt deine Änderung ins Repository — das ist die Voraussetzung, aber nicht automatisch eine live sichtbare Seite. Wenn ihr so weit seid, richten wir das Hosting (z. B. GitHub Pages) separat ein.

Arbeite außerdem auf dem Branch **`claude/laser-engraving-website-jiijfe`** — nicht auf `main`. Prüfe das, bevor du etwas änderst.

---

## Neues Produkt anlegen (Regelfall: über die Excel-Tabelle)

Die meisten Produkte (ein Foto, ein optionales Textfeld zur Personalisierung) pflegst du direkt in **`assets/data/produkte.csv`** — das ist eine CSV-Datei, die sich in Excel wie eine ganz normale Tabelle öffnen und bearbeiten lässt.

**Spalten:** `Artikelname` · `Artikelbeschreibung` · `Art` (`Laser` oder `3D`) · `Preis` · `Bildname`

1. Öffne `produkte.csv` in Excel (Rechtsklick → Öffnen mit → Excel, falls es nicht automatisch dort aufgeht).
2. Neue Zeile mit den fünf Spalten ausfüllen. Bei `Art` genau `Laser` oder `3D` eintragen — das entscheidet, auf welcher Katalogseite das Produkt erscheint.
3. `Bildname` ist ein **Ordnername**, kein Dateiname — siehe nächster Abschnitt.
4. In Excel ganz normal **Speichern** (nicht "Speichern unter" und dabei aus Versehen `.xlsx` wählen — die Datei muss `.csv` bleiben).

### Produktfotos (Galerie)

Für jedes Produkt mit Fotos legst du einen Ordner unter `assets/products/` an, benannt genau wie der Wert in der Spalte `Bildname`. Darin liegen die Fotos **durchnummeriert**:

```
assets/products/namensschild-eiche/1.jpg
assets/products/namensschild-eiche/2.jpg
assets/products/namensschild-eiche/3.jpg
```

- `1.jpg` ist automatisch das Titelbild (Katalog-Kachel + Basis für die Personalisierungs-Vorschau).
- Bis zu 12 Fotos pro Produkt, `.jpg` oder `.png`.
- Kein Foto vorhanden → `Bildname`-Spalte leer lassen, es erscheint ein Platzhalter statt eines echten Fotos.
- Warum nummeriert und nicht einfach "alle Dateien im Ordner": Eine Website ohne eigenen Server kann technisch keinen Ordnerinhalt auflesen — deshalb probiert die Seite 1, 2, 3, … einfach der Reihe nach durch.

### Personalisierung

Jedes Excel-Produkt bekommt automatisch **ein** zentriertes Textfeld ("Dein Text") zur Personalisierung — passend für die meisten Fälle (Name, Spruch, Datum).

Brauchst du **mehrere** Textfelder oder ein **Foto-Upload-Feld** (wie beim Beispiel "Foto-Gravur Holzbild"), reicht die Excel-Tabelle nicht — dafür weiterhin **`tools/designer.html`** benutzen. Das Werkzeug erklärt selbst, wohin der erzeugte Code kommt (`ADVANCED_PRODUCTS` in `assets/js/products.js`).

---

## Projekt lokal einrichten

Damit du Fotos/die CSV-Datei bequem aus deinem Dateisystem bearbeiten kannst, brauchst du eine lokale Kopie des Repos.

### Option 1 — GitHub Desktop (empfohlen, kein Terminal nötig)

1. [GitHub Desktop](https://desktop.github.com) installieren und mit deinem GitHub-Account anmelden.
2. **File → Clone repository**, dann `robinbaechle-ops/RB-STUDOS-Website` auswählen, lokalen Ordner-Speicherort wählen, **Clone** klicken.
3. Oben auf **Current Branch** klicken und zu `claude/laser-engraving-website-jiijfe` wechseln.

### Option 2 — Git-Kommandozeile

```bash
git clone https://github.com/robinbaechle-ops/RB-STUDOS-Website.git
cd RB-STUDOS-Website
git checkout claude/laser-engraving-website-jiijfe
```

### Änderungen lokal ansehen, bevor du sie hochlädst

**Wichtig:** Seit die Website die Produkte aus `produkte.csv` nachlädt, reicht ein Doppelklick auf `index.html` **nicht mehr** — Browser blockieren das Nachladen lokaler Dateien aus Sicherheitsgründen, wenn eine Seite einfach nur als Datei geöffnet wird. Du brauchst einen kleinen lokalen Server:

- **VS Code:** Erweiterung "Live Server" installieren, im Projektordner auf `index.html` rechtsklicken → **Open with Live Server**.
- **Oder Terminal:** im Projektordner `python3 -m http.server 8000` ausführen, dann `http://localhost:8000` im Browser öffnen.

Ohne das siehst du eine leere Produktliste — das ist kein Fehler, nur die lokale Vorschau-Einschränkung. Nach dem Push auf GitHub bzw. sobald Hosting eingerichtet ist, entfällt das.

### Änderungen hochladen (committen & pushen)

**Mit GitHub Desktop:** Geänderte Dateien erscheinen automatisch links in der Liste. Unten eine kurze Beschreibung eintragen, **Commit to claude/laser-engraving-website-jiijfe**, dann **Push origin**.

**Mit der Kommandozeile:**
```bash
git add -A
git commit -m "Produkt Namensschild Eiche hinzufügen"
git push origin claude/laser-engraving-website-jiijfe
```

---

## Alternative — Direkt auf github.com (ganz ohne lokale Kopie)

1. Repository auf github.com öffnen, oben links zum Branch `claude/laser-engraving-website-jiijfe` wechseln.
2. `assets/data/produkte.csv` öffnen → Stift-Symbol (**Edit this file**) → neue Zeile ergänzen → **Commit changes**.
3. Für Fotos: zu `assets/products/` navigieren, **Add file → Create new file**, als Namen `<Bildname>/1.jpg` eingeben (der Schrägstrich legt automatisch den Ordner an) und die Datei hochladen — oder den Ordner erst lokal anlegen und dann komplett per Drag & Drop hochladen.

---

## Kurzform

1. `produkte.csv` in Excel öffnen, Zeile ergänzen, speichern.
2. Fotos nummeriert in `assets/products/<Bildname>/` ablegen.
3. Committen, pushen.
4. Bei Unsicherheit: Screenshot oder Link schicken, ich prüfe es.
