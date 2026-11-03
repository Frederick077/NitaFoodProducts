import { useState } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import {
  academyAliases, academyContactLink, academyEnquiries, academyImages, academyPillars,
  agricultureSections, communitySections, educationalTopics, maternalGuide, maternalReferences,
  maternalSections, type AcademyImageId, type AcademyImageSlot,
} from '../data/educationalHub';

function AcademyPhoto({ id, priority = false }: { id: AcademyImageId; priority?: boolean }) {
  const slot: AcademyImageSlot = academyImages[id];
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const photo = slot.image;
  const available = photo && failedSource !== photo.src;
  if (!available) return null;
  return <figure className={`academy-photo academy-photo-${id} academy-photo--loaded`} data-academy-slot={id}>
    <div className="academy-photo-frame">
      <img src={photo.src} srcSet={photo.srcSet} sizes={photo.sizes} width={photo.width ?? 1920} height={photo.height ?? 2560} alt={photo.alt} title={photo.illustrative ? 'Illustrative photograph; not a NITA activity, participant, farm or product.' : undefined} style={{ objectFit: photo.fit || 'contain' }} loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : undefined} decoding="async" onError={() => setFailedSource(photo.src)} />
    </div>
  </figure>;
}

export function AcademyAlias() {
  const { topic } = useParams();
  const location = useLocation();
  const slug = topic ? academyAliases[topic] || topic : '';
  return <Navigate replace to={`/educational-hub${slug ? '/' + slug : ''}${location.search}${location.hash}`} />;
}

function AcademyNavigation({ current }: { current?: string }) {
  return <nav className="academy-program-nav" aria-label="Academy pages">
    <Link to="/educational-hub" aria-current={!current ? 'page' : undefined}>Nita Nutrition Academy</Link>
    {educationalTopics.map(topic => <Link key={topic.slug} to={`/educational-hub/${topic.slug}`} aria-current={current === topic.slug ? 'page' : undefined}>{topic.title}</Link>)}
  </nav>;
}

function ProgramHeader({ category, title, children }: { category: string; title: string; children: React.ReactNode }) {
  return <header className="academy-program-header"><p className="academy-identifier">{category}</p><h1>{title}</h1><div className="academy-prose">{children}</div></header>;
}

function AcademyLanding() {
  return <>
    <header className="academy-intro">
      <div><p className="academy-identifier">NITA FOOD PRODUCTS &mdash; NUTRITION EDUCATION</p><h1>Welcome to the Nita Nutrition Academy</h1>
        <p className="academy-lead">Making nutrition practical, accessible, understandable, and sustainable for every Tanzanian family.</p>
        <div className="academy-prose"><p>At Nita Food Products, we believe that providing nutritious food is only half the solution. True, lasting health happens when families understand the value of the food available to them and know how to prepare it to protect their health.</p>
          <p>Our educational programs bridge the gap between traditional food habits and formal healthcare. We work directly at the grass-roots level, empowering local communities to transition from passive recipients of aid to self-reliant producers of their own nutritional security.</p></div>
      </div><AcademyPhoto id="A1" priority />
    </header>
    <section className="academy-pillars" aria-labelledby="academy-pillars-title"><div className="academy-section-heading"><h2 id="academy-pillars-title">Our Three Educational Pillars</h2></div>
      {academyPillars.map(pillar => <article className="academy-pillar" key={pillar.slug}>
        <AcademyPhoto id={pillar.image} /><div className="academy-pillar-copy"><span className="academy-number" aria-hidden="true">{pillar.number}</span><h3>{pillar.title}</h3><p>{pillar.text}</p><Link className="nita-story-link" to={`/educational-hub/${pillar.slug}`}>{pillar.cta}</Link></div>
      </article>)}
    </section>
  </>;
}

function CommunityPage() {
  return <>
    <div className="academy-community-intro"><ProgramHeader category="COMMUNITY & CLINIC TRAINING" title="Bringing Nutrition to the Heart of the Village"><p>We partner with community clinics, maternal and child health services, and village savings groups (Vikoba) to deliver hands-on, practical food education.</p></ProgramHeader><AcademyPhoto id="C1" priority /></div>
    <section className="academy-community-sections" aria-labelledby="community-work"><h2 id="community-work">What We Do in the Community</h2>
      {communitySections.map((section, i) => <article className={`academy-community-feature academy-community-feature-${i + 1}`} key={section.image}><div className="academy-prose"><h3>{section.title}</h3><p>{section.text}</p>{i === 2 && <p className="academy-caption">Nita Nutrition Ambassador is NITA's program designation; it does not imply external accreditation.</p>}</div><AcademyPhoto id={section.image} /></article>)}
    </section>
    <section className="academy-invitation" aria-labelledby="community-partnership"><div><h2 id="community-partnership">Are you a community leader or health officer?</h2><p>Partner with us to bring a Nita Cooking Demonstration to your village clinic.</p></div><Link className="nita-contact-action" to={academyContactLink(academyEnquiries.community)}>Request a Partnership Training</Link></section>
  </>;
}

function MaternalPage() {
  return <>
    <div className="academy-maternal-intro"><ProgramHeader category="MATERNAL & LACTATION SUPPORT" title="Empowering Mothers, Protecting Newborns"><p>Postpartum and lactating mothers in rural areas carry heavy physical workloads. Alongside limited dietary variety, these demands can make caring for maternal health and feeding a baby more difficult.</p><p>Our educational guides help mothers care for their health and find appropriate support for their child's nutrition.</p></ProgramHeader><AcademyPhoto id="M1" priority /></div>
    <aside className="academy-health-note" aria-label="General information"><p>This page offers general nutrition education and does not replace qualified healthcare guidance. Speak with a healthcare professional about anemia, breastfeeding concerns or your baby's feeding needs.</p></aside>
    <section className="academy-guidelines" aria-labelledby="maternal-guidelines"><h2 id="maternal-guidelines">Key Nutritional Guidelines for New Mothers</h2>
      <nav className="academy-contents" aria-label="Maternal nutrition guidelines">{maternalSections.map((section, i) => <a key={section.image} href={`#maternal-guideline-${i + 1}`}>{i + 1}. {section.title}</a>)}</nav>
      {maternalSections.map((section, i) => <article className="academy-guideline" key={section.image} id={`maternal-guideline-${i + 1}`}><div className="academy-guideline-copy"><span className="academy-number" aria-hidden="true">0{i + 1}</span><h3>{section.title}</h3><p>{section.text}</p></div><AcademyPhoto id={section.image} /></article>)}
    </section>
    <section className="academy-guide" aria-labelledby="maternal-guide-title"><AcademyPhoto id="M5" /><div><h2 id="maternal-guide-title">Download Our Visual Guide</h2><p>Get our free Swahili Pictorial Guide for Maternal Nutrition. Perfect for printing or sharing via mobile phones in rural communities.</p>
      {maternalGuide.href ? <a className="nita-contact-action" href={maternalGuide.href} download>{maternalGuide.label}</a> : <><button type="button" className="nita-contact-action" disabled aria-describedby="maternal-guide-status">{maternalGuide.label}</button><p className="academy-guide-status" id="maternal-guide-status">Coming soon. The download will be available when the approved guide is uploaded.</p></>}
    </div></section>
    <aside className="academy-references" aria-labelledby="maternal-reading"><h2 id="maternal-reading">Further reading</h2><p>General health guidance for the educational topics above. These organizations are not presented as NITA partners or endorsers.</p><ul>{maternalReferences.map(source => <li key={source.url}><a href={source.url}>{source.title}</a></li>)}</ul></aside>
  </>;
}

function AgriculturePage() {
  return <>
    <ProgramHeader category="SUSTAINABLE FARMING EDUCATION" title="Farming for Nutritional and Financial Freedom"><p>Pumpkins are grown across Tanzania, yet their nutrient-rich seeds can be discarded as agricultural waste. Our Agro-Educational Model teaches smallholder farmers how to make use of this resource for household nutrition and potential income.</p></ProgramHeader>
    <div className="academy-agriculture-hero"><AcademyPhoto id="S1" priority /></div>
    <section className="academy-farming" aria-labelledby="agricultural-training"><h2 id="agricultural-training">What Our Agricultural Training Covers</h2><div className="academy-farming-topics">
      {agricultureSections.slice(0, 1).map(section => <article key={section.image} className="academy-farming-topic"><AcademyPhoto id={section.image} /><div className="academy-prose"><h3>{section.title}</h3><p>{section.text}</p></div></article>)}
      <section className="academy-farming-text" aria-label="Intercropping and post-harvest practices">
        {agricultureSections.slice(1).map(section => <article key={section.image} className="academy-prose"><h3>{section.title}</h3><p>{section.text}</p></article>)}
      </section>
    </div></section>
    <section className="academy-sourcing" aria-labelledby="sourcing-loop"><h2 id="sourcing-loop">The Nita Sourcing Loop: Grow, Keep, Sell</h2><ol className="academy-sourcing-flow"><li><h3>Grow</h3><p>Cultivation and production.</p><a className="nita-story-link" href="#agricultural-training">Explore the training topics</a></li><li><h3>Keep</h3><p>Save the vital nutrient-rich seeds your family needs for daily health.</p></li><li><h3>Sell</h3><p>Sell your excess surplus pumpkin seeds directly back to Nita Food Products at a guaranteed, fair market price.</p></li></ol><p className="academy-sourcing-result"><strong>Result:</strong> Your family can strengthen household income while helping us keep Unga Lishe affordable for the entire community.</p></section>
    <section className="academy-invitation" aria-labelledby="agricultural-collaboration"><div><h2 id="agricultural-collaboration">Interested in Agricultural Collaboration?</h2></div><Link className="nita-contact-action" to={academyContactLink(academyEnquiries.agriculture)}>Contact Nita Food Products</Link></section>
  </>;
}

export default function EducationalHub() {
  const { topic: slug } = useParams<{ topic: string }>();
  const topic = educationalTopics.find(item => item.slug === slug);
  if (slug && !topic) return <div className="nita-academy academy-unavailable"><h1>Topic unavailable</h1><Link className="nita-story-link" to="/educational-hub">Return to Nita Nutrition Academy</Link></div>;
  return <div className={`nita-academy academy-${slug || 'landing'}`}>
    {topic && <nav className="academy-breadcrumb" aria-label="Breadcrumb"><Link to="/educational-hub">Nita Nutrition Academy</Link><span aria-current="page">{topic.title}</span></nav>}
    {!topic ? <AcademyLanding /> : slug === 'community-clinic-training' ? <CommunityPage /> : slug === 'maternal-lactation-support' ? <MaternalPage /> : <AgriculturePage />}
    <AcademyNavigation current={slug} />
  </div>;
}
