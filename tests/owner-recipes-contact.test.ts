import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { recipes } from '../src/data/recipes';
import { recipeIngredientLinks, recipeIngredientMatches } from '../src/recipeShopping';
import { NITA_PHONE, NITA_PHONE_DISPLAY, NITA_WHATSAPP_MESSAGE, NITA_WHATSAPP_NUMBER, NITA_WHATSAPP_URL } from '../src/config/businessContact';
import { getWhatsAppLink } from '../src/utils';
import { getOrderWhatsAppHref } from '../src/components/SocialLinks';

test('all three owner recipes match the independent text fixture without corrections', () => {
  const expected = JSON.parse(readFileSync(new URL('./fixtures/owner-recipes.json', import.meta.url), 'utf8'));
  assert.deepEqual(recipes.map(({ shopIngredients, ...recipe }) => recipe), expected);
  assert.equal(recipes[2].servings, '1s');
});

test('ingredient matching rejects substitutions and compound products', () => {
  assert.equal(recipeIngredientMatches('NITA Pumpkin Seed Powder', 'Pumpkin Seed Powder'), true);
  assert.equal(recipeIngredientMatches('NITA Pumpkin Seed Powder', 'Pumpkin Powder'), false);
  assert.equal(recipeIngredientMatches('NITA Butternut Flour', 'Nita flour'), false);
  assert.equal(recipeIngredientMatches('NITA Chia Seeds Granola Bar', 'NITA Chia Seeds'), false);
  assert.equal(recipeIngredientMatches('NITA Granola Snack Bar', 'Granola Cereals'), false);
  assert.equal(recipeIngredientMatches('NITA Pumpkin Seeds (Roasted & Salted)', 'Roasted Pumpkin Seeds'), true);
  assert.equal(recipeIngredientMatches('NITA Pumpkin Seed Oil', 'Roasted Pumpkin Seeds'), false);
});

test('product URLs use only matching public catalogue IDs; missing products use working search routes', () => {
  const links = recipeIngredientLinks(['Pumpkin Seed Powder', 'NITA Chia Seeds', 'Granola Cereals'], [
    { id: 'real powder id', name: 'NITA Pumpkin Seed Powder', publicationStatus: 'PUBLISHED' },
    { id: 'draft', name: 'NITA Chia Seeds', publicationStatus: 'DRAFT' },
    { id: 'bar', name: 'NITA Granola Snack Bar', publicationStatus: 'PUBLISHED' },
  ]);
  assert.deepEqual(links, [
    { label: 'NITA Pumpkin Seed Powder', href: '/products/real%20powder%20id' },
    { label: 'NITA Chia Seeds', href: '/products?search=Chia%20Seeds' },
    { label: 'Granola Cereals', href: '/products?search=Granola%20Cereals' },
  ]);
});

test('every general WhatsApp helper uses the exact approved message and number', () => {
  const expected = 'Hello NITA Food Products! I am visiting your website and I would like to learn more about your nutritional seed products and healthy services. How can I place an order or get started? 🌿';
  assert.equal(NITA_PHONE, '+255757542585');
  assert.equal(NITA_PHONE_DISPLAY, '0757 542 585');
  assert.equal(NITA_WHATSAPP_NUMBER, '255757542585');
  assert.equal(NITA_WHATSAPP_MESSAGE, expected);
  assert.equal(new URL(NITA_WHATSAPP_URL).searchParams.get('text'), expected);
  assert.equal(getWhatsAppLink(), NITA_WHATSAPP_URL);
  assert.equal(getOrderWhatsAppHref(), NITA_WHATSAPP_URL);
});

test('specialized product WhatsApp messages preserve product, pack and quantity on the new destination', () => {
  const url = new URL(getWhatsAppLink('NITA Sunflower Seeds', 2, '250g'));
  assert.equal(url.pathname, '/255757542585');
  assert.equal(url.searchParams.get('text'), 'Hello NITA FOOD PRODUCTS,\n\nI am interested in NITA Sunflower Seeds.\nSize: 250g\nQuantity: 2');
});
