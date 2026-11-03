import { Link } from 'react-router-dom';
import type { Product } from '../types';
import { formatTZS } from '../utils';
import { variantLabel } from '../variantLabel';
import { getProductPresentation } from '../productPresentation';
import SafeImage from './SafeImage';

export interface ProductCardProps {
  product: Product;
  onQuickOrder?: (product: Product) => void;
  layout?: 'standard' | 'spotlight';
}

export default function ProductCard({ product, onQuickOrder, layout = 'standard' }: ProductCardProps) {
  const variants = product.variants || [];
  const { price, compareAtPrice, hasPriceRange, available, canQuickOrder } = getProductPresentation(product);
  const primaryImage = product.featuredImageUrl || product.images?.[0]?.imageUrl || product.image || '';
  const productUrl = `/products/${product.slug || product.id}`;
  const nameId = `product-${product.id}-name`;
  const packLabels = [...new Set(variants.filter(variant => variant.name?.trim() || variant.size?.trim()).map(variantLabel))];
  const description = product.shortDescription || product.description;

  return (
    <article className={`nita-product-card ${layout === 'spotlight' ? 'nita-product-card--spotlight' : ''}`}
      id={`product-card-${product.id}`} aria-labelledby={nameId}>
      <Link to={productUrl} className="nita-product-media" aria-label={`View ${product.name}`}>
        <SafeImage src={primaryImage} alt={product.name} placeholderText="Product photograph unavailable"
          className="nita-product-photo" loading="lazy" decoding="async" />
      </Link>
      <div className="nita-product-information">
        {product.category && <span className="nita-product-category">{product.category}</span>}
        <h3 id={nameId}><Link to={productUrl}>{product.name}</Link></h3>
        {description && <p className="nita-product-description">{description}</p>}
        {packLabels.length > 0 && <p className="nita-product-packs">Pack sizes: {packLabels.join(', ')}</p>}
        {!available && <p className="nita-product-ordering-note">Ordering currently unavailable</p>}
        <div className="nita-product-purchase">
          <div className="nita-product-pricing">
            {price !== null ? <>
              <span className="nita-product-price">{hasPriceRange ? 'From ' : ''}{formatTZS(price)}</span>
              {compareAtPrice !== null && <del className="nita-product-comparison"><span className="sr-only">Previously </span>{formatTZS(compareAtPrice)}</del>}
            </> : <span className="nita-product-price-note">See product details for pricing</span>}
          </div>
          {onQuickOrder && canQuickOrder ? (
            <button type="button" className="nita-product-action" aria-label={`${variants.length > 1 ? 'Choose options for' : 'Quick order'} ${product.name}`}
              aria-haspopup="dialog" onClick={() => onQuickOrder(product)}>
              {variants.length > 1 ? 'Choose options' : 'Quick order'}
            </button>
          ) : <Link className="nita-product-action nita-product-action--details" to={productUrl}>View product<span className="sr-only">: {product.name}</span></Link>}
        </div>
      </div>
    </article>
  );
}
