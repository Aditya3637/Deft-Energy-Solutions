const services = [
  {
    title: "Solar & Renewables",
    body: "Design, deployment, and optimization of solar and renewable energy systems.",
  },
  {
    title: "Energy Efficiency",
    body: "Audits and retrofits that cut consumption and operating cost.",
  },
  {
    title: "Monitoring & Analytics",
    body: "Real-time usage insights and forecasting to keep systems running lean.",
  },
];

export default function Home() {
  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: "5rem 1.5rem" }}>
      <header style={{ marginBottom: "4rem" }}>
        <span
          style={{
            color: "var(--accent)",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            fontSize: "0.8rem",
          }}
        >
          Deft Energy Solutions
        </span>
        <h1 style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", marginTop: "1rem" }}>
          Smart, sustainable energy for the way you work.
        </h1>
        <p style={{ color: "var(--muted)", fontSize: "1.15rem", marginTop: "1rem", maxWidth: 620 }}>
          We design and operate clean energy systems that lower cost, cut
          emissions, and keep you in control of your power.
        </p>
      </header>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "1.25rem",
        }}
      >
        {services.map((s) => (
          <article
            key={s.title}
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: "1.5rem",
            }}
          >
            <h2 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>
              {s.title}
            </h2>
            <p style={{ color: "var(--muted)" }}>{s.body}</p>
          </article>
        ))}
      </section>

      <footer
        style={{
          marginTop: "5rem",
          paddingTop: "2rem",
          borderTop: "1px solid var(--border)",
          color: "var(--muted)",
          fontSize: "0.9rem",
        }}
      >
        © {new Date().getFullYear()} Deft Energy Solutions.
      </footer>
    </main>
  );
}
