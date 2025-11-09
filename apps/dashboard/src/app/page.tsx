export default function Home() {
  return (
    <main>
      <div style={{ background: "#000", color: "#fff", padding: "10px", textAlign: "center" }}>
        Visly — Like this project? <a href="#contact" style={{ textDecoration: "underline" }}>Hire the dev</a>.
      </div>
      <section style={{ padding: "24px" }}>
        <h1>Visly Analytics (Portfolio)</h1>
        <p>Browser → Collector → Kafka → Worker → ClickHouse → Dashboard</p>
      </section>
    </main>
  );
}
