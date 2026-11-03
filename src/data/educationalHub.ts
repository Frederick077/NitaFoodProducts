export const educationalTopics = [
  { slug: 'community-clinic-training', title: 'Community & Clinic Demonstrations' },
  { slug: 'maternal-lactation-support', title: 'Maternal & Lactation Support' },
  { slug: 'sustainable-farming-education', title: 'Sustainable Agriculture & Post-Harvest Training' },
] as const;

// Canonical URLs retained from Phase 3C.1 so existing bookmarks/navigation keep working.
export const educationalHubLinks = educationalTopics.map(topic => ({
  name: topic.title, path: `/educational-hub/${topic.slug}`,
}));

export const academyAliases: Record<string, string> = {
  'community-training': 'community-clinic-training',
  'maternal-nutrition': 'maternal-lactation-support',
  'sustainable-agriculture': 'sustainable-farming-education',
};

export const academyEnquiries = {
  community: 'Community & Clinic Partnership Training',
  agriculture: 'Agricultural Collaboration',
} as const;

export const academyContactLink = (subject: string) => `/contact?subject=${encodeURIComponent(subject)}#nita-contact-form-panel`;

export interface AcademyImageSlot {
  subject: string;
  aspectRatio: `${number} / ${number}`;
  altGuidance: string;
  image: { src: string; alt: string; fit?: 'cover' | 'contain'; width?: number; height?: number; srcSet?: string; sizes?: string; illustrative?: boolean } | null;
}
const slot = (subject: string, aspectRatio: AcademyImageSlot['aspectRatio'], altGuidance: string, image: AcademyImageSlot['image'] = null): AcademyImageSlot => ({subject, aspectRatio, altGuidance, image});

// Licensed editorial images are illustrative, not records of NITA activities.
// Sources, license checks and retained placeholders: EDUCATIONAL_HUB_PHOTOGRAPHY_REGISTER.md.
const illustration = (filename: string, height: number, description: string): NonNullable<AcademyImageSlot['image']> => ({
  src: `/images/education/editorial/${filename}-720.webp`,
  srcSet: [360, 720, 1080].map(width => `/images/education/editorial/${filename}-${width}.webp ${width}w`).join(', '),
  sizes: '(max-width: 407px) calc(100vw - 48px), 360px',
  width: 720, height, fit: 'contain', illustrative: true,
  alt: `Illustrative photograph: ${description}`,
});

// Owner confirmed publication permission for the four original NITA photographs on 27 October 2026.
// Loaded portraits use their natural proportions; unfilled slots retain their placeholder ratios.
export const academyImages = {
  A1: slot('Community nutrition education', '4 / 3', 'Describe the actual community session or family meal preparation shown.', {src:'/images/education/IMG-20261027-WA0072.jpg', alt:'Adults standing together outdoors beneath a tree.', fit:'contain'}),
  A2: slot('Healthy Families: everyday foods and meal preparation', '4 / 3', 'Identify the actual local ingredients or family activity, without inferring nutritional outcomes.', {src:'/images/education/IMG-20261027-WA0076.jpg', alt:'Schoolchildren in red tops and blue uniforms gathered outdoors beside brick buildings.', fit:'contain'}),
  A3: slot('Thriving Mothers: maternal nutrition education', '4 / 3', 'Respectfully describe the actual education or support activity; confirm permission for recognizable people.', illustration('mother-baby-hands', 405, "an adult hand resting beside a baby's hand on a pink blanket.")),
  A4: slot('Sustainable Futures: pumpkin farming education', '4 / 3', 'Describe the actual farmer, cultivation activity or training, without inferring crop origin or yield.', illustration('pumpkin-vine', 1074, "an orange pumpkin on its vine among leaves and a white blossom.")),
  C1: slot('Community learning and clinic demonstrations', '3 / 2', 'Identify the actual village or clinic learning activity where confirmed.', {src:'/images/education/IMG-20261027-WA0070.jpg', alt:'A speaker addressing adults seated on chairs outdoors beside a brick building.', fit:'contain'}),
  C2: slot('Hands-on cooking demonstration', '4 / 3', 'Describe the actual cooking equipment, ingredients and demonstration.', illustration('pumpkin-market', 480, "cut pumpkins with orange flesh and visible seeds displayed at a market.")),
  C3: slot('Swahili pictorial education materials', '3 / 2', 'Describe the approved pictorial guide and the learning activity shown.'),
  C4: slot('Local leadership and nutrition training', '4 / 3', 'Describe the actual leadership or volunteer training; do not imply external accreditation.', {src:'/images/education/IMG-20261027-WA0089.jpg', alt:'Adults posing together outdoors beneath a tree.', fit:'contain'}),
  M1: slot('Maternal nutrition and breastfeeding support', '4 / 3', 'Respectfully describe the actual mother-and-child or education scene, with permission.', illustration('pumpkin-market', 480, "cut pumpkins with orange flesh and visible seeds displayed at a market.")),
  M2: slot('Mineral-rich foods and dietary variety', '4 / 3', 'Identify only the foods visible; do not describe them as medical treatments.', illustration('rice-lentils', 540, "brown rice grains mixed with black lentils.")),
  M3: slot('Pumpkin seeds and maternal nutrition', '4 / 3', 'Describe the seeds, flour or education activity without implying a milk-supply effect.', illustration('pumpkin-seeds', 480, "pumpkin seeds and orange pulp on a plate beside a spoon.")),
  M4: slot('Complementary feeding education', '4 / 3', 'Describe actual preparation or caregiver education, without claiming suitability for every infant.', illustration('barley-porridge', 480, "a bowl of barley porridge and a spoon on a dark table.")),
  M5: slot('Swahili Pictorial Guide for Maternal Nutrition', '3 / 4', 'Describe the approved guide cover or preview and provide an accessible text version where needed.'),
  S1: slot('Pumpkin farming and smallholder agriculture', '16 / 9', 'Identify the actual landscape or farming activity; name the location only if confirmed.', illustration('kenya-field', 540, "cultivated rows with drip irrigation on a farm in Kitengela, Kenya.")),
  S2: slot('Resilient pumpkin cultivation', '4 / 3', 'Describe the actual planting or crop inspection without inferring climate resistance.', illustration('pumpkin-plants', 480, "young pumpkin plants with broad green leaves growing in soil.")),
  S3: slot('Intercropping and mixed farming', '4 / 3', 'Identify the crops and farming activity actually visible.'),
  S4: slot('Seed drying, handling and storage', '3 / 2', 'Describe the actual drying or storage activity without certifying food safety.'),
} satisfies Record<string, AcademyImageSlot>;

export type AcademyImageId = keyof typeof academyImages;
export const maternalGuide: {href: string | null; label: string} = {href:null, label:'Download Swahili Motherhood Guide'};

export const academyPillars = [
  {number:'01',title:'Healthy Families (Eliminating the Nutritional Void)',image:'A2',slug:'community-clinic-training',cta:'Explore Community Education',text:'We teach rural families how to break away from standard single-crop starches like plain cassava or white maize. Learn how to enrich daily family meals with vital nutrients using affordable, locally available ingredients.'},
  {number:'02',title:'Thriving Mothers (Overcoming the Lactation Crisis)',image:'A3',slug:'maternal-lactation-support',cta:'Explore Maternal Nutrition',text:'We provide targeted education for pregnant and breastfeeding mothers. Learn about varied diets, including natural ingredients such as pumpkin seeds, and where to find qualified support for anemia and breast milk supply concerns. No food or NITA product is presented as a treatment or a guaranteed way to increase milk supply or protect newborn immunity.'},
  {number:'03',title:'Sustainable Futures (The Economic & Agricultural Loop)',image:'A4',slug:'sustainable-farming-education',cta:'Explore Sustainable Agriculture',text:'Education extends to the farm. We train smallholder farming networks on climate-smart pumpkin cultivation, intercropping, and proper post-harvest solar drying to reduce crop waste and the risk of mold.'},
] satisfies {number:string;title:string;image:AcademyImageId;slug:string;cta:string;text:string}[];

export const communitySections = [
  {title:'Hands-on Cooking Demonstrations',image:'C2',text:'We do not just hand out food bags. Our team conducts live cooking exhibitions using local pots and tools. We show caregivers exactly how to prepare fortified composite flour (Unga Lishe) and how to easily incorporate pumpkin seed flour into everyday family dishes.'},
  {title:'Interactive Visual Materials',image:'C3',text:'We use simple, clear Swahili pictorial guides. These materials are custom-designed for remote countryside communities, making it easy for anyone to understand correct nutritional portions, regardless of literacy levels.'},
  {title:'Building Local Leadership',image:'C4',text:'We train local village leaders, midwives, and healthcare volunteers to become certified Nita Nutrition Ambassadors. They ensure that healthy eating practices leave a lasting legacy long after our official sessions conclude.'},
] satisfies {title:string;image:AcademyImageId;text:string}[];

export const maternalSections = [
  {title:'Replenish Core Minerals',image:'M2',text:'Pregnancy and nursing place demands on your body. Focus on a varied diet with foods containing iron, zinc, and magnesium. Suspected or diagnosed maternal anemia needs appropriate healthcare assessment and treatment; food alone should not be presented as its treatment.'},
  {title:'Boost Milk Production Naturally',image:'M3',text:'Nutritious foods, including pumpkin seeds or pumpkin seed flour, can be part of a varied maternal diet. Their specific effects on breast milk supply have not been established here. For concerns about milk supply, seek qualified breastfeeding support rather than relying on a particular food or product.'},
  {title:'Safe Complementary Feeding',image:'M4',text:'At 6 months of age, babies need appropriate complementary foods alongside continued breastfeeding. Our educational focus includes nutrient-rich foods and porridge preparation as part of a varied diet. Seek qualified guidance on safe preparation, suitable textures and your child’s individual needs. A particular flour cannot be promised to prevent stunting or boost immunity, and this guidance does not imply that every NITA product is suitable for infants.'},
] satisfies {title:string;image:AcademyImageId;text:string}[];

export const agricultureSections = [
  {title:'Resilient Pumpkin Cultivation',image:'S2',text:'Learn methods for growing pumpkins, including climate-smart cultivation approaches and choosing varieties suited to local conditions. Yields, weather resilience and the work required vary with conditions; none is guaranteed.'},
  {title:'Intercropping Techniques',image:'S3',text:'Discover how to grow pumpkins alongside your existing staple crops to make use of space, support soil health, and diversify your household’s food supply.'},
  {title:'Post-Harvest Solar Drying',image:'S4',text:'We teach drying and storage techniques to reduce the risk of harmful mold buildup in harvested seeds. Appropriate handling matters for food intended for human consumption and storage; drying alone does not guarantee food safety or a particular storage life.'},
] satisfies {title:string;image:AcademyImageId;text:string}[];

export const maternalReferences = [
  {title:'WHO: anaemia',url:'https://www.who.int/news-room/fact-sheets/detail/anaemia'},
  {title:'WHO: complementary feeding',url:'https://www.who.int/health-topics/complementary-feeding'},
  {title:'NHS: breastfeeding and a varied diet',url:'https://www.nhs.uk/baby/breastfeeding-and-bottle-feeding/breastfeeding-and-lifestyle/diet/'},
  {title:'NHS: getting support with milk supply',url:'https://www.nhs.uk/baby/breastfeeding-and-bottle-feeding/breastfeeding-problems/enough-milk/'},
];
