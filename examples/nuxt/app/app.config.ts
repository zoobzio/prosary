/**
 * The site's data. A message sits in it like any other field: an
 * `AppProsaryMessage` is a key — alone, or with the values its message
 * takes — checked against the contract here, where it is written: a key
 * that does not exist, or values that are not its own, fail the typecheck.
 * So does an `AppProsaryDocument` the content does not build. A component
 * resolves each message with `$t(message)` and loads each document with
 * `useDocument(path)`, in whatever locale is active.
 */

/** A section of the page: its anchor, and the label of its link. */
interface Section {
  id: string;
  title: AppProsaryMessage;
}

/** A route: its two cities, when it runs, and what it costs at least. */
interface Route {
  id: string;
  origin: AppProsaryMessage;
  destination: AppProsaryMessage;
  /** The departure, as an instant: the first night of the winter timetable. */
  departs: number;
  /** The arrival, the next morning. */
  arrives: number;
  /** How many nights a week the route runs. */
  nights: number;
  /** The seat fare, per traveller, in euros. */
  from: number;
}

/** A fare: what it is called, what it offers, and what it adds to the seat fare. */
interface Fare {
  id: "seat" | "couchette" | "cabin";
  name: AppProsaryMessage;
  about: AppProsaryMessage;
  supplement: number;
}

/**
 * The first night of the winter timetable, 4 December 2026, in UTC: every
 * route is shown for that night. The visitor's time zone turns each instant
 * into the local time they see.
 */
const night = (hour: number, minute: number, morning = false): number => {
  return Date.UTC(2026, 11, morning ? 5 : 4, hour, minute);
};

const sections: Section[] = [
  { id: "routes", title: "section.routes" },
  { id: "planner", title: "section.planner" },
  { id: "onboard", title: "section.onboard" },
  { id: "journal", title: "section.journal" },
  { id: "faq", title: "section.faq" },
  { id: "story", title: "section.story" },
];

const routes: [Route, ...Route[]] = [
  {
    id: "paris-vienna",
    origin: "city.paris",
    destination: "city.vienna",
    departs: night(18, 40),
    arrives: night(7, 20, true),
    nights: 7,
    from: 49,
  },
  {
    id: "munich-rome",
    origin: "city.munich",
    destination: "city.rome",
    departs: night(19, 10),
    arrives: night(8, 5, true),
    nights: 6,
    from: 39,
  },
  {
    id: "amsterdam-zurich",
    origin: "city.amsterdam",
    destination: "city.zurich",
    departs: night(20, 0),
    arrives: night(7, 40, true),
    nights: 3,
    from: 59,
  },
  {
    id: "berlin-stockholm",
    origin: "city.berlin",
    destination: "city.stockholm",
    departs: night(17, 30),
    arrives: night(9, 15, true),
    nights: 4,
    from: 69,
  },
];

const fares: [Fare, ...Fare[]] = [
  {
    id: "seat",
    name: "fare.seat.name",
    about: "fare.seat.about",
    supplement: 0,
  },
  {
    id: "couchette",
    name: "fare.couchette.name",
    about: "fare.couchette.about",
    supplement: 30,
  },
  {
    id: "cabin",
    name: "fare.cabin.name",
    about: "fare.cabin.about",
    supplement: 90,
  },
];

/** The journal, newest first: each post a content document. */
const posts: AppProsaryDocument[] = [
  "journal/2026-10-09-bikes.md",
  "journal/2026-10-02-winter-timetable.md",
  "journal/2026-09-18-berlin-stockholm.md",
];

/** The network in figures, as the strip under the hero shows them. */
const network = { cities: 8, track: 4800, travellers: 1_240_000 };

/**
 * The countries the trains run through, as region codes: the runtime names
 * them in the visitor's language.
 */
const countries = ["FR", "AT", "DE", "IT", "NL", "CH", "SE"];

/** The time zones the visitor can read the timetable in. */
const zones = [
  "Europe/Paris",
  "Europe/London",
  "Europe/Stockholm",
  "America/New_York",
  "Asia/Tokyo",
  "UTC",
];

export default defineAppConfig({
  sections,
  routes,
  fares,
  posts,
  network,
  countries,
  zones,
});
