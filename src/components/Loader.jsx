export default function Loader({ className = '' }) {
  return <div className={`loader mx-auto ${className}`} aria-label="Loading" />;
}
