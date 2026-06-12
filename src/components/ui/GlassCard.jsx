// Frosted translucent card — the base surface of the design system.
export default function GlassCard({ className = '', children, ...rest }) {
  return (
    <div className={`glass glass-card${className ? ' ' + className : ''}`} {...rest}>
      {children}
    </div>
  );
}
