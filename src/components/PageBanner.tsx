import SafeImage from './SafeImage';

/** The photographic page header used by the reference's company pages. */
export default function PageBanner({ title, image, alt }: { title: string; image: string; alt: string }) {
  return <header className="nita-page-banner">
    <SafeImage src={image} alt={alt} className="nita-page-banner-photo" />
    <h1>{title}</h1>
  </header>;
}
