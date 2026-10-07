# Shelfhound (voorheen Beautiful Editions)

Naslagwerk en koperstool voor mooi geïllustreerde boekedities (Folio Society, Curious King Books, Suntup, later misschien Loeb). Eigendom van Dust BV. Eind van het jaar live; nu nog niet publiek.

## Taal
- Praat met Eric in het **Nederlands**, kort en concreet.
- Alle **teksten in de interface in het Engels** (Titles, Authors, Publishers, Series, About, "Edition of 26"...). Code, bestandsnamen en commentaar in het Engels mag; commentaar in het Nederlands ook.

## Stack en commando's
- Next.js 16 (App Router, TypeScript, server components waar mogelijk), React 19, Tailwind CSS 4, Supabase (`@supabase/supabase-js`, client in `utils/supabase.ts`), Vitest. Gedeployed op Vercel.
- `npm run dev`, `npm run build`, `npm run lint`, `npm test`.
- Lees `.env.local` nooit voor en toon of commit die niet. Bewerk de database of het schema nooit zonder het eerst te bespreken.
- Let op: `app/components/SearchBox.tsx` en `components/SearchBox.tsx` bestaan beide, `app/edities/` is leeg, en `app/globals.css` gebruikt nog Tailwind v3-directives (`@tailwind base`). Ruim dat op bij de migratie naar `@import "tailwindcss"` en `@theme` (zie `docs/design/tokens.css`).

## De nieuwe stijl
De volledige gids staat in `docs/design/DESIGN.md`; tokens in `docs/design/tokens.css`; logo's in `docs/design/logo/`; de borden (markup met de exacte waarden) in `docs/design/boards/`. **Lees DESIGN.md voor je aan een pagina of component begint.** De korte regels:

- Enkel donker (Cocoa #3B332C), Archivo 800 voor koppen en 400 tot 600 voor tekst, IBM Plex Mono voor data. Geen serif, geen lichte modus.
- Gebruik alleen de tokens uit `tokens.css`. Geen hex-codes in componenten. **Geen gradients, geen verloop, geen schaduwverloop.** Elk kleurvlak is één vlak.
- Amber is voor wat aanklikbaar of geselecteerd is. Gloed (#FF6B3D) is schaars: aantallen en variantlabels, als vlak of lijn, nooit als kleine tekst.
- Foto's staan altijd op de grijze mat (#A19E99), `object-fit: contain`, nooit bijgesneden en nooit groter dan hun eigen formaat. Elke foto heeft een ©-knop met de bron.
- Lege velden: verborgen op kaarten, een gedempt "—" in tabellen.
- Tikdoelen minstens 44 px.
- De borden zijn statisch en niet bedoeld om te kopiëren. Vertaal ze naar herbruikbare React-componenten in `components/`.

## Werkafspraken
- Werk in kleine stappen: eerst tokens en lettertypes, dan gedeelde componenten (header met menu, footer, knoppen, chips, tabel, editiekaart, fototegel, gele band), daarna pagina per pagina. Maak een `/styleguide`-route die de componenten toont.
- Volgorde van pagina's: titelpagina en editiepagina, overzichten (Titles, Authors, Publishers, Series), startpagina, zoeken, variantpagina, auteur en reeks, About en randgevallen, foto's, opmerkingen met wachtrij.
- Check het datamodel vóór je een pagina bouwt; sectie 7 van DESIGN.md noemt wat de gids veronderstelt (type variant of printing, Includes als open lijst, foto-bronnen, announced, spotlight en suggesties). Stel schemawijzigingen voor in plaats van ze door te voeren.
- Gebruik plan-modus voor alles dat meer dan één bestand raakt. Draai `npm run lint` en `npm test` voor je klaar meldt.
- Bestanden met niet-gecommitte wijzigingen van Eric: lees ze, maar overschrijf niets zonder het te vragen.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
