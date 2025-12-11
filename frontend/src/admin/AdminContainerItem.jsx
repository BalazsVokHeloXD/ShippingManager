export default function AdminContainerItem({
  row,
  selectedId,
  onSelect,
  header,
  sortKey,
  sortDirection,
  onSortClick,
}) {
  if (header) {
    const renderHeaderCell = (label, key, className) => (
      <span
        className={`${className} containerCell ${
          sortKey === key ? `sorted-${sortDirection}` : ""
        }`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onSortClick?.(key);
        }}
        onMouseDown={(e) => e.preventDefault()}
        role="button"
        tabIndex={0}
      >
        {label}
        {sortKey === key && (
          <span className="sortIndicator">
            {sortDirection === "asc" ? " ▲" : sortDirection === "desc" ? " ▼" : ""}
          </span>
        )}
      </span>
    );

    return (
      <div className="display-flex-row containerItem">
        {renderHeaderCell("", "", "containerSelection")}
        {renderHeaderCell("Name", "name", "containerName")}
        {renderHeaderCell("Harbor", "harbor_name", "containerHarborname")}
        {renderHeaderCell("Type", "type", "containerType")}
        {renderHeaderCell("Size", "size", "containerSize")}
        {renderHeaderCell("Price", "price", "containerPrice")}
      </div>
    );
  }

  const isSelected = selectedId === row.id;

  return (
    <div
      className={`display-flex-row containerItem ${
        isSelected ? "selected-container" : ""
      }`}
      style={{ cursor: "pointer" }}
      onClick={() => onSelect(row.id)}
    >
      <input
        type="radio"
        name="selectedContainer"
        checked={isSelected}
        onChange={() => onSelect(row.id)}
        onClick={(e) => e.stopPropagation()}
      />
      <span className="containerName">{row.name}</span>
      <span className="containerHarborname">{row.harbor_name}</span>
      <span className="containerType">{row.type}</span>
      <span className="containerSize">{row.size}</span>
      <span className="containerPrice">${row.price}</span>
    </div>
  );
}