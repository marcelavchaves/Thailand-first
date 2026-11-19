export default function LoadingIndicator({ label = 'Loading…' }: { label?: string }) {
  return <span className="tauck-loading" role="status"><img src="/images/loading-compass-transparent.png" width="28" height="28" alt="" aria-hidden="true" /><span>{label}</span></span>;
}
