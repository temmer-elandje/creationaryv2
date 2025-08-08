# Lego Bouwspel — v2 (met plaatjes & snelle moeilijkheid)

Nieuw in v2:
- **Plaatjes per woord** (optioneel): toon een afbeelding als `image`-pad in `words.json` is gezet.
- **Snelle moeilijkheid**: druk op **Makkelijk / Normaal / Moeilijk** om direct een woord van die moeilijkheid te trekken (ongeacht de filter).
- Filter met dropdown blijft werken voor vaste voorkeuren.

## Afbeeldingen toevoegen
1. Zet je PNG/JPG in de map **/images**.
2. In `words.json` voeg je per item `"image": "images/bestand.png"` toe (en optioneel `"caption": "Bijschrift"`).
3. De app toont het plaatje als *Plaatjes tonen* aan staat (Instellingen).

> Tip: In deze versie staan al **voorbeeldafbeeldingen** voor o.a. auto, fiets, helikopter, huis, kasteel, hond, pizza, gitaar, robot, kerstboom (placeholder-kaarten). Vervang ze gerust door echte afbeeldingen.

## Deploy
- Zelfde als v1: upload alle bestanden in de root van je GitHub repo en zet GitHub Pages aan.
- Op iPad: open de URL → Deel → Zet op beginscherm.

Veel bouwplezier! 🧱
