import itinerary from "../itinerary.json";
import ExportChooser from "./ExportChooser";
export default function ExportPage(){const days=itinerary.map(day=>({number:day.date-4,title:day.title}));return <ExportChooser days={days}/>;}
