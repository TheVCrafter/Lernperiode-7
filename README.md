# Lern-Periode 7
24.10. bis 19.12.2025

# Grob-Planung

In dieser Lernperiode möchte ich zusammen mit @HerrDextro einen Crypto- und Aktiensimulator wie [Investopedia](https://www.investopedia.com/simulator) erstellen. Dabei haben wir uns dafür entschieden, dass ich den Crypto-Teil übernehme. Dafür habe ich
Für welche API möchten Sie ein eigenes front end erstellen?
Welche groben Funktionalitäten soll Ihr front end zur Verfügung stellen?
Was möchten Sie insbesondere dabei lernen oder üben?

## 24.10.
- [X] Arbeitspaket 1: Erstellen Sie mehrere Skizzen von Ihrem front end. Überlegen Sie sich auch, welche Elemente die Interaktion mit dem back end auslösen und wie sich die Oberfläche dadurch verändert. Bauen Sie auch Interaktionen ein, die keinen Aufruf der API benötigen, sondern sich im client bearbeiten lassen (sortieren, suchen etc.)
- [X] Arbeitspaket 2: Setzen Sie in HTML und CSS Ihren Entwurf auf rudimentäre Weise um.
- [X] Arbeitspaket 3: Schreiben Sie ersten JS-Code als proof of concept (bspw. Meldung bei Klick auf Knopf-Element)

Heute habe ich zunächst nach einer API gesucht, um Daten zu verschiedenen Kryptowährungen live abzurufen. Dabei stieß ich auf die API von [CoinMarketCap](https://coinmarketcap.com/api/), die mir mit einem Limit von 30 API-Calls pro Minute und insgesamt 10.000 pro Monat fürs Erste ausreicht. 

Anschließend habe ich mir Gedanken zum Aufbau der Website gemacht. Ich ließ mich dabei stark von *Investopedia* inspirieren, entschied mich aber gleichzeitig, die Struktur etwas umzubauen und zusätzlich einige weitere Informationen anzuzeigen.  

Danach habe ich bereits einen ersten HTML-Teil erstellt – eine Tabelle zum Anzeigen der aktuellen Daten – und mithilfe von [ChatGPT](https://chatgpt.com/) mit API-Calls über JavaScript experimentiert. Für einige Kryptowährungen konnte ich bereits den API-Call zum Befüllen der Tabelle einrichten. 

Dabei fiel mir allerdings auf, dass etwas nicht funktionierte. Um den Fehler zu untersuchen, führte ich den API-Call nochmals über die Browser-Konsole aus und entdeckte durch die Fehlermeldungen, dass direkte Anfragen vom Browser aus aufgrund der **CORS-Richtlinien** blockiert werden. Daraus folgt, dass ich die Daten über einen kleinen **Server-Proxy** abgerufen werden musste, um die API korrekt nutzen zu können.

## 31.10.
- [ ] **CSS:** Grundlegendes CSS-Design erstellen. Die Website soll ein Dunkles Design verfolgen und ausserdem auf das Design des Aktienteils abgestimmt werden.
- [ ] **HTML** Header und Footer im HTML finalisieren und fehlende HTML-Elemente für *Overview*, *Holdings*, *Performance (Kurs)*, *Pending Trades* etc. einfügen.
- [ ] **Kurs:** Das JavaScript um eine Funktion ergänzen um mit aus dem API-Call erhaltenen historischen und aktuellen informationen ein Kurs-Display für die betreffende Kryptowährung zu erstellen.
- [ ] **Speichern:** Informieren über das Speichern von Account-Daten (json) wie z.B. Account Value, Holdings etc.
