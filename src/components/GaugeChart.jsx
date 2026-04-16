import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip } from "chart.js";

ChartJS.register(ArcElement, Tooltip);

export default function GaugeChart({ value }) {
  const getColor = () => {
    if (value < 70) return "#ef4444";
    if (value < 85) return "#f59e0b";
    return "#22c55e";
  };

  const data = {
    datasets: [
      {
        data: [value, 100 - value],
        backgroundColor: [getColor(), "#1f2937"],
        borderWidth: 0
      }
    ]
  };

  const options = {
    rotation: -90,
    circumference: 180,
    cutout: "75%",
    plugins: {
      tooltip: { enabled: false }
    }
  };

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "320px",
        margin: "0 auto",
        position: "relative"
      }}
    >
      <Doughnut data={data} options={options} />

      {/* TEXTO CENTRO */}
      <div
        style={{
          position: "absolute",
          top: "60%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center"
        }}
      >
        <h2 style={{ margin: 0 }}>{value.toFixed(1)}%</h2>
      </div>
    </div>
  );
}