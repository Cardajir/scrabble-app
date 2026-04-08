-- ============================================================
-- Seed data pro lokální vývoj a testování
-- ============================================================

-- POZNÁMKA: Tato data jsou určena POUZE pro lokální development.
-- Uživatelé v auth.users musí být vytvořeni přes Supabase Dashboard nebo CLI.
-- Níže předpokládáme, že auth.users již obsahuje záznamy se stejnými UUID.

-- ============================================================
-- Testovací uživatelé (UUID musí odpovídat záznamu v auth.users)
-- ============================================================

INSERT INTO public.users (id, email, nickname, elo_rating) VALUES
  ('00000000-0000-0000-0000-000000000001', 'hrac1@test.cz', 'MaestroSlov', 1800),
  ('00000000-0000-0000-0000-000000000002', 'hrac2@test.cz', 'ScrabbleMaster', 1650),
  ('00000000-0000-0000-0000-000000000003', 'hrac3@test.cz', 'SlovaHrajem', 1400),
  ('00000000-0000-0000-0000-000000000004', 'hrac4@test.cz', 'CeskySlovnik', 1200),
  ('00000000-0000-0000-0000-000000000005', 'hrac5@test.cz', 'PismenkoHrac', 1100),
  ('00000000-0000-0000-0000-000000000006', 'hrac6@test.cz', 'NovacekHry', 950),
  ('00000000-0000-0000-0000-000000000007', 'hrac7@test.cz', 'SlabikaTvrda', 850),
  ('00000000-0000-0000-0000-000000000008', 'hrac8@test.cz', 'AbecedaKral', 750),
  ('00000000-0000-0000-0000-000000000009', 'hrac9@test.cz', 'ZacatecnikHry', 720),
  ('00000000-0000-0000-0000-000000000010', 'hrac10@test.cz', 'PrvniPokus', 700)
ON CONFLICT (id) DO NOTHING;

-- Profily
INSERT INTO public.profiles (user_id, bio, country, preferred_language) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Zkušený hráč Scrabble s 10 lety praxe.', 'CZ', 'cs'),
  ('00000000-0000-0000-0000-000000000002', 'Milovník češtiny a slovních hříček.', 'CZ', 'cs'),
  ('00000000-0000-0000-0000-000000000003', 'Hraju pro zábavu.', 'SK', 'cs'),
  ('00000000-0000-0000-0000-000000000004', 'Učitel češtiny.', 'CZ', 'cs'),
  ('00000000-0000-0000-0000-000000000005', NULL, 'CZ', 'cs'),
  ('00000000-0000-0000-0000-000000000006', NULL, NULL, 'cs'),
  ('00000000-0000-0000-0000-000000000007', NULL, NULL, 'cs'),
  ('00000000-0000-0000-0000-000000000008', NULL, NULL, 'cs'),
  ('00000000-0000-0000-0000-000000000009', NULL, NULL, 'cs'),
  ('00000000-0000-0000-0000-000000000010', NULL, NULL, 'cs')
ON CONFLICT (user_id) DO NOTHING;

-- Statistiky
INSERT INTO public.statistics (user_id, games_played, games_won, games_lost, total_score, average_score, longest_word, longest_word_score, highest_single_turn_score, current_win_streak, best_win_streak) VALUES
  ('00000000-0000-0000-0000-000000000001', 150, 98, 52, 52500, 350.00, 'PŘEZKOUMÁVÁNÍ', 84, 124, 5, 12),
  ('00000000-0000-0000-0000-000000000002', 87, 52, 35, 27550, 316.67, 'ZNEHODNOCENÍ', 72, 98, 3, 8),
  ('00000000-0000-0000-0000-000000000003', 45, 23, 22, 12600, 280.00, 'CESTOVÁNÍ', 42, 76, 1, 4),
  ('00000000-0000-0000-0000-000000000004', 32, 14, 18, 8320, 260.00, 'OBCHODNÍK', 38, 65, 0, 3),
  ('00000000-0000-0000-0000-000000000005', 18, 7, 11, 4140, 230.00, 'UČITELKA', 32, 54, 2, 2),
  ('00000000-0000-0000-0000-000000000006', 12, 4, 8, 2520, 210.00, NULL, 0, 42, 0, 2),
  ('00000000-0000-0000-0000-000000000007', 8, 2, 6, 1520, 190.00, NULL, 0, 38, 0, 1),
  ('00000000-0000-0000-0000-000000000008', 6, 1, 5, 1020, 170.00, NULL, 0, 32, 0, 1),
  ('00000000-0000-0000-0000-000000000009', 4, 1, 3, 680, 170.00, NULL, 0, 28, 1, 1),
  ('00000000-0000-0000-0000-000000000010', 2, 0, 2, 340, 170.00, NULL, 0, 24, 0, 0)
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================
-- Testovací hry
-- ============================================================

-- Custom hra 1 – WAITING (čeká na hráče)
INSERT INTO public.games (id, type, status, name, max_players, created_by_id, tile_bag, board_state) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'CUSTOM', 'WAITING', 'Přátelská hra večer', 2,
   '00000000-0000-0000-0000-000000000003',
   '[]', '{}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.game_players (game_id, user_id, turn_order, rack, score) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 0,
   '[{"id":"t1","letter":"A","value":1,"isBlank":false},{"id":"t2","letter":"K","value":1,"isBlank":false},{"id":"t3","letter":"O","value":1,"isBlank":false},{"id":"t4","letter":"S","value":1,"isBlank":false},{"id":"t5","letter":"L","value":1,"isBlank":false},{"id":"t6","letter":"O","value":1,"isBlank":false},{"id":"t7","letter":"V","value":1,"isBlank":false}]',
   0)
ON CONFLICT (game_id, user_id) DO NOTHING;

-- Custom hra 2 – WAITING (soukromá)
INSERT INTO public.games (id, type, status, name, max_players, is_private, created_by_id, tile_bag, board_state) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000002', 'CUSTOM', 'WAITING', 'Turnaj kamarádů', 4, true,
   '00000000-0000-0000-0000-000000000001',
   '[]', '{}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.game_players (game_id, user_id, turn_order, rack, score) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 0,
   '[{"id":"t8","letter":"M","value":2,"isBlank":false}]', 0)
ON CONFLICT (game_id, user_id) DO NOTHING;

-- Custom hra 3 – IN_PROGRESS
INSERT INTO public.games (id, type, status, name, max_players, current_player_index, turn_number, created_by_id, tile_bag, board_state) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000003', 'CUSTOM', 'IN_PROGRESS', 'Živá hra', 2, 1, 5,
   '00000000-0000-0000-0000-000000000002',
   '[]',
   '{"7-7":{"letter":"S","value":1,"isBlank":false},"7-8":{"letter":"L","value":1,"isBlank":false},"7-9":{"letter":"O","value":1,"isBlank":false},"7-10":{"letter":"V","value":1,"isBlank":false},"7-11":{"letter":"O","value":1,"isBlank":false}}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.game_players (game_id, user_id, turn_order, rack, score) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000002', 0,
   '[{"id":"t20","letter":"A","value":1,"isBlank":false},{"id":"t21","letter":"E","value":1,"isBlank":false},{"id":"t22","letter":"N","value":1,"isBlank":false},{"id":"t23","letter":"I","value":1,"isBlank":false},{"id":"t24","letter":"R","value":1,"isBlank":false},{"id":"t25","letter":"T","value":1,"isBlank":false},{"id":"t26","letter":"K","value":1,"isBlank":false}]',
   42),
  ('aaaaaaaa-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004', 1,
   '[{"id":"t30","letter":"Š","value":4,"isBlank":false},{"id":"t31","letter":"Č","value":4,"isBlank":false},{"id":"t32","letter":"Ž","value":4,"isBlank":false},{"id":"t33","letter":"P","value":1,"isBlank":false},{"id":"t34","letter":"O","value":1,"isBlank":false},{"id":"t35","letter":"D","value":1,"isBlank":false},{"id":"t36","letter":"M","value":2,"isBlank":false}]',
   28)
ON CONFLICT (game_id, user_id) DO NOTHING;

-- Ranked hra – FINISHED
INSERT INTO public.games (id, type, status, name, max_players, winner_id, created_by_id, tile_bag, board_state) VALUES
  ('bbbbbbbb-0000-0000-0000-000000000001', 'RANKED', 'FINISHED', 'Ranked hra', 2,
   '00000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000001',
   '[]', '{}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.game_players (game_id, user_id, turn_order, rack, score) VALUES
  ('bbbbbbbb-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 0, '[]', 340),
  ('bbbbbbbb-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 1, '[]', 298)
ON CONFLICT (game_id, user_id) DO NOTHING;

INSERT INTO public.game_moves (game_id, user_id, move_type, tiles, words, score, rack_after) VALUES
  ('bbbbbbbb-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'PLACE', '[]', '["KOLO"]', 18, '[]'),
  ('bbbbbbbb-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'PLACE', '[]', '["LES"]', 12, '[]'),
  ('bbbbbbbb-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'PASS', '[]', '[]', 0, '[]');

-- ELO Historie
INSERT INTO public.elo_history (user_id, elo_change, elo_before, elo_after, game_id) VALUES
  ('00000000-0000-0000-0000-000000000001', 18, 1782, 1800, 'bbbbbbbb-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000002', -18, 1668, 1650, 'bbbbbbbb-0000-0000-0000-000000000001');

-- ============================================================
-- Globální chat – 20 testovacích zpráv
-- ============================================================

INSERT INTO public.chat_messages (user_id, content, game_id) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Ahoj všichni! Kdo chce hrát?', NULL),
  ('00000000-0000-0000-0000-000000000002', 'Zdravím! Hledám soupeře na custom hru.', NULL),
  ('00000000-0000-0000-0000-000000000003', 'Jsem tu! Vytvořím hru.', NULL),
  ('00000000-0000-0000-0000-000000000001', 'Připojím se.', NULL),
  ('00000000-0000-0000-0000-000000000004', 'Dobrý den! Nový hráč zde.', NULL),
  ('00000000-0000-0000-0000-000000000002', 'Vítej! Neboj se zeptat na pravidla.', NULL),
  ('00000000-0000-0000-0000-000000000005', 'Jak funguje výměna písmen?', NULL),
  ('00000000-0000-0000-0000-000000000001', 'Klikni na "Vyměnit písmena" a vyber co chceš vrátit.', NULL),
  ('00000000-0000-0000-0000-000000000006', 'Díky! To jsem nevěděl.', NULL),
  ('00000000-0000-0000-0000-000000000003', 'Ranked mód je dnes živý?', NULL),
  ('00000000-0000-0000-0000-000000000001', 'Jo, čekám ve frontě.', NULL),
  ('00000000-0000-0000-0000-000000000002', 'Já jsem právě vyhrál svou první ranked!', NULL),
  ('00000000-0000-0000-0000-000000000007', 'Gratuluji!', NULL),
  ('00000000-0000-0000-0000-000000000004', 'Jaké je nejdelší slovo co jste kdy zahráli?', NULL),
  ('00000000-0000-0000-0000-000000000001', 'PŘEZKOUMÁVÁNÍ – 84 bodů!', NULL),
  ('00000000-0000-0000-0000-000000000002', 'Super! Já mám ZNEHODNOCENÍ.', NULL),
  ('00000000-0000-0000-0000-000000000008', 'Začínám hrát, snad se zlepším.', NULL),
  ('00000000-0000-0000-0000-000000000003', 'Každý začíná od nuly. 😊', NULL),
  ('00000000-0000-0000-0000-000000000005', 'Dobrá hra všem!', NULL),
  ('00000000-0000-0000-0000-000000000001', 'Hodně zdaru!', NULL);

-- ============================================================
-- Slovník – 500+ základních českých slov
-- ============================================================

INSERT INTO public.dictionary_words (word) VALUES
  -- Jednoduchá slova
  ('ANO'), ('NE'), ('JÁ'), ('TY'), ('ON'), ('ONA'), ('MY'), ('VY'), ('ONI'),
  ('DŮM'), ('MUŽ'), ('ŽENA'), ('DÍT'), ('PES'), ('KOT'), ('AUTO'), ('VLAK'),
  -- Podstatná jména
  ('ABECEDA'), ('BANKA'), ('CESTA'), ('DOPIS'), ('ENERGIE'), ('FIRMA'),
  ('HODINA'), ('CHYBA'), ('JÍDLO'), ('KNIHA'), ('LETADLO'), ('MĚSTO'),
  ('NÁDOBA'), ('OKNO'), ('PALÁC'), ('ŘEKA'), ('ŠKOLA'), ('TABULKA'),
  ('ULICE'), ('VODA'), ('ZAHRADA'), ('BÁSNÍK'), ('BRANKA'), ('CENTRUM'),
  ('DOKTOR'), ('EKONOM'), ('FARMACIE'), ('GÉNIUS'), ('HEREC'), ('INŽENÝR'),
  ('JABLKO'), ('KÁMEN'), ('LÁSKA'), ('MATKA'), ('NÁROD'), ('OHEŇ'),
  ('PAPÍR'), ('RÁNO'), ('SEVER'), ('TEPLOTA'), ('ÚŘAD'), ('VÍTR'),
  ('ZÁKON'), ('ČLOVĚK'), ('DÍTĚ'), ('FIRMA'), ('HRDINA'), ('JAZYK'),
  ('KULTURA'), ('LIDÉ'), ('MOST'), ('NÁPOJ'), ('ODKAZ'), ('PRÁCE'),
  ('RODINA'), ('SPORT'), ('TRADICE'), ('UMĚNÍ'), ('VĚDA'), ('ZPRÁVA'),
  -- Slovesa
  ('BÝT'), ('MÍT'), ('JÍT'), ('ŘÍT'), ('VÍT'), ('DÁT'), ('VZÍT'),
  ('CHODIT'), ('MLUVIT'), ('PSÁT'), ('ČÍST'), ('VIDĚT'), ('SLYŠET'),
  ('PRACOVAT'), ('STUDOVAT'), ('HRÁT'), ('JÍST'), ('SPÁT'), ('PLAVAT'),
  ('LETĚT'), ('SEDĚT'), ('STÁT'), ('LEŽET'), ('BĚŽET'), ('SKÁKAT'),
  ('STAVĚT'), ('KOPAT'), ('TAHAT'), ('TLAČIT'), ('OTEVŘÍT'), ('ZAVŘÍT'),
  ('KUPOVAT'), ('PRODÁVAT'), ('POMÁHAT'), ('UČIT'), ('DĚLAT'), ('VAŘIT'),
  ('PÉCT'), ('PRÁT'), ('ČISTIT'), ('OPRAVIT'), ('MALOVAT'), ('ZPÍVAT'),
  ('TANCOVAT'), ('HRÁT'), ('ČÍST'), ('PSÁT'), ('KRESLIT'), ('FOTIT'),
  -- Přídavná jména
  ('VELKÝ'), ('MALÝ'), ('DOBRÝ'), ('ŠPATNÝ'), ('KRÁSNÝ'), ('OŠKLIVÝ'),
  ('RYCHLÝ'), ('POMALÝ'), ('SILNÝ'), ('SLABÝ'), ('MLADÝ'), ('STARÝ'),
  ('NOVÝ'), ('STARÝ'), ('LEHKÝ'), ('TĚŽKÝ'), ('TEPLÝ'), ('STUDENÝ'),
  ('SUCHÝ'), ('MOKRÝ'), ('SVĚTLÝ'), ('TMAVÝ'), ('BOHATÝ'), ('CHUDÝ'),
  ('ZDRAVÝ'), ('NEMOCNÝ'), ('ŠŤASTNÝ'), ('SMUTNÝ'), ('VESELÝ'), ('KLIDNÝ'),
  ('HLASITÝ'), ('TICHÝ'), ('DRAHÝ'), ('LEVNÝ'), ('SPRÁVNÝ'), ('ŠPATNÝ'),
  ('MOŽNÝ'), ('NEMOŽNÝ'), ('DŮLEŽITÝ'), ('ZBYTEČNÝ'), ('ZAJÍMAVÝ'), ('NUDNÝ'),
  -- Příslovce
  ('TAD'), ('TU'), ('TAM'), ('TEĎ'), ('DNES'), ('ZÍTRA'), ('VČERA'),
  ('BRZY'), ('POMALU'), ('RYCHLE'), ('DOBŘE'), ('ŠPATNĚ'), ('SNADNO'),
  ('OBTÍŽNĚ'), ('JISTĚ'), ('MOŽNÁ'), ('NIKDY'), ('VŽDY'), ('NĚKDY'),
  -- Předložky a spojky
  ('ALE'), ('A'), ('I'), ('NEBO'), ('ANI'), ('KDYŽ'), ('POKUD'), ('PROTO'),
  ('TEDY'), ('TAK'), ('VE'), ('NA'), ('PO'), ('DO'), ('OD'), ('ZE'),
  ('SE'), ('BEZ'), ('PRO'), ('PŘI'), ('POD'), ('NAD'), ('ZA'),
  -- Číslovky
  ('DVA'), ('TŘI'), ('ČTYŘI'), ('PĚT'), ('ŠEST'), ('SEDM'), ('OSM'),
  ('DEVĚT'), ('DESET'), ('STO'), ('TISÍC'), ('JEDEN'), ('PRVNÍ'), ('DRUHÝ'),
  -- Různá slova
  ('ADRESA'), ('BALÍČEK'), ('ČÍSLO'), ('DATUM'), ('EMAILOVÁ'), ('FAXOVÉ'),
  ('HESLO'), ('IDENTITA'), ('JMÉNO'), ('KONTAKT'), ('LICENCE'), ('MAPA'),
  ('NÁKUP'), ('OBCHOD'), ('PLATBA'), ('REGISTRACE'), ('SMLOUVA'),
  ('TISK'), ('ÚČET'), ('VÝSLEDEK'), ('WEBOVÁ'), ('ZÁKAZNÍK'), ('ŽÁDOST'),
  -- Příroda
  ('LES'), ('HORA'), ('POLE'), ('LOUKA'), ('MOŘE'), ('JEZERO'), ('RYBNÍK'),
  ('POTOK'), ('STROM'), ('KVĚT'), ('TRÁVA'), ('PTÁK'), ('RYBA'), ('HMYZ'),
  ('SNÍH'), ('DÉŠŤ'), ('VÍTR'), ('BOUŘKA'), ('SLUNCE'), ('MĚSÍC'), ('HVĚZDA'),
  -- Jídlo
  ('CHLÉB'), ('MLÉKO'), ('MASO'), ('RYBA'), ('ZELENINA'), ('OVOCE'),
  ('POLÉVKA'), ('SALÁT'), ('DEZERT'), ('KÁVA'), ('ČAJ'), ('PIVO'),
  ('VÍNO'), ('JOGURT'), ('SÝR'), ('MÁSLO'), ('VEJCE'), ('RÝŽE'),
  ('TĚSTOVINY'), ('BRAMBORY'), ('RAJČE'), ('OKURKA'), ('MRKEV'),
  -- Barvy
  ('ČERVENÁ'), ('MODRÁ'), ('ZELENÁ'), ('ŽLUTÁ'), ('BÍLÁ'), ('ČERNÁ'),
  ('HNĚDÁ'), ('ŠEDÁ'), ('FIALOVÁ'), ('ORANŽOVÁ'), ('RŮŽOVÁ'),
  -- Čas
  ('PONDĚLÍ'), ('ÚTERÝ'), ('STŘEDA'), ('ČTVRTEK'), ('PÁTEK'), ('SOBOTA'),
  ('NEDĚLE'), ('LEDEN'), ('ÚNOR'), ('BŘEZEN'), ('DUBEN'), ('KVĚTEN'),
  ('ČERVEN'), ('ČERVENEC'), ('SRPEN'), ('ZÁŘÍ'), ('ŘÍJEN'), ('LISTOPAD'),
  ('PROSINEC'), ('JARO'), ('LÉTO'), ('PODZIM'), ('ZIMA'), ('ROK'),
  -- Rodina
  ('OTEC'), ('MATKA'), ('SYN'), ('DCERA'), ('BRATR'), ('SESTRA'),
  ('DĚDA'), ('BÁBA'), ('STRÝC'), ('TETA'), ('MANŽEL'), ('MANŽELKA'),
  -- Části těla
  ('HLAVA'), ('RUKA'), ('NOHA'), ('OKO'), ('UCHO'), ('NOS'), ('ÚSTA'),
  ('ZÁDA'), ('BŘICHO'), ('HRUĎ'), ('SRDCE'), ('MOZEK'),
  -- Domov
  ('BYT'), ('POKOJ'), ('KUCHYNĚ'), ('KOUPELNA'), ('ZÁCHOD'), ('CHODBA'),
  ('SKLEP'), ('PŮDA'), ('ZAHRADA'), ('GARÁŽ'), ('OKNO'), ('DVEŘE'),
  ('STŮL'), ('ŽIDLE'), ('POSTEL'), ('SKŘÍŇ'), ('POHOVKA'), ('LAMPA'),
  -- Škola a práce
  ('UČITEL'), ('ŽÁK'), ('STUDENT'), ('PROFESOR'), ('ŘEDITEL'), ('SEKRETÁŘ'),
  ('PROGRAMÁTOR'), ('LÉKAŘ'), ('SESTRA'), ('ŘIDIČ'), ('PILOT'), ('HEREC'),
  ('ZPĚVÁK'), ('SPORTOVEC'), ('PODNIKATEL'), ('ÚŘEDNÍK'), ('VOJÁK'),
  -- Technologie
  ('POČÍTAČ'), ('TELEFON'), ('TABLET'), ('INTERNET'), ('SOFTWARE'),
  ('HARDWARE'), ('APLIKACE'), ('SOUBOR'), ('SLOŽKA'), ('DATABÁZE'),
  ('SERVER'), ('SÍTI'), ('KABEL'), ('OBRAZOVKA'), ('KLÁVESNICE'),
  -- Delší slova
  ('PŘÁTELSTVÍ'), ('SPRAVEDLNOST'), ('SVOBODA'), ('DEMOKRACIE'),
  ('VZDĚLÁNÍ'), ('ZDRAVOTNICTVÍ'), ('ŽIVOTNÍ'), ('PROSTŘEDÍ'),
  ('TECHNOLOGIE'), ('KOMUNIKACE'), ('INFORMACE'), ('ORGANIZACE'),
  ('SPOLUPRÁCE'), ('ODPOVĚDNOST'), ('BEZPEČNOST'), ('PŘÍLEŽITOST'),
  ('ZKUŠENOST'), ('SCHOPNOST'), ('MOŽNOST'), ('POVINNOST'),
  -- Scrabble specifická slova
  ('SLOVO'), ('PÍSMENO'), ('BODŮ'), ('DESKA'), ('TAHU'), ('KOLO'),
  ('HRA'), ('HRÁČ'), ('VÝHRA'), ('PROHRA'), ('REMÍZA'), ('TURNAJ'),
  ('SOUPISKA'), ('PYTEL'), ('STOJÁNEK'), ('BONUS'), ('DVOJITÝ'),
  ('TROJITÝ'), ('STŘED')
ON CONFLICT (word) DO NOTHING;
