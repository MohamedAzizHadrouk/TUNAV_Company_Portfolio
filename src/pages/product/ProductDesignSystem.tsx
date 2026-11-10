import { useProduct } from '../../hooks/useProduct';
import { ProductNotFound } from '../../components/products/ProductNotFound';
import { ProductSubpage } from '../../components/products/ProductSubpage';
import { DesignSystemSection } from '../../components/products/DesignSystemSection';

export function ProductDesignSystem() {
  const { product, patch } = useProduct();
  if (!product) return <ProductNotFound />;
  return (
    <ProductSubpage product={product} sectionId="design-system">
      <div className="max-w-3xl">
        <DesignSystemSection value={product.designSystem} onChange={(designSystem) => patch({ designSystem })} />
      </div>
    </ProductSubpage>);

}