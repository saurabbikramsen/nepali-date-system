/**
 * Historical dates recorded in both calendars, or as a BS date with the weekday written
 * on the original document. None of these come from date-converter software.
 */

export interface DocumentedDate {
  bs: [year: number, month: number, day: number];
  ad: string;
  event: string;
  source: string;
}

export type Weekday =
  "Sunday" | "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday";

export interface WeekdayRecord {
  bs: [year: number, month: number, day: number];
  weekday: Weekday;
  event: string;
  source: string;
}

/** Events whose sources state both the BS and the AD date. */
export const DOCUMENTED_DATES: readonly DocumentedDate[] = [
  {
    bs: [1977, 2, 30],
    ad: "1920-06-11",
    event: "Birth of King Mahendra",
    source: "https://ne.wikipedia.org/wiki/महेन्द्र_वीर_विक्रम_शाह",
  },
  {
    bs: [1977, 3, 25],
    ad: "1920-07-08",
    event: "Chandra Shumsher's law abolishing Sati (Muluki Ain amendment)",
    source: "https://ne.wikipedia.org/wiki/चन्द्र_शमशेर_जङ्गबहादुर_राणा",
  },
  {
    bs: [1980, 9, 6],
    ad: "1923-12-21",
    event: "Nepal–Britain Treaty of Friendship signed at Singha Durbar",
    source: "https://en.wikipedia.org/wiki/Nepal%E2%80%93Britain_Treaty_of_1923",
  },
  {
    bs: [1989, 5, 17],
    ad: "1932-09-01",
    event: "Death of PM Bhim Shumsher; Juddha Shumsher becomes PM",
    source: "https://ne.wikipedia.org/wiki/भीम_शमशेर_जङ्गबहादुर_राणा",
  },
  {
    bs: [1990, 10, 2],
    ad: "1934-01-15",
    event: "Great Nepal–Bihar earthquake ('90 saal ko bhuichalo')",
    source: "https://nepalitimes.com/earthquake-coming",
  },
  {
    bs: [1994, 7, 30],
    ad: "1937-11-15",
    event: "Nepal Bank Limited, Nepal's first bank, established",
    source: "https://nepalbank.com.np/nbl-in-brief",
  },
  {
    bs: [1996, 6, 18],
    ad: "1939-10-04",
    event: "Birth of singer Narayan Gopal",
    source: "https://en.wikipedia.org/wiki/Narayan_Gopal",
  },
  {
    bs: [2002, 9, 14],
    ad: "1945-12-28",
    event: "Birth of King Birendra",
    source: "https://www.collegenp.com/biography/king-birendra-bir-bikram-shah-biography",
  },
  {
    bs: [2004, 3, 23],
    ad: "1947-07-07",
    event: "Birth of King Gyanendra",
    source:
      "https://ne.wikipedia.org/wiki/ज्ञानेन्द्र_वीर_विक्रम_शाह + https://www.britannica.com/biography/Gyanendra",
  },
  {
    bs: [2006, 1, 10],
    ad: "1949-04-22",
    event: "Communist Party of Nepal founded in Calcutta",
    source:
      "https://english.ratopati.com/story/71513/why-was-pushpalal-the-founding-general-secretary-of-the-nepal-communist-party-removed-in-2008",
  },
  {
    bs: [2007, 7, 21],
    ad: "1950-11-06",
    event: "King Tribhuvan takes refuge in the Indian Embassy",
    source: "https://www.collegenp.com/biography/tribhuvan-bir-bikram-shah",
  },
  {
    bs: [2007, 11, 1],
    ad: "1951-02-12",
    event: "Delhi Agreement (Tribhuvan–Rana–Congress)",
    source: "https://ne.wikipedia.org/wiki/त्रिभुवन_वीर_विक्रम_शाह",
  },
  {
    bs: [2007, 11, 4],
    ad: "1951-02-15",
    event: "King Tribhuvan and Congress leaders return to Kathmandu",
    source:
      "https://aawaajnews.com/?p=6624 + https://en.wikipedia.org/wiki/1950%E2%80%931951_Nepalese_revolution",
  },
  {
    bs: [2007, 11, 7],
    ad: "1951-02-18",
    event: "Royal proclamation of democracy (Democracy Day)",
    source:
      "https://kathmandupost.com/visual-stories/2025/02/19/democracy-day-celebrated-at-tundikhel",
  },
  {
    bs: [2007, 12, 20],
    ad: "1951-04-02",
    event: "Radio Nepal begins broadcasting",
    source: "https://radionepal.gov.np/en/?p=66",
  },
  {
    bs: [2007, 12, 29],
    ad: "1951-04-11",
    event: "Interim Government of Nepal Act promulgated",
    source:
      "https://himalaya.socanth.cam.ac.uk/collections/rarebooks/downloads/Nepal_1951_Interim_Government_Act_English.pdf",
  },
  {
    bs: [2011, 1, 1],
    ad: "1954-04-13",
    event: "Nepal 'Map series' postage stamps issued",
    source:
      "https://himalaya.socanth.cam.ac.uk/collections/journals/postalhimal/pdf/PH_2005_002.pdf",
  },
  {
    bs: [2011, 11, 30],
    ad: "1955-03-13",
    event: "Death of King Tribhuvan in Zurich",
    source: "https://www.collegenp.com/biography/tribhuvan-bir-bikram-shah",
  },
  {
    bs: [2011, 12, 1],
    ad: "1955-03-14",
    event: "King Mahendra ascends the throne",
    source:
      "https://ne.wikipedia.org/wiki/महेन्द्र_वीर_विक्रम_शाह + https://en.himalpress.com/king-tribhuvans-final-journey-from-zurich/",
  },
  {
    bs: [2013, 1, 14],
    ad: "1956-04-26",
    event: "Nepal Rastra Bank established",
    source: "https://en.wikipedia.org/wiki/Nepal_Rastra_Bank",
  },
  {
    bs: [2013, 2, 8],
    ad: "1956-05-21",
    event: "Supreme Court of Nepal established",
    source: "https://supremecourt.gov.np/web/eng/faq",
  },
  {
    bs: [2013, 7, 15],
    ad: "1956-10-31",
    event: "Royal seal on Regional Development Plans (Implementation) Act, 2013",
    source: "https://www.lawcommission.gov.np/en/?cat=298",
  },
  {
    bs: [2014, 4, 7],
    ad: "1957-07-22",
    event: "Currency Circulation Act, 2014 published in Nepal Gazette",
    source: "https://lawcommission.gov.np/en/?p=11843",
  },
  {
    bs: [2016, 3, 11],
    ad: "1959-06-25",
    event: "Tribhuvan University established",
    source: "https://en.wikipedia.org/wiki/Tribhuvan_University",
  },
  {
    bs: [2016, 5, 29],
    ad: "1959-09-14",
    event: "Death of poet Laxmi Prasad Devkota",
    source:
      "https://ne.wikipedia.org/wiki/लक्ष्मीप्रसाद_देवकोटा + https://istampgallery.com/lakshmi-prasad-devkota/",
  },
  {
    bs: [2017, 9, 1],
    ad: "1960-12-15",
    event: "King Mahendra's royal coup dismisses the B.P. Koirala government",
    source: "https://en.wikipedia.org/wiki/Panchayat_(Nepal)",
  },
  {
    bs: [2017, 9, 22],
    ad: "1961-01-05",
    event: "Panchayat system introduced",
    source: "https://en.wikipedia.org/wiki/Panchayat_(Nepal)",
  },
  {
    bs: [2017, 12, 27],
    ad: "1961-04-09",
    event: "Rajya Rajauta (Petty States and Rulers) Act, 2017 authenticated",
    source: "https://www.lawcommission.gov.np/en/?cat=298",
  },
  {
    bs: [2019, 12, 30],
    ad: "1963-04-12",
    event: "State Principality (Amendment) Act, 2019 authenticated",
    source: "https://www.lawcommission.gov.np/en/?cat=298",
  },
  {
    bs: [2020, 5, 19],
    ad: "1963-09-04",
    event: "Nepal Red Cross Society founded",
    source: "https://risingnepaldaily.com/news/86098",
  },
  {
    bs: [2020, 11, 16],
    ad: "1964-02-28",
    event: "Some Nepal Laws (Amendment and Remanagement) Act, 2020 authenticated",
    source: "https://www.lawcommission.gov.np/en/?cat=296",
  },
  {
    bs: [2022, 5, 14],
    ad: "1965-08-30",
    event: "Patent, Design and Trade Mark Act, 2022 authenticated",
    source: "https://www.wipo.int/wipolex/en/legislation/details/7234",
  },
  {
    bs: [2022, 10, 10],
    ad: "1966-01-23",
    event: "Rastriya Banijya Bank established",
    source: "https://en.wikipedia.org/wiki/Rastriya_Banijya_Bank",
  },
  {
    bs: [2025, 2, 29],
    ad: "1968-06-11",
    event: "Stamp for King Mahendra's birthday issued",
    source: "https://istampgallery.com/king-mahendras-49th-birthday/",
  },
  {
    bs: [2027, 10, 13],
    ad: "1971-01-26",
    event: "'Shree Harihar' stamp issued",
    source: "https://istampgallery.com/shree-harihar/",
  },
  {
    bs: [2028, 2, 28],
    ad: "1971-06-11",
    event: "Stamp for King Mahendra's 52nd birthday issued",
    source: "https://istampgallery.com/king-mahendras-52nd-birthday/",
  },
  {
    bs: [2028, 10, 17],
    ad: "1972-01-31",
    event: "Death of King Mahendra; accession of Birendra",
    source: "https://www.collegenp.com/biography/king-birendra-bir-bikram-shah-biography",
  },
  {
    bs: [2030, 11, 7],
    ad: "1974-02-18",
    event: "'National Anthem' stamp issued (Democracy Day)",
    source: "https://istampgallery.com/national-anthem/",
  },
  {
    bs: [2031, 11, 12],
    ad: "1975-02-24",
    event: "Coronation of King Birendra",
    source: "https://www.collegenp.com/biography/king-birendra-bir-bikram-shah-biography",
  },
  {
    bs: [2033, 9, 16],
    ad: "1976-12-30",
    event: "B.P. Koirala returns from exile (National Reconciliation Day)",
    source: "https://www.collegenp.com/biography/bp-koirala-biography",
  },
  {
    bs: [2033, 11, 7],
    ad: "1977-02-18",
    event: "'Kaji Amar Singh Thapa' stamp issued",
    source: "https://istampgallery.com/kaji-amar-singh-thapa/",
  },
  {
    bs: [2034, 9, 13],
    ad: "1977-12-28",
    event: "Stamp for King Birendra's 33rd birthday issued",
    source: "https://istampgallery.com/king-birendras-33rd-birthday/",
  },
  {
    bs: [2035, 1, 1],
    ad: "1978-04-14",
    event: "'Nepalese Postal Service' stamp issued (New Year)",
    source: "https://istampgallery.com/nepalese-postal-service/",
  },
  {
    bs: [2035, 2, 16],
    ad: "1978-05-29",
    event: "Stamp for 25th anniversary of first Everest ascent issued",
    source: "https://istampgallery.com/first-ascent-of-mt-everest/",
  },
  {
    bs: [2035, 9, 13],
    ad: "1978-12-28",
    event: "Stamp for King Birendra's 34th birthday issued",
    source: "https://istampgallery.com/king-birendras-34th-birthday/",
  },
  {
    bs: [2036, 1, 29],
    ad: "1979-05-12",
    event: "'Lumbini Year 1979' stamp issued",
    source: "https://istampgallery.com/lumbini-year-1979/",
  },
  {
    bs: [2036, 3, 15],
    ad: "1979-06-29",
    event: "'Forest Festival' stamp issued",
    source: "https://istampgallery.com/forest-festival/",
  },
  {
    bs: [2036, 9, 13],
    ad: "1979-12-28",
    event: "Stamp for King Birendra's 35th birthday issued",
    source: "https://istampgallery.com/king-birendras-35th-birthday/",
  },
  {
    bs: [2037, 9, 14],
    ad: "1980-12-28",
    event: "Stamp for King Birendra's 36th birthday issued",
    source: "https://istampgallery.com/king-birendras-36th-birthday/",
  },
  {
    bs: [2038, 9, 12],
    ad: "1981-12-27",
    event: "'Nepal Philatelic Exhibition 1981' stamp issued",
    source: "https://istampgallery.com/nepal-philatelic-exhibition-1981",
  },
  {
    bs: [2039, 4, 6],
    ad: "1982-07-21",
    event: "Balkrishna Sama stamp issued; same day B.P. Koirala died",
    source: "https://istampgallery.com/balkrishna-sama/",
  },
  {
    bs: [2040, 9, 13],
    ad: "1983-12-28",
    event: "Stamp for King Birendra's 39th birthday issued",
    source: "https://istampgallery.com/king-birendras-39th-birthday/",
  },
  {
    bs: [2041, 10, 17],
    ad: "1985-01-30",
    event: "Nepal Television's first broadcast",
    source: "https://en.wikipedia.org/wiki/Nepal_Television",
  },
  {
    bs: [2044, 7, 1],
    ad: "1987-10-18",
    event: "First amendment to the Patent, Design and Trade Mark Act",
    source: "https://www.wipo.int/wipolex/en/legislation/details/7234",
  },
  {
    bs: [2046, 11, 7],
    ad: "1990-02-18",
    event: "People's Movement (Jana Andolan I) begins",
    source: "https://en.wikipedia.org/wiki/1990_Nepalese_revolution",
  },
  {
    bs: [2047, 7, 23],
    ad: "1990-11-09",
    event: "Constitution of the Kingdom of Nepal, 2047 promulgated",
    source: "https://www.ifes.org/sites/default/files/migrate/el00122.pdf",
  },
  {
    bs: [2047, 8, 19],
    ad: "1990-12-05",
    event: "Death of singer Narayan Gopal",
    source: "https://en.wikipedia.org/wiki/Narayan_Gopal",
  },
  {
    bs: [2048, 7, 28],
    ad: "1991-11-14",
    event: "Supreme Court Act, 2048 authenticated",
    source: "https://lawcommission.gov.np/en/?p=9708",
  },
  {
    bs: [2049, 7, 27],
    ad: "1992-11-12",
    event: "Foreign Investment and Technology Transfer Act, 2049 authenticated",
    source: "https://www.wipo.int/wipolex/en/legislation/details/7233",
  },
  {
    bs: [2050, 2, 3],
    ad: "1993-05-16",
    event: "Madan Bhandari and Jeevraj Ashrit killed at Dasdhunga",
    source: "https://nepjol.info/index.php/ProD/article/view/78563",
  },
  {
    bs: [2050, 2, 27],
    ad: "1993-06-09",
    event: "National Broadcasting Act, 2049 authenticated",
    source: "https://www.wipo.int/wipolex/en/legislation/details/13556",
  },
  {
    bs: [2052, 10, 10],
    ad: "1996-01-24",
    event: "FITTA First Amendment Act authenticated",
    source: "https://www.wipo.int/wipolex/en/legislation/details/7233",
  },
  {
    bs: [2052, 11, 1],
    ad: "1996-02-13",
    event: "Maoist 'People's War' launched",
    source:
      "https://english.ratopati.com/story/48298/three-decades-of-the-peoples-war-where-did-the-maoists-go-wrong + https://en.wikipedia.org/wiki/Nepalese_Civil_War",
  },
  {
    bs: [2052, 12, 7],
    ad: "1996-03-20",
    event: "Value Added Tax Act, 2052 royal seal",
    source: "https://nepallaws.com/?p=47607",
  },
  {
    bs: [2054, 6, 2],
    ad: "1997-09-18",
    event: "Death of Ganesh Man Singh",
    source: "https://risingnepaldaily.com/news/32620",
  },
  {
    bs: [2054, 10, 15],
    ad: "1998-01-28",
    event: "Consumer Protection Act, 2054 authenticated",
    source: "https://www.wipo.int/wipolex/en/legislation/details/13564",
  },
  {
    bs: [2055, 10, 7],
    ad: "1999-01-21",
    event: "Some Nepal Acts Amendment Act, 2055 authenticated",
    source: "https://www.wipo.int/wipolex/en/legislation/details/13564",
  },
  {
    bs: [2057, 4, 26],
    ad: "2000-08-10",
    event: "Some Nepal Laws Amendment Act, 2057 authenticated",
    source: "https://www.wipo.int/wipolex/en/legislation/details/7233",
  },
  {
    bs: [2057, 10, 18],
    ad: "2001-01-31",
    event: "Communication-related Nepal Acts (Amendment) Act authenticated",
    source: "https://www.wipo.int/wipolex/en/legislation/details/13556",
  },
  {
    bs: [2058, 2, 19],
    ad: "2001-06-01",
    event: "Narayanhiti royal massacre",
    source: "https://en.wikipedia.org/wiki/Nepalese_royal_massacre",
  },
  {
    bs: [2059, 2, 8],
    ad: "2002-05-22",
    event: "King Gyanendra dissolves the House of Representatives",
    source: "https://english.onlinekhabar.com/20th-loktantra-day-today.html",
  },
  {
    bs: [2059, 4, 30],
    ad: "2002-08-15",
    event: "Copyright Act, 2059 authenticated",
    source: "https://www.wipo.int/wipolex/en/legislation/details/7230",
  },
  {
    bs: [2063, 1, 11],
    ad: "2006-04-24",
    event: "King Gyanendra reinstates the House (Loktantra Day)",
    source: "https://english.onlinekhabar.com/20th-loktantra-day-today.html",
  },
  {
    bs: [2063, 3, 9],
    ad: "2006-06-23",
    event: "Competition Promotion and Market Protection Act authenticated",
    source: "https://www.wipo.int/wipolex/en/legislation/details/7232",
  },
  {
    bs: [2063, 8, 5],
    ad: "2006-11-21",
    event: "Comprehensive Peace Accord signed",
    source:
      "https://prabhabonline.com/detail/83605 + https://en.wikipedia.org/wiki/Comprehensive_Peace_Accord",
  },
  {
    bs: [2063, 8, 8],
    ad: "2006-11-24",
    event: "Act amending Nepal acts on export/import and IP, 2063",
    source: "https://www.wipo.int/wipolex/en/legislation/details/7234",
  },
  {
    bs: [2063, 10, 1],
    ad: "2007-01-15",
    event: "Interim Constitution of Nepal, 2063 promulgated",
    source: "https://www.wipo.int/wipolex/en/legislation/details/7236",
  },
  {
    bs: [2063, 11, 30],
    ad: "2007-03-14",
    event: "Interim Constitution First Amendment",
    source: "https://www.wipo.int/wipolex/en/legislation/details/7236",
  },
  {
    bs: [2064, 2, 30],
    ad: "2007-06-13",
    event: "Interim Constitution Second Amendment",
    source: "https://www.wipo.int/wipolex/en/legislation/details/7236",
  },
  {
    bs: [2064, 5, 9],
    ad: "2007-08-26",
    event: "Act Amending Some Nepal Acts (Competition Act amendment)",
    source: "https://www.wipo.int/wipolex/en/legislation/details/7232",
  },
  {
    bs: [2064, 9, 13],
    ad: "2007-12-28",
    event: "Interim Constitution Third Amendment",
    source: "https://www.wipo.int/wipolex/en/legislation/details/7236",
  },
  {
    bs: [2065, 2, 15],
    ad: "2008-05-28",
    event: "Constituent Assembly declares Nepal a federal democratic republic",
    source: "https://thehimalayantimes.com/nepal/republic-day-observed-nationwide-today",
  },
  {
    bs: [2065, 2, 16],
    ad: "2008-05-29",
    event: "Interim Constitution Fourth Amendment",
    source: "https://www.wipo.int/wipolex/en/legislation/details/7236",
  },
  {
    bs: [2065, 3, 29],
    ad: "2008-07-13",
    event: "Interim Constitution Fifth Amendment",
    source: "https://www.wipo.int/wipolex/en/legislation/details/7236",
  },
  {
    bs: [2065, 8, 30],
    ad: "2008-12-15",
    event: "Interim Constitution Sixth Amendment",
    source: "https://www.wipo.int/wipolex/en/legislation/details/7236",
  },
  {
    bs: [2066, 10, 7],
    ad: "2010-01-21",
    event: "Republic Strengthening and Some Nepal Laws Amendment Act",
    source: "https://www.wipo.int/wipolex/en/legislation/details/13556",
  },
  {
    bs: [2072, 1, 12],
    ad: "2015-04-25",
    event: "Gorkha earthquake",
    source:
      "https://thehimalayantimes.com/nepal/70-magnitude-earthquake-with-epicenter-in-tibet-sends-shockwaves-across-nepal",
  },
  {
    bs: [2072, 6, 3],
    ad: "2015-09-20",
    event: "Constitution of Nepal promulgated",
    source: "https://www.wipo.int/wipolex/en/legislation/details/16153",
  },
  {
    bs: [2079, 1, 18],
    ad: "2022-05-01",
    event: "International Workers' Day holiday (MoHA list 2079)",
    source: "https://narayanilawfirm.com/list-of-public-holidays-in-nepal-2079/",
  },
  {
    bs: [2079, 8, 17],
    ad: "2022-12-03",
    event: "International Day of Persons with Disabilities holiday (MoHA list 2079)",
    source: "https://narayanilawfirm.com/list-of-public-holidays-in-nepal-2079/",
  },
  {
    bs: [2079, 11, 24],
    ad: "2023-03-08",
    event: "International Women's Day holiday (MoHA list 2079)",
    source: "https://narayanilawfirm.com/list-of-public-holidays-in-nepal-2079/",
  },
  {
    bs: [2081, 1, 1],
    ad: "2024-04-13",
    event: "Nepali New Year 2081",
    source:
      "https://www.spotlightnepal.com/2024/04/13/bikram-sambat-or-vickram-sambat-2081-president-and-pm-extend-new-years-greeting/ + https://blog.educatenepal.com/2024/02/list-of-public-holidays-for-2081-bs.html",
  },
  {
    bs: [2081, 11, 15],
    ad: "2025-02-27",
    event: "MoHA publishes 2082 public-holiday notice",
    source: "https://www.pradhanlaw.com/publications/list-of-public-holidays-2082-bs-202526-ad",
  },
  {
    bs: [2082, 1, 1],
    ad: "2025-04-14",
    event: "Nepali New Year 2082",
    source: "https://www.pradhanlaw.com/publications/list-of-public-holidays-2082-bs-202526-ad",
  },
  {
    bs: [2082, 2, 15],
    ad: "2025-05-29",
    event: "Republic Day 2082",
    source: "https://www.pradhanlaw.com/publications/list-of-public-holidays-2082-bs-202526-ad",
  },
  {
    bs: [2082, 6, 3],
    ad: "2025-09-19",
    event: "Constitution Day 2082",
    source: "https://www.pradhanlaw.com/publications/list-of-public-holidays-2082-bs-202526-ad",
  },
  {
    bs: [2082, 6, 13],
    ad: "2025-09-29",
    event: "Dashain holidays begin (2082)",
    source: "https://www.pradhanlaw.com/publications/list-of-public-holidays-2082-bs-202526-ad",
  },
  {
    bs: [2082, 7, 3],
    ad: "2025-10-20",
    event: "Tihar holidays begin (2082)",
    source: "https://www.pradhanlaw.com/publications/list-of-public-holidays-2082-bs-202526-ad",
  },
  {
    bs: [2082, 10, 1],
    ad: "2026-01-15",
    event: "Maghe Sankranti 2082",
    source: "https://www.pradhanlaw.com/publications/list-of-public-holidays-2082-bs-202526-ad",
  },
  {
    bs: [2082, 11, 18],
    ad: "2026-03-02",
    event: "MoHA publishes 2083 public-holiday notice",
    source: "https://pradhanlaw.com/publications/list-of-public-holidays-2083-202627",
  },
  {
    bs: [2082, 11, 21],
    ad: "2026-03-05",
    event: "House of Representatives election after Gen Z uprising",
    source:
      "https://ekantipur.com/news/2026/03/05/en/we-fulfilled-the-duty-given-to-us-i-am-happy-today-prime-minister-karki-27-33.html",
  },
  {
    bs: [2082, 12, 13],
    ad: "2026-03-27",
    event: "Ram Nawami 2082",
    source: "https://www.pradhanlaw.com/publications/list-of-public-holidays-2082-bs-202526-ad",
  },
  {
    bs: [2083, 1, 1],
    ad: "2026-04-14",
    event: "Nepali New Year 2083",
    source: "https://pradhanlaw.com/publications/list-of-public-holidays-2083-202627",
  },
  {
    bs: [2083, 5, 23],
    ad: "2026-09-08",
    event: "First Gen Z Martyrs' Day public holiday",
    source: "https://english.onlinekhabar.com/public-holiday-gen-z-martyrs-day.html",
  },
  {
    bs: [2083, 6, 25],
    ad: "2026-10-11",
    event: "Ghatasthapana 2083",
    source: "https://pradhanlaw.com/publications/list-of-public-holidays-2083-202627",
  },
  {
    bs: [2083, 9, 27],
    ad: "2027-01-11",
    event: "Prithvi Jayanti / National Unity Day 2083",
    source: "https://pradhanlaw.com/publications/list-of-public-holidays-2083-202627",
  },
  {
    bs: [2083, 11, 7],
    ad: "2027-02-19",
    event: "National Democracy Day 2083",
    source: "https://pradhanlaw.com/publications/list-of-public-holidays-2083-202627",
  },
  {
    bs: [2083, 12, 23],
    ad: "2027-04-06",
    event: "Ghode Jatra 2083 (Kathmandu Valley)",
    source: "https://pradhanlaw.com/publications/list-of-public-holidays-2083-202627",
  },
  // Contemporary sources that settle the disputed rows for 2004 and 2062
  {
    bs: [2062, 1, 31],
    ad: "2005-05-14",
    event: 'nepalnews.com dateline "Baishakh 31 2062"',
    source:
      "https://web.archive.org/web/20050514004142/http://www.nepalnews.com:80/archive/main.htm",
  },
  {
    bs: [2062, 2, 1],
    ad: "2005-05-15",
    event: 'nepalnews.com dateline "Jestha 01 2062"',
    source:
      "https://web.archive.org/web/20050515014731/http://www.nepalnews.com:80/archive/main.htm",
  },
  {
    bs: [2062, 2, 5],
    ad: "2005-05-19",
    event: 'Kantipur Online dateline "Thursday, May 19, 2005 (Jestha 5, 2062)"',
    source: "https://web.archive.org/web/20050519163843/http://www.kantipuronline.com/",
  },
  {
    bs: [2062, 2, 6],
    ad: "2005-05-20",
    event: 'The Rising Nepal footer "May 20, 2005 · Jestha 6, 2062"',
    source: "https://web.archive.org/web/20050520110037/http://www.gorkhapatra.org.np:80/",
  },
  {
    bs: [2062, 2, 18],
    ad: "2005-06-01",
    event: 'Kantipur Online dateline "Wednesday, June 1, 2005 (Jestha 18, 2062)"',
    source: "https://web.archive.org/web/20050602000730/http://www.kantipuronline.com/",
  },
  {
    bs: [2062, 2, 30],
    ad: "2005-06-13",
    event: 'Kantipur Online dateline "Monday, June 13, 2005 (Jestha 30, 2062)"',
    source: "https://web.archive.org/web/20050614014027/http://www.kantipuronline.com/",
  },
  {
    bs: [2062, 2, 31],
    ad: "2005-06-14",
    event: 'nepalnews.com dateline "Jestha 31 2062"',
    source:
      "https://web.archive.org/web/20050614012142/http://www.nepalnews.com:80/archive/main.htm",
  },
  {
    bs: [2004, 10, 13],
    ad: "1948-01-26",
    event:
      "Padma Shumsher's speech inaugurating the Government of Nepal Act 2004 (S. B. Pant, 1974)",
    source: "https://archive.org/details/2015.476943.-constitutional-development",
  },
];

/**
 * BS dates with the weekday written on the original document ("roj 1" = Sunday).
 * The first group settles the disputed rows for 1989, 1991, 1993 and 2004.
 * Catalogue transcriptions have occasional scribal errors; 2005 Falgun 12 ("Thursday",
 * nepalica item 44571) is left out because it contradicts the astronomical month start.
 */
export const WEEKDAY_RECORDS: readonly WeekdayRecord[] = [
  // Settle the disputed rows
  {
    bs: [1989, 8, 3],
    weekday: "Friday",
    event: "Premier's executive order",
    source: "https://nepalica.hadw-bw.de/nepal/catitems/viewitem/14590",
  },
  {
    bs: [1989, 8, 5],
    weekday: "Sunday",
    event: "Premier to Gen. Mohan Shamsher",
    source: "https://nepalica.hadw-bw.de/nepal/catitems/viewitem/25521",
  },
  {
    bs: [1989, 8, 16],
    weekday: "Thursday",
    event: "Pashupati Goshwara purji",
    source: "https://nepalica.hadw-bw.de/nepal/catitems/viewitem/45578",
  },
  {
    bs: [1989, 8, 26],
    weekday: "Sunday",
    event: "Director-General of Public Instruction to the library",
    source: "https://nepalica.hadw-bw.de/nepal/catitems/viewitem/676",
  },
  {
    bs: [1989, 8, 29],
    weekday: "Wednesday",
    event: "Guthi land-records batch",
    source: "https://nepalica.hadw-bw.de/nepal/catitems/viewitem/31496",
  },
  {
    bs: [1991, 9, 8],
    weekday: "Sunday",
    event: "Mahottari revenue office",
    source: "https://nepalica.hadw-bw.de/nepal/catitems/viewitem/16309",
  },
  {
    bs: [1991, 9, 10],
    weekday: "Tuesday",
    event: "Order signed by Chandralal Pradhan (Sainik Dravya Kosh p. 44)",
    source: "https://archive.org/details/xhfe-sainik-dravya-kosh-ed-mohan-prasad-khanal-nepali-k",
  },
  {
    bs: [1991, 9, 17],
    weekday: "Tuesday",
    event: "Earthquake-damage petition",
    source: "https://nepalica.hadw-bw.de/nepal/catitems/viewitem/21393",
  },
  {
    bs: [1991, 9, 29],
    weekday: "Sunday",
    event: "Order (Sainik Dravya Kosh p. 46)",
    source: "https://archive.org/details/xhfe-sainik-dravya-kosh-ed-mohan-prasad-khanal-nepali-k",
  },
  {
    bs: [1993, 4, 3],
    weekday: "Friday",
    event: "Khadga-nishana judgment",
    source: "https://nepalica.hadw-bw.de/nepal/catitems/viewitem/66708",
  },
  {
    bs: [1993, 4, 8],
    weekday: "Wednesday",
    event: "Order (Sainik Dravya Kosh p. 96)",
    source: "https://archive.org/details/xhfe-sainik-dravya-kosh-ed-mohan-prasad-khanal-nepali-k",
  },
  {
    bs: [1993, 4, 15],
    weekday: "Wednesday",
    event: "Order (Sainik Dravya Kosh p. 351)",
    source: "https://archive.org/details/xhfe-sainik-dravya-kosh-ed-mohan-prasad-khanal-nepali-k",
  },
  {
    bs: [1993, 4, 22],
    weekday: "Wednesday",
    event: "Archival document (Abhilekh vol. 37, p. 66)",
    source:
      "https://archive.org/details/srjv_abhilekh-vol.-37-no.-37-ed-by-saubhagya-pradhanang-2019-kathmandu-pura-tattva-vi/page/n71/mode/1up",
  },
  {
    bs: [1993, 4, 28],
    weekday: "Tuesday",
    event: "Order (Sainik Dravya Kosh p. 97)",
    source: "https://archive.org/details/xhfe-sainik-dravya-kosh-ed-mohan-prasad-khanal-nepali-k",
  },
  {
    bs: [2004, 10, 11],
    weekday: "Saturday",
    event: "Sale deed quoted in Supreme Court decision NKP 1454",
    source: "https://nkp.gov.np/full_detail/5172",
  },
  {
    bs: [2004, 10, 12],
    weekday: "Sunday",
    event: "Petition quoted in Supreme Court decision NKP 566",
    source: "https://nkp.gov.np/full_detail/7561",
  },
  {
    bs: [2004, 10, 20],
    weekday: "Monday",
    event: "Deposit quoted in Supreme Court decision NKP 695",
    source: "https://nkp.gov.np/full_detail/7486",
  },
  {
    bs: [2004, 10, 22],
    weekday: "Wednesday",
    event: "Deed registration quoted in Supreme Court decision NKP 695",
    source: "https://nkp.gov.np/full_detail/7486",
  },
  // Other Rana-era documents, 1975–2008
  {
    bs: [1975, 12, 3],
    weekday: "Sunday",
    event: "Rana-era document",
    source: "https://nepalica.hadw-bw.de/nepal/catitems/viewitem/43881",
  },
  {
    bs: [1976, 1, 15],
    weekday: "Sunday",
    event: "Rana-era document",
    source: "https://nepalica.hadw-bw.de/nepal/catitems/viewitem/43883",
  },
  {
    bs: [1976, 1, 30],
    weekday: "Monday",
    event: "Rana-era document",
    source: "https://nepalica.hadw-bw.de/nepal/catitems/viewitem/44372",
  },
  {
    bs: [1977, 12, 20],
    weekday: "Friday",
    event: "Rana-era document",
    source: "https://nepalica.hadw-bw.de/nepal/catitems/viewitem/43517",
  },
  {
    bs: [1978, 4, 25],
    weekday: "Tuesday",
    event: "Rana-era document",
    source: "https://nepalica.hadw-bw.de/nepal/catitems/viewitem/43552",
  },
  {
    bs: [1978, 4, 28],
    weekday: "Friday",
    event: "Rana-era document",
    source: "https://nepalica.hadw-bw.de/nepal/catitems/viewitem/43553",
  },
  {
    bs: [1979, 9, 14],
    weekday: "Thursday",
    event: "Rana-era document",
    source: "https://nepalica.hadw-bw.de/nepal/catitems/viewitem/43501",
  },
  {
    bs: [1979, 9, 18],
    weekday: "Monday",
    event: "Rana-era document",
    source: "https://nepalica.hadw-bw.de/nepal/catitems/viewitem/43500",
  },
  {
    bs: [1980, 3, 31],
    weekday: "Sunday",
    event: "Rana-era document",
    source: "https://nepalica.hadw-bw.de/nepal/catitems/viewitem/43574",
  },
  {
    bs: [1980, 4, 32],
    weekday: "Thursday",
    event: "Rana-era document",
    source: "https://nepalica.hadw-bw.de/nepal/catitems/viewitem/43502",
  },
  {
    bs: [1980, 8, 22],
    weekday: "Friday",
    event: "Rana-era document",
    source: "https://nepalica.hadw-bw.de/nepal/catitems/viewitem/44515",
  },
  {
    bs: [1980, 12, 29],
    weekday: "Thursday",
    event: "Rana-era document",
    source: "https://nepalica.hadw-bw.de/nepal/catitems/viewitem/44523",
  },
  {
    bs: [1981, 3, 31],
    weekday: "Monday",
    event: "Rana-era document",
    source: "https://nepalica.hadw-bw.de/nepal/catitems/viewitem/43515",
  },
  {
    bs: [1981, 4, 19],
    weekday: "Saturday",
    event: "Rana-era document",
    source: "https://nepalica.hadw-bw.de/nepal/catitems/viewitem/43512",
  },
  {
    bs: [1982, 8, 6],
    weekday: "Saturday",
    event: "Rana-era document",
    source: "https://nepalica.hadw-bw.de/nepal/catitems/viewitem/43999",
  },
  {
    bs: [1982, 12, 24],
    weekday: "Tuesday",
    event: "Rana-era document",
    source: "https://nepalica.hadw-bw.de/nepal/catitems/viewitem/44011",
  },
  {
    bs: [1983, 5, 24],
    weekday: "Thursday",
    event: "Rana-era document",
    source: "https://nepalica.hadw-bw.de/nepal/catitems/viewitem/44432",
  },
  {
    bs: [1983, 5, 30],
    weekday: "Wednesday",
    event: "Rana-era document",
    source: "https://nepalica.hadw-bw.de/nepal/catitems/viewitem/44434",
  },
  {
    bs: [1984, 10, 25],
    weekday: "Tuesday",
    event: "Rana-era document",
    source: "https://nepalica.hadw-bw.de/nepal/catitems/viewitem/43817",
  },
  {
    bs: [1984, 12, 12],
    weekday: "Saturday",
    event: "Rana-era document",
    source: "https://nepalica.hadw-bw.de/nepal/catitems/viewitem/44528",
  },
  {
    bs: [1985, 1, 14],
    weekday: "Thursday",
    event: "Rana-era document",
    source: "https://nepalica.hadw-bw.de/nepal/catitems/viewitem/44620",
  },
  {
    bs: [1986, 9, 22],
    weekday: "Sunday",
    event: "Rana-era document",
    source: "https://nepalica.hadw-bw.de/nepal/catitems/viewitem/44536",
  },
  {
    bs: [1987, 12, 30],
    weekday: "Sunday",
    event: "Rana-era document",
    source: "https://nepalica.hadw-bw.de/nepal/catitems/viewitem/43704",
  },
  {
    bs: [1988, 9, 6],
    weekday: "Monday",
    event: "Rana-era document",
    source: "https://nepalica.hadw-bw.de/nepal/catitems/viewitem/44310",
  },
  {
    bs: [1991, 2, 31],
    weekday: "Wednesday",
    event: "Rana-era document",
    source: "https://nepalica.hadw-bw.de/nepal/catitems/viewitem/43874",
  },
  {
    bs: [1993, 9, 30],
    weekday: "Wednesday",
    event: "Rana-era document",
    source: "https://nepalica.hadw-bw.de/nepal/catitems/viewitem/44551",
  },
  {
    bs: [1997, 3, 27],
    weekday: "Wednesday",
    event: "Rana-era document",
    source: "https://nepalica.hadw-bw.de/nepal/catitems/viewitem/43885",
  },
  {
    bs: [1999, 7, 8],
    weekday: "Saturday",
    event: "Rana-era document",
    source: "https://nepalica.hadw-bw.de/nepal/catitems/viewitem/44443",
  },
  {
    bs: [2000, 8, 30],
    weekday: "Wednesday",
    event: "Rana-era document",
    source: "https://nepalica.hadw-bw.de/nepal/catitems/viewitem/44645",
  },
  {
    bs: [2006, 7, 23],
    weekday: "Tuesday",
    event: "Rana-era document",
    source: "https://nepalica.hadw-bw.de/nepal/catitems/viewitem/44212",
  },
  {
    bs: [2008, 12, 28],
    weekday: "Wednesday",
    event: "Rana-era document",
    source: "https://nepalica.hadw-bw.de/nepal/catitems/viewitem/44215",
  },
];
