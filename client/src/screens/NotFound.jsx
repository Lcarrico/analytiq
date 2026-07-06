// R15S1E1 → R33S2E4: the 404 now renders the shared error template
// (mono route detail + Go home action preserved for the router contract).
import { useLocation } from 'react-router-dom';
import ErrorState from '../components/ErrorState';

export default function NotFound() {
  const { pathname } = useLocation();
  return (
    <div data-testid="notfound-page">
      <ErrorState kind="not_found" detail={pathname} />
    </div>
  );
}
