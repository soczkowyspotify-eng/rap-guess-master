// ═══════════════════════════════════════════════════════════════════
//  RAPGUESSER — BAZA PIOSENEK
// ═══════════════════════════════════════════════════════════════════
//
//  JAK SPRAWDZIĆ CZY LINK ZADZIAŁA?
//  ─────────────────────────────────
//  Nie każda piosenka na SoundCloud działa jako embed!
//  Przed dodaniem do bazy wejdź na:
//
//   https://w.soundcloud.com/player/?url=TUTAJ_WKLEJ_LINK
//
//  Przykład sprawdzenia:
//    https://w.soundcloud.com/player/?url=https://soundcloud.com/ksi/holiday
//
//  Jeśli pojawia się odtwarzacz z okładką → DZIAŁA ✅
//  Jeśli pojawia się "This track is not available" → NIE DZIAŁA ❌
//    (zablokowane przez wytwórnię / artysta wyłączył embedding)
//
//  ─────────────────────────────────
//  FORMAT WPISU:
//  {
//    id:     dowolny unikalny string BEZ spacji i polskich znaków,
//    title:  tytuł piosenki (wyświetlany w grze),
//    artist: wykonawca,
//    year:   rok (liczba, bez cudzysłowów),
//    type:   zawsze 'sc' dla SoundCloud,
//    src:    pełny link z soundcloud.com
//  }
//
//  WAŻNE: po każdym wpisie (oprócz ostatniego) musi być przecinek!
//  WAŻNE: src musi być dokładnym linkiem do konkretnej piosenki,
//         NIE do profilu artysty ani playlisty
// ═══════════════════════════════════════════════════════════════════

export const SONGS_DB = [

  // ── PRZYKŁADY KTÓRE DZIAŁAJĄ (sprawdzone embedowanie) ──
  // Usuń te przykłady i wstaw swoje własne piosenki

  {
    id: 'sc_0001',
    title: 'Klękaj przed panem',
    artist: 'Białas, Słoń',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/DRUGA%20TURA/Kl%C4%99kaj%20przed%20panem%20Bia%C5%82as%202021-12-14.mp3'
  },

  {
    id: 'sc_0002',
    title: 'Buduje zamek',
    artist: 'Malik Montana, Asster',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/DRUGA%20TURA/Buduje%20zamek%20Malik%20Montana%202023-03-10.mp3'
  },
  
  {
    id: 'sc_0003',
    title: 'Tańcz ze mną',
    artist: 'ReTo',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/DRUGA%20TURA/Ta%C5%84cz%20ze%20mn%C4%85%20ReTo%202023-02-24.mp3'
  },  
  
  {
    id: 'sc_0004',
    title: 'BALLADA O SAMOTNOŚCI (vlone)',
    artist: 'Young Multi',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/DRUGA%20TURA/BALLADA%20O%20SAMOTNO%C5%9ACI%20(vlone)%20Young%20Multi%202021-12-17.mp3'
  },   

  {
    id: 'sc_0005',
    title: 'BEZ SERCA',
    artist: 'Young Multi, Miszel, matiskater',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/DRUGA%20TURA/BEZ%20SERCA%20Young%20Multi%202021-12-17.mp3'
  },

  {
    id: 'sc_0006',
    title: 'Bitch, Please',
    artist: 'Hodak',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/DRUGA%20TURA/Bitch%2C%20Please%20Hodak%202021-06-10.mp3'
  },    
  
  {
    id: 'sc_0007',
    title: 'Blueface',
    artist: 'Kaz Bałagane',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/DRUGA%20TURA/Blueface%20Kaz%20Ba%C5%82agane%202021-08-27.mp3'
  },

  {
    id: 'sc_0008',
    title: 'Bogowie nie krwawią',
    artist: 'ReTo, Białas',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/DRUGA%20TURA/Bogowie%20nie%20krwawi%C4%85%20ReTo%202023-02-24.mp3'
  },

  {
    id: 'sc_0009',
    title: 'BŁĄD W SYMULACJI',
    artist: 'White Widow, Pako',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/DRUGA%20TURA/B%C5%81%C4%84D%20W%20SYMULACJI%20White%20Widow%202022-10-28.mp3'
  },
  
  {
    id: 'sc_0010',
    title: 'COOKIN UP',
    artist: 'White Widow',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/DRUGA%20TURA/COOKIN%20UP%20White%20Widow%202022-10-28.mp3'
  },

  {
    id: 'sc_0011',
    title: 'Comme Des Garçons',
    artist: 'Chivas',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/DRUGA%20TURA/Comme%20Des%20Gar%C3%A7ons%20Chivas%202021-05-21.mp3'
  },

  {
    id: 'sc_0012',
    title: 'Droga krzyżowa',
    artist: 'Kabe, Miszel',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/DRUGA%20TURA/Droga%20krzy%C5%BCowa%20Kabe%202022-12-30.mp3'
  },

  {
    id: 'sc_0013',
    title: 'Faka',
    artist: 'Mata',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/DRUGA%20TURA/Faka%20Mata%202021-10-01.mp3'
  },

  {
    id: 'sc_0014',
    title: 'Frugo',
    artist: 'Diho',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/DRUGA%20TURA/Frugo%20Diho%202019-01-28.mp3'
  },

  {
    id: 'sc_0015',
    title: 'GO!',
    artist: 'Rusina',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/DRUGA%20TURA/GO!%20Rusina%202022-04-28.mp3'
  },

  {
    id: 'sc_0016',
    title: 'GTA',
    artist: 'ReTo',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/DRUGA%20TURA/GTA%20ReTo%202023-02-24.mp3'
  },

  {
    id: 'sc_0017',
    title: 'God Mode',
    artist: 'Żabson, Malik Montana',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/DRUGA%20TURA/God%20Mode%20%C5%BBabson%202023-03-30.mp3'
  },

  {
    id: 'sc_0018',
    title: 'HIGH RIGHT NOW',
    artist: 'Zeamsone',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/DRUGA%20TURA/HIGH%20RIGHT%20NOW%20Zeamsone%202022-07-28.mp3'
  },

  {
    id: 'sc_0019',
    title: 'Jungle Boyz',
    artist: 'Malik Montana',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/DRUGA%20TURA/Jungle%20Boyz%20Malik%20Montana%202019-09-27.mp3'
  },

  {
    id: 'sc_0020',
    title: 'Flaga',
    artist: 'Chillwagon',

    type: 'file',
    src: 'flaga-chillwagon.mp3'
  },

  {
    id: 'sc_0021',
    title: 'KILLA',
    artist: 'Trill Pem, Wac Toja',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/DRUGA%20TURA/KILLA%20Trill%20Pem%202021-08-18.mp3'
  },

  {
    id: 'sc_0022',
    title: 'KWAŚNY DIESEL NIE BENZYNA',
    artist: 'matiskater, Acidstanek',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/DRUGA%20TURA/KWA%C5%9ANY%20DIESEL%20NIE%20BENZYNA%20matiskater%202021-10-29.mp3'
  },

  {
    id: 'sc_0023',
    title: 'Karate Kid',
    artist: 'Białas, Malik Montana',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/DRUGA%20TURA/Karate%20Kid%20Bia%C5%82as%202018-10-04.mp3'
  },

  {
    id: 'sc_0024',
    title: 'Koala Party',
    artist: 'Kukon, Młody Koala',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/DRUGA%20TURA/Koala%20Party%20Kukon%202022-06-23.mp3'
  },

  {
    id: 'sc_0025',
    title: 'LAXJFK',
    artist: 'Jan-Rapowanie, Kinny Zimmer',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/DRUGA%20TURA/LAXJFK%20Jan-Rapowanie%202022-03-11.mp3'
  },

  {
    id: 'sc_0026',
    title: 'London Rain',
    artist: 'Kukon, Kaz Bałagane',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/DRUGA%20TURA/London%20Rain%20Kukon%202022-06-23.mp3'
  },

  {
    id: 'sc_0027',
    title: 'Luty',
    artist: 'Otsochodzi',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/DRUGA%20TURA/Luty%20Otsochodzi%202022-08-04.mp3'
  },

  {
    id: 'sc_0028',
    title: 'Matrioszki',
    artist: 'Kukon',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/DRUGA%20TURA/Matrioszki%20Kukon%202021-08-09.mp3'
  },

  {
    id: 'sc_0029',
    title: 'Mówiłaś',
    artist: 'Young Igi',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/DRUGA%20TURA/M%C3%B3wi%C5%82a%C5%9B%20Young%20Igi%202017-10-23.mp3'
  },  

  {
    id: 'sc_0030',
    title: 'OMDB',
    artist: 'Malik Montana, Szamz',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/DRUGA%20TURA/OMDB%20Malik%20Montana%202023-03-10.mp3'
  },  

  {
    id: 'sc_0031',
    title: 'Oh No!',
    artist: 'Hodak',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/DRUGA%20TURA/Oh%20No!%20Hodak%202021-06-10.mp3'
  },  

  {
    id: 'sc_0032',
    title: 'Omerta',
    artist: 'Hodak, Avi',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/DRUGA%20TURA/Omerta%20Hodak%202020-03-05.mp3'
  },  

  {
    id: 'sc_0033',
    title: 'Owboy',
    artist: 'ReTo',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/DRUGA%20TURA/Owboy%20ReTo%202023-02-24.mp3'
  },  

  {
    id: 'sc_0034',
    title: 'POL Smoke',
    artist: 'Taco Hemingway',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/DRUGA%20TURA/POL%20Smoke%20Taco%20Hemingway%202020-08-28.mp3'
  },  

  {
    id: 'sc_0035',
    title: 'POLAND REMIX',
    artist: 'Young Multi',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/DRUGA%20TURA/POLAND%20REMIX%20Young%20Multi%202022-11-10.mp3'
  },  

  {
    id: 'sc_0036',
    title: 'Paczkomat',
    artist: 'Otsochodzi, Pako, Szopeen',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/DRUGA%20TURA/Paczkomat%20Otsochodzi%202022-08-04.mp3'
  },  

  {
    id: 'sc_0037',
    title: 'Palenie Zabija',
    artist: 'Chivas',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/DRUGA%20TURA/Palenie%20Zabija%20Chivas%202021-05-20.mp3'
  },  

  {
    id: 'sc_0038',
    title: 'Palm Angels',
    artist: 'Zeamsone',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/DRUGA%20TURA/Palm%20Angels%20Zeamsone%202022-07-28.mp3'
  },  

  {
    id: 'sc_0039',
    title: 'Panta Rhei',
    artist: 'ReTo',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/DRUGA%20TURA/Panta%20Rhei%20ReTo%202023-02-24.mp3'
  },  

  {
    id: 'sc_0040',
    title: 'Mów',
    artist: 'Otsochodzi',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/1/M%C3%B3w.mp3'
  },  

  {
    id: 'sc_0041',
    title: 'Prawdziwy trap',
    artist: 'Białas, Lanek',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/DRUGA%20TURA/Prawdziwy%20trap%20Bia%C5%82as%202018-10-05.mp3'
  },  

  {
    id: 'sc_0042',
    title: 'Prometazyna',
    artist: 'SB Maffija',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/DRUGA%20TURA/Prometazyna%20SB%20Maffija%202022-01-28.mp3'
  },  

  {
    id: 'sc_0043',
    title: 'Pumba ',
    artist: 'ReTo, Kaz Bałagane, Kabe',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/DRUGA%20TURA/Pumba%20ReTo%202023-02-24.mp3'
  },  

    {
    id: 'sc_0044',
    title: 'RIDE WITH MY BOYS',
    artist: 'White Widow',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/DRUGA%20TURA/RIDE%20WITH%20MY%20BOYS%20White%20Widow%202022-10-28.mp3'
  },  

  {
    id: 'sc_0045',
    title: 'STILO',
    artist: 'matiskater',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/DRUGA%20TURA/STILO%20matiskater%202021-01-04.mp3'
  },  

  {
    id: 'sc_0046',
    title: 'Sheraton Kopenhaga',
    artist: 'Kukon',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/DRUGA%20TURA/Sheraton%20Kopenhaga%20Kukon%202020-12-25.mp3'
  },  

  {
    id: 'sc_0047',
    title: 'Sonic Skit',
    artist: 'OKI',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/DRUGA%20TURA/Sonic%20Skit%20OKI%202022-06-09.mp3'
  },  

  {
    id: 'sc_0048',
    title: 'TERAZ ALBO NIGDY',
    artist: '2115, Young Multi',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/DRUGA%20TURA/TERAZ%20ALBO%20NIGDY%202115%202022-12-16.mp3'
  },  

  {
    id: 'sc_0049',
    title: 'Teleport',
    artist: 'Janusz Walczuk, Waima, Premixm, Diffi, Xad, yezusslime',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/DRUGA%20TURA/Teleport%20Janusz%20Walczuk%202023-01-27.mp3'
  },  

  {
    id: 'sc_0050',
    title: 'Trap II',
    artist: 'Young Multi',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/DRUGA%20TURA/Trap%20II%20Young%20Multi%202018-11-23.mp3'
  },  

  {
    id: 'sc_0051',
    title: 'Trash',
    artist: 'Chivas',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/DRUGA%20TURA/Trash%20Chivas%202019-09-30.mp3'
  },  

  {
    id: 'sc_0052',
    title: '8 Kobiet',
    artist: 'Taconafide, Taco Hemingway, Quebonafide',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/SOMA05/8%20kobiet%20TACONAFIDE%202018-04-13.mp3'
  },  

  {
    id: 'sc_0053',
    title: 'Art-B',
    artist: 'Taconafide, Taco Hemingway, Quebonafide',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/SOMA05/Art-B%20TACONAFIDE%202018-04-13.mp3'
  },  

  {
    id: 'sc_0054',
    title: 'Ekodiesel',
    artist: 'Taconafide, Taco Hemingway, Quebonafide',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/SOMA05/Ekodiesel%20TACONAFIDE%202018-04-13.mp3'
  },  

  {
    id: 'sc_0055',
    title: 'Tesla Sport Carbon',
    artist: 'Żabson',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/DRUGA%20TURA/Tesla%20Sport%20Carbon%20%C5%BBabson%202023-03-30.mp3'
  },  

  {
    id: 'sc_0056',
    title: 'Giro d’Italia',
    artist: 'Taconafide, Taco Hemingway, Quebonafide',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/SOMA05/Giro%20d%E2%80%99Italia%20TACONAFIDE%202018-04-13.mp3'
  },  

  {
    id: 'sc_0057',
    title: 'Metallica 808',
    artist: 'Taconafide, Taco Hemingway, Quebonafide',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/SOMA05/Metallica%20808%20TACONAFIDE%202018-04-13.mp3'
  },  

  {
    id: 'sc_0058',
    title: 'Mleko & miód',
    artist: 'Taconafide, Taco Hemingway, Quebonafide',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/SOMA05/Mleko%20%26%20mi%C3%B3d%20TACONAFIDE%202018-04-13.mp3'
  }, 

    {
    id: 'sc_0059',
    title: 'Tamagotchi',
    artist: 'Taconafide, Taco Hemingway, Quebonafide',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/SOMA05/Tamagotchi%20TACONAFIDE%202018-04-13.mp3'
  },  

  {
    id: 'sc_0060',
    title: 'KURWY CHCĄ SENTO',
    artist: 'Sentino, Popek',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/ZL5/KURWY%20CHC%C4%84%20SENTO.mp3'
  },  

  {
    id: 'sc_0061',
    title: 'Supersize',
    artist: 'Żabson, Kronkel Dom',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/DRUGA%20TURA/Supersize%20%C5%BBabson%202023-03-30.mp3'
  },  

  {
    id: 'sc_0062',
    title: 'FANTASTYCZNY',
    artist: 'Sentino',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/ZL5/FANTASTYCZNY%20Sentino%202026-03-11.mp3'
  },  

  {
    id: 'sc_0063',
    title: 'PENTHOUSE 2',
    artist: 'Sentino, Koneser',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/ZL5/PENTHOUSE%202%20Sentino%202026-03-11.mp3'
  },  

  {
    id: 'sc_0064',
    title: 'WAWA022',
    artist: 'Sentino, Diho',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/ZL5/WAWA022%20Sentino%202026-03-11.mp3'
  },  

  {
    id: 'sc_0065',
    title: 'OSTATNI RAZ',
    artist: 'Sentino, Kaz Bałagane',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/ZL5/OSTATNI%20RAZ%20Sentino%202026-03-11.mp3'
  },  

  {
    id: 'sc_0066',
    title: '05:05',
    artist: 'Bedoes 2115, Kubi Producent',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/05_05.mp3'
  },  

  {
    id: 'sc_0067',
    title: 'Baba Hassan',
    artist: 'PUSHER, OSKA030',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/Baba%20Hassan.mp3'
  },  

  {
    id: 'sc_0068',
    title: 'ASPARTAM',
    artist: 'Quebonafide, Mata',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/ASPARTAM_spotdown.org.mp3'
  },  

  {
    id: 'sc_0069',
    title: 'BEEF',
    artist: 'White Widow',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/BEEF.mp3'
  },  

  {
    id: 'sc_0070',
    title: 'Bez Zarzutów',
    artist: 'Hodak, schafter',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/Bez%20Zarzut%C3%B3w.mp3'
  },  

  {
    id: 'sc_0071',
    title: 'Będę Prezydentem',
    artist: 'Mata',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/B%C4%98D%C4%98%20PREZYDENTEM%20_)_spotdown.org.mp3'
  },  

  {
    id: 'sc_0072',
    title: 'California',
    artist: 'White 2115',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/California.mp3'
  },  

  {
    id: 'sc_0073',
    title: 'Euforia',
    artist: 'Otsochodzi',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/Euforia.mp3'
  }, 

    {
    id: 'sc_0074',
    title: 'FREAKY',
    artist: 'Mata, Fagata',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/FREAKY_spotdown.org.mp3'
  },  

  {
    id: 'sc_0075',
    title: 'NIE CHCĘ WRACAĆ',
    artist: 'Fukaj, Hubert.',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/NIE%20CHC%C4%98%20WRACA%C4%86_spotdown.org.mp3'
  },  

  {
    id: 'sc_0076',
    title: 'Floyd Mayweather',
    artist: 'Żabson',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/Floyd%20Mayweather.mp3'
  },  

  {
    id: 'sc_0077',
    title: 'GOMBAO 33',
    artist: 'Mata, Wyguś, Szczepan, Adam',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/GOMBAO%2033_spotdown.org.mp3'
  },  

  {
    id: 'sc_0078',
    title: 'Głowa rodziny',
    artist: 'Białas, Lanek',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/G%C5%82owa%20rodziny.mp3'
  },  

  {
    id: 'sc_0079',
    title: 'KAMIKAZE',
    artist: 'Mata, Skolim, Khaid',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/KAMIKAZE_spotdown.org.mp3'
  },  

  {
    id: 'sc_0080',
    title: 'Kulig',
    artist: 'Kaz Bałagane',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/Kulig_spotdown.org.mp3'
  },  

  {
    id: 'sc_0081',
    title: 'Mówili',
    artist: 'Malik Montana',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/1/M%C3%93WILI.mp3'
  },  

  {
    id: 'sc_0082',
    title: 'NICKI',
    artist: 'Trill Pem, Wac Toja',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/NICKI.mp3'
  },  

  {
    id: 'sc_0083',
    title: 'Narcyz',
    artist: 'Chivas',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/Narcyz.mp3'
  },  

  {
    id: 'sc_0084',
    title: 'Nie ma raju bez węża',
    artist: 'SB Maffija',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/Nie%20ma%20raju%20bez%20w%C4%99%C5%BCa.mp3'
  },  

  {
    id: 'sc_0085',
    title: 'nie pytaj co brałem',
    artist: 'Alan',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/Nie%20pytaj%20co%20bra%C5%82em.mp3'
  },  

  {
    id: 'sc_0086',
    title: 'OSZUKAJ PRZEZNACZENIE',
    artist: 'yung adisz',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/OSZUKAJ%20PRZEZNACZENIE.mp3'
  },  

  {
    id: 'sc_0087',
    title: 'Palma de mallorca',
    artist: 'Mata, Żabson',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/PALMA%20DE%20MALLORCA_spotdown.org.mp3'
  },  

  {
    id: 'sc_0088',
    title: 'Sam',
    artist: 'Waima',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/Sam.mp3'
  }, 

    {
    id: 'sc_0089',
    title: 'San Andreas',
    artist: 'Zeamsone',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/San%20Andreas.mp3'
  },  

  {
    id: 'sc_0090',
    title: 'Schodki',
    artist: 'Mata',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/Schodki_spotdown.org.mp3'
  },  

  {
    id: 'sc_0091',
    title: 'Sexoholik',
    artist: 'Żabson',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/Sexoholik.mp3'
  },  

  {
    id: 'sc_0092',
    title: 'Szafir',
    artist: 'Mata',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/Szafir_spotdown.org.mp3'
  },  

  {
    id: 'sc_0093',
    title: 'Szmata',
    artist: 'Mata',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/Szmata_spotdown.org.mp3'
  },  

  {
    id: 'sc_0094',
    title: 'Tarcho Terror',
    artist: 'Otsochodzi',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/Tarcho%20Terror.mp3'
  },  

  {
    id: 'sc_0095',
    title: 'Trójkat Bermudzki',
    artist: 'Sentino, Nitro, MASNY BEN',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/Tr%C3%B3jk%C4%85t%20Bermudzki.mp3'
  },  

  {
    id: 'sc_0096',
    title: 'UA',
    artist: 'ReTo',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/UA.mp3'
  },  

  {
    id: 'sc_0097',
    title: 'Wiking',
    artist: 'Sarius',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/Wiking.mp3'
  },  

  {
    id: 'sc_0098',
    title: 'candy.doll',
    artist: 'schafter',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/candy.doll.mp3'
  },  

  {
    id: 'sc_0099',
    title: 'dopóki się nie znüdzisz',
    artist: 'MIÜ, Zalia',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/dop%C3%B3ki%20si%C4%99%20nie%20zn%C3%BCdzisz_spotdown.org.mp3'
  },  

  {
    id: 'sc_0100',
    title: 'ŚWIATTOMÓJPLACZABAW',
    artist: 'Quebonafide, Sentino',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/%C5%9AWIATTOM%C3%93JPLACZABAW.mp3'
  },  

  {
    id: 'sc_0101',
    title: 'Ona Mówi',
    artist: '730 Huncho, Malik Montana, Kazior',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/1/Ona%20M%C3%B3wi.mp3'
  },  

  {
    id: 'sc_0102',
    title: 'Ty Teraz Dzwonisz (2:02)',
    artist: '730 Huncho, Moskal SQU, 730purp',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/1/Ty%20Teraz%20Dzwonisz%20(2_02).mp3'
  },  

  {
    id: 'sc_0103',
    title: '„Tak to leciało!”',
    artist: 'Otsochodzi, Taco Hemingway',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/1/%E2%80%9ETak%20to%20lecia%C5%82o!%E2%80%9D.mp3'
  },  

  {
    id: 'sc_0104',
    title: '1DAY IN LA',
    artist: 'francis, bambi, OKI',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/1/1DAY%20IN%20LA.mp3'
  },    

  {
    id: 'sc_0105',
    title: '300 BANIEK',
    artist: 'Otsochodzi, OKI',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/1/300%20BANIEK.mp3'
  },  

  {
    id: 'sc_0106',
    title: '911',
    artist: 'Malik Montana, OG ENZO',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/1/911.mp3'
  },  

  {
    id: 'sc_0107',
    title: '1998 (mam to we krwi)',
    artist: 'Bedoes 2115, Lanek',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/1/1998%20(mam%20to%20we%20krwi).mp3'
  },  

  {
    id: 'sc_0108',
    title: 'AMG',
    artist: 'Avi, Louis Villain',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/1/AMG.mp3'
  },  

  {
    id: 'sc_0109',
    title: 'Apollo',
    artist: 'Avi, Louis Villain, Sarius',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/1/Apollo.mp3'
  },  

  {
    id: 'sc_0110',
    title: 'Atlanta',
    artist: 'Aleshen',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/1/Atlanta.mp3'
  },  

  {
    id: 'sc_0111',
    title: 'Belly Dance',
    artist: 'Malik Montana',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/1/Belly%20Dance.mp3'
  },  

  {
    id: 'sc_0112',
    title: 'BFF',
    artist: 'bambi, Young Leosia, PG$',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/1/BFF.mp3'
  },  

  {
    id: 'sc_0113',
    title: 'Błoto',
    artist: 'wane',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/1/B%C5%82oto.mp3'
  },  

  {
    id: 'sc_0114',
    title: 'Bogini',
    artist: 'Quebonafide',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/1/Bogini.mp3'
  },  

  {
    id: 'sc_0115',
    title: 'Brunetki',
    artist: 'Kaz Bałagane, Smolasty',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/1/Brunetki.mp3'
  },  

  {
    id: 'sc_0116',
    title: 'CAŁE LATO',
    artist: 'Sobel',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/1/CA%C5%81E%20LATO.mp3'
  },    

  {
    id: 'sc_0117',
    title: 'CHA CHA',
    artist: 'Sobel',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/1/CHA%20CHA.mp3'
  },  

  {
    id: 'sc_0118',
    title: 'cotton candy',
    artist: 'Hubert.',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/1/cotton%20candy.mp3'
  },  

  {
    id: 'sc_0119',
    title: 'COWABONGA',
    artist: 'Żabson',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/1/COWABONGA.mp3'
  },  

  {
    id: 'sc_0120',
    title: 'Dior',
    artist: 'Malik Montana',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/1/Dior.mp3'
  },  

  {
    id: 'sc_0121',
    title: 'Dom Nad Wodą',
    artist: 'Pezet, Auer',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/1/Dom%20Nad%20Wod%C4%85.mp3'
  },  

  {
    id: 'sc_0122',
    title: 'Dr. Traphouse',
    artist: 'Kaz Bałagane, Belmondo',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/1/Dr.%20Traphouse%20(feat.%20Belmondo).mp3'
  },   

  {
    id: 'sc_0123',
    title: 'DRESSCODE',
    artist: '2115, Bedoes 2115, White 2115, Taco Hemingway, prześwit',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/1/DRESSCODE.mp3'
  },  

  {
    id: 'sc_0124',
    title: 'Drive',
    artist: 'Gibbs, Opał, Jonatan, 4Money',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/1/Drive.mp3'
  },  

  {
    id: 'sc_0125',
    title: 'Hinata',
    artist: 'Szpaku, Deemz',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/1/Hinata.mp3'
  },  

  {
    id: 'sc_0126',
    title: 'Hit Em Up',
    artist: 'Bedoes 2115',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/1/Hit%20Em%20Up.mp3'
  },  

  {
    id: 'sc_0127',
    title: 'Impreza',
    artist: 'Sobel',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/1/Impreza.mp3'
  },  

  {
    id: 'sc_0128',
    title: 'Interpol',
    artist: 'PRO8L3M',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/1/Interpol.mp3'
  },   

  {
    id: 'sc_0129',
    title: 'Jagodzianki',
    artist: 'Malik Montana, Mr. Polska',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/1/Jagodzianki.mp3'
  },  

  {
    id: 'sc_0130',
    title: 'Lloret de Mar',
    artist: 'Mata',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/1/Lloret%20de%20Mar.mp3'
  },  

  {
    id: 'sc_0131',
    title: 'LOLA',
    artist: 'Żabson',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/1/LOLA.mp3'
  },  

  {
    id: 'sc_0132',
    title: 'Miniówa',
    artist: 'Kukon',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/1/Mini%C3%B3wa.mp3'
  },  

  {
    id: 'sc_0133',
    title: 'miü miü',
    artist: 'MIÜ, Koder, 6YNTHMANE',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/1/mi%C3%BC%20mi%C3%BC.mp3'
  },  

  {
    id: 'sc_0134',
    title: 'Miyabi',
    artist: 'PRO8L3M',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/1/Miyabi.mp3'
  },   

  {
    id: 'sc_0135',
    title: 'Młody Manson',
    artist: 'Young Multi, Szpaku, Kubi Producent, Lucassi',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/1/M%C5%82ody%20Manson.mp3'
  },  

  {
    id: 'sc_0136',
    title: 'Molly',
    artist: 'PRO8L3M',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/1/Molly.mp3'
  },  

  {
    id: 'sc_0137',
    title: 'Multisport',
    artist: 'Kaz Bałagane. Oskar83, clearmind, Worek',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/1/Multisport.mp3'
  },  

  {
    id: 'sc_0138',
    title: 'Nicea',
    artist: 'PRO8L3M',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/1/Nicea.mp3'
  },  

  {
    id: 'sc_0139',
    title: 'NORADRENALINA',
    artist: 'Quebonafide, Sobel, Duit',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/1/NORADRENALINA.mp3'
  },  

  {
    id: 'sc_0140',
    title: 'Papierosy',
    artist: 'ReTo, SecretRank',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/1/Papierosy.mp3'
  },
  
  {
    id: 'sc_0141',
    title: 'Patolove',
    artist: 'Zdechły Osa',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/1/Patolove.mp3'
  },  

  {
    id: 'sc_0142',
    title: 'Plaster',
    artist: 'Szpaku Deemz',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/1/Plaster.mp3'
  },  

  {
    id: 'sc_0143',
    title: 'Prawie straciłem głos',
    artist: 'Chivas',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/1/Prawie%20straci%C5%82em%20g%C5%82os.mp3'
  },  

  {
    id: 'sc_0144',
    title: 'Przester',
    artist: 'Young Leosia, bambi, PG$, francis',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/1/Przester.mp3'
  },  

  {
    id: 'sc_0145',
    title: 'Przypadkiem',
    artist: 'OKI, Young Igi, Otsochodzi, OIO, Michał Anioł',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/1/Przypadkiem.mp3'
  },  

  {
    id: 'sc_0146',
    title: 'SEXTAPE',
    artist: 'Sobel, OKI, Deemz, Magiera, PSR',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/1/SEXTAPE.mp3'
  },     

  {
    id: 'sc_0147',
    title: 'Sophia Loren',
    artist: 'Tymek, Urbański, Tymoteusz',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/1/Sophia%20Loren.mp3'
  },   

  {
    id: 'sc_0148',
    title: 'taki mały ja',
    artist: 'kuqe 2115, francis',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/1/taki%20ma%C5%82y%20ja.mp3'
  },   

  {
    id: 'sc_0149',
    title: 'Tenten',
    artist: 'Wenext, Młody West, wane, Okekel',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/1/Tenten.mp3'
  },   

  {
    id: 'sc_0150',
    title: 'up! up! up!',
    artist: 'Mata',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/1/up!%20up!%20up!.mp3'
  },   

  {
    id: 'sc_0151',
    title: 'VHS',
    artist: 'PRO8L3M',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/1/VHS.mp3'
  },   

  {
    id: 'sc_0152',
    title: 'W GORĄCEJ WODZIE COMPANY',
    artist: 'rów babicze',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/1/W%20GOR%C4%84CEJ%20WODZIE%20COMPANY.mp3'
  },   

  {
    id: 'sc_0153',
    title: 'Woda Księżycowa',
    artist: 'Kubi Producent, bambi, Fukaj, stickxr',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/1/Woda%20Ksi%C4%99%C5%BCycowa.mp3'
  },   

  {
    id: 'sc_0154',
    title: 'Wschód (lubię zapierdalać)',
    artist: 'Bedoes 2115, Lanek, Kosa, White 2115',

    type: 'url',
    src: 'https://pub-8247d6c452064a33b8f98ab2cc36e7e1.r2.dev/1/Wsch%C3%B3d%20(lubi%C4%99%20zapierdala%C4%87).mp3'
  },   
  
  // ── TUTAJ DODAWAJ SWOJE PIOSENKI ──
  // Wzór:
 // {
   // id: 'sc_01',
   // title: '',
   // artist: '',
   // year: 0000,
   // type: 'url',
   // src: ''
 // },  
];

// ── NIE MODYFIKUJ PONIŻEJ ──
if (typeof window !== 'undefined') {
  window.SONGS_DB = SONGS_DB;
}
