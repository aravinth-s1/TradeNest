import { createRoot } from "react-dom/client";

function App() {
  return (
    <main style={{ fontFamily: "system-ui", padding: 24 }}>
      <h1>TradeNest</h1>
      <p>Buy, sell or rent within your organisation.</p>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
