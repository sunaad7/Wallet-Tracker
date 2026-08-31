import { Link } from 'react-router-dom';
import { cn } from '../../lib/format';

export default function LineHoverLink({ to, children, className = '' }) {
  return <Link to={to} className={cn('inline-flex items-center gap-0.5 text-xs font-semibold transition-colors hover:underline', className)}>{children}</Link>;
}
