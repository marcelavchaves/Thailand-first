import MapHandout from '../MapHandout';
import {TDProvider} from '../TDSession';
import {ResourceProvider} from '../ResourceLibrary';
export default function Page(){return <TDProvider><ResourceProvider><MapHandout/></ResourceProvider></TDProvider>;}
