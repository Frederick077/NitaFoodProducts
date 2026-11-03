import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { trackPageView, getWhatsAppLink } from '../utils';
import PageBanner from '../components/PageBanner';
import RecipeTitle from '../components/RecipeTitle';
import { recipes } from '../data/recipes';
import { recipeIngredientLinks } from '../recipeShopping';
import type { Product } from '../types';

const tabs = [['recipes', 'Recipes'], ['faqs', 'FAQs'], ['stockists', 'Stockists']] as const;
const faqs = [
  ['Where do the ingredients come from?', 'For information about the origin of an ingredient, contact NITA with the product name and your question.'],
  ['Where can I find certification information?', 'Ask NITA for the current documentation relevant to the product or supply enquiry.'],
  ['How can I order?', 'Browse the product range, choose an available pack size and add it to your cart. You can also make a product enquiry through Contact or WhatsApp.'],
  ['Where can I find storage and shelf-life information?', 'Follow the storage instructions and date information printed on the current product packaging.'],
  ['Can I ask about other pack sizes?', 'The product page lists the available pack options. Contact NITA about any additional pack or supply requirements.'],
];
export default function Explore() {
  const location = useLocation();
  const active = location.pathname.split('/')[2] || 'faqs';
  const [recipeProducts, setRecipeProducts] = useState<Product[]>([]);
  useEffect(() => { trackPageView(location.pathname); }, [location.pathname]);
  useEffect(() => {
    if (active !== 'recipes') return;
    const controller = new AbortController();
    fetch('/api/products', { signal: controller.signal }).then(async response => {
      if (!response.ok) return;
      const data: Product[] = await response.json();
      if (Array.isArray(data) && !controller.signal.aborted) setRecipeProducts(data.filter(product => product && typeof product.id === 'string' && typeof product.name === 'string'));
    }).catch(() => {});
    return () => controller.abort();
  }, [active]);
  return <div className="nita-page nita-explore" id="explore-hub-page">
    <PageBanner image="/images/headers/explore-pumpkin-seeds-dark-bowl.jpg" alt="A dark bowl of pumpkin seeds on a wooden surface" title={location.pathname === '/explore' ? 'Explore NITA' : active === 'recipes' ? 'Recipes' : active === 'faqs' ? 'Frequently asked questions' : 'Find NITA products'} />
    <nav className="nita-explore-nav nita-page-inner" aria-label="Explore NITA">{tabs.map(([key, title]) => <Link key={key} to={`/explore/${key}`} aria-current={active === key ? 'page' : undefined}>{title}</Link>)}</nav>
    <div className="nita-page-inner nita-explore-content">
      {active === 'recipes' && <section id="recipes-section" aria-label="Recipes">
        <nav className="nita-recipe-index" aria-label="Recipes on this page"><ol>{recipes.map((recipe, index) => <li key={recipe.title}><a href={`#recipe-${index + 1}`}><RecipeTitle title={recipe.title} /></a></li>)}</ol></nav>
        <div className="nita-recipe-list">{recipes.map((recipe, index) => <article key={recipe.title} id={`recipe-${index + 1}`} aria-labelledby={`recipe-${index + 1}-title`} tabIndex={-1}>
        <div className="nita-recipe-intro"><span className="nita-recipe-number">0{index + 1}</span><h2 id={`recipe-${index + 1}-title`}><RecipeTitle title={recipe.title} /></h2><p>{recipe.desc}</p><p className="nita-recipe-meta">Prep Time: {recipe.prepTime} | Servings: {recipe.servings}</p></div>
        <div className="nita-recipe-method"><section aria-labelledby={`recipe-${index + 1}-ingredients`}><h3 id={`recipe-${index + 1}-ingredients`}>Ingredients:</h3><ul>{recipe.ingredients.map(ingredient => <li key={ingredient}>{ingredient}</li>)}</ul></section><section aria-labelledby={`recipe-${index + 1}-preparation`}><h3 id={`recipe-${index + 1}-preparation`}>Instructions:</h3><ol>{recipe.instructions.map(step => <li key={step}>{step}</li>)}</ol></section></div>
        <nav className="nita-recipe-shop" aria-label={`Shop ingredients for ${recipe.title}`}><Link className="nita-story-link" to="/products">Shop Ingredients</Link><ul>{recipeIngredientLinks(recipe.shopIngredients, recipeProducts).map(link => <li key={link.href}><Link to={link.href}>{link.label}</Link></li>)}</ul></nav>
      </article>)}</div></section>}
      {active === 'faqs' && <section className="nita-faq-list" id="faqs-section" aria-label="Frequently asked questions">{faqs.map(([question, answer], index) => <details key={question} name="nita-faq" open={index === 0}><summary>{question}</summary><p>{answer}</p></details>)}<div className="nita-faq-contact"><p>Have another question?</p><a href={getWhatsAppLink()} target="_blank" rel="noopener noreferrer" className="nita-story-link">Ask NITA on WhatsApp <span className="sr-only">(opens in a new tab)</span></a></div></section>}
      {active === 'stockists' && <section className="nita-stockist-enquiry" id="stockists-section"><h2>Ask about availability near you</h2><p>Tell us which Nita Food Products you are looking for and your location. Contact us about current stockists or a retail supply enquiry.</p><Link to="/contact" className="nita-contact-action">Contact NITA</Link><Link to="/products" className="nita-story-link">Shop the range</Link></section>}
    </div>
  </div>;
}
