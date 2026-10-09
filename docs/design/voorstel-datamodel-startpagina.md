# Voorstel: datamodel voor de startpagina

Status: **uitgevoerd op 9 oktober 2026; de startpagina gebruikt beide.** Bestaande edities hebben geen `created_at` (eerst kregen ze per vergissing de datum van de wijziging; dat is met een `update` weer leeggemaakt).

De startpagina werkt nu met de bestaande gegevens:
- **What's new** neemt willekeurig 4 uit de 120 edities met het hoogste id. Het id stijgt bij elke nieuwe editie, dus de hoogste id's zijn de laatst toegevoegde.
- **De spotlights** wisselen automatisch: een titel per week, een uitgever per twee weken. Ze kiezen alleen uit titels en uitgevers met foto's, en komen allemaal om de beurt aan bod.

DESIGN.md §6 en §7 vragen twee dingen die daarvoor in de database moeten komen.

---

## 1. `editions.created_at`, voor "What's new"

**Waarom.** "What's new" zou de edities van de laatste drie maanden moeten tonen. Het id zegt wel welke editie later kwam, maar niet wanneer. Met een datum kan de pagina echt "de laatste drie maanden" nemen, en later eventueel een pagina "All new editions" tonen.

**Wijziging.**

```sql
alter table public.editions
  add column created_at timestamptz default now();
comment on column public.editions.created_at is
  'Moment waarop de editie is toegevoegd; leeg voor edities van voor oktober 2026.';
```

**Bestaande rijen.** Die hebben geen echte datum. Mijn voorstel is ze **leeg te laten**, zodat ze niet als "nieuw" gelden. De pagina neemt dan:
1. de edities met `created_at` in de laatste drie maanden;
2. zijn dat er minder dan 4, dan vult ze aan met de hoogste id's, zoals nu.

Zo verandert er vandaag niets, en wordt "What's new" vanzelf juist zodra je edities toevoegt.

**Beslissen:** bestaande rijen leeg laten (mijn voorstel), of één vaste datum geven?

---

## 2. Tabel `spotlights`, om een keuze vast te zetten of in te plannen

**Waarom.** DESIGN.md wil dat je een spotlight kunt vastzetten of inplannen, met een eigen tekst. De gids wil ook dat een titel niet te snel terugkomt. De automatische rotatie doet dat nu al: alles komt om de beurt aan bod. Een vastgezette keuze verstoort die volgorde, en daarvoor dient de kolom `shown_at` hieronder.

**Wijziging.**

```sql
create table public.spotlights (
  id           bigint generated always as identity primary key,
  kind         text not null check (kind in ('title', 'publisher')),
  work_id      bigint references public.works (id),
  publisher_id bigint references public.publishers (id),
  starts_on    date not null,
  ends_on      date,                    -- leeg = één periode (een week voor een titel, twee weken voor een uitgever)
  text         text,                    -- jouw korte tekst op de tekstkaart (2 of 3 zinnen)
  created_at   timestamptz not null default now(),
  check (
    (kind = 'title' and work_id is not null and publisher_id is null) or
    (kind = 'publisher' and publisher_id is not null and work_id is null)
  )
);

comment on table public.spotlights is
  'Ingeplande of vastgezette spotlights op de startpagina. Zonder rij voor vandaag kiest de site automatisch.';

alter table public.spotlights enable row level security;
create policy "spotlights are readable by everyone"
  on public.spotlights for select
  using (true);
```

**Hoe de pagina kiest:**
1. Is er een rij van de juiste soort waarbij vandaag tussen `starts_on` en `ends_on` (of het einde van de periode) valt, dan toont de pagina die, met jouw tekst.
2. Anders kiest ze automatisch, zoals nu, en slaat ze titels en uitgevers over die in de laatste acht weken in `spotlights` stonden.

**Wat er niet in zit.** Ik stel geen kolom `pinned` en geen `shown_at` voor:
- **Vastzetten** is een rij met een `ends_on` ver in de toekomst.
- **"Niet recent getoond"** leest de pagina af uit `starts_on`.

**Beheren** doe je voorlopig in de Table Editor van Supabase: een rij toevoegen met de soort, de titel of uitgever, een startdatum en eventueel een tekst. Een eigen beheerscherm kan later, samen met de wachtrij voor opmerkingen.

**Beslissen:**
- Is dit voldoende, of wil je meer, bv. een kolom voor een andere foto dan de automatische?
- Mag de site titels overslaan die je recent zelf in de kijker zette (8 weken), of wil je een andere termijn?

---

## Een spotlight inplannen (Table Editor in Supabase)

Voeg een rij toe aan `spotlights`:

| Kolom | Titel | Uitgever |
|---|---|---|
| `kind` | `title` | `publisher` |
| `work_id` | id van de titel (zie de URL `/titles/…`) | leeg |
| `publisher_id` | leeg | id van de uitgever |
| `starts_on` | eerste dag | eerste dag |
| `ends_on` | leeg = een week, of een einddatum | leeg = twee weken, of een einddatum |
| `text` | 2 of 3 zinnen op de tekstkaart (mag leeg) | idem |

- **Vastzetten:** `ends_on` ver in de toekomst, bv. `2099-12-31`.
- **Volgorde:** zijn er meerdere rijen tegelijk actief, dan wint de laatst gestarte.
- **Zonder rij voor vandaag** kiest de site automatisch, en slaat ze titels en uitgevers over die in de laatste acht weken ingepland stonden.
- **Snelheid:** een nieuwe rij verschijnt binnen vijf minuten op de startpagina.
