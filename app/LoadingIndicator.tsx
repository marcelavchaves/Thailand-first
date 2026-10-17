export default function LoadingIndicator({ label = 'Loading…' }: { label?: string }) {
  return <span className="tauck-loading" role="status"><img src="/images/tauck-compass.png" width="28" height="28" alt="" aria-hidden="true" /><span>{label}</span></span>;
}
