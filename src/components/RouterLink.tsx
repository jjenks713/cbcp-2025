import { forwardRef } from 'react';
import { Link } from 'react-router-dom';

interface RouterLinkProps {
  href?: string;
  [key: string]: any;
}

export const RouterLink = forwardRef<HTMLAnchorElement, RouterLinkProps>(
  ({ href, ...other }, ref) => <Link ref={ref} to={href || '/'} {...other} />
);

export default RouterLink;
