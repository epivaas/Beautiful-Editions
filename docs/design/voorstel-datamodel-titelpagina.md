# Voorstel: datamodel voor de titelpagina

Status: **voorstel, niets uitgevoerd.** De cijfers zijn op 7 en 8 oktober 2026 alleen-lezend uit de database gehaald.

Versie 2, aangepast na de antwoorden van Eric op 8 oktober.

## Besliste punten (Eric, 8 oktober)

- **Er zijn twee soorten subedities, niet drie.** Het onderscheid is `is_limited_edition`:
  - **Limited:** numbered, lettered, artist, en "limited" zoals de Folio Society het gebruikt.
  - **Niet-limited:** latere printings (2nd, 3rd…), soms met een nieuw catalogusnummer omdat er meer veranderde dan de run (bv. nu met slipcase), en afwijkingen die iemand vaststelt ("mijn exemplaar heeft een gele band, de site zegt blauw").
  - Er komt geen kolom `kind` en geen soort `state`.
- **Een editie mag beide soorten hebben.** Een Folio Society-editie kan bv. subeditie 1 limited hebben (clamshell, poster) en subeditie 2 unlimited (slipcase, geen poster). De regel "nooit beide" uit DESIGN.md vervalt.
- **Oplage:** `limited_edition_count` is de oplage. Er komt geen `print_run`.
- **Foto's:** miniaturen zonder ©-knop zijn goed, zolang de viewer (lightbox) de bronvermelding toont. Kleine foto's worden nooit vergroot.

## A. Nieuw veld: soort beperkte uitgave

**Wat ontbreekt.** Voor Suntup, Curious King en Amaranthine staat nergens in een veld of een limited subeditie *Numbered*, *Lettered* of *Artist* is. Dat staat nu alleen in de vrije tekst `impression_label`. De pagina toont daarom "Edition of 26" in plaats van "Lettered · 26".

`sub_editions.limitation_number` bestaat al, maar is overal leeg. Ik lees het als een exemplaarnummer ("No. 14"), niet als de soort, en laat het met rust.

**Wijziging.**

```sql
alter table sub_editions
  add column limitation_type text
  check (limitation_type in ('Limited', 'Numbered', 'Lettered', 'Artist'));
comment on column sub_editions.limitation_type is
  'Soort beperkte uitgave, alleen bij is_limited_edition = true. Limited = Folio-stijl zonder nummering per soort.';
```

- **Waarom een vaste lijst.** Met een vaste lijst kunnen chips, filters en labels erop rekenen, en schrijffouten ("lettered", "Letterd") kunnen niet in de database. Een nieuwe soort is een kleine wijziging van de `check`.
- **Waarom niet ook op `editions`.** Een editie kan zelf `is_limited_edition` zijn. Moet die dan ook een soort krijgen, of is dat altijd "Limited"? Zie de vraag onderaan.

**Overzetten** (468 limited subedities). Eerst als CSV die jij nakijkt, pas daarna uitgevoerd.

| Uitgever | Limited subedities |
|---|---|
| The Folio Society | 324 |
| Suntup Editions | 96 |
| Curious King | 29 |
| Amaranthine Books | 18 |
| Athenaeum-Polak en Van Gennep | 1 |

Hoe de rijen ingevuld worden:
- de tekst bevat "lettered" → `Lettered` (116 rijen)
- de tekst bevat "numbered" → `Numbered` (148 rijen)
- de tekst bevat "artist" → `Artist` (29 rijen)
- geen van deze, of Folio Society zonder een van die woorden → `Limited`

Rijen waar twee woorden in staan (bv. "Lettered … also numbered") komen apart in de CSV, zodat jij beslist.

**Wat de pagina daarna toont.** Op de titelpagina de variantlabels "Lettered · 26", "Numbered · 250", "Artist · 15" en "Limited · 1,000". Later volgen de variant-chips op de variantpagina en de editiepagina.

## B. Beschrijving van een titel (beslist: geen samenvatting)

Eric, 8 oktober: er komt **geen samenvatting** op de titelpagina (zie DESIGN.md §6 Titelpagina). De titels zijn bekend, en een tekst schrijven voor enkele duizenden titels weegt niet op tegen de winst. De gele band toont de Engelse titel, de originele titel, de auteur en een gegevensregel.

De kolom `works.summary` is op 8 oktober wel aangemaakt, maar wordt door de site niet gebruikt. Als er later toch een tekstveld komt, kan ze daarvoor dienen. Anders kan ze weg:

```sql
alter table public.works drop column summary;
```

## C. Afmetingen van foto's (nog open)

`photos.width` en `photos.height` zijn nodig voor:
- rijen foto's met dezelfde hoogte, waarvan de breedte de verhouding volgt;
- de lightbox, die nooit groter mag tonen dan de eigen maat;
- `next/image`.

Een eenmalig script meet de 449 bestaande foto's met `sharp`.

```sql
alter table photos add column width integer, add column height integer;
```

Dit kan nu, of samen met de fotopagina.

## D. DESIGN.md bijwerken

De regel "Een editie heeft **ofwel** variants **ofwel** printings, nooit beide" (§6 Titelpagina, §6 Editiepagina en §7 Subedities) klopt niet meer. Voorstel voor de nieuwe tekst:

> Een editie kan limited en niet-limited subedities hebben. Limited subedities (Numbered, Lettered, Artist, Limited) verschijnen als kaarten met hun oplage. Niet-limited subedities (latere printings en afwijkingen) staan in een tabel. Heeft een editie beide, dan eerst de limited kaarten, dan de tabel.

## Stand van zaken (8 oktober)

- **A, uitgevoerd:** tabel `limited_states` (Lettered, Numbered, Artist, Deluxe, Deluxe State, Standard, Standard State, Limited, Named Edition) en kolom `sub_editions.limited_state_id`. 313 van de 468 limited subedities zijn ingevuld. De overige 155 vult Eric aan via `limited-states-voorstel.csv`; Claude maakt daar daarna de SQL voor.
- **B:** geen samenvatting; `works.summary` bestaat maar wordt niet gebruikt.
- **C:** de afmetingen van foto's komen samen met de fotopagina.
- **D, uitgevoerd:** DESIGN.md beschrijft het model met limited en niet-limited.
- **SQL:** Eric voert die uit in de SQL-editor van Supabase; Claude levert de statements en controleert daarna met een leesquery.
