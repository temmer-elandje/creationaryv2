# Lego Bouwspel — v3 (Startscherm met niveaus & punten)

**Nieuw:** Startscherm met drie keuzes:
- **1×1-steen** (Makkelijk, 1 punt)
- **2×2-steen** (Normaal, 2 punten)
- **Meesterbouwer** (Moeilijk, 3 punten)

Na de keuze ga je naar het opdrachtenscherm. Je ziet de punten-tag van de ronde rechtsboven.
Verder: afbeeldingen, timer, categorieën en custom woorden blijven werken.

## Gebruik
1. Open de app (GitHub Pages / lokale server).
2. Kies je bouw-niveau op het startscherm.
3. Bouw de opdracht! Nieuwe opdracht (zelfde niveau) via de knop.
4. Terug naar het startscherm met **Terug**.

## Afbeeldingen toevoegen
Zet PNG/JPG in **/images** en verwijs ernaar in `words.json` bij het item:
```json
{ "word": "auto", "difficulty": "makkelijk", "image": "images/auto.png" }
```

Veel plezier! 🧱
