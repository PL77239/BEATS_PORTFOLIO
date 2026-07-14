# Poland-Importers.com — Commercial Proposal (redesign)

A professionally laid-out rebuild of the trade-mission offer to the Egyptian
Chemical & Fertilizers Export Council.

## Files

| File | Description |
| --- | --- |
| `offer_Egypt_Poland_trade_mission.pdf` | **The finished, redesigned document.** |
| `build_offer.py` | Reproducible generator (ReportLab) for the PDF. |
| `assets/poland-importers-logo.png` | Company logo, extracted from the original and flattened onto white. |
| `assets/poland-importers-logo-transparent.png` | Same logo with a transparent background. |
| `offer_Egypt_1_reference.pdf` | The client's reference ("offer Egypt 1.pdf") — the text source of truth. |
| `original_offer_Egypt.pdf` | The earlier source document, kept for reference. |

## Text-integrity policy

The wording, phrases, names, numbers and spellings are reproduced **verbatim**
from `offer_Egypt_1_reference.pdf`. Nothing is paraphrased, "corrected" or
added. Intentional-looking source quirks are therefore preserved on purpose,
for example:

* `Mariott`, `multiindustrial`, `hecavalent`, `Utilize`, `analysing`;
* lowercase `polish`; `IVA` (not VAT);
* European number style `24.000 Euro`, `1500 Euro/day`, `100ppm`;
* spelled-out sizes `two hundred m2` / `three hundred m2`;
* ranges written with a hyphen (`10-20`, `130-150`).

Only **layout** was applied (cover page, coloured section bars, bullets,
tables), per the Polish designer notes in the earlier draft.

### Two source artifacts (please confirm)

1. **Duplicated / truncated "Deliverables".** The source contains the heading
   *Deliverables* twice: once followed by a cut-off bullet ("…before each
   miss") and once by the complete list. The redesign shows it **once**, using
   the complete list. Say the word and I can reproduce the duplicate/fragment
   verbatim instead.
2. **Editing noise omitted.** The manual `-- x of 10 --` page markers, a couple
   of lone `.` lines and a stray empty bullet were dropped (they are
   pagination/editing noise, not content). Page numbers are shown in the footer
   instead.

Everything else — every sentence, name, figure and requirement — is identical
to the reference.

## Rebuild

```bash
pip install reportlab pillow
python3 build_offer.py
```
