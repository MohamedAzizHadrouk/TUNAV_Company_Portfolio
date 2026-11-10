import { useProduct } from '../../hooks/useProduct';
import { ProductNotFound } from '../../components/products/ProductNotFound';
import { ProductSubpage } from '../../components/products/ProductSubpage';
import { LinksSection } from '../../components/products/LinksSection';

export function ProductLinks() {
  const { product, patch } = useProduct();
  if (!product) return <ProductNotFound />;
  return (
    <ProductSubpage product={product} sectionId="links">
      <div className="max-w-3xl">
        <LinksSection links={product.links} onChange={(links) => patch({ links })} />
      </div>
    </ProductSubpage>);

}