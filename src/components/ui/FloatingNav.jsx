// Pill-shaped nav button list used inside the floating glass sidebar.
export default function FloatingNav({ items, active, onSelect }) {
  return (
    <nav className="nav" aria-label="Primary">
      {items.map(item => (
        <button
          key={item.key}
          className={active === item.key ? 'active' : ''}
          aria-current={active === item.key ? 'page' : undefined}
          onClick={() => onSelect(item.key)}
        >
          <span className="dot" />
          {item.label}
        </button>
      ))}
    </nav>
  );
}
