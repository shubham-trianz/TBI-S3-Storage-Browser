export default function FullScreenLoader({ text = "Signing out..." }) {
  return (
    <div className="fullscreen-loader">
      <div className="loader-card">
        <div className="spinner" />
        <p>{text}</p>
      </div>
    </div>
  );
}
