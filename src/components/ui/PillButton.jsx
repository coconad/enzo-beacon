// Pill-shaped button. variant: "default" | "primary" | "ghost"
export default function PillButton({ variant = 'default', className = '', children, ...rest }) {
  const variantClass = variant === 'primary' ? ' btn-primary' : variant === 'ghost' ? ' btn-ghost' : '';
  return (
    <button className={`btn${variantClass}${className ? ' ' + className : ''}`} {...rest}>
      {children}
    </button>
  );
}
