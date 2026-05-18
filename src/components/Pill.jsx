export default function Pill({ tone = "", dot = false, children }) {
  const cls = ['pill', tone, dot ? 'dot' : ''].filter(Boolean).join(' ');
  return <span className={cls}>{children}</span>;
}
