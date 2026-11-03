import { Navigate, useLocation } from 'react-router-dom';
import { companySectionForHash, type CompanySection } from '../data/companySections';

/** Keep old company URLs useful without retaining duplicate page components. */
export default function CompanyRedirect({ section }: { section: CompanySection }) {
  const { search, hash } = useLocation();
  return <Navigate replace to={{ pathname: '/about', search, hash: `#${companySectionForHash(hash, section)}` }} />;
}
