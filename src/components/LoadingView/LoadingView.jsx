export default function LoadingView() {
  return (
    <div
      className="admin__view admin__view--catalog"
      role="status"
      aria-label="Cargando"
    >
      <div className="article-list">
        <div className="skeleton" />
        <div className="skeleton" />
        <div className="skeleton" />
      </div>
    </div>
  )
}
