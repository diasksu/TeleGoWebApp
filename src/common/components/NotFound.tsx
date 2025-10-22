import { Link } from 'react-router-dom';

export function NotFound() {
    return (
        <div>
            <h3>404 NOT FOUND</h3>
            <div>
        Go <Link to="/">home</Link>
            </div>
        </div>
    );
}