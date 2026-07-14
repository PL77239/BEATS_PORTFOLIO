# Poland-Importers.com — Commercial Proposal (redesign)

A cleaned-up, professional rebuild of the trade-mission offer to the Egyptian
Chemical & Fertilizers Export Council.

## Files

| File | Description |
| --- | --- |
| `offer_Egypt_Poland_trade_mission.pdf` | **The finished, redesigned document.** |
| `build_offer.py` | Reproducible generator (ReportLab) for the PDF. |
| `assets/poland-importers-logo.png` | Company logo, extracted from the original and flattened onto white. |
| `assets/poland-importers-logo-transparent.png` | Same logo with a transparent background. |
| `original_offer_Egypt.pdf` | The original source document, kept for reference. |

## What changed

The source file mixed final content with Polish notes left for the designer,
e.g.:

* `TU DAJ TAKI LAYOUT JAK PALLADIUM STR 1 ... JAKO 1 SZA STRONA` — "give it a
  cover-page layout (like Palladium), as page 1";
* `TU BĘDZIE OD DRUGIE STRONY TYTUL` / `... W TAKICH LINIJKACH JAK 1 SZA STRONA`
  — "the section title starts from page 2 ... in bars like page 1";
* `TU DAJ KROPKA ALBO INNY PUNKTOR` — "put a dot / another bullet here";
* `tu może znajdź lepsze słowo` — "find a better word here" (next to
  *multiindustrial*).

Those are instructions, not content, so they were removed and their intent
applied:

1. **Cover page** — a proper title page that keeps the logo, with the company
   details, the addressee, the subject, and the country of performance.
2. **Section bars (I–V)** — each main section opens with a coloured title bar in
   the logo's blue/orange palette.
3. **Bulleted sub-headings** — every sub-section (Organization Stages,
   Methodology, Timeline, Scope of Work, Deliverables, Costs, etc.) is marked
   with a coloured bullet.
4. **Clean typesetting** — consistent numbered/bulleted lists, proper cost
   tables, and a repeating-header import-requirements matrix.
5. **Copy clean-up** — removed the manual `-- x of 10 --` page markers and the
   highlighted note, de-duplicated the "Deliverables" list, fixed spacing,
   punctuation and typos (e.g. *Minsitry* → *Ministry*, *Mariott* → *Marriott*),
   and changed *multiindustrial* → *multi-industry*.

Content and figures were preserved; only wording and layout were improved.

## Rebuild

```bash
pip install reportlab pillow
python3 build_offer.py
```
