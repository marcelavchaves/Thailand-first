import BrandIcon from './BrandIcon';
import './wondercase-gallery.css';
export const galleryUrl='https://photos.omnifizer.com/?g=79d7a798-f26b-483b-a48d-c2b35f7780bdfead94bf';
export default function WondercaseGallery(){
 return <section className="section gallery-page wondercase-gallery"><h1 className="tab-page-title">Gallery</h1><article className="gallery-welcome"><BrandIcon name="camera"/><h2>Wondercase Photo Gallery</h2><p>Open our shared photo gallery.</p><a className="gallery-open-link" href={galleryUrl} target="_blank" rel="noopener noreferrer"><BrandIcon name="camera"/>Open photo gallery <span aria-hidden="true">↗</span></a><small>Opens in a new window.</small></article></section>;
}
