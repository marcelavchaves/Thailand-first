import { build } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { load } from 'cheerio';
import { createHash } from 'node:crypto';
import { readdir, readFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

export const root = process.cwd();
export const clean = value => value.replace(/\s+/g, ' ').trim();
export const digest = value => createHash('sha256').update(value).digest('hex');
export const baseUrl = 'https://kd-103-pretour.netlify.app';
export const absolute = href => new URL(href, baseUrl).href;

export async function sourceHash() {
  const hash = createHash('sha256');
  async function walk(dir) {
    for (const entry of (await readdir(path.join(root, dir), { withFileTypes: true })).sort((a,b) => a.name.localeCompare(b.name))) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(file);
      else { hash.update(file); hash.update(await readFile(path.join(root, file))); }
    }
  }
  for (const dir of ['app', 'scripts', 'public/images', 'public/documents']) await walk(dir);
  for (const file of ['package.json', 'package-lock.json', 'next.config.ts', 'netlify.toml']) hash.update(await readFile(path.join(root, file)));
  hash.update(baseUrl);
  return hash.digest('hex');
}

// Render actual traveler components, including closed accordions. Browser-only
// effects (private usage, live notes and memories) never run in this process.
export async function readAppContent() {
  await mkdir('.pdf-build', { recursive: true });
  await build({ stdin: { contents: 'export {default, tripContent} from "./app/TravelerApp"; export {getDailyQuestions} from "./app/DailyTrivia"; export {scoreQuestions} from "./app/AppRatings"; export {default as LocalLanguageLesson} from "./app/LocalLanguageLesson";', resolveDir: root, loader: 'tsx' }, outfile: '.pdf-build/content.cjs', bundle: true, platform: 'node', format: 'cjs', loader: { '.css': 'empty' }, jsx: 'automatic', external: ['react', 'react-dom', 'react/jsx-runtime'], logLevel: 'silent' });
  const { default: bundle } = await import(path.join(root, '.pdf-build/content.cjs'));
  const { tripContent: data, getDailyQuestions } = bundle;
  const render = props => load(renderToStaticMarkup(React.createElement(bundle.default, props)));
  const info = render({ initialTab: 'info' });
  const home = render({ initialTab: 'home' });
  const documents = new Map();
  const links = new Set();

  function blocks($, element) {
    const result = [];
    const textOf = node => node.type === 'text' ? node.data : (node.children || []).map(textOf).join(' ');
    const addText = (text, kind = 'text') => { if (clean(text)) result.push({ kind, text: clean(text) }); };
    function visit(node) {
      if (node.type === 'text') { addText(node.data); return; }
      if (!node.tagName) return;
      const el = $(node), tag = node.tagName;
      if (el.is('[data-pdf-exclude]')) return;
      if (['svg','script','style','button','video','select','input','textarea'].includes(tag) || el.attr('aria-hidden') === 'true') return;
      if (el.hasClass('guest-entry')) {
        const entry=el.clone();entry.find('[data-pdf-exclude]').remove();
        const name=entry.find('.guest-details > strong').text();const origin=entry.find('.guest-origin').text();const intro=entry.find('.guest-introduction > p').text();
        result.push({kind:'text',text:clean(`${name} · ${origin} · ${intro}`),guestId:el.attr('data-guest-id')});return;
      }
      if (el.hasClass('resource-card')) {
        result.push({kind:'heading',text:clean(el.find('h3').text()),keepHeight:170});
        el.find('p, a').each((_, child) => visit(child));
        return;
      }
      if (el.hasClass('asia-journey-card')) {
        addText(el.find('h2').text() + ' · ' + el.find('.asia-journey-duration').text(), 'heading');
        el.find('p, a').each((_, child) => visit(child));
        return;
      }
      if (tag === 'img') {
        const src = el.attr('src');
        if (src?.startsWith('/documents/')) {
          const title = el.attr('alt') || 'Journey reference';
          documents.set(src, title);
          links.add(absolute(src));
          result.push({kind:'link',text:'Open original: ' + title,href:absolute(src)});
        }
        return;
      }
      if (tag === 'a') {
        const href = el.attr('href');
        if (href) {
          links.add(absolute(href));
          const text = clean(textOf(node)) || el.attr('aria-label');
          if (text) result.push({ kind: 'link', text, href: absolute(href) });
        }
        el.find('img').each((_, img) => visit(img));
        return;
      }
      if (tag === 'summary') {
        const title = el.find('strong').first().text() || el.text().replace(/[＋+]/g, '');
        addText(title, 'heading'); return;
      }
      if (/^h[1-6]$/.test(tag)) { addText(el.contents().map((_, child) => $(child).text()).get().join(' '), 'heading'); return; }
      if (['p','li','figcaption'].includes(tag)) {
        addText(tag === 'li' && !el.hasClass('guest-entry') && el.find('strong').length && el.find('span').length ? el.find('strong').text() + ' · ' + el.find('span').text() : textOf(node));
        el.find('a').each((_, a) => visit(a)); return;
      }
      // Group adjacent inline nodes so labels/names retain natural spacing.
      let inline = '';
      const flush = () => { addText(inline); inline = ''; };
      el.contents().each((_, child) => {
        if (child.type !== 'text' && $(child).attr('aria-hidden') === 'true') return;
        if (child.type === 'text') inline += child.data;
        else if (['span','small','strong','b','sup','i','label'].includes(child.tagName) && !$(child).find('a,img').length) inline += ' ' + $(child).text() + ' ';
        else { flush(); visit(child); }
      });
      flush();
    }
    visit(element);
    return result;
  }
  const directorPhoto="data:image/jpeg;base64,"+(await readFile(path.join(root,"public/images/xavier-brunelle.jpeg"))).toString("base64");
  const sections = [];
  const essentials=render({initialTab:"journey",initialSelected:data.days[0].date});
  const welcome=essentials(".xavier-welcome-panel").first();
  if(welcome.length)sections.push({id:"welcome",title:"Xavier’s Welcome Letter",blocks:blocks(essentials,welcome[0])});
  info('.info-page').children().each((i, element) => {
    const el = info(element);
    const title = el.find('summary strong, h1, h2, h3').first().contents().map((_, child) => info(child).text()).get().join(' ') || (el.hasClass('traveler-album-card') ? 'Shared Tour Album' : `Trip information ${i+1}`);
    const sectionBlocks=el.hasClass("director-simple") ? [{kind:"heading",text:"Xavier Brunelle · Your tour director"},{kind:"text",text:`WhatsApp · ${data.xavierPhoneDisplay}`},{kind:"text",text:`Email · ${data.xavierEmail}`},{kind:"text",text:"KD 103 WhatsApp group · Invitation coming soon"}] : el.hasClass("xavier-contact-card") ? [{kind:"text",text:"",photo:directorPhoto,directorPhoto:true},...blocks(info,element)] : blocks(info,element);
    sections.push({ id: `info-${i}`, title: clean(title), blocks: sectionBlocks });
  });
  for (const tab of ['more','gallery']) {
    const page=render({initialTab:tab});
    const panel=page(`.${tab}-page`).first();
    sections.push({id:`tab-${tab}`,title:tab==='more'?'More…':'Photos',blocks:blocks(page,panel[0])});
  }
  const featureBlocks = [
    {kind:"heading",text:"Download selected journey content"},
    {kind:"text",text:"Tap Export a section in the travel book to save one or more days, hotels and flights, guides and resources, or the full itinerary. Each journey day also has Download this day as PDF. Downloads reflect the latest saved schedules and include a Back to app link."},
    {kind:'heading',text:'Home and today’s plans'},
    {kind:'text',text:'Home and the journey page for today show the same date-specific Xavier announcement. Memory links can be pasted directly into the body text; separate restaurant, website and album fields have been removed. Home has a compact illustrated cover banner in light green and gold tones, followed by Xavier’s announcements and a rounded journey panel with the date and local time together on one line. The panel combines the journey status, date, Day number, title and destination together in an evenly spaced row and a green-and-gold button to open today’s journey. The journey map follows this panel and a green travel-book panel with a matching green-and-gold button. Find Xavier’s contact card at the top of Info, with phone and email side by side; expand About Xavier to read his biography. The shared album is available only in Photos. Each journey day has a shorter, proportionally cropped banner, a Day number beside the introduction, and a clear All 14 days button beneath its Day number and date. Timeline times use larger text; tap a time to enlarge it with its activity details. Close the panel with Close, Escape, or a tap outside it.'},
    {kind:'heading',text:'Meet your fellow travelers'},
    {kind:'text',text:'In Info, guest profiles appear two side by side, each with a photo above the name and hometown, followed by A little about me. Tap a guest’s photo, name, or profile area to open a larger photo, hometown, and approved introduction. An olive-green Introduction available indicator means there is more to read. Email and WhatsApp details are not displayed on guest cards. Open your profile and use Write your own introduction to send your introduction to Xavier for review.'},
    {kind:'heading',text:'Your journey, hotels, and stories'},
    {kind:'text',text:'Each journey day includes its itinerary. Expand How about some trivia? at the bottom of each day to play the daily quiz, or A little language lesson to see vocabulary and pronunciation. Both panels start collapsed. The More… tab has an expandable collection of books, online heritage resources, films and traveler perspectives and five suggested Tauck journeys across Asia, with trip lengths, destinations and links to the official tour pages. Photos opens the shared PhotoCircle album for viewing and adding photos. Tonight’s stay opens the matching hotel in Hotels + Flights. Explore the local guide cards, optional tours, hotel menus, and illustrated destination stories where available. Documents include a return link to the app.'},
    {kind:'heading',text:'Memories and feedback'},
    {kind:'text',text:'Share memories and comments in the journey journal. In Add a memory, write your message and choose Add photos or files, then press Post memory to save everything together. Select up to three JPG, PNG or WebP photos (10 MB before automatic resizing) or PDFs (4 MB each). Keep the page open until saving finishes; selected files are not retained after closing or reloading. Photos open separately and PDFs download, allowing you to return to the app. Only the original posting device can add or remove attachments; deleting a memory also removes its files. In More…, expand Rate the app — share your feedback to complete Kingdoms & Dragons App Feedback. The name defaults to Anonymous and can be changed. The single overall rating starts at zero and accepts half-star ratings from 0 to 5.'},
    ...bundle.scoreQuestions.map(([,label])=>({kind:'text',text:'Rate: '+label})),
    {kind:'text',text:'Optional comments: What worked especially well for you? What could be improved? Was there anything you wished the app included? Any other comments or suggestions?'},
    {kind:'text',text:'Feedback is shared with fellow travelers. Only the submitting browser/device can edit or delete its feedback, using Edit my feedback or Delete my feedback. Clearing browser data removes that access. Current comments, announcements, and feedback are viewed in the app; this PDF is a downloaded snapshot.'},
    {kind:'heading',text:'Help and Tour Director access'},
    {kind:'text',text:'Installation instructions, the tutorial video with speed controls, and the instruction booklet are at the bottom of Info. Xavier’s authenticated Tour Director access manages announcements, daily timeline changes, guest photo uploads, and introduction approval. When signed in, Xavier can change his own contact-card photo or restore the original. The travel book uses the current photo when opened.'},
    {kind:'link',text:'Open the app and feedback survey',href:absolute('/?tab=more')},
    {kind:'link',text:'Open Info for guest profiles and help',href:absolute('/?tab=info')},
  ];
  sections.push({id:'app-features',title:'Using your app — latest features',blocks:featureBlocks});
  featureBlocks.filter(b=>b.href).forEach(b=>links.add(b.href));
  const installation = home('.home-install-guide').get(0);
  if (installation) sections.splice(2, 0, { id: 'install', title: clean(home(installation).find('h2').text()), blocks: blocks(home, installation) });
  home('img[src="/images/journey-map.png"]').each((_, element) => {
    documents.set(home(element).attr('src'), home(element).attr('alt') || 'Journey map');
  });
  const languageLessons = [];
  const optionalTours = [];
  // Include supplemental day-only material, such as the Singapore excursion sheets.
  for (const day of data.days) {
    const $ = render({ initialTab: 'journey', initialSelected: day.date });
    const dayResources=$('.optional-tour, .dining-guide-accordion');
    if(dayResources.length) optionalTours.push({date:day.date,blocks:dayResources.toArray().flatMap(element=>blocks($,element))});
    const lesson=load(renderToStaticMarkup(React.createElement(bundle.LocalLanguageLesson,{region:day.region})));
    languageLessons.push({date:day.date,blocks:blocks(lesson,lesson('.local-language-lesson').get(0))});
    $('.detail img, .detail a').each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('href');
      if (src?.startsWith('/documents/')) documents.set(src, $(el).attr('alt') || clean($(el).text()) || 'Journey reference');
    });
  }
  return {
    data, sections, languageLessons, optionalTours, documents: [...documents].map(([src, title]) => ({ src, title })),
    links: [...links],
    guests: info('.guest-list li strong').map((_, el) => clean(info(el).text())).get(),
    title: clean(home('.hero h1').contents().map((_, node) => home(node).text()).get().join(' ')) || 'Kingdoms & Dragons',
    milestone: clean(home('.hero-tour-date strong').text()) || '103rd Tour',
    trivia: data.days.map(day => ({ date: day.date, questions: getDailyQuestions(day.date) })),
    sourceHash: await sourceHash(),
  };
}
