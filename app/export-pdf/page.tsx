import manifest from "../../public/itinerary-manifest.json";
import ExportChooser from "./ExportChooser";
export default function ExportPage(){const days=manifest.sections.filter(s=>/^day-\d+$/.test(s.id)).map(s=>({number:Number(s.id.slice(4))-4,title:s.title}));return <ExportChooser days={days}/>;}
