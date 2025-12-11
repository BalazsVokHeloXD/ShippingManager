export default function ContainerItem({ row, selected, onToggle }) {
  return (
    <div
      className={`display-flex-row containerItem ${selected ? 'selected-container' : ''}`}
      onClick={() => onToggle(row.id)}
      style={{ cursor: 'pointer' }}
    >
      <input
        type="checkbox"
        checked={selected}
        onClick={(e) => e.stopPropagation()}  // ✅ prevent parent click
        onChange={() => onToggle(row.id)}
      />
      <label>{row.name}</label>
      <label>{row.type}</label>
      <label>{row.size}</label>
      <label>${row.price}</label>
    </div>
  );
}