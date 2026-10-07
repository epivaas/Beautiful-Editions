# Designborden

HTML-markup van de borden uit het Claude-artifact "Shelfhound: naam en designgids". Ze bevatten de exacte kleuren, maten en afstanden en zijn een **referentie voor de waarden**, geen productiecode.

- Foto's verwijzen naar `/_blob/...` en laden dus niet buiten het artifact.
- De nieuwste borden (Fotos, Variantpagina, Auteur-en-serie, About-en-randgevallen, Opmerkingen, Startpagina, Woordmerken, Logo) zijn statische HTML en openen in een browser. Oudere borden (Componenten, Titelpagina, Overzichten, Detailpaginas, Zoeken, Cocoa-fotos) gebruiken de canvas-runtime (`sc-for`, `sc-if`) en tonen buiten het artifact alleen hun ruwe markup.
- In `../screens/` staan schermafbeeldingen van de nieuwste borden. De foto's daarin zijn grijze vervangafbeeldingen.
- Historisch en bewust niet meegenomen: Main (naamvoorstellen), Richtingen en Lamplight (oude stijlen), Logo (archief van de logo-rondes).
