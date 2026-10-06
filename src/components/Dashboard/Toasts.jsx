export default function Toasts({ toasts }) {
  return (
    <div className="toasts" id="toast-root">
      {toasts.map((t) => (
        <div
          className={
            'toast' +
            (t.kind === 'error' ? ' toast-error' : '') +
            (t.leaving ? ' toast-out' : '')
          }
          key={t.id}
        >
          {t.msg}
        </div>
      ))}
    </div>
  )
}
