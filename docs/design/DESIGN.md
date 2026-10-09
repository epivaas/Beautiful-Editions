# Shelfhound: designgids

Shelfhound is de nieuwe naam van de Beautiful Editions-site: een naslagwerk en koperstool voor mooi geïllustreerde edities (Folio Society, Curious King Books, Suntup, later misschien Loeb). Dit document is de tekstversie van de designborden. De borden zelf staan in `boards/` (HTML-markup met de exacte waarden) en in het Claude-artifact "Shelfhound: naam en designgids".

Taal: gesprekken met Eric in het Nederlands. **Alle teksten in de interface in het Engels** (Titles, Authors, Publishers, Series, About, "Edition of 26", "Show all 18 photos"...).

## 1. Principes

- Donker, enkel Cocoa. Er is geen lichte modus.
- Één kleur per vlak: **geen gradients, geen schaduwverloop, geen afbeeldingen als achtergrond**.
- Geen serif, nergens. Titels in Archivo 800, data in IBM Plex Mono.
- Foto's staan altijd op de **grijze mat** (#A19E99), nooit bijgesneden, nooit groter getoond dan hun eigen formaat. De foto's hebben alle kleuren, dus gebruik nooit palette-gekleurde voorbeeldfoto's.
- Gloed is schaars. Het is een vlak- en lijnkleur voor aantallen en variantlabels (en op de uitgeverspagina voor het geselecteerde jaar: de balk en de rand van de bijbehorende rij; verder de huidige pagina in de paginering en de gevonden tekens bij filteren en zoeken, telkens als vlak met Inkt-tekst), nooit voor kleine tekst (4,4:1 op Cocoa, 3,7:1 op Oppervlak).
- Aanklikbaar is Amber. Alles wat Amber is, doet iets.
- Lege velden: verborgen op kaarten, een gedempt "—" in tabellen en op detailpagina's.
- Minimale tikdoelen: 44 px hoog (knoppen, chips, paginering).

## 2. Kleuren

Staan als Tailwind v4-tokens in `tokens.css`. Gebruik de namen, geen hex.

| Token | Hex | Gebruik |
|---|---|---|
| cocoa | #3B332C | pagina-achtergrond |
| oppervlak | #473E36 | kaarten, panelen |
| lijn | #5C5147 | randen |
| kop | #2A241F | header, tabelkop |
| mat | #A19E99 | fotomat |
| rij-hover | #52483F | hover op tabelrij |
| creme | #F5ECD7 | hoofdtekst |
| creme-gedempt | #D2C6AE | secundaire tekst |
| leeg | #A89C86 | "—", uitgeschakeld |
| inkt | #1B1612 | tekst op Amber, Gloed, mat |
| amber | #FFB627 | accent, links, primaire knop, gele band |
| gloed | #FF6B3D | aantallen en variantlabels, vlak of lijn |

Contrasten (handmatig berekend): Crème op Cocoa 10,5; gedempte crème op Cocoa 7,3 (6,2 op Oppervlak); Amber op Cocoa 7,1 (bruikbaar als tekst); Inkt op Amber 10,2, op Gloed 6,3, op de mat 6,7. Gloed op Cocoa 4,4 en op Oppervlak 3,7: geen kleine tekst.

## 3. Typografie

- Archivo (400, 500, 600, 700, 800) voor alles behalve data. Titels 800 met negatieve letterspatiëring (-0.02em tot -0.04em).
- IBM Plex Mono (400, 500) voor aantallen, jaren, nummers, eyebrows en tellers.
- Maten uit de borden: paginatitel 72/72; titel in een gele band 64 tot 88 px; h2 32/36; h3 26/32; lopende tekst 15 tot 17 px; nota 17/27 in een kolom van maximaal 68 tekens; veldlabels 11 px, hoofdletters, 600, letterspatiëring 0.09em, in gedempte crème; eyebrow in mono 13 px hoofdletters 0.08em, Amber.

## 4. Logo

Bestanden in `logo/`. Het merkteken is een hond waarvan het gezicht een open boek is: twee crème bladzijden met ogen, Gloed-kaften als hangende oren, een snuit onder het boek.

- Woordmerk: "Shelfhound", Archivo 800, recht (geen italic), letterspatiëring -0.04em. "Shelf" in Crème, "hound" in Amber. Op Amber: alles Inkt.
- Standaard: merkteken in een Amber tegel (hoekradius schaalt mee met de grootte: in de header op 34 px is dat 8/64 = 12,5 % van de zijde, ongeveer 4 px; bij 64 px en groter 14/64 ≈ 22 %; zie de SVG's in `docs/design/logo/`) links van het woordmerk. Op Amber: omgekeerd, Cocoa/Inkt-tegel. Eén kleur: Crème op Cocoa.
- Minimale grootte: tegel 16 px (favicon), horizontale opstelling 24 px hoog. Geen draaien, uitrekken, schaduw of verloop.
- Dit is een eigen tekening; voor drukwerk is een door een ontwerper nagetekend vectorbestand aan te raden.

## 5. Componenten

- **Header** (Kop-achtergrond, onderrand Lijn): merkteken 34 px + woordmerk 22 px, menu Titles / Authors / Publishers / Series / About (actief: Crème 600 met 3 px Amber onderlijn), rechts de zoekbalk (300 px, "Search" met Amber "Detailed"). Zoeken staat op elke pagina; op de startpagina staat bovendien een grote balk in de band.
- **Knoppen**: primair Amber met Inkt-tekst, 700 15 px, minimaal 44 px hoog, radius 6. Secundair: omlijnd in Crème.
- **Chips (filters)**: standaard Oppervlak met Lijn-rand; geselecteerd Amber met Inkt-tekst 700; aantal in mono.
- **Includes-chips** (slipcase, dust jacket, clamshell box en meer, allemaal gelijkwaardig): Lijn-achtergrond, 28 px hoog, 13 px 600.
- **Variantlabel**: Gloed-vlak met Inkt-tekst, 26 px hoog, 13 px 700. Tekst is "Edition of 26", niet "26 copies".
- **Gele band** bovenaan titel-, editie-, variant-, auteur-, reeks- en uitgeverspagina's: Amber, Inkt-tekst, titel groot, rechts een blok van 280 px in Gloed met een aantal (130 px, regelhoogte 0.8, 800), mono-label en een mono-regel. Op de overzichtspagina's is de band compacter (zie Titles, Authors, Publishers, Series): aantal 80 px, geen mono-regel. De uitgever staat als Inkt-pil met Amber-tekst (800, 20 px) boven de titel.
- **Tabel**: kop in Kop-kleur met veldlabels, alle rijen Oppervlak met een haarlijn ertussen (geen zebra), rand Lijn, radius 8, hover #52483F, waarbij de titel in die rij een Amber onderlijn van 2 px krijgt (geen bolletje of andere Gloed-markering). Paginering: huidige pagina Gloed (vlak met Inkt-tekst). A–Z alleen op de titelpagina.
- **Fototegel**: mat, `object-fit: contain`, `max-width/max-height: 100%`, cirkelknop © (28 px, rgba(27,22,18,.85), rechtsonder) die de bronvermelding toont. Rijen foto's zijn gelijke hoogte met flex proportioneel aan de verhouding.
- **Editiekaart**: foto op mat (190 px), titel 19 px 800, uitgever Amber 700 14 px, jaar en binding in mono, variantlabels in Gloed.
- **Feitenraster**: vier kolommen, bovenrand Lijn, label 11 px hoofdletters, waarde 16/24.
- **Nota**: 17/27, smalle kolom, bronnen onderaan als kleine Amber-links.
- **Foutmelding**: Gloed-rand links (6 px) op een Oppervlak-vlak. Gloed enkel als lijn.

## 6. Pagina's

Bestaande routes staan tussen haakjes. Elk bord in `boards/` hoort bij een pagina.

| Pagina | Route nu | Bord |
|---|---|---|
| Startpagina | `/` | Startpagina |
| Titles (duizenden, weinig detail: titel, Engelse titel, auteur, oorspronkelijk jaar; geen foto) | `/titles` | Overzichtspagina's |
| Titelpagina (edities, veel details, foto's) | `/titles/[id]` | Titel- en editiepagina |
| Editiepagina (details en printings) | `/edition/[id]` | Titel- en editiepagina |
| Variantpagina (lettered, numbered, artist) | `/sub-editions/[id]` | Variantpagina |
| Authors, auteurspagina | `/author`, `/author/[id]` | Overzichtspagina's, Auteur en reeks |
| Publishers, Series (nu samen op `/publishers-series`) | Publishers en Series zijn aparte menu-items | Overzichtspagina's, Auteur en reeks |
| Zoeken, gedetailleerd zoeken | `/titles/search` | Menu en zoeken |
| About, FAQ, lege toestanden, 404 | nieuw (`app/not-found.tsx` bestaat) | About en randgevallen |
| Foto's: strook, alle foto's, lightbox | nieuw | Foto's bekijken |
| Opmerkingen en correcties met wachtrij | nieuw | Opmerkingen |

### Beslissingen per pagina

**Startpagina.** Gele band met merkteken en woordmerk groot, slogan "Find the edition worth owning" (76 px), korte uitleg, zoekbalk in Crème met Inkt-knop, rechts Gloed-blok "3,000+ editions". Daaronder drie even grote rijen van vier kaarten: *What's new* (willekeurig uit de edities van de laatste drie maanden, knop "Show other editions"), *Title in the spotlight* en *Publisher in the spotlight*. Bij een spotlight is de eerste kaart de tekstkaart (Amber rand, eyebrow, titel of uitgever, optionele tekst, aantal, knop) en zijn de andere drie edities van die titel of uitgever. De titel wisselt wekelijks, de uitgever om de twee weken, automatisch uit titels met minstens drie edities en foto's die nog niet recent getoond zijn. Eric kan een keuze vastzetten of inplannen, met eigen tekst. Geen Browse-blokken met aantallen.

**Titles, Authors, Publishers, Series.** Elke lijst opent met een compacte gele band (ongeveer 180 px hoog, bord Overzichten): de naam van de lijst groot (72 px, 800), één zin uitleg (18 px, 500) en rechts een Gloed-blok van 280 px met alleen het aantal (80 px, 800) en daaronder het label in mono ("titles", "authors", "publishers", "series"). Geen tweede getal en geen mono-regels; het losse tellertje boven de lijst vervalt. Beschrijvingen: Titles "Every work on the shelf, under its original title.", Authors "The people behind the works, from A to Z.", Publishers "The houses that publish the editions.", Series "Publisher series, in order of publication." De pagina "Titles van een uitgever" krijgt dezelfde band met de uitgeversnaam als titel, een Inkt-pil "Publisher" erboven, "Publisher · 1947 to now" als zin en het aantal titels in het Gloed-blok (±220 px met de pil), onder de kruimellijst; het losse blok rechts van de kop vervalt. Daaronder: korte tabellen met filter ("Filter this list"), paginering en A–Z waar de lijst lang is (titles). Bij auteurs en reeksen is dat meestal overbodig: Homer heeft er twee.

**Titelpagina.** Gele band, van boven naar onder: de Engelse titel (middelgroot, alleen als die verschilt van de originele), de originele titel groot, de auteur in een groot lettertype (ongeveer 28 px), daaronder een regel met gegevens in IBM Plex Mono ("First published c. 700 BC", "Original language: Ancient Greek" en een link "Wikipedia ↗", onderstreept in Inkt en alleen aanwezig als de link bekend is; lege gegevens worden weggelaten). Er staat geen eyebrow "Title" meer boven de band: de Engelse titel neemt die plaats in. Tekst op Amber is altijd Inkt (#1B1612), nooit #2A1D0C. Er is bewust **geen samenvatting** van het werk: de titels zijn bekend, er is geen tekst voor en die schrijven voor enkele duizenden titels weegt niet op tegen de winst. Een tekstveld kan later, en wordt dan alleen getoond als het ingevuld is. Rechts een Gloed-blok met aantal edities. Foto's: één grote, enkele kleine en een laatste tegel "+34" (wat overblijft) met link "View all 39 photos". Edities in twee weergaven (schakelaar Cards / Grid, die pas vanaf vier edities verschijnt; de standaard is Cards). **Cards**: volle breedte, links een grote foto met drie kleine en een "+N"-tegel, rechts uitgever (Amber), titel, en een rij met Year, Binding, Pages en Illustrators, daaronder de Includes als gelijke chips, de limited editions in Gloed (bv. "Lettered · 26"), een ingekorte nota van maximaal drie regels, het aantal limited editions, printings en foto's en de knop "View edition". **Grid**: compacte kaarten naast elkaar (minstens 230 px breed) met foto op de mat met ©, uitgever, titel, jaar en binding, illustrator, de Includes als kleine chips (slipcase, clamshell box, dust jacket) en onderaan de limited editions en het aantal printings. Er is geen tabel- of vergelijkingsweergave meer. **Sort by** (Year, Publisher, Name; opnieuw klikken keert de volgorde om) staat boven beide weergaven, naast de filter op uitgever. Hoort een editie bij meerdere titels (nu 22 edities), dan staat op de kaart een regel "Also contains" met twee à drie andere titels en "+N". Lege velden verdwijnen op de kaarten. Een editie kan limited en niet-limited subedities hebben, ook allebei tegelijk.

**Editiepagina.** Gele band, Includes-balk, Publication en Physical description in een feitenraster, nota, daarna twee blokken: **Limited editions** (kaarten) en **Printings** (tabel). Heeft een editie beide, dan eerst de kaarten, dan de tabel; een soort zonder items verdwijnt. **Kaart van een limited edition:** de naam is de soort + "edition" ("Lettered edition", "Numbered edition"); bij een Named Edition het stuk vóór de dubbele punt ("Hyde Edition"). Het Gloed-label op de kaart toont de oplage ("Edition of 26") en er staat een Amber knop "Open page →". Op de kaarten van de titelpagina staat de soort samen met de oplage als chip ("Lettered · 26"). **Gloed-blok in de band:** een groot getal met label, daaronder in IBM Plex Mono de overige tellingen. Heeft de editie beide soorten, dan toont het blok "3 limited editions" én "4 printings" (het grote getal is het aantal limited editions, de printings staan eronder, samen met het aantal foto's). Heeft ze alleen printings, dan is het grote getal het aantal printings. Heeft ze geen van beide, dan is het getal het aantal foto's. Is er niets te tellen, dan blijft het Gloed-blok staan als **leeg blok** (zelfde breedte en kleur, zonder inhoud), zodat de band er op elke pagina hetzelfde uitziet; het blok verdwijnt dus nooit. Het enkelvoud klopt altijd ("1 edition", "1 limited edition"). Op de titelpagina toont het blok altijd het aantal edities, ook bij één. **Printings:** een tabel waar elke rij is uitgeklapt (▶ meer details), een eigen pagina heeft (→) of niets heeft (alles staat al in de rij). Een uitgeklapte rij toont zoveel mogelijk eigen gegevens: de beschrijving (`impression_label`, waarin ook het jaar staat), band, Includes (slipcase e.d.), formaat, lettertype, colofon en foto's; een veld zonder eigen waarde verdwijnt. **Editie bij meerdere titels:** de kruimellijst toont de titel waarvan je komt (via de link of een query-parameter), anders de eerste titel. De band toont ze allemaal in een regel "Contains" met een chip per titel (de huidige gevuld in Inkt); zijn het er meer dan vijf, dan vijf chips en "+N more" dat de rest uitklapt. Het Gloed-blok toont dan het aantal titels, met eronder de limited editions en printings als die er zijn.

**Variantpagina.** De titel van het boek is de grootste kop (88 px), daaronder "Lettered edition · 2018". Gloed-blok: "Edition of" boven een groot aantal. Geen fotoaantal in de band. Varianten van dezelfde editie als chips bovenaan. Velden die afwijken van de editie tonen de eigen waarde met de waarde van de editie gedempt eronder; gelijke velden zeggen "Same as edition". Colofon is optioneel (verborgen als leeg). Geen lijst met bekende exemplaren. Geen printings.

**Auteurspagina.** Een auteur is een auteur, geen rollen. Band met naam, jaren, land en een link naar Wikipedia als die er is (`wiki_link`). "About" is optioneel. Tabel met titels; "Titles per publisher" (titels, niet edities). Filter en paginering pas vanaf ongeveer 25 titels.

**Reeks.** Hoort bij één uitgever. Volgorde is publicatiedatum, met het nummer vooraan in mono. Aangekondigde titels staan onderaan met het label "Announced" en het verwachte jaar. Geen jaarhistogram, filter of sorteerknoppen bij enkele delen.

**Foto's.** Strook op de pagina; een eigen pagina "Photographs" met rijen gelijke hoogte, filter per editie en variant en een knop "Show more"; een lightbox met donkere laag, pijlen en toetsen (← → Esc), miniaturenstrook, uitleg, editie en rechten (© maker, bron, licentie), geen zoom boven de bron en op de telefoon vegen.

**About.** Gele band (kleiner), "A reference for beautifully illustrated editions" met "Find the edition worth owning" als zin eronder. Uitleg bij edition, variant, printing en includes, FAQ (Eric vult de antwoorden zelf in), formulier "Spotted an error?" (één tekstvak, naam en e-mail optioneel), colofon.

**Lege toestanden en 404.** Zoeken zonder resultaat, titel zonder foto's, filter zonder uitkomst, lege lijst: elk zegt wat er aan de hand is, geeft een volgende stap en heeft maximaal één Amber knop. 404: "This book is not on the shelf" met zoekbalk en links naar de overzichten. Foutmelding (500): Gloed-rand.

**Opmerkingen.** Alleen inzenden, geen draden, geen accounts. Elke pagina heeft onderaan "Suggest a change"; later ook een potlood bij elk veld. Alle inzendingen gaan in een wachtrij die alleen Eric ziet (statussen New, Accepted, Published, Rejected, Spam); niets wordt automatisch gepubliceerd. Eric beantwoordt e-mails zelf. Spamwering zonder accounts: verborgen veld, minimumtijd, maximum per uur per adres, maximaal één link. Bij de start: formulier en wachtrij; notes onder de pagina en een lijst bijdragers later.

## 7. Datamodel: wat de gids veronderstelt

Gebaseerd op `types/database.ts`; controleer dit tegen het echte Supabase-schema.

- **Includes**: nu drie booleans (`slipcase`, `dustjacket`, `clamshell`). De gids wil een open lijst van gelijkwaardige items. Voorstel: een lijst of aparte tabel.
- **Subedities**: twee soorten, onderscheiden door `is_limited_edition`. **Limited** (Numbered, Lettered, Artist, Standard, Deluxe, "Limited" zoals bij de Folio Society…) met `limited_edition_count` als oplage. **Niet-limited**: latere printings (soms met een nieuw catalogusnummer, bv. nu met slipcase) en vastgestelde afwijkingen ("mijn exemplaar heeft een gele band"). Een editie kan beide hebben. Nodig: een veld voor de soort van een limited subeditie, waaraan Eric gemakkelijk nieuwe namen kan toevoegen (zie `voorstel-datamodel-titelpagina.md`). Een limited subeditie kan geen printings hebben (een herdruk zou niet meer limited zijn): printings horen alleen bij de editie, nooit bij een variant, en een variantpagina toont dus nooit een printingtabel.
- **Printings**: `impression_label` is de enige beschrijving (het jaar staat alleen in die tekst). Eigen waarden hebben vaak ook band, includes, formaat en lettertype; die worden in de uitgeklapte rij getoond zodra ze bestaan.
- **Edities bij meerdere titels**: nu 22 edities, soms zeven of meer titels. Het model heeft dus een veel-op-veel-relatie tussen titel en editie nodig (of gebruikt die al); de pagina's moeten een lijst van titels aankunnen.
- **Foto's**: bestaan al per editie en subeditie. De bronvermelding staat al in `photos.copyright_statement` en is voldoende voor de © knop. Afmetingen en een bron-URL zijn optioneel en pas later nodig.
- **Series**: `publisher_id` en `sequence_number` bestaan. Toevoegen: een status "announced" (of een jaar in de toekomst).
- **Auteurs**: `wiki_link` bestaat; geen rollen. Illustrators en vertalers zijn contributors per editie (bestaande `role`), meerdere toegestaan.
- **Pagina's**: `pages_description` is vrije tekst ("Pp. [1–9] 10–280."). Binding mag leeg zijn.
- **Nieuw**: `created_at` op edities (voor What's new), een spotlight-tabel (soort, id, begindatum, tekst, vastgezet) met een geplande taak, een suggesties-tabel (pagina, veld, type, tekst, naam, e-mail, e-mail bevestigd, credit ja/nee, status, tijdstempel) en een beheerweergave voor Eric.

## 8. Wat nog openstaat

- Een focusring is niet getekend; voorstel in `tokens.css`: 2 px Amber.
- De FAQ-antwoorden vult Eric zelf in.
- Domein (shelfhound.be en .io of .org) bevestigen bij een registrar, en een merkcontrole bij BOIP.
- Eigen vectorbestand van het logo voor drukwerk.
