export default function DisasterMap() {
  return (
    <div style={{ width: "100%", height: "600px" }}>
      <iframe
        title="Disaster Map"
        width="100%"
        height="100%"
        src="https://embed.windy.com/embed2.html?lat=21.25&lon=81.63&zoom=6&level=surface&overlay=rain"
        frameBorder="0"
      >
        
      </iframe>
    </div>
  );
}