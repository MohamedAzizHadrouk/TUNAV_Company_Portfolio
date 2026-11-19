import { useProduct } from '../../hooks/useProduct';
import { useAccess } from '../../contexts/AccessContext';
import { ProductNotFound } from '../../components/products/ProductNotFound';
import { ProductSubpage } from '../../components/products/ProductSubpage';
import { LinksSection } from '../../components/products/LinksSection';

export function ProductLinks() {
  const { product, patch } = useProduct();
  const { can, canWriteSection } = useAccess();
  if (!product) return <ProductNotFound />;
  return (
    <ProductSubpage product={product} sectionId="links">
      <div className="max-w-3xl">
        <LinksSection links={product.links} readOnly={!can('portfolio.edit') && !canWriteSection(product.id, 'links')} onChange={(links) => patch({ links })} />
      </div>
    </ProductSubpage>);

}
