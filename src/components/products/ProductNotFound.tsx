import { Link } from 'react-router-dom';
import { EmptyState } from '../EmptyState';

export function ProductNotFound() {
  return (
    <div className="w-full">
      <EmptyState
        title="Product not found"
        description="It may have been deleted."
        action={<Link to="/products" className="btn-ghost">Back to products</Link>} />
      
    </div>);

}