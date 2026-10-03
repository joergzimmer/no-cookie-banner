# No Cookie Banner

Ein kleines JavaScript-Plugin, das kurz einen Hinweis einblendet: **Diese Website verwendet keine Cookies und respektiert Ihre Privatsphäre.** Nach Ablauf der Anzeigedauer fährt ein stilisierter Mauszeiger zum OK-Button und klickt den Hinweis automatisch weg – als kleiner Service für die Besucher.

**[Live-Demo ansehen](https://joergzimmer.github.io/no-cookie-banner/demo.html)** · Quelltext der Demo: [`demo.html`](demo.html)

- Eine einzige Datei: [`no-cookie-banner.js`](no-cookie-banner.js), plain JavaScript, keine Abhängigkeiten
- Text, Button-Text, Anzeigedauer, Position und Farben frei einstellbar
- Setzt keine Cookies und speichert nichts im Browser
- Läuft in einem Shadow DOM, das CSS der Website verändert das Banner nicht
- Funktioniert auch mit strenger Content-Security-Policy
- Berücksichtigt die Systemeinstellung „Bewegung reduzieren“

## Einbindung

1. [`no-cookie-banner.js`](no-cookie-banner.js) herunterladen und auf den eigenen Webserver legen.
2. Vor dem schließenden `</body>`-Tag (oder im `<head>` mit `defer`) einbinden:

```html
<script src="/pfad/zu/no-cookie-banner.js" defer></script>
```

Fertig. Das Banner erscheint beim Laden der Seite mit den Standardwerten.

## Konfiguration

Es gibt drei Wege, das Banner anzupassen. Sie lassen sich kombinieren; bei gleichen Optionen gilt:
Standardwerte < `NoCookieBannerConfig` < data-Attribute < `NoCookieBanner.show(options)`.

### 1. data-Attribute am Script-Tag

```html
<script src="no-cookie-banner.js" defer
        data-text="Diese Seite kommt komplett ohne Cookies aus."
        data-button-text="Alles klar"
        data-duration="2500"
        data-position="bottom-right"></script>
```

### 2. Globales Konfigurationsobjekt

Das Objekt muss **vor** dem Script definiert werden. Nur auf diesem Weg (oder per `show()`) lässt sich ein `onClose`-Callback übergeben.

```html
<script>
  window.NoCookieBannerConfig = {
    text: 'Diese Seite kommt komplett ohne Cookies aus.',
    buttonText: 'Alles klar',
    duration: 2500,
    onClose: function (reason) {
      console.log('Banner geschlossen:', reason); // 'auto' | 'user' | 'api'
    }
  };
</script>
<script src="no-cookie-banner.js" defer></script>
```

### 3. Per JavaScript-API

Mit `data-auto-start="false"` erscheint das Banner nicht automatisch, sondern erst auf Aufruf:

```html
<script src="no-cookie-banner.js" data-auto-start="false"></script>
<script>
  NoCookieBanner.show({ text: 'Hallo!', duration: 3000 });
  // NoCookieBanner.hide();
</script>
```

| Methode | Beschreibung |
| --- | --- |
| `NoCookieBanner.show(options)` | Zeigt das Banner an. `options` überschreibt die Grundkonfiguration. Läuft bereits ein Banner, passiert nichts. |
| `NoCookieBanner.hide()` | Blendet das aktuelle Banner sofort aus (`onClose` erhält `'api'`). |
| `NoCookieBanner.version` | Versionsnummer des Plugins. |

## Optionen

| Option | data-Attribut | Standard | Beschreibung |
| --- | --- | --- | --- |
| `text` | `data-text` | „Diese Website verwendet keine Cookies und respektiert Ihre Privatsphäre.“ | Hinweistext im Banner |
| `buttonText` | `data-button-text` | `OK` | Beschriftung des Buttons |
| `duration` | `data-duration` | `2000` | Zeit in ms vom Einblenden bis zum automatischen Klick (mindestens `800`) |
| `delay` | `data-delay` | `300` | Wartezeit in ms vor dem Einblenden |
| `position` | `data-position` | `bottom` | `bottom`, `top`, `bottom-left`, `bottom-right`, `top-left`, `top-right` |
| `autoStart` | `data-auto-start` | `true` | Banner beim Laden der Seite automatisch anzeigen |
| `onlyOnEntry` | `data-only-on-entry` | `false` | Nur anzeigen, wenn der Besucher von einer fremden Seite kommt (siehe [Datenschutz](#datenschutz)) |
| `showIcon` | `data-show-icon` | `true` | Schild-Symbol links im Banner anzeigen |
| `background` | `data-background` | `#1f2933` | Hintergrundfarbe des Banners |
| `textColor` | `data-text-color` | `#f5f7fa` | Textfarbe |
| `accentColor` | `data-accent-color` | `#3ecf8e` | Farbe von Button und Symbol |
| `buttonTextColor` | `data-button-text-color` | `#0b1f14` | Textfarbe des Buttons |
| `zIndex` | `data-z-index` | `2147483000` | z-index des Banners |
| `nonce` | – | Nonce des Script-Tags | CSP-Nonce für den Style-Fallback in älteren Browsern |
| `onClose` | – | `null` | Funktion `(reason)`, aufgerufen beim Schließen mit `'auto'`, `'user'` oder `'api'` |

Boolesche data-Attribute werden mit `false`, `0`, `no` oder `off` abgeschaltet. Farben akzeptieren jeden gültigen CSS-Farbwert.

## Ablauf

1. Nach `delay` ms fährt das Banner ein.
2. Kurz vor Ende der Anzeigedauer erscheint der Mauszeiger und fährt in einem leichten Bogen zum OK-Button.
3. Genau nach `duration` ms „klickt“ der Zeiger: Der Button wird sichtbar gedrückt, das Banner blendet aus und wird aus dem DOM entfernt.

Besucher können den Button jederzeit auch selbst anklicken. Bei aktivierter Einstellung „Bewegung reduzieren“ erscheint der Zeiger direkt am Button, ohne Fahrt.

## Datenschutz

- Das Script setzt **keine Cookies** und nutzt weder `localStorage` noch `sessionStorage`. Es lädt keine externen Ressourcen.
- Deshalb erscheint das Banner bei jedem Seitenaufruf. Sich das Schließen zu merken, wäre ein Speichern auf dem Endgerät nach § 25 TDDDG und würde der Aussage des Banners widersprechen.
- Wer das Banner nicht auf jeder Unterseite zeigen möchte, setzt `onlyOnEntry: true`. Dann wird anhand des Referrers geprüft, ob der Besucher von einer fremden Seite kommt – ohne etwas zu speichern. Sendet der Browser keinen Referrer, erscheint das Banner.
- Der Hinweis muss stimmen: Vor dem Einsatz prüfen, dass die Website wirklich ohne Cookies auskommt – auch bei eingebundenen Diensten wie Videos, Karten, Web-Fonts oder Analyse-Tools.

## Browser-Unterstützung

Alle aktuellen Browser (Chrome, Edge, Firefox, Safari, auch mobil). Benötigt wird Shadow DOM; in Browsern ohne Shadow-DOM-Unterstützung (z. B. Internet Explorer) wird das Banner einfach nicht angezeigt.

## Demo lokal starten

Die Demo ist eine statische Seite und lässt sich direkt öffnen:

```bash
git clone https://github.com/joergzimmer/no-cookie-banner.git
cd no-cookie-banner
# demo.html im Browser öffnen, oder über einen lokalen Server:
npx serve .
```

## Lizenz

[MIT](LICENSE) – frei verwendbar, auch kommerziell. Der Copyright- und Lizenzhinweis muss bei Weitergabe erhalten bleiben; im Kopfkommentar von `no-cookie-banner.js` ist er bereits enthalten.
