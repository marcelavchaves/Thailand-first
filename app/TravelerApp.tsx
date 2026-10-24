"use client";
import {Handouts} from './ResourceLibrary';
import {ResourceProvider, ResourceSlot, ResourceGroup, useResources} from "./ResourceLibrary";
import DestinationOutline from './DestinationOutline';
import BrandIcon from "./BrandIcon";
import TDSuitcase from "./TDSuitcase";
import SafePlans from "./SafePlans";
import WondercaseMark from "./WondercaseMark";
import PdfDownload from "./PdfDownload";
import MemoryAttachments, {prepareMemoryFile} from './MemoryAttachments';
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { TDProvider, TDLogin, useTDSession } from "./TDSession";
import DailyTrivia from "./DailyTrivia";
import localGuidesData from "./local-guides.json";

import storytelling from "./storytelling.json";
import hotelResources from "./hotel-resources.json";
import AppRatings from './AppRatings';
import {HelpAndTutorials} from './JourneyExtras';
import useXavierPhoto from "./useXavierPhoto";
import GuestProfiles from "./GuestProfiles";
import JourneyTimeline from "./JourneyTimeline";
import DayPhoto from "./DayPhoto";
import LocalLanguageLesson from "./LocalLanguageLesson";
import LoadingIndicator from "./LoadingIndicator";
import { getJourneyStatus } from "./trip-clock";
type LocalGuide = { name: string; destination: string; days: number[]; image: string; introduction: string };
const localGuides: LocalGuide[] = [];

const travelerAlbumUrl: string = "";
const xavierPhoneDisplay = "+46 70 549 7222";
const xavierPhoneUrl = "https://wa.me/46705497222";
const xavierEmail = "xbrunelle@tauck.com";
const isBaliDay = (date: number) => [11, 12, 13, 16, 17, 18].includes(date);

import itinerary from "./itinerary.json";
import RecommendedReading from "./RecommendedReading";
import JourneyMaps from "./JourneyMaps";
import hotelList from "./hotels.json";
type Day = {
  date: number;
  title: string;
  region: string;
  image: string;
  intro: string;
  events: [string, string][];
  note: string;
  hotel: string;
  meals: string;
};
const days: Day[] = itinerary as Day[];
const hotels = hotelList;
const internalFlights: {date:number;route:string;airline:string;time:string;detail:string;duration?:string}[] = [{"date": 7, "route": "Hanoi \u2192 Da Nang", "airline": "Vietnam Airlines VN163", "time": "07:45\u201309:05", "detail": "Continue to Hue"}, {"date": 10, "route": "Da Nang \u2192 Saigon", "airline": "As provided in itinerary", "time": "08:55\u201310:25", "detail": "Continue to Cu Chi Tunnels"}, {"date": 12, "route": "Saigon \u2192 Siem Reap", "airline": "Air Cambodia K6825", "time": "12:00\u201313:15", "detail": "Cambodian immigration on arrival"}, {"date": 14, "route": "Siem Reap \u2192 Bangkok \u2192 Chiang Mai", "airline": "Thai Airways", "time": "09:50; onward 13:30", "detail": "Bangkok arrival 10:55; Chiang Mai arrival 14:45"}, {"date": 17, "route": "Chiang Mai \u2192 Bangkok", "airline": "Bangkok Airways", "time": "10:10\u201311:35", "detail": "Transfer to Rosewood Bangkok"}];
const tripDate = (d: number) => new Date(Date.UTC(2026, 10, 16 + d - 5));
const weekday = (d: number) => tripDate(d).toLocaleDateString("en-US", {weekday:"short",timeZone:"UTC"});
const shortTripDate = (d: number) => tripDate(d).toLocaleDateString("en-US", {month:"short",day:"numeric",timeZone:"UTC"});
const longTripDate = (d: number) => tripDate(d).toLocaleDateString("en-US", {weekday:"long",month:"long",day:"numeric",timeZone:"UTC"});
const tauck = (d: number) => d - 4;
type WeatherPlace = { name: string; lat: number; lon: number; typical: string };
type Forecast = {
  high: number;
  low: number;
  rain: number;
  historical?: boolean;
  code: number;
  sunrise: string;
  sunset: string;
};
const weatherPlaces: Record<number, WeatherPlace> = {
  5: {
    name: "Singapore",
    lat: 1.29,
    lon: 103.85,
    typical: "Warm and tropical with passing showers · typically 88° / 77°F",
  },
  6: {
    name: "Singapore",
    lat: 1.29,
    lon: 103.85,
    typical: "Warm and tropical with passing showers · typically 88° / 77°F",
  },
  7: {
    name: "Singapore",
    lat: 1.29,
    lon: 103.85,
    typical: "Warm and tropical with passing showers · typically 88° / 77°F",
  },
  8: {
    name: "Borobudur",
    lat: -7.61,
    lon: 110.2,
    typical: "Warm with a mix of sun and clouds · typically 88° / 70°F",
  },
  9: {
    name: "Borobudur",
    lat: -7.61,
    lon: 110.2,
    typical: "Warm with a mix of sun and clouds · typically 88° / 70°F",
  },
  10: {
    name: "Yogyakarta",
    lat: -7.8,
    lon: 110.37,
    typical: "Warm and mostly dry · typically 88° / 70°F",
  },
  11: {
    name: "Ubud",
    lat: -8.51,
    lon: 115.26,
    typical: "Warm days and comfortable evenings · typically 84° / 70°F",
  },
  12: {
    name: "Ubud",
    lat: -8.51,
    lon: 115.26,
    typical: "Warm days and comfortable evenings · typically 84° / 70°F",
  },
  13: {
    name: "Ubud",
    lat: -8.51,
    lon: 115.26,
    typical: "Warm days and comfortable evenings · typically 84° / 70°F",
  },
  14: {
    name: "Labuan Bajo",
    lat: -8.5,
    lon: 119.89,
    typical: "Sunny, warm, and dry · typically 88° / 73°F",
  },
  15: {
    name: "Rinca Island",
    lat: -8.65,
    lon: 119.72,
    typical: "Sunny, warm, and dry · typically 88° / 73°F",
  },
  16: {
    name: "Jimbaran Bay",
    lat: -8.79,
    lon: 115.16,
    typical: "Warm, breezy, and mostly dry · typically 84° / 73°F",
  },
  17: {
    name: "Jimbaran Bay",
    lat: -8.79,
    lon: 115.16,
    typical: "Warm, breezy, and mostly dry · typically 84° / 73°F",
  },
  18: {
    name: "Jimbaran Bay",
    lat: -8.79,
    lon: 115.16,
    typical: "Warm, breezy, and mostly dry · typically 84° / 73°F",
  },
};
const weatherDescription = (code: number) =>
  code === 0
    ? "Clear skies"
    : code <= 2
      ? "Mostly sunny"
      : code === 3
        ? "Cloudy"
        : code <= 48
          ? "Mist or fog"
          : code <= 57
            ? "Light drizzle"
            : code <= 67
              ? "Rain showers"
              : code <= 77
                ? "Wintry weather"
                : code <= 82
                  ? "Showers"
                  : code <= 86
                    ? "Snow showers"
                    : "Thunderstorms";
const weatherEmoji = (code: number) =>
  code === 0
    ? "☀️"
    : code <= 2
      ? "🌤️"
      : code === 3
        ? "☁️"
        : code <= 48
          ? "🌫️"
          : code <= 67
            ? "🌦️"
            : code <= 82
              ? "🌧️"
              : code <= 86
                ? "🌨️"
                : "⛈️";
const clock = (value: string) => {
  const [h, m] = value.slice(-5).split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
};
function WeatherCard({ date }: { date: number }) {
  const place = weatherPlaces[date];
  const requestedDay = new Date(`${tripDate(date).toISOString().slice(0, 10)}T12:00:00`);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const isPast = requestedDay < startOfToday;
  const [data, setData] = useState<Forecast | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "soon" | "error">(
    "loading",
  );
  useEffect(() => {
    const target = new Date(
      `${tripDate(date).toISOString().slice(0, 10)}T12:00:00`,
    );
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysAway = Math.ceil((target.getTime() - today.getTime()) / 86400000);
    if (daysAway > 16) {
      setStatus("soon");
      return;
    }
    const controller = new AbortController();
    const dateLabel = `${tripDate(date).toISOString().slice(0, 10)}`;
    const historical = daysAway < 0;
    const daily = historical
      ? "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,sunrise,sunset"
      : "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset";
    const url = historical
      ? `https://api.open-meteo.com/v1/forecast?latitude=${place.lat}&longitude=${place.lon}&daily=${daily}&temperature_unit=fahrenheit&precipitation_unit=inch&timezone=auto&past_days=31&forecast_days=1`
      : `https://api.open-meteo.com/v1/forecast?latitude=${place.lat}&longitude=${place.lon}&daily=${daily}&temperature_unit=fahrenheit&timezone=auto&start_date=${dateLabel}&end_date=${dateLabel}`;
    fetch(url, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error("Forecast unavailable");
        return r.json();
      })
      .then((j) => {
        const index = historical ? j.daily?.time?.indexOf(dateLabel) : 0;
        if (!j.daily?.time?.length || index < 0) throw new Error("Forecast unavailable");
        setData({
          high: Math.round(j.daily.temperature_2m_max[index]),
          low: Math.round(j.daily.temperature_2m_min[index]),
          rain: historical
            ? Number((j.daily.precipitation_sum[index] ?? 0).toFixed(2))
            : Math.round(j.daily.precipitation_probability_max[index] ?? 0),
          historical,
          code: j.daily.weather_code[index],
          sunrise: j.daily.sunrise[index],
          sunset: j.daily.sunset[index],
        });
        setStatus("ready");
      })
      .catch((e) => {
        if (e.name !== "AbortError")
          setStatus(daysAway > 12 ? "soon" : "error");
      });
    return () => controller.abort();
  }, [date, place.lat, place.lon]);
  const advice = data
    ? !data.historical && data.rain >= 60
      ? "Keep an umbrella close today."
      : data.high >= 88
        ? "Light clothing, water, and sun protection will help."
        : data.code <= 2
          ? "A lovely day to enjoy the outdoors."
          : "Pack a light layer and check conditions before heading out."
    : "The live forecast will replace this seasonal outlook automatically.";
  return (
    <section className="weather-card" aria-live="polite">
      <div className="weather-heading">
        <div>
          <span className="eyebrow">WEATHER · {place.name.toUpperCase()}{data?.historical ? " · RECORDED" : ""}</span>
          <h2>
            {status === "ready" && data
              ? weatherDescription(data.code)
              : isPast ? "Recorded weather unavailable" : "Forecast coming soon"}
          </h2>
        </div>
        <span className="weather-icon">
          {status === "ready" && data ? weatherEmoji(data.code) : "◌"}
        </span>
      </div>
      {status === "ready" && data ? (
        <>
          <div className="weather-temps">
            <strong>{data.high}°</strong>
            <span>HIGH</span>
            <strong>{data.low}°</strong>
            <span>LOW</span>
            <strong>{data.rain}{data.historical ? '″' : '%'}</strong>
            <span>{data.historical ? "RAINFALL" : "RAIN"}</span>
          </div>
          <div className="weather-sun">
            <span>Sunrise {clock(data.sunrise)}</span>
            <span>Sunset {clock(data.sunset)}</span>
          </div>
        </>
      ) : (
        <div className="weather-seasonal">
          <span>{isPast ? "RECORDED CONDITIONS" : "SEASONAL OUTLOOK"}</span>
          <strong>{isPast ? "Reconnect to load this day’s recorded temperature." : place.typical}</strong>
          {status === "loading" && <small>Checking the latest forecast…</small>}
          {status === "error" && (
            <small>
              Live conditions could not refresh. Try again when connected.
            </small>
          )}
          {status === "soon" && (
            <small>
              Live forecast available approximately 16 days before this date.
            </small>
          )}
        </div>
      )}
      <p>{advice}</p>
      <a
        className="weather-source"
        href="https://open-meteo.com/"
        target="_blank"
        rel="noreferrer"
      >
        {data?.historical ? "Recorded daily conditions" : "Live forecast refreshes automatically"} · Weather data by Open-Meteo ↗
      </a>
    </section>
  );
}
type CalendarTone = "singapore" | "java" | "bali" | "komodo";
const calendarTone = (date: number): CalendarTone =>
  [5, 6, 7].includes(date)
      ? "singapore"
      : [8, 9, 10].includes(date)
        ? "java"
        : [14, 15].includes(date)
          ? "komodo"
          : "bali";
const calendarLabels: Record<CalendarTone, string> = {
  singapore: "Singapore",
  java: "Java",
  bali: "Bali",
  komodo: "Komodo",
};
function TripCalendar({onSelect}: {onSelect: (date: number) => void}) {
  const months = [{month:10,label:"November 2026"},{month:11,label:"December 2026"}];
  return <section className="trip-calendar journey-calendar" aria-label="Journey calendar">
    <div className="calendar-top"><div><h2>Your journey calendar</h2><p>November 16–December 1, 2026 · 16 days</p></div></div>
    {months.map(({month,label})=>{
      const offset = new Date(Date.UTC(2026,month,1)).getUTCDay();
      const total = new Date(Date.UTC(2026,month+1,0)).getUTCDate();
      return <section className="journey-calendar-month" key={month} aria-label={label}>
        <h3>{label}</h3>
        <div className="journey-calendar-weekdays" aria-hidden="true">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=><span key={d}>{d}</span>)}</div>
        <div className="journey-month-grid">
          {Array.from({length:offset},(_,i)=><span key={`empty-${i}`} aria-hidden="true"/>)}
          {Array.from({length:total},(_,i)=>{
            const date=i+1;
            const day=days.find(d=>tripDate(d.date).getUTCMonth()===month&&tripDate(d.date).getUTCDate()===date);
            if(!day)return <span className="journey-calendar-outside" key={date}>{date}</span>;
            const number=tauck(day.date);
            const country=number<=7?'vietnam':number<=9?'cambodia':'thailand';
            return <button type="button" className={`journey-calendar-date ${country}`} key={date} onClick={()=>onSelect(day.date)} aria-label={`${longTripDate(day.date)}, Day ${number}: ${day.title}`}><strong>{date}</strong><small>Day {number}</small></button>;
          })}
        </div>
      </section>;
    })}
    <div className="journey-calendar-legend"><span className="vietnam">Vietnam</span><span className="cambodia">Cambodia</span><span className="thailand">Thailand</span></div>
    <p className="calendar-hint">Tap a highlighted date to open that day’s itinerary.</p>
  </section>;
}

function TimeAtHome() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  if (!now)
    return (
      <section className="home-time" aria-label="Eastern time at home">
        <div>
          <span className="eyebrow light">TIME AT HOME</span>
          <strong>Checking Eastern time…</strong>
        </div>
      </section>
    );
  const easternParts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(now);
  const part = (type: string) =>
    Number(easternParts.find((x) => x.type === type)?.value);
  const easternDay = Date.UTC(part("year"), part("month") - 1, part("day"));
  const localDay = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const dayDifference = Math.round((easternDay - localDay) / 86400000);
  const relation =
    dayDifference < 0
      ? "Yesterday at home"
      : dayDifference > 0
        ? "Tomorrow at home"
        : "Same day at home";
  const time = now.toLocaleTimeString("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
  const date = now.toLocaleDateString("en-US", {
    timeZone: "America/New_York",
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  return (
    <section
      className="home-time"
      aria-live="polite"
      aria-label={`Eastern time at home: ${date}, ${time}`}
    >
      <div>
        <span className="eyebrow light">TIME AT HOME · EASTERN</span>
        <strong>{time}</strong>
        <small>{date}</small>
      </div>
      <span
        className={`home-time-relation ${dayDifference !== 0 ? "different-day" : ""}`}
      >
        <i />
        {relation}
      </span>
    </section>
  );
}

function CurrentTripDay({ date, now, onPrevious, onNext }: { date: number; now: Date | null; onPrevious: () => void; onNext: () => void }) {
  const clock = now ? getJourneyStatus(now) : null;
  const day = days.find(d => d.date === date)!;
  const tauckDay = tauck(date);
  const viewingToday = date === (clock?.dayId ?? 5);
  const beforeTrip = clock?.beforeTrip ?? true;
  const statusDetail = clock?.beforeTrip ? `Your journey starts in ${clock.daysToGo} days` : clock?.afterTrip ? "Until the next journey" : "";
  const overviewDate = longTripDate(date);
  const dayTimeZone = "Asia/Bangkok";
  const {authenticated}=useTDSession();
  const {items}=useResources();
  const scheduleVisible=items[`schedule-${date}`]?.visible;
  const [schedule, setSchedule] = useState<[string,string][] | null>(null);
  const previewFirstDay = beforeTrip && date === days[0].date;
  const scheduleEvents = previewFirstDay && (!schedule?.length || schedule[0][0] === 'COMING SOON') ? day.events : schedule || day.events;
  const scheduleContent = <div className="home-schedule"><h3>{previewFirstDay ? 'Day 1 itinerary' : viewingToday ? 'Today’s schedule' : `Day ${tauckDay} schedule`}</h3><ol>{scheduleEvents.map(([time,activity],index)=><li key={`${time}-${index}`}><strong>{time}</strong><span>{activity}</span></li>)}</ol></div>;

  useEffect(() => {
    const controller = new AbortController();
    setSchedule(null);
    const load = () => fetch(`/api/journey-timeline?day=${date}`, {cache:'no-store',signal:controller.signal})
      .then(response => response.ok ? response.json() : null)
      .then(data => { if (!controller.signal.aborted) setSchedule(data?.schedule?.events || null); })
      .catch(() => {});
    void load();
    window.addEventListener('focus', load);
    const timer = window.setInterval(load, 60000);
    return () => { controller.abort(); window.removeEventListener('focus', load); window.clearInterval(timer); };
  }, [date, authenticated, scheduleVisible]);
  return (
    <section className="current-day-card journey-today-card" aria-live="polite">
      <div className={`home-day-overview${beforeTrip ? ' before-trip' : ''}`}>
        <DestinationOutline region={day.region}/>
        <div className="home-overview-top">
          {!beforeTrip && <div className="home-day-switch"><button type="button" aria-label="Previous Home day" disabled={date === 5} onClick={onPrevious}>‹</button><span className="journey-day-number">Day {tauckDay}</span><button type="button" aria-label="Next Home day" disabled={date === 20} onClick={onNext}>›</button></div>}
          <div className="home-local-clock">{now && <time dateTime={now.toISOString()}>{now.toLocaleTimeString('en-US', {timeZone:dayTimeZone,hour:'numeric',minute:'2-digit'})}</time>}<small>{day.region} time</small></div>
        </div>
        <div className="home-overview-date"><h2>{overviewDate}</h2><p>{day.region}</p></div>
        {viewingToday && statusDetail && <p className="home-journey-countdown">{statusDetail}</p>}
      </div>
      {previewFirstDay ? <section className="release-card home-predeparture-schedule" aria-label="Day 1 itinerary"><div className="release-heading"><BrandIcon name="calendar"/><div><h3>Day 1 itinerary</h3><p>{day.title}</p></div></div>{scheduleContent}</section> : <ResourceSlot id={`schedule-${date}`} title="Your schedule" group="schedules" icon="calendar" caption="Xavier will share your plans here.">{scheduleContent}</ResourceSlot>}
      {date === days[0].date && <XavierWelcomePanel expanded />}
    </section>
  );
}

type UsageVisitor = {
  id: string;
  name: string;
  opens: number;
  lastOpenedAt: string;
};

type UsageData = {
  totalOpens: number;
  uniqueVisitors: number;
  visitors: UsageVisitor[];
};

function UsageStatistics() {
  const [statistics, setStatistics] = useState<UsageData | null>(null);
  const [visitorId, setVisitorId] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let id = localStorage.getItem("kd-usage-visitor-id") || "";
    if (!id) {
      id = typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `traveler-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      localStorage.setItem("kd-usage-visitor-id", id);
    }
    const savedName =
      localStorage.getItem("kd-usage-name") ||
      localStorage.getItem("kd-journal-author") ||
      "";
    setVisitorId(id);
    setName(savedName);

    const alreadyRecorded = sessionStorage.getItem("kd-usage-open-recorded");
    fetch("/api/usage", {
      method: alreadyRecorded ? "GET" : "POST",
      headers: alreadyRecorded ? undefined : { "content-type": "application/json" },
      body: alreadyRecorded
        ? undefined
        : JSON.stringify({ action: "open", visitorId: id, name: savedName }),
      cache: "no-store",
    })
      .then((response) => {
        if (!response.ok) throw new Error();
        return response.json();
      })
      .then((data) => {
        if (!alreadyRecorded) sessionStorage.setItem("kd-usage-open-recorded", "yes");
        setStatistics(data);
      })
      .catch(() => setMessage("Statistics will refresh when the connection returns."));
  }, []);

  async function saveName(event: React.FormEvent) {
    event.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setMessage("Please add your name.");
      return;
    }
    setMessage("Saving…");
    try {
      const response = await fetch("/api/usage", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "rename", visitorId, name: cleanName }),
      });
      if (!response.ok) throw new Error();
      const data = await response.json();
      localStorage.setItem("kd-usage-name", cleanName);
      localStorage.setItem("kd-journal-author", cleanName);
      setStatistics(data);
      setMessage("Your name has been saved. ✓");
    } catch {
      setMessage("Your name could not be saved. Please try again.");
    }
  }

  return (
    <details className="info-accordion usage-accordion">
      <summary>
        <span className="accordion-icon"><Icon name="people" size={18} /></span>
        <span><small>APP ACTIVITY</small><strong>Visits &amp; Travelers</strong></span>
        <b>＋</b>
      </summary>
      <section className="usage-statistics">
        <div className="usage-totals">
          <div><strong>{statistics?.totalOpens ?? "—"}</strong><span>APP OPENS</span></div>
          <div><strong>{statistics?.uniqueVisitors ?? "—"}</strong><span>VISITORS</span></div>
        </div>
        <form onSubmit={saveName}>
          <label htmlFor="usage-name">YOUR DISPLAY NAME</label>
          <div>
            <input
              id="usage-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Enter your name"
              maxLength={80}
            />
            <button type="submit">SAVE</button>
          </div>
        </form>
        {message && <p className="usage-message" aria-live="polite">{message}</p>}
        <div className="usage-visitors">
          <span className="eyebrow">WHO HAS OPENED THE APP</span>
          {statistics?.visitors.length ? (
            <ul>
              {statistics.visitors.map((visitor) => (
                <li key={visitor.id}>
                  <span>{visitor.name}</span>
                  <strong>{visitor.opens} {visitor.opens === 1 ? "open" : "opens"}</strong>
                </li>
              ))}
            </ul>
          ) : (
            <p>No visits recorded yet.</p>
          )}
        </div>
        <small className="usage-privacy">Names are supplied by travelers. The app does not display email or location information.</small>
      </section>
    </details>
  );
}

type JournalEntry = {
  id: string;
  tripDate: number;
  author: string;
  note: string;
  restaurantName: string;
  restaurantUrl: string;
  photoUrl: string;
  createdAt: string;
  isOwner: boolean;
};
type JournalDraft = {
  author: string;
  note: string;
  restaurantName: string;
  restaurantUrl: string;
  photoUrl: string;
};
const emptyDraft: JournalDraft = {
  author: "",
  note: "",
  restaurantName: "",
  restaurantUrl: "",
  photoUrl: "",
};

function formatJournalDate(value: string) {
  const raw = String(value || "").trim();
  const normalized = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(raw)
    ? raw
    : raw.includes("T")
      ? `${raw}Z`
      : `${raw.replace(" ", "T")}Z`;
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return "Recently";
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

type XavierNote = {
  tripDate: number;
  text: string;
  updatedAt: string;
};

function memoryText(entry: JournalEntry) {
  return [entry.note, [entry.restaurantName, entry.restaurantUrl].filter(Boolean).join(' · '), entry.photoUrl].filter(Boolean).join('\n\n');
}
function MemoryTextLinks({ text }: { text: string }) {
  return <>{text.split(/(https?:\/\/[^\s<>]+)/gi).map((part, index) => {
    if (!/^https?:\/\//i.test(part)) return part;
    const url = part.replace(/[.,!?;:]+$/, '');
    return <span key={index}><a href={url} target="_blank" rel="noopener noreferrer">{url}</a>{part.slice(url.length)}</span>;
  })}</>;
}

function XavierWelcomePanel({ expanded = false }: { expanded?: boolean }) {
  return <details className="info-accordion xavier-welcome-panel" open={expanded || undefined}>
    <summary>
      <span className="accordion-icon"><Icon name="people" size={18} /></span>
      <span><small>FROM YOUR TOUR DIRECTOR</small><strong>Xavier’s Welcome Letter</strong></span>
      <b>＋</b>
    </summary>
    <XavierWelcome />
  </details>;
}

function XavierDailyNote({ date, home = false, currentDay = false }: { date: number; home?: boolean; currentDay?: boolean }) {
  const { authenticated, configured, refresh: refreshTD } = useTDSession();
  const legacyMode = configured === false;
  const [note, setNote] = useState<XavierNote | null>(null);
  const [draft, setDraft] = useState("");
  const [password, setPassword] = useState("");
  const [managing, setManaging] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const cacheKey = `kd-xavier-note-${date}`;
    const controller = new AbortController();
    let hasCachedNote = false;
    setNote(null);
    setDraft("");
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const cachedNote = JSON.parse(cached) as XavierNote;
        if (cachedNote?.tripDate === date && cachedNote.text) {
          hasCachedNote = true;
          setNote(cachedNote);
          setDraft(cachedNote.text);
        }
      }
    } catch {
      localStorage.removeItem(cacheKey);
    }
    setLoading(true);
    setManaging(false);
    setMessage("");
    fetch(`/api/xavier-notes?day=${date}`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load Xavier’s note.");
        return data;
      })
      .then((data) => {
        if (controller.signal.aborted) return;
        const freshNote = data.note?.tripDate === date ? data.note as XavierNote : null;
        setNote(freshNote);
        setDraft(freshNote?.text || "");
        if (freshNote) localStorage.setItem(cacheKey, JSON.stringify(freshNote));
        else localStorage.removeItem(cacheKey);
      })
      .catch(() => {
        if (!controller.signal.aborted) setMessage(hasCachedNote
          ? "Showing the last saved note. It will refresh when the connection returns."
          : "Xavier’s note will appear when the connection returns.");
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [date]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/xavier-notes", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ day: date, text: draft, ...(legacyMode ? {password} : {}) }),
      });
      const data = await response.json();
      if (!response.ok) { if(response.status === 401) {setManaging(false);void refreshTD();} throw new Error(data.error || "Could not save Xavier’s note."); }
      setNote(data.note);
      localStorage.setItem(`kd-xavier-note-${date}`, JSON.stringify(data.note));
      setPassword("");
      setManaging(false);
      setMessage("Xavier’s note has been posted. ✓");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save Xavier’s note.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/xavier-notes", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ day: date, ...(legacyMode ? {password} : {}) }),
      });
      const data = await response.json();
      if (!response.ok) { if(response.status === 401) {setManaging(false);void refreshTD();} throw new Error(data.error || "Could not remove Xavier’s note."); }
      setNote(null);
      localStorage.removeItem(`kd-xavier-note-${date}`);
      setDraft("");
      setPassword("");
      setManaging(false);
      setMessage("Xavier’s note has been removed. ✓");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not remove Xavier’s note.");
    } finally {
      setSaving(false);
    }
  }

  const visibleNote = note?.tripDate === date ? note : null;

  return (
    <section className={`xavier-daily-note${visibleNote ? " has-note" : ""}${home ? " home-special-notes" : ""}`}>
      <div className="xavier-note-heading">
        <div>
          <h2>Your TD’s announcement</h2>
        </div>

      </div>
      {visibleNote ? (
        <>
          <p className="xavier-note-copy">{visibleNote.text}</p>
          {authenticated && <small>Updated {formatJournalDate(visibleNote.updatedAt)}</small>}
          {authenticated && <div className="announcement-whatsapp" data-pdf-exclude>
            <a className="button" href={`https://wa.me/?text=${encodeURIComponent(`*Wondercase · K&D 103*\n*Day ${tauck(date)} · ${longTripDate(date)}*\nFrom Xavier Brunelle\n\n${visibleNote.text}`)}`} target="_blank" rel="noopener noreferrer">Share announcement to WhatsApp ↗</a>
            <small>Choose the tour group in WhatsApp, then tap Send. Save any edits here before sharing.</small>
          </div>}
        </>
      ) : loading ? (
        <LoadingIndicator label="Checking for this day’s announcement…" />
      ) : (
        <p className="xavier-note-empty">Xavier has not posted a note for this day yet.</p>
      )}
      {(authenticated || legacyMode) && (!managing ? (
        <button
          type="button"
          className="xavier-note-manage"
          onClick={() => {
            setDraft(note?.text || "");
            setManaging(true);
            setMessage("");
          }}
        >
          {note ? "XAVIER: EDIT NOTE" : "XAVIER: ADD NOTE"}
        </button>
      ) : (
        <form className="xavier-note-form" onSubmit={save}>
          <label>
            TODAY’S NOTE
            <textarea
              required
              rows={5}
              maxLength={4000}
              value={draft}
              placeholder="Share an update, reminder, meeting point, or message for today…"
              onChange={(event) => setDraft(event.target.value)}
            />
          </label>
          {legacyMode && <label>
            XAVIER’S PASSWORD
            <input
              required
              type="password"
              autoComplete="current-password"
              value={password}
              placeholder="Enter password"
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>}
          <div className="xavier-note-actions">
            <button className="xavier-note-post" type="submit" disabled={saving}>
              {saving ? <LoadingIndicator label="Saving…" /> : "POST NOTE"}
            </button>
            <div className="xavier-note-secondary-actions">
              <button type="button" onClick={() => { setManaging(false); setPassword(""); setMessage(""); }}>
                CANCEL
              </button>
              {note && <button type="button" disabled={saving || (legacyMode && !password)} onClick={remove}>DELETE</button>}
            </div>
          </div>
        </form>
      ))}
      {message && <p className="xavier-note-message" aria-live="polite">{message}</p>}
    </section>
  );
}

type JournalComment = {
  id: string;
  entryId: string;
  author: string;
  comment: string;
  createdAt: string;
};

function MemoryComments({ entryId }: { entryId: string }) {
  const [comments, setComments] = useState<JournalComment[]>([]);
  const [author, setAuthor] = useState("");
  const [comment, setComment] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setAuthor(localStorage.getItem("kd-journal-author") || "");
    fetch(`/api/comments?entryId=${encodeURIComponent(entryId)}`)
      .then((response) => response.json())
      .then((data) => setComments(data.comments || []))
      .catch(() => setMessage("Comments will refresh when you’re back online."))
      .finally(() => setLoading(false));
  }, [entryId]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ entryId, author, comment }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not post this comment.");
      setComments((current) => [...current, data.comment]);
      localStorage.setItem("kd-journal-author", author.trim());
      setComment("");
      setOpen(false);
      setMessage("Comment posted. ✓");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not post this comment.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="memory-comments">
      <div className="comments-heading">
        <strong>{comments.length} {comments.length === 1 ? "comment" : "comments"}</strong>
        <button type="button" onClick={() => setOpen((value) => !value)}>
          {open ? "CANCEL" : "ADD A COMMENT"}
        </button>
      </div>
      {!loading && comments.length > 0 && (
        <div className="comments-list">
          {comments.map((item) => (
            <article key={item.id}>
              <div><strong>{item.author}</strong><time>{formatJournalDate(item.createdAt)}</time></div>
              <p>{item.comment}</p>
            </article>
          ))}
        </div>
      )}
      {loading && <LoadingIndicator label="Opening comments…" />}
      {open && (
        <form className="comment-form" onSubmit={submit}>
          <label>YOUR NAME<input required value={author} maxLength={80} placeholder="Traveler name" onChange={(event) => setAuthor(event.target.value)} /></label>
          <label>COMMENT<textarea required rows={3} maxLength={1000} value={comment} placeholder="Write a comment…" onChange={(event) => setComment(event.target.value)} /></label>
          <button disabled={saving}>{saving ? <LoadingIndicator label="Posting…" /> : "POST COMMENT"}</button>
        </form>
      )}
      {message && <p className="comments-message" aria-live="polite">{message}</p>}
    </section>
  );
}

function TravelJournal({ date }: { date: number }) {
  const [entries, setEntries] = useState<JournalEntry[]>([]),
    [draft, setDraft] = useState<JournalDraft>(emptyDraft),
    [open, setOpen] = useState(false),
    [loading, setLoading] = useState(true),
    [saving, setSaving] = useState(false),
    [editingId, setEditingId] = useState<string | null>(null),
    [deleteId, setDeleteId] = useState<string | null>(null),
    [message, setMessage] = useState("");
  const [files,setFiles]=useState<File[]>([]);
  const [attachmentVersion,setAttachmentVersion]=useState(0);
  const ownerToken = useRef("");
  const key = `kd-journal-draft-${date}`;
  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      const author = localStorage.getItem("kd-journal-author") || "";
      let token = localStorage.getItem("kd-traveler-journal-token") || "";
      if (!token) {
        token = `${crypto.randomUUID()}${crypto.randomUUID()}`;
        localStorage.setItem("kd-traveler-journal-token", token);
      }
      ownerToken.current = token;
      setDraft(
        stored
          ? { ...emptyDraft, ...JSON.parse(stored), author }
          : { ...emptyDraft, author },
      );
      setLoading(true);
      fetch(`/api/journal?day=${date}`, {
        headers: { "x-journal-token": token },
      })
        .then((r) => r.json())
        .then((j) => {
          if (j.entries) setEntries(j.entries);
        })
        .catch(() =>
          setMessage("Shared memories will refresh when you’re back online."),
        )
        .finally(() => setLoading(false));
    } catch {
      setDraft(emptyDraft);
      setLoading(false);
    }
  }, [date, key]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(key, JSON.stringify(draft));
    localStorage.setItem("kd-journal-author", draft.author);
  }, [draft, key]);
  function change(field: keyof JournalDraft, value: string) {
    setDraft((d) => ({ ...d, [field]: value }));
    setMessage("Draft saved on this device.");
  }
  function add() {
    setFiles([]);
    setEditingId(null);
    setDeleteId(null);
    setDraft((d) => ({ ...emptyDraft, author: d.author }));
    setOpen(true);
    setMessage("");
  }
  function edit(entry: JournalEntry) {
    setFiles([]);
    setDeleteId(null);
    setEditingId(entry.id);
    setDraft({
      author: entry.author,
      note: memoryText(entry),
      restaurantName: "",
      restaurantUrl: "",
      photoUrl: "",
    });
    setOpen(true);
    setMessage("Editing this shared memory.");
  }
  function cancel() {
    setFiles([]);
    setOpen(false);
    setEditingId(null);
    setDraft((d) => ({ ...emptyDraft, author: d.author }));
    localStorage.removeItem(key);
    setMessage("");
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    let savedId=editingId;
    try {
      if(files.length>3)throw Error("Choose up to 3 attachments.");
      const prepared=await Promise.all(files.map(prepareMemoryFile));
      const response = await fetch("/api/journal", {
        method: editingId ? "PATCH" : "POST",
        headers: {
          "content-type": "application/json",
          "x-journal-token": ownerToken.current,
        },
        body: JSON.stringify({ id: editingId, tripDate: date, ...draft }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Could not save this memory.");
      setEntries((current) =>
        editingId
          ? current.map((item) => (item.id === editingId ? data.entry : item))
          : [data.entry, ...current],
      );
      savedId=data.entry.id;
      setEditingId(savedId);
      if(prepared.length){
        const base=`/api/memory-attachments?day=${date}&id=${savedId}`;
        const listing=await fetch(base,{cache:'no-store'});
        const listed=await listing.json();
        if(!listing.ok)throw Error(listed.error||'Could not load attachments.');
        const free=[1,2,3].filter(slot=>!listed.attachments.some((a:{slot:number})=>a.slot===slot));
        if(prepared.length>free.length)throw Error('This memory can have up to 3 attachments. Remove a selected file or an existing attachment.');
        for(let i=0;i<prepared.length;i++){
          setMessage(`Saving attachment ${i+1} of ${prepared.length}…`);
          const {body,name}=prepared[i];
          const result=await fetch(`${base}&slot=${free[i]}`,{method:'POST',headers:{'Content-Type':body.type,'x-journal-token':ownerToken.current,'x-file-name':encodeURIComponent(name)},body});
          const answer=await result.json();
          if(!result.ok)throw Error(answer.error||'Attachment upload failed.');
          setFiles(current=>current.filter(file=>file!==files[i]));
          setAttachmentVersion(v=>v+1);
        }
      }
      setFiles([]);
      setDraft((d) => ({ ...emptyDraft, author: d.author }));
      localStorage.removeItem(key);
      setOpen(false);
      setEditingId(null);
      setMessage(
        editingId
          ? "Memory updated. ✓"
          : "Memory added to the shared journal. ✓",
      );
    } catch (error) {
      setMessage(
        (savedId ? "Your memory is saved, but an attachment needs attention. Retry with SAVE CHANGES. " : "") + (error instanceof Error ? error.message : "Please try again."),
      );
    } finally {
      setSaving(false);
    }
  }
  async function remove(id: string) {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(`/api/journal?id=${id}&day=${date}`, {
        method: "DELETE",
        headers: { "x-journal-token": ownerToken.current },
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Could not delete this memory.");
      setEntries((current) => current.filter((item) => item.id !== id));
      setDeleteId(null);
      setMessage("Memory deleted. ✓");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not delete this memory.",
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <section className="journal-card">
      <div className="journal-heading">
        <div>
          <span className="eyebrow">xxx edition</span>
          <h2>Today’s Memories</h2>
        </div>
        <span className="journal-book">✦</span>
      </div>
      <p className="journal-intro">
        Share a memory, comment, favorite restaurant, or photo link as the
        journey unfolds. Your posts remain here through future app updates.
      </p>
      {loading ? (
        <LoadingIndicator label="Opening the journal…" />
      ) : entries.length ? (
        <div className="journal-feed">
          {entries.map((entry) => (
            <article className="journal-entry" key={entry.id}>
              <div>
                <strong>{entry.author}</strong>
                <time>{formatJournalDate(entry.createdAt)}</time>
              </div>
              {memoryText(entry) && <p className="memory-text"><MemoryTextLinks text={memoryText(entry)} /></p>}
              {entry.isOwner && (
                <div className="journal-entry-actions">
                  <button onClick={() => edit(entry)}>EDIT</button>
                  <button
                    onClick={() => {
                      setOpen(false);
                      setEditingId(null);
                      setDeleteId(entry.id);
                      setMessage("");
                    }}
                  >
                    DELETE
                  </button>
                </div>
              )}
              {deleteId === entry.id && (
                <div className="journal-delete">
                  <strong>Delete this memory?</strong>
                  <p>This cannot be undone.</p>
                  <div>
                    <button onClick={() => setDeleteId(null)}>KEEP IT</button>
                    <button disabled={saving} onClick={() => remove(entry.id)}>
                      {saving ? <LoadingIndicator label="Deleting…" /> : "YES, DELETE"}
                    </button>
                  </div>
                </div>
              )}
              <MemoryAttachments key={`${entry.id}-${attachmentVersion}`} day={date} id={entry.id} isOwner={entry.isOwner} token={ownerToken.current} />
              <MemoryComments entryId={entry.id} />
            </article>
          ))}
        </div>
      ) : (
        <p className="journal-empty">
          The first memory of this day is waiting to be written.
        </p>
      )}
      {message && (
        <p className="journal-message" aria-live="polite">
          {message}
        </p>
      )}
      {!open ? (
        <button className="journal-add" onClick={add}>
          + ADD A MEMORY
        </button>
      ) : (
        <form className="journal-form" onSubmit={save}>
          <span className="journal-form-title">
            {editingId ? "EDIT MEMORY" : "ADD A NEW MEMORY"}
          </span>
          <label>
            YOUR NAME
            <input
              maxLength={80}
              placeholder="Traveler name"
              value={draft.author}
              onChange={(e) => change("author", e.target.value)}
            />
          </label>
          <label>
            MEMORY OR COMMENT
            <textarea
              rows={4}
              placeholder="What made today memorable?"
              value={draft.note}
              onChange={(e) => change("note", e.target.value)}
            />
          </label>
          <small>Paste website, restaurant, map or photo-album links directly into your memory text.</small>
          <div className="memory-upload">
            <label>ADD PHOTOS OR FILES
              <input type="file" multiple accept="image/jpeg,image/png,image/webp,application/pdf" disabled={saving} onChange={e=>{
                const chosen=Array.from(e.target.files||[]);e.target.value='';
                if(files.length+chosen.length>3){setMessage('Choose up to 3 attachments.');return;}
                setFiles(current=>[...current,...chosen]);setMessage('Files selected. Press POST MEMORY to save your memory and attachments.');
              }}/>
            </label>
            <small>Up to 3 attachments. JPG, PNG or WebP photos: 10 MB before automatic resizing. PDFs: 4 MB each.</small>
            {files.length>0&&<ul>{files.map((file,index)=><li key={`${file.name}-${index}`}><span>{file.name} · {(file.size/1048576).toFixed(1)} MB</span><button type="button" disabled={saving} onClick={()=>setFiles(current=>current.filter((_,i)=>i!==index))}>Remove selected file</button></li>)}</ul>}
            <small>Files upload when you save. Keep this page open until saving finishes. Selected files are not retained if you close or reload the page.</small>
          </div>
          <small>Your draft stays on this device until you post it. Only this device can edit or delete your published entry.</small>
          <div className="journal-actions">
            <button type="button" disabled={saving} onClick={cancel}>
              CANCEL
            </button>
            <button type="submit" disabled={saving}>
              {saving ? <LoadingIndicator label="Saving…" /> : editingId ? "SAVE CHANGES" : "POST MEMORY"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

const singaporeGuide = [
  {
    category: "Xavier’s restaurant recommendations",
    places: [
      ["Song Fa", "Bak kut teh—peppery pork-rib broth with fried dough sticks."],
      ["Jumbo Seafood", "Singapore seafood institution; chili crab with fried mantou buns."],
      ["Keng Eng Kee Seafood", "Family-run zi char; coffee pork ribs, moonlight hor fun, chili crab, and prawn-paste chicken."],
      ["Samy’s Curry", "North and South Indian cooking; fish-head curry and fish-potato croquettes on a banana-leaf set."],
      ["Kotuwa", "Chef Rishi Naleendra’s Sri Lankan cooking; crab curry, egg hoppers, and mutton rolls."],
      ["The Coconut Club", "Modern nasi lemak with fried chicken, sambal, peanuts, anchovies, and coconut rice."],
      ["Peach Blossoms", "Modern Chinese cuisine and Marina Bay views; steamed carrot cake with lobster, drunken-crab noodles, and the Forbidden Roll."],
      ["National Kitchen by Violet Oon", "Peranakan and Singaporean classics in the National Gallery; dry laksa or beef rendang with sambal eggplant and traditional kueh for dessert."],
    ],
  },
  {
    category: "Hawker centres",
    places: [
      ["Lau Pa Sat", "Victorian-style market and evening satay street; try skewers and fresh sugar-cane juice."],
      ["Albert Centre Market & Food Centre", "Local Bugis market for chicken rice, fishball noodles, laksa, and ice kacang."],
      ["Market Street Hawker Centre", "Modern two-level centre at CapitaSpring; Ipoh hor fun, truffle wonton mee, and biryani."],
      ["Maxwell Food Centre", "Famous, easy-to-navigate centre; Tian Tian chicken rice or fish-noodle soup."],
    ],
  },
  {
    category: "Coffee, cafés & ice cream",
    places: [
      ["Narrative Coffee Stand", "Local roasters serving cold brew and espresso-style coffee."],
      ["Ya Kun Kaya Toast", "Kaya toast breakfast sets with local kopi."],
      ["Toast Box", "Singaporean coffee and kaya-toast breakfast sets."],
      ["My Awesome Cafe", "Local vegan café with a vibrant interior, popular for after-work drinks."],
      ["Apiary", "Playful local ice-cream flavors."],
      ["Birds of Paradise Gelato Boutique", "Botanical gelato inspired by herbs, flowers, and Southeast Asian flavors."],
    ],
  },
  {
    category: "Near Raffles",
    places: [
      ["Chin Chin Eating House", "Old-school Hainanese comfort food and classic chicken rice."],
      ["New Ubin Seafood", "Singaporean seafood and zi char in a lively communal setting."],
      ["Un-Yang-Kor-Dai", "Authentic northeastern Thai cooking."],
      ["Odette", "Modern French tasting menus with optional wine pairing; reservations required."],
      ["HolyCrab", "Playful Singaporean crab dishes; try pepper crab with crispy mantou."],
    ],
  },
  {
    category: "Cocktails & views",
    places: [
      ["Nutmeg & Clove", "Award-winning cocktails inspired by Singapore’s history and flavors."],
      ["LeVeL33", "Marina Bay views from a high-rise microbrewery."],
      ["Caffe Fernet", "Italian restaurant and bar overlooking Marina Bay."],
      ["Rooftop Bar at Heritage", "Casual rooftop views of Boat Quay and Marina Bay."],
      ["Night Hawk", "Intimate speakeasy with creative menus and cocktails."],
      ["Jigger & Pony", "Acclaimed cocktail bar celebrated for beautifully executed classics."],
      ["Bar KAP", "Teochew-inspired cocktails in a historic mansion setting."],
    ],
  },
] as const;

function JourneyHotelResources({name}:{name:string}) {
  const hotelIndex=hotels.findIndex(h=>h.name===name||(h.name==='Four Seasons Resort at Sayan'&&name==='Four Seasons Resort Bali at Sayan')||(h.name==='Four Seasons Resort Jimbaran'&&name==='Four Seasons Resort Bali at Jimbaran Bay'));
  if(hotelIndex<0)return null;
  const hotel=hotels[hotelIndex];
  return <div className="day-hotel-resources">
                      {storytelling.filter(story => story.hotelIndex === hotelIndex).map(story => <ResourceSlot key={story.id} id={`story-${story.id}`} title={story.title} group={`hotel-${hotelIndex}`}><a href={`/storytelling.html?story=${story.id}`}>{story.title} →</a></ResourceSlot>)}
                      {hotelResources.filter(item => item.hotel === hotel.name).map(item => <ResourceSlot key={item.id} id={`menu-${item.id}`} title={item.title} group={`hotel-${hotelIndex}`} icon={item.category.includes("Spa")?"spa":"food"}><a href={`/hotel-menus.html?menu=${item.id}`}>{item.title} →</a></ResourceSlot>)}
                    </div>;
}

function XavierContactCard({onSuitcase}:{onSuitcase:()=>void}) {
  const [contactOpen, setContactOpen] = useState(true);
  const {authenticated}=useTDSession();
  const portrait=useXavierPhoto();
  return <section className="director-simple">
    <button type="button" className="director-toggle" aria-expanded={contactOpen} aria-controls="director-contact-details" onClick={()=>setContactOpen(open=>!open)}>
      <img className="xavier-profile-portrait" src={portrait.photo || "/images/xavier-brunelle.jpeg"} alt="Xavier Brunelle" width={86} height={104}/>
      <span><small>Your tour director</small><strong>Xavier Brunelle</strong></span><span className="director-expand" aria-hidden="true">{contactOpen?'−':'+'}</span>
    </button>
    {contactOpen && <div id="director-contact-details" className="director-contact-details">
      <div className="director-contact-links">
        <a href={xavierPhoneUrl} target="_blank" rel="noopener noreferrer"><small>WhatsApp</small><span>{xavierPhoneDisplay}</span></a>
        <a href={`mailto:${xavierEmail}`}><small>Email</small><span>{xavierEmail}</span></a>
      </div>
      <details className="director-about" open><summary>About Xavier</summary>
        <p>Born in Montreal, Canada, Xavier has built an international career in tourism, hospitality and wellness. He began working in tourism in Mexico in 2001 and became a tour leader in 2006, guiding Spanish-speaking travelers through Canada. During those years, he divided his time between Canada and Indonesia, where he worked as a scuba diving instructor and later as a wellness and fitness coach at a retreat in Bali.</p>
        <p>Since 2017, Xavier has been a Tour Director with Tauck, leading journeys across Canada, Scandinavia, other parts of Europe, Cuba and Southeast Asia. After decades of living and working around the world, he now calls Palma de Mallorca home, where he lives with his Swedish wife and their two daughters.</p>
      </details>
    </div>}
    <button type="button" className="director-signin" onClick={onSuitcase}>TD Suitcase · {authenticated ? "Open workspace" : "Sign in"}</button>
  </section>;
}

function XavierWelcome() { return <article className="xavier-letter"><span className="eyebrow">YOUR TOUR DIRECTOR</span><h2>Xavier Brunelle</h2><p>Vietnam, Cambodia &amp; Thailand · xxx edition</p><p>Please follow the supplied itinerary for your hospitality desk, welcome reception and dinner details.</p></article>; }

function XavierJavaGuide() {
  const originalPages = ["IMG_8807.jpeg", "IMG_8808.jpeg", "IMG_8809.jpeg"];
  return (
    <article className="java-guide">
      <figure className="java-guide-cover">
        <img
          src="/documents/xavier-java/IMG_8806.jpeg"
          alt="Java artwork shared by a previous tour, showing volcanoes, rice terraces, temples, batik, and ceremonial offerings"
        />
        <figcaption>JAVA · DESTINATION READING</figcaption>
      </figure>
      <div className="java-guide-copy">
        <span className="eyebrow">JAVA: THE ISLAND THAT BUILT INDONESIA</span>
        <h2>Volcanoes, kingdoms, faiths &amp; modern life</h2>
        <p>
          Java occupies only a small part of Indonesia’s land, yet more than half
          of the country’s population lives there. For centuries it has been a
          political, economic, cultural, and spiritual center—an island of dense
          cities, ancient temples, royal palaces, fertile fields, and active volcanoes.
        </p>
        <h3>Created by fire</h3>
        <p>
          Java lies on the Pacific Ring of Fire. Mount Merapi, near Amanjiwo, is
          among the world’s most active volcanoes; farther east are Mount Bromo and
          Mount Semeru. Their eruptions can be destructive, but they also created
          exceptionally fertile soil that has sustained rice, fruit, coffee, tea,
          spices, and generations of communities.
        </p>
        <h3>Trade, temples &amp; kingdoms</h3>
        <p>
          Long before Europeans arrived, traders from India, China, Arabia, and
          elsewhere connected Java to maritime routes between East and West. The
          spice trade brought wealth and cultural exchange, including Hinduism and
          Buddhism. The Sailendra and Mataram kingdoms flourished between the
          eighth and tenth centuries, leaving Borobudur—the world’s largest Buddhist
          monument—and the great Hindu temple complex of Prambanan. The later
          Majapahit Empire remains a symbol of a golden age and of the archipelago’s
          early regional connections.
        </p>
        <h3>Islam &amp; coexistence</h3>
        <p>
          Islam arrived largely through trade rather than conquest. The Wali Songo,
          or Nine Saints, helped spread the faith while incorporating local customs.
          Today the call to prayer is part of Java’s daily rhythm, alongside a long
          tradition of coexistence among Islam, Christianity, Hinduism, Buddhism,
          Confucianism, and local traditions.
        </p>
        <h3>Colonial rule &amp; independence</h3>
        <p>
          Europeans came seeking spices and profit. The Dutch East India Company
          established itself in 1602 and made Batavia—modern Jakarta—its colonial
          headquarters. Japanese occupation during the Second World War ended Dutch
          control. Sukarno and Mohammad Hatta declared Indonesian independence on
          August 17, 1945; after a difficult struggle, Dutch rule formally ended in 1949.
        </p>
        <h3>Java today</h3>
        <p>
          Jakarta, Surabaya, Bandung, and Yogyakarta drive much of Indonesia’s
          economy, education, tourism, and cultural life. Indonesia is building a
          new administrative capital, Nusantara, on Borneo, while Jakarta remains
          its commercial powerhouse. Through all this change, family, respect for
          elders, shared meals, celebrations, and community ties remain central to
          life across Java.
        </p>
        <p className="java-guide-closing">
          “The monuments tell the story of Java’s past. The people tell the story
          of Java today.”
        </p>
      </div>
      <details className="java-original-pages">
        <summary>READ ORIGINAL PAGES <span>＋</span></summary>
        <div>
          {originalPages.map((page, index) => (
            <a
              key={page}
              href={`/documents/xavier-java/${page}`}
              target="_blank"
              rel="noreferrer"
            >
              <img
                src={`/documents/xavier-java/${page}`}
                alt={`Java reading, page ${index + 1}`}
                loading="lazy"
              />
            </a>
          ))}
        </div>
      </details>
    </article>
  );
}

function XavierBaliGuide() {
  const originalPages = ["IMG_9427.jpeg", "IMG_9428.jpeg", "IMG_9429.jpeg"];
  return (
    <article className="java-guide bali-guide">
      <figure className="java-guide-cover bali-guide-cover">
        <img
          src="/documents/xavier-bali/IMG_9426.jpeg"
          alt="Bali watercolor shared by a previous tour, showing Balinese dancers, temples, rice terraces, and Mount Agung"
        />
        <figcaption>BALI · DESTINATION READING</figcaption>
      </figure>
      <div className="java-guide-copy">
        <span className="eyebrow">BALI: THE ISLAND OF GODS</span>
        <h2>Faith, family, tradition &amp; a different rhythm</h2>
        <p>
          Bali brings together beaches, history, food, landscapes, spirituality,
          and a pace of life that feels entirely its own. Flower-and-palm-leaf
          offerings appear on sidewalks, temple steps, shop entrances, and even
          parked scooters, while incense and daily ceremonies weave the sacred
          into ordinary life.
        </p>
        <h3>A guardian of an older world</h3>
        <p>
          Hindu and Buddhist kingdoms from Java shaped Bali for centuries. As
          Islam spread across much of Indonesia, nobles, priests, artists,
          craftsmen, and scholars carried sacred texts, artistic knowledge, and
          religious practices east to Bali. The island became a guardian of
          traditions that remain deeply rooted today.
        </p>
        <h3>Harmony in everyday life</h3>
        <p>
          Balinese Hinduism blends Hindu practice with local beliefs, ancestor
          worship, and reverence for nature. Its guiding idea, Tri Hita Karana,
          teaches harmony among people, the natural world, and the spiritual
          world. Daily canang sari offerings express gratitude and respect, and
          temples are part of homes, villages, hotels, and everyday routines.
        </p>
        <h3>Family, community &amp; ceremony</h3>
        <p>
          Several generations often share a family compound arranged around a
          courtyard and family temple. Community responsibility remains central,
          as do ceremonies marking birth, adulthood, marriage, temple anniversaries,
          harvests, and death. The tooth-filing ritual marks adulthood, while
          colorful Ngaben cremations are understood as transitions in a larger
          spiritual journey.
        </p>
        <h3>Silence, water &amp; renewal</h3>
        <p>
          Nyepi, Bali’s Day of Silence, brings the island to a complete pause for
          reflection and renewal. The Subak irrigation system expresses the same
          philosophy of balance through water temples and shared stewardship of
          rice terraces—an enduring network of cooperation more than a thousand
          years old.
        </p>
        <h3>Bali today</h3>
        <p>
          Ubud remains a cultural heart for painters, woodcarvers, dancers,
          musicians, and craftspeople. Elsewhere, rice terraces and family temples
          coexist with surfing, wellness retreats, galleries, boutique hotels,
          and digital entrepreneurship. Bali’s distinctiveness lies in its ability
          to welcome change while keeping tradition, community, and spirituality
          present in daily life.
        </p>
        <p className="java-guide-closing">
          Bali moves at a different rhythm—one shaped by gratitude, balance,
          community, and a close relationship with the natural world.
        </p>
      </div>
      <details className="java-original-pages">
        <summary>READ ORIGINAL PAGES <span>＋</span></summary>
        <div>
          {originalPages.map((page, index) => (
            <a
              key={page}
              href={`/documents/xavier-bali/${page}`}
              target="_blank"
              rel="noreferrer"
            >
              <img
                src={`/documents/xavier-bali/${page}`}
                alt={`Bali reading, page ${index + 1}`}
                loading="lazy"
              />
            </a>
          ))}
        </div>
      </details>
    </article>
  );
}

function BaliMap() {
  return (
    <figure className="bali-map-card">
      <a
        href="/documents/xavier-bali/IMG_9436.jpeg"
        target="_blank"
        rel="noreferrer"
        aria-label="Open the Bali map at full size"
      >
        <img
          src="/documents/xavier-bali/IMG_9436.jpeg"
          alt="Map of Bali showing towns, temples, roads, mountains, and nearby islands"
          loading="lazy"
        />
      </a>
      <figcaption>Tap the map to open it at full size.</figcaption>
    </figure>
  );
}

function SingaporeDiningGuide() {
  return (
    <details className="info-accordion dining-guide-accordion">
      <summary>
        <span className="accordion-icon"><Icon name="compass" size={18} /></span>
        <span><small>FOOD RECOMMENDATIONS BY XAVIER BRUNELLE</small><strong>Xavier’s food recommendations</strong></span>
        <b>＋</b>
      </summary>
      <section className="dining-guide">
        <p><a href="/documents/cher/food-recommendations.pdf" target="_blank" rel="noopener noreferrer">Open Xavier’s original food recommendations (PDF) ↗</a></p>
        <p className="dining-guide-intro">
          Tap any recommendation to open it in Google Maps. Reservations are especially important for Jumbo Seafood, Keng Eng Kee, Kotuwa, Peach Blossoms, Odette, and HolyCrab.
        </p>
        {singaporeGuide.map((group) => (
          <details className="dining-group" key={group.category}>
            <summary>{group.category}<span>＋</span></summary>
            <div>
              {group.places.map(([name, description]) => (
                <a
                  key={name}
                  href={`https://maps.google.com/?q=${encodeURIComponent(name + " Singapore")}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span><strong>{name}</strong><small>{description}</small></span>
                  <b>↗</b>
                </a>
              ))}
            </div>
          </details>
        ))}
      </section>
    </details>
  );
}

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const s: Record<string, React.ReactNode> = {
    gallery: (<><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8" cy="8" r="1.5"/><path d="m3 17 6-6 4 4 3-3 5 5"/></>),
    more: (<><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>),
    home: (
      <>
        <path d="m3 10 9-7 9 7v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <path d="M9 21v-8h6v8" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 11h18" />
      </>
    ),
    hotel: (
      <>
        <path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4M9 9v.01M9 13v.01M9 17v.01M15 13v.01M15 17v.01" />
      </>
    ),
    plane: (
      <path d="M12 2c-.7 0-1 1-1 2v5L3 14v2l8-3v5l-3 2v2l4-1 4 1v-2l-3-2v-5l8 3v-2l-8-5V4c0-1-.3-2-1-2Z" />
    ),
    people: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M16 3a4 4 0 0 1 0 8M20 21v-2a4 4 0 0 0-3-4" />
        <circle cx="10" cy="7" r="4" />
      </>
    ),
    map: (
      <>
        <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15M15 6v15" />
      </>
    ),
    arrow: (
      <>
        <path d="M7 17 17 7M8 7h9v9" />
      </>
    ),
    phone: (
      <path d="M22 17v3a2 2 0 0 1-2 2A19 19 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2l.5 3a2 2 0 0 1-.5 2l-2 2a16 16 0 0 0 6 6l2-2a2 2 0 0 1 2-.5l3 .5a2 2 0 0 1 2 2z" />
    ),
    document: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16h16V8zM14 2v6h6M8 13h8M8 17h8" />
      </>
    ),
    compass: (
      <>
        <circle cx="12" cy="12" r="10" />
        <path d="m16 8-2 6-6 2 2-6z" />
      </>
    ),
    share: (
      <>
        <path d="M12 16V3M8 7l4-4 4 4M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-7" />
      </>
    ),
    close: <path d="m18 6-12 12M6 6l12 12" />,
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {s[name]}
    </svg>
  );
}
type Tab = "map" | "home" | "journey" | "hotels" | "info" | "more" | "gallery" | "td";
function TutorialHelp() {
  const [buffering, setBuffering] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [speed, setSpeed] = useState(1);
  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];

  return (
    <details className="info-accordion tutorial-help" onToggle={(event) => {
      if (!event.currentTarget.open) videoRef.current?.pause();
    }}>
      <summary>
        <span className="accordion-icon"><Icon name="phone" size={18} /></span>
        <span><small>GET TO KNOW YOUR APP</small><strong>Help &amp; Video Tutorial</strong></span>
        <b>＋</b>
      </summary>
      <div className="tutorial-content">
          <div className="kd-tutorial-invite"><span className="eyebrow">THERE’S SOMETHING NEW IN YOUR SUITCASE</span><h2>Unpack the journey</h2><p>Watch Xavier’s silent, interactive Wondercase welcome. The suitcase rolls in, then waits for you to unpack. Pause, replay or jump to a chapter whenever you like.</p><a className="button" href="/tutorial/k-d102-v0.003.html" target="_blank" rel="noopener noreferrer">Let’s Unpack ↗</a></div>
          <section className="info-install-guide">
            <div className="home-install-heading">
              <span className="home-install-icon" aria-hidden="true">＋</span>
              <div>
                <span className="eyebrow">KEEP THE JOURNEY CLOSE</span>
                <h2>Install this app</h2>
              </div>
            </div>
            <p>Place Vietnam, Cambodia &amp; Thailand on your phone’s Home Screen for quick access throughout the journey.</p>
            <details className="install-platform">
              <summary>
                <span></span>
                <strong>iPhone or iPad</strong>
                <b>＋</b>
              </summary>
              <ol>
                <li>Open this website in <strong>Safari</strong>.</li>
                <li>Tap the <strong>Share</strong> button—the square with an upward arrow.</li>
                <li>Scroll down and choose <strong>Add to Home Screen</strong>.</li>
                <li>Tap <strong>Add</strong> in the upper-right corner.</li>
              </ol>
            </details>
            <details className="install-platform">
              <summary>
                <span>◆</span>
                <strong>Android phone or tablet</strong>
                <b>＋</b>
              </summary>
              <ol>
                <li>Open this website in <strong>Google Chrome</strong>.</li>
                <li>Tap the <strong>three-dot menu</strong> in the upper-right corner.</li>
                <li>Choose <strong>Add to Home screen</strong> or <strong>Install app</strong>.</li>
                <li>Tap <strong>Install</strong> or <strong>Add</strong> to confirm.</li>
              </ol>
            </details>
          </section>

        <h3>Your app, step by step</h3>
        <p><a href="/instruction-booklet.html">Read the illustrated instruction booklet →</a></p>
        <p><a href="/tutorial/k-d102-quick-guide-v0.003.pdf" download>Download / print the Wondercase Quick Guide ↗</a></p>
        <div className="installation-videos"><h3>Install the app on your Home Screen</h3><p>Separate step-by-step videos you can watch, pause or download.</p><a href="/installation-help.html?phone=iphone">iPhone installation tutorial →</a><a href="/installation-help.html?phone=android">Android installation tutorial →</a></div>
        <p>A captioned tour of the xxx edition. No sound needed. Pause whenever you like or choose a slower speed below.</p>
        <video
          ref={videoRef}
          controls
          playsInline
          preload="metadata"
          aria-label="Vietnam, Cambodia &amp; Thailand app tutorial"
          onWaiting={() => setBuffering(true)}
          onPlaying={() => setBuffering(false)}
          onCanPlay={() => setBuffering(false)}
          onError={() => setBuffering(false)}
          onRateChange={(event) => setSpeed(event.currentTarget.playbackRate)}
        >
          <source src="/tutorial/traveler-tutorial.mp4?v=0.003" type="video/mp4" />
          <track kind="captions" src="/tutorial/traveler-tutorial.vtt" srcLang="en" label="English" />
          Your browser cannot play this video. Use the download link below.
        </video>
        {buffering && <LoadingIndicator label="Loading tutorial…" />}
        <div className="tutorial-speed">
          <label htmlFor="tutorial-playback-speed">Playback speed</label>
          <select id="tutorial-playback-speed" value={speed} onChange={(event) => {
            const nextSpeed = Number(event.target.value);
            if (videoRef.current) videoRef.current.playbackRate = nextSpeed;
            setSpeed(nextSpeed);
          }}>
            {!speeds.includes(speed) && <option value={speed}>{speed}×</option>}
            {speeds.map((rate) => <option key={rate} value={rate}>{rate}×{rate === 1 ? " (Normal)" : ""}</option>)}
          </select>
        </div>
        <p className="tutorial-tip">0.5× and 0.75× give you more time to read. 1.25×, 1.5× and 2× play faster. Use the video progress bar to go back or skip ahead.</p>
        <a href="/tutorial/traveler-tutorial.mp4?v=0.003" download>Download the tutorial video ↗</a>
      </div>
    </details>
  );
}

// The PDF build renders these same components and reads these same itinerary
// records. Keep traveler content here rather than maintaining a PDF-only copy.
export const tripContent = { days, hotels, hotelResources, localGuides, storytelling, internalFlights, tripDate, shortTripDate, longTripDate, tauck, travelerAlbumUrl, xavierPhoneDisplay, xavierPhoneUrl, xavierEmail };

function TravelerHome({ initialTab = "home", initialSelected = null }: { initialTab?: Tab; initialSelected?: number | null }) {
  const [tab, setTab] = useState<Tab>(initialTab === "journey" ? "home" : initialTab),
    [selected, setSelected] = useState<number | null>(initialSelected);
  const [essentialsSection, setEssentialsSection] = useState<string | null>(null);
  const [moreSection, setMoreSection] = useState<string | null>(null);
  const [learnDay, setLearnDay] = useState(5);
  const [hotelTarget, setHotelTarget] = useState<string | null>(null);
  const activeEssentialsSection = hotelTarget ? "hotels" : essentialsSection;
  const sectionScrollTarget = useRef<string | null>(null);
  useEffect(() => {
    const header=document.querySelector('.topbar');
    if(!header)return;
    const update=()=>document.documentElement.style.setProperty('--app-header-height',`${header.getBoundingClientRect().height}px`);
    update();
    const observer=new ResizeObserver(update);
    observer.observe(header);
    return ()=>observer.disconnect();
  }, []);

  useEffect(() => {
    const targetId = sectionScrollTarget.current;
    if (!targetId) return;
    sectionScrollTarget.current = null;
    const frame = requestAnimationFrame(() => {
      const section = document.getElementById(targetId);
      if (!section || section.hidden) return;
      const bannerHeight = document.querySelector('.topbar')?.getBoundingClientRect().height ?? 0;
      window.scrollTo({
        top: Math.max(0, window.scrollY + section.getBoundingClientRect().top - bannerHeight - 12),
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [activeEssentialsSection, moreSection]);

  const [homeOrder, setHomeOrder] = useState<'journey'|'announcements'>('journey');
  const [homeDateOverride, setHomeDateOverride] = useState<number | null>(null);
  useEffect(() => {
    if (localStorage.getItem('kd-home-first-v1') === 'announcements') setHomeOrder('announcements');
  }, []);
  useLayoutEffect(() => {
    if (tab === "hotels" && hotelTarget) {
      const card = document.getElementById(hotelTarget);
      if (card) { card.scrollIntoView({block:"start",behavior:"instant"}); card.focus({preventScroll:true}); return; }
    }
    if (tab === "home" && selected !== null) {
      const day = document.getElementById('home-day-detail');
      if (day) {
        const headerHeight = document.querySelector('.topbar')?.getBoundingClientRect().height ?? 0;
        window.scrollTo({top: Math.max(0, window.scrollY + day.getBoundingClientRect().top - headerHeight), behavior:'instant'});
        return;
      }
    }
    window.scrollTo({top:0,left:0,behavior:"instant"});
  }, [tab, selected, hotelTarget]);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    if(/(?:invite_token|recovery_token|confirmation_token|access_token)=/.test(window.location.hash)){window.location.replace('/master-admin'+window.location.hash);return()=>window.clearInterval(timer);}
    const params = new URLSearchParams(window.location.search);
    const requestedDay = Number(params.get('day'));
    if (requestedDay >= 1 && requestedDay <= 16) setSelected(requestedDay + 4);
    const requestedTab = params.get('tab');
    const requestedHotel = params.get('hotel');
    if (requestedTab === 'hotels' && /^hotel-[0-6]$/.test(requestedHotel || '')) setHotelTarget(requestedHotel);
    if (['home', 'journey', 'map', 'hotels', 'info', 'more', 'gallery', 'td'].includes(requestedTab || '')) setTab(requestedTab === 'journey' ? 'home' : requestedTab as Tab);
    return () => window.clearInterval(timer);
  }, []);
  const clock = now ? getJourneyStatus(now) : null;
  const currentDay = clock?.dayId ?? 5;
  const homeDay = homeDateOverride ?? currentDay;
  useEffect(() => {
    if ("serviceWorker" in navigator)
      navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  useEffect(() => {
    if (sessionStorage.getItem("kd-usage-open-recorded")) return;
    if (navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent)) return;
    const timer = window.setTimeout(() => {
      let visitorId = localStorage.getItem("kd-usage-visitor-id") || "";
      if (!visitorId) {
        visitorId = typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `traveler-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        localStorage.setItem("kd-usage-visitor-id", visitorId);
      }
      const name =
        localStorage.getItem("kd-usage-name") ||
        localStorage.getItem("kd-journal-author") ||
        "";
      fetch("/api/usage", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "open", visitorId, name }),
      })
        .then((response) => {
          if (response.ok) sessionStorage.setItem("kd-usage-open-recorded", "yes");
        })
        .catch(() => {});
    }, 5000);
    return () => window.clearTimeout(timer);
  }, []);
  function nav(t: Tab) {
    setHotelTarget(null);
    setTab(t);
    setSelected(null);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  function openDay(date: number) {
    setTab("home");
    setSelected(date);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  function startDaySwipe(event: React.TouchEvent<HTMLElement>) {
    if (event.touches.length !== 1) {swipeStart.current=null;return;}
    const target = event.target as HTMLElement;
    if (target.closest("button, a, input, textarea, select, summary, dialog, [contenteditable='true'], .resource-preview")) {
      swipeStart.current = null;
      return;
    }
    swipeStart.current = {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY,
    };
  }
  function finishDaySwipe(event: React.TouchEvent<HTMLElement>) {
    const start = swipeStart.current;
    swipeStart.current = null;
    if (!start || !detail || event.changedTouches.length !== 1) return;
    const deltaX = event.changedTouches[0].clientX - start.x;
    const deltaY = event.changedTouches[0].clientY - start.y;
    if (Math.abs(deltaX) < 70 || Math.abs(deltaX) < Math.abs(deltaY) * 1.35) return;
    if (deltaX < 0 && detail.date < 20) openDay(detail.date + 1);
    if (deltaX > 0 && detail.date > 5) openDay(detail.date - 1);
  }
  const detail = days.find((d) => d.date === selected);
  return (
    <main className="app-shell">
      {process.env.NEXT_PUBLIC_APP_ENV === "pretour" && (
        <div className="pretour-review-banner" role="note">PRE-TOUR REVIEW · Current content for your tab-by-tab review</div>
      )}
      {process.env.NEXT_PUBLIC_APP_ENV === "test" && (
        <div className="testing-banner" role="note">TEST VERSION · Changes here do not update the live app.</div>
      )}
      <header className="topbar">
        <div className="wondercase-lockup">
          <WondercaseMark />
          <div className="wondercase-titles">
            <strong><a className="wondercase-admin-entry" href="/master-admin">WONDERCASE</a></strong>
            <small>Vietnam, Cambodia &amp; Thailand</small>
            <span>xxx Edition</span>
          </div>
        </div>
      </header>
      {tab === "home" && (
        <>
          <section className="page home-calendar" aria-label="Journey overview"><TripCalendar onSelect={openDay}/></section>
          {!detail && <div className="home-panels">
            {(homeOrder === 'journey' ? ['journey','announcements'] : ['announcements','journey']).map(panel => <div key={panel}>
              {panel === 'journey' ? <CurrentTripDay key={homeDay} date={homeDay} now={now} onPrevious={() => setHomeDateOverride(Math.max(5, homeDay - 1))} onNext={() => setHomeDateOverride(Math.min(20, homeDay + 1))} /> : <XavierDailyNote key={homeDay} date={homeDay} home currentDay={homeDay === currentDay} />}
            </div>)}
          </div>}
        </>
      )}
      {tab === "home" && !detail && (
        <section className="page home-day-list">
          <h2>Explore all 16 days</h2>

          <div className="day-list">
            {days.map((d) => (
              <button
                className="day-card"
                key={d.date}
                onClick={() => openDay(d.date)}
              >
                <img className="journey-day-thumbnail" src={`/images/${d.image}`} alt={`Watercolor of ${d.region}`} loading="lazy" width={96} height={128} />
                <div>
                  <span className="date">
                    {weekday(d.date).toUpperCase()} · {shortTripDate(d.date).toUpperCase()}
                  </span>
                  <strong>{/Komodo|Dragons/i.test(d.title) && <span className="brand-komodo" aria-hidden="true"><img src="/brand/komodo-reference.jpeg" alt="" /></span>}{d.title}</strong>
                  <small>{d.region}</small>
                  <div className="badges">
                    {tauck(d.date) && (
                      <span className="tauck-badge">DAY {tauck(d.date)}</span>
                    )}
                  </div>
                </div>
                <i>›</i>
              </button>
            ))}
          </div>
          <section className="route-section journey-route-section"><h2>The journey at a glance</h2><p>Hanoi · Hue · Da Nang · Hoi An · Saigon · Siem Reap · Chiang Mai · Bangkok</p></section>
        </section>
      )}
      {tab === "home" && detail && (
        <section
          id="home-day-detail"
          key={`journey-day-${detail.date}`}
          className="detail swipe-enabled"
          onTouchStart={startDaySwipe}
          onTouchEnd={finishDaySwipe}
          onTouchCancel={() => {
            swipeStart.current = null;
          }}
        >
          <nav className="detail-nav" aria-label="Journey day navigation">
            <button
              className="detail-nav-arrow"
              disabled={detail.date === 5}
              onClick={() => openDay(detail.date - 1)}
              aria-label="Previous journey day"
            >
              ← <span>Previous</span>
            </button>
            <div className="sticky-day-summary">
              <div className="sticky-day-date"><strong>Day {tauck(detail.date)}</strong><span>{weekday(detail.date)} · {shortTripDate(detail.date)}</span></div>
              <button className="all-days-button" onClick={() => {setSelected(null); window.scrollTo({top:0});}}><span aria-hidden="true">▦</span> All 16 days</button>
            </div>
            <button
              className="detail-nav-arrow"
              disabled={detail.date === 20}
              onClick={() => openDay(detail.date + 1)}
              aria-label="Next journey day"
            >
              <span>Next</span> →
            </button>
          </nav>
          <p className="swipe-hint">← Swipe to explore another day →</p>
          <img className="detail-image" src={`/images/${detail.image}`} alt={`Watercolor of ${detail.region}`} width={480} height={320}/>
          
          <div className="detail-body">
            <div className="day-heading-meta">
              <strong>Day {tauck(detail.date)}</strong>
              <div><span className="detail-date">{longTripDate(detail.date)}</span><span className="day-local-time">{now?.toLocaleTimeString('en-US',{timeZone:"Asia/Bangkok",hour:'numeric',minute:'2-digit'}) ?? '–'} local time</span></div>
            </div>
            <h1>{detail.title}</h1>
            <XavierDailyNote date={detail.date} />
            <ResourceSlot id={`schedule-${detail.date}`} title="Today’s schedule" group="schedules" icon="calendar"><JourneyTimeline key={detail.date} day={detail.date} dateLabel={longTripDate(detail.date)} events={detail.events} note={detail.note} /></ResourceSlot>
            <div className="detail-footer">
              <div>
                <span className="eyebrow">TONIGHT’S STAY</span>
                {(() => {
                  const hotelIndex = hotels.findIndex(h => h.name === detail.hotel || (h.name === 'Four Seasons Resort at Sayan' && detail.hotel === 'Four Seasons Resort Bali at Sayan') || (h.name === 'Four Seasons Resort Jimbaran' && detail.hotel === 'Four Seasons Resort Bali at Jimbaran Bay'));
                  if (hotelIndex < 0) return <strong>{detail.hotel}</strong>;
                  const hotel = hotels[hotelIndex];
                  return <><a className="tonight-hotel-link" href={`/?tab=hotels&hotel=hotel-${hotelIndex}`} onClick={event => {event.preventDefault(); setHotelTarget(`hotel-${hotelIndex}`); setSelected(null); setTab('hotels');}}>{detail.hotel} <span aria-hidden="true">→</span></a>
</>;
                })()}
              </div>
              <div>
                <span className="eyebrow">MEALS</span>
                <strong>{detail.meals}</strong>
              </div>
            </div>
            {detail.date === days[0].date && <><XavierWelcomePanel expanded /></>}
            <JourneyHotelResources name={detail.hotel}/>
            <SafePlans key={`personal-${detail.date}`} date={tripDate(detail.date).toISOString().slice(0,10)} embedded/>
              {localGuides.filter(guide => guide.days.includes(detail.date)).map(guide => <ResourceSlot id={`local-${localGuides.indexOf(guide)}`} title="Meet your local guide" group="local-guides" icon="people" key={guide.name}><section className="local-guide-panel" aria-label="Meet your local guide"><span className="eyebrow">MEET YOUR LOCAL GUIDE</span><h2>{guide.name} <small>· {guide.destination}</small></h2><a href={`/images/${guide.image}`} target="_blank" rel="noreferrer" aria-label={`Open ${guide.name}’s guide card at full size`}><img src={`/images/${guide.image}`} alt={`${guide.name}, your local guide in ${guide.destination}`} /></a><p>{guide.introduction}</p></section></ResourceSlot>)}
            
            {internalFlights.filter(flight => flight.date === detail.date).map(flight => <section className="day-flight-panel" key={flight.date} aria-label="Today’s internal flight">
              <span className="eyebrow">TODAY’S INTERNAL FLIGHT</span>
              <div className="flight-route"><h3>{flight.route}</h3>
                <div className="flight-meta"><strong>{flight.airline}</strong><span>{flight.time}</span></div>
                {flight.duration && <span className="flight-duration">Flight duration: {flight.duration}</span>}
                <p>{flight.detail}</p>
              </div>
            </section>)}
            <div className="day-community-sections">
              {storytelling.some(story => story.days.includes(detail.date)) && <section className="storytelling-panel" aria-label="Stories of your destination"><span className="eyebrow">STORIES OF YOUR DESTINATION</span>{storytelling.filter(story => story.days.includes(detail.date)).map(story => <ResourceSlot key={story.id} id={`story-${story.id}`} title={story.title} group="stories"><p>{story.description}</p><a href={`/storytelling.html?story=${story.id}&day=${detail.date-4}`}>Read the illustrated story →</a></ResourceSlot>)}</section>}
              <TravelJournal date={detail.date} />
            </div>
            <details className="day-disclosure" key={`language-${detail.date}`}><summary>A little language lesson</summary><LocalLanguageLesson region={detail.region} /></details>
              <details className="day-disclosure" key={`trivia-${detail.date}`}><summary>How about some trivia?</summary><DailyTrivia date={detail.date} /></details>
            <div className="day-save-actions">
              <DayPhoto date={detail.date} dateLabel={longTripDate(detail.date)} title={detail.title} events={detail.events} note={detail.note} flight={internalFlights.find(flight=>flight.date===detail.date)} hotel={detail.hotel} />
              <PdfDownload url={`/api/export-itinerary?section=days&day=${tauck(detail.date)}`} label="Download this day as PDF" />
            </div>
          </div>
        </section>
      )}
      {tab === "hotels" && (
        <section className="page">
          <div className="intro"><h1>Travel essentials</h1></div>
          <div className="more-tile-grid" role="group" aria-label="Travel essentials sections">{[
            {key:'handouts',title:'Handouts',image:'/images/more-reading.svg'},
            {key:'hotels',title:'Hotels',image:'/images/essentials-hotels.svg'},
            {key:'flights',title:'Flights',image:'/images/essentials-flights.svg'},
            {key:'local-guides',title:'Local guides',image:'/images/essentials-local-guides.svg'},
          ].map(item=><button key={item.key} type="button" className="more-tile" disabled={item.key==='shop'} aria-expanded={activeEssentialsSection===item.key} aria-controls={`essentials-${item.key}`} onClick={()=>{const next=activeEssentialsSection===item.key?null:item.key;sectionScrollTarget.current=next?`essentials-${next}`:null;setEssentialsSection(next);setHotelTarget(null);}}><img src={item.image} alt=""/><strong>{item.title}</strong></button>)}</div>
          <section id="essentials-local-guides" hidden={activeEssentialsSection!=='local-guides'} aria-labelledby="local-guides-title"><h2 id="local-guides-title">Local guides</h2><ResourceGroup group="local-guides"/>{localGuides.map((guide,i)=><ResourceSlot key={guide.name} id={`local-${i}`} title={guide.name} group="local-guides" icon="people"><section className="local-guide-panel"><h3>{guide.name} · {guide.destination}</h3><img src={`/images/${guide.image}`} alt={guide.name}/><p>{guide.introduction}</p></section></ResourceSlot>)}</section>
          <section className="essentials-handouts" id="essentials-handouts" hidden={activeEssentialsSection!=='handouts'} aria-labelledby="handouts-title"><h2 id="handouts-title">Handouts</h2><Handouts/>
</section><section id="essentials-hotels" hidden={activeEssentialsSection!=='hotels'} aria-labelledby="stays"><h2 id="stays">Hotels</h2><p>Overnight stays · November 16–December 1, 2026. Vedana Lagoon Resort is a lunch stop on November 19, not an overnight stay.</p>
          <div className="hotel-list">
            {hotels.map((h, i) => (
              <article className="hotel-card" id={`hotel-${i}`} tabIndex={-1} key={h.name}>
                <div className="hotel-image">
                  <img src={`/images/${h.image}`} alt={i === 0 ? "Watercolor illustration of Hanoi; hotel to be confirmed" : `Watercolor illustration inspired by ${h.name}`} loading="lazy" width={1536} height={1024} />
                  <span>0{i + 1}</span>
                  <i>
                    {h.checkout - h.checkin} NIGHT
                    {h.checkout - h.checkin > 1 ? "S" : ""}
                  </i>
                </div>
                <div className="hotel-body">
                  <span className="eyebrow">{h.city.toUpperCase()}</span>
                  <h2>{h.name}</h2>
                  <div className="hotel-dates">
                    <div>
                      <small>CHECK IN</small>
                      <strong>{shortTripDate(h.checkin)}</strong>
                    </div>
                    <span>→</span>
                    <div>
                      <small>CHECK OUT</small>
                      <strong>{shortTripDate(h.checkout)}</strong>
                    </div>
                  </div>
                  <div className="badges">
                    {h.tauck && (
                      <span className="tauck-badge">
                        DAY{h.tauck.includes("–") ? "S" : ""} {h.tauck}
                      </span>
                    )}
                  </div>
                  {h.address && <p className="address">{h.address}</p>}<p>{h.note}</p>
                  
                  {hotelResources.filter(item=>item.hotel===h.name).map(item=><ResourceSlot key={item.id} id={`menu-${item.id}`} title={item.title} group={`hotel-${i}`} icon={item.category.includes('Spa')?'spa':'food'}><a href={`/hotel-menus.html?menu=${item.id}`}>{item.title} →</a><p>{item.note}</p></ResourceSlot>)}
                  <ResourceGroup group={`hotel-${i}`}/>
                  <div className="hotel-actions">
                    {h.website && <a href={h.website} target="_blank" rel="noreferrer">
                      WEBSITE ↗
                    </a>}
                    {i > 0 && <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(h.name + " " + h.city)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      MAP ↗
                    </a>}
                    {h.phone && <a href={`tel:${h.phone.replace(/\s/g, "")}`}>CALL ↗</a>}
                  </div>
                </div>
              </article>
            ))}
          </div>
          </section>
          <section id="essentials-flights" hidden={activeEssentialsSection!=='flights'} className="flight-section" aria-labelledby="internal-flights-title">
            <span className="eyebrow">BETWEEN DESTINATIONS</span>
            <h2 id="internal-flights-title"><BrandIcon name="plane"/> Internal flights</h2>
            <div className="flight-list">
              {internalFlights.map((flight) => (
                <article className="flight-card" key={flight.date}>
                  <div className="flight-date">
                    <strong>{shortTripDate(flight.date)}</strong>
                    <small>DAY {tauck(flight.date)}</small>
                  </div>
                  <div className="flight-route">
                    <h3>{flight.route}</h3>
                    <div className="flight-meta"><strong>{flight.airline}</strong><span>{flight.time}</span></div>
                    {flight.duration && <span className="flight-duration">Flight duration: {flight.duration}</span>}
                    <p>{flight.detail}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

        </section>
      )}
      {tab === "map" && <JourneyMaps/>}
      {tab === "info" && <section className="page info-page travelers-page"><XavierContactCard onSuitcase={()=>nav("td")}/><GuestProfiles/></section>}
      {tab === "more" && <section className="section more-page">
        <h1>More</h1>

        <div className="more-tile-grid">{[
          {key:'reading',title:'Recommended reading',icon:'book',image:'/images/more-reading.svg'},
          {key:'learn',title:'Learn more',icon:'info',image:'/images/more-learn.svg'},
          {key:'tauck',title:'More Tauck experiences',icon:'map',image:'/images/more-travel.svg'},
          {key:'help',title:'Help & Tutorials',icon:'book',image:'/images/more-help.svg'},
          {key:'shop',title:'Journey Shop',icon:'shop',image:'/images/more-shop.svg'},
          {key:'rating',title:'Help Wondercase Grow',icon:'feedback',image:'/images/more-grow.svg'},
        ].map(item=><button key={item.key} type="button" className="more-tile" disabled={item.key==='shop'} aria-expanded={moreSection===item.key} aria-controls={`more-${item.key}`} onClick={()=>{const next=moreSection===item.key?null:item.key;sectionScrollTarget.current=next?`more-${next}`:null;setMoreSection(next);}}><img src={item.image} alt=""/><strong>{item.title}</strong><small>{item.key==='learn'?'Trivia & language':item.key==='help'?'FAQs, how-tos & tutorials':item.key==='shop'?'Coming soon':item.key==='rating'?'Your ideas help us bloom':null}</small></button>)}</div>
        {moreSection==='help'&&<HelpAndTutorials/>}
        {moreSection==='learn'&&<section id="more-learn" className="more-open-panel"><h2>Learn more</h2><label>Choose a journey day<select value={learnDay} onChange={event=>setLearnDay(Number(event.target.value))}>{days.map(day=><option key={day.date} value={day.date}>Day {tauck(day.date)} · {day.title}</option>)}</select></label><LocalLanguageLesson key={`learn-language-${learnDay}`} region={days.find(day=>day.date===learnDay)!.region}/><DailyTrivia key={`learn-trivia-${learnDay}`} date={learnDay}/></section>}

        <RecommendedReading visible={moreSection==='reading'}/>
        <details id="more-tauck" key={`tauck-${moreSection}`} hidden={moreSection!=='tauck'} open className="day-disclosure asia-journeys"><summary>More Tauck experiences</summary><div className="asia-journeys-list"><article className="asia-journey-card"><span className="asia-journey-duration">14 days</span><h2>Kingdoms &amp; Dragons: Singapore to Bali</h2><p>Journey from Singapore through Java, Bali and Flores, exploring Borobudur and Prambanan, Ubud and Komodo National Park, before ending in Jimbaran Bay.</p><a href="https://www.tauck.com/tours/kingdoms-dragons-singapore-bali-escorted-tour" target="_blank" rel="noopener noreferrer" aria-label="View Kingdoms &amp; Dragons: Singapore to Bali on Tauck (opens in a new tab)">View tour on Tauck ↗</a></article><article className="asia-journey-card"><span className="asia-journey-duration">16 days</span><h2>The Mekong, Vietnam, Laos &amp; Cambodia</h2><p>Ho Chi Minh City, Hanoi, Phnom Penh, Siem Reap and Luang Prabang.</p><a href="https://www.tauck.com/tours/indochina-vietnam-cambodia-laos-escorted-tour" target="_blank" rel="noopener noreferrer" aria-label="View The Mekong, Vietnam, Laos &amp; Cambodia on Tauck (opens in a new tab)">View tour on Tauck ↗</a></article><article className="asia-journey-card"><span className="asia-journey-duration">18 days</span><h2>A Portrait of India</h2><p>New Delhi, Agra, Jaipur, Udaipur, Mumbai, Kochi, Kumarakom and Varanasi.</p><a href="https://www.tauck.com/tours/portrait-of-india-escorted-tour" target="_blank" rel="noopener noreferrer" aria-label="View A Portrait of India on Tauck (opens in a new tab)">View tour on Tauck ↗</a></article><article className="asia-journey-card"><span className="asia-journey-duration">18 days</span><h2>Northern India &amp; Nepal</h2><p>New Delhi, Kathmandu, Dhulikhel, Mumbai, Bandhavgarh National Park and Chitwan National Park.</p><a href="https://www.tauck.com/tours/northern-india-and-nepal-escorted-tour" target="_blank" rel="noopener noreferrer" aria-label="View Northern India &amp; Nepal on Tauck (opens in a new tab)">View tour on Tauck ↗</a></article><article className="asia-journey-card"><span className="asia-journey-duration">13 days</span><h2>India’s Golden Triangle, Udaipur &amp; Mumbai</h2><p>New Delhi, Agra, Jaipur, Udaipur, Varanasi and Mumbai.</p><a href="https://www.tauck.com/tours/spotlight-on-india-guided-tour" target="_blank" rel="noopener noreferrer" aria-label="View India’s Golden Triangle, Udaipur &amp; Mumbai on Tauck (opens in a new tab)">View tour on Tauck ↗</a></article></div></details>
        <details id="more-rating" key={`rating-${moreSection}`} hidden={moreSection!=='rating'} open className="day-disclosure feedback-disclosure"><summary>Help Wondercase Grow</summary><AppRatings /></details>
      </section>}
      {tab === "gallery" && <section className="section gallery-page"><h1>Gallery</h1><article className="album-invite"><span className="eyebrow">PHOTOCIRCLE</span><h2>Our shared memories</h2><p>View and share photos from our journey.</p>{travelerAlbumUrl?<a className="album-join-link" href={travelerAlbumUrl} target="_blank" rel="noopener noreferrer">Join our photo album <span aria-hidden="true">↗</span></a>:<p>The photo album is coming soon.</p>}<small>Opens in PhotoCircle</small></article></section>}
      {tab === "td" && <TDSuitcase days={days} dateLabel={longTripDate} onBack={()=>nav("more")} announcement={day=><XavierDailyNote key={day} date={day}/>} groups={[{id:'handouts',title:'Handouts'},{id:'maps',title:'Maps'},{id:'guides',title:'Destination guides & documents'},...hotels.map((h,i)=>({id:`hotel-${i}`,title:h.name})),{id:'stories',title:'Destination stories'},{id:'local-guides',title:'Local guides'}]} resources={[
       {id:'guide-singapore',title:'Singapore Guide',group:'guides',content:<span/>},
       {id:'guide-java',title:'Java Guide',group:'guides',content:<XavierJavaGuide/>},
       {id:'guide-bali',title:'Bali Guide',group:'guides',content:<XavierBaliGuide/>},
       {id:'guide-bali-map',title:'Bali Map',group:'guides',content:<BaliMap/>},
       ...hotelResources.map(r=>({id:`menu-${r.id}`,title:r.title,group:`hotel-${hotels.findIndex(h=>h.name===r.hotel)}`,content:<a href={`/hotel-menus.html?menu=${r.id}`} target="_blank" rel="noreferrer">Open {r.title} ↗</a>})),
       ...storytelling.map(r=>({id:`story-${r.id}`,title:r.title,group:r.hotelIndex>=0?`hotel-${r.hotelIndex}`:'stories',content:<a href={`/storytelling.html?story=${r.id}`} target="_blank" rel="noreferrer">Open {r.title} ↗</a>})),
       ...localGuides.map((r,i)=>({id:`local-${i}`,title:r.name,group:'local-guides',content:<img src={`/images/${r.image}`} alt={r.name}/>}))
      ]}/>}
      <footer className="footer">
        Vietnam, Cambodia &amp; Thailand · xxx edition · 2026
      </footer>
      <nav className="bottom-nav" aria-label="Main navigation">
        {(
          [
            { key: "home", label: "Home", icon: "home" },
            { key: "map", label: "Maps", icon: "map" },
            { key: "hotels", label: "Essentials", icon: "book" },
            { key: "gallery", label: "Gallery", icon: "gallery" },
            { key: "info", label: "The Group", icon: "people" },
            { key: "more", label: "More…", icon: "more" },
          ] as const
        ).map((x) => (
          <button
            key={x.key}
            className={tab === x.key ? "active" : ""}
            onClick={() => {if(x.key==='gallery'&&travelerAlbumUrl){window.open(travelerAlbumUrl,'_blank','noopener,noreferrer');}else nav(x.key);}}
          >
            <BrandIcon name={x.icon} />
            <span>{x.label}</span>
          </button>
        ))}
      </nav>
    </main>
  );
}

export default function Home(props: {initialTab?: Tab;initialSelected?:number|null}) {
 return <TDProvider><ResourceProvider><TravelerHome {...props}/></ResourceProvider></TDProvider>;
}
