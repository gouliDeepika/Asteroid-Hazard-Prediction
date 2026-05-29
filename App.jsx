import { useEffect, useState } from "react";

export default function App() {
  // Features (same as your training)
  const featureKeys = [
    "est_diameter_min",
    "est_diameter_max",
    "relative_velocity",
    "miss_distance",
    "absolute_magnitude",
  ];

  // States
  const [shapData, setShapData] = useState([]);
  const [source, setSource] = useState("kaggle"); // kaggle | nasa
  const [selectedAsteroidName, setSelectedAsteroidName] = useState("");
  const [asteroidList, setAsteroidList] = useState([]);
  const [selectedAsteroid, setSelectedAsteroid] = useState("");
  const [formData, setFormData] = useState({
    est_diameter_min: "",
    est_diameter_max: "",
    relative_velocity: "",
    miss_distance: "",
    absolute_magnitude: "",
  });

  const [result, setResult] = useState(null);
  const [loadingAsteroids, setLoadingAsteroids] = useState(false);
  const [loadingPredict, setLoadingPredict] = useState(false);
  const [search, setSearch] = useState("");

  // Later we will connect backend here
 const BACKEND_URL = "http://localhost:8000";


  // 1) Load asteroid list for dropdown
  useEffect(() => {
    async function fetchAsteroids() {
      try {
        setLoadingAsteroids(true);

        // This endpoint will be created in backend later
        const endpoint = source === "nasa" ? "nasa-asteroids" : "asteroids";
        const res = await fetch(`${BACKEND_URL}/${endpoint}`);
        const data = await res.json();

        setAsteroidList(data);
      } catch (err) {
        console.log("Error loading asteroid list:", err);
      } finally {
        setLoadingAsteroids(false);
      }
    }

    fetchAsteroids();
  }, [source]);

  // 2) When user selects asteroid, auto-fill form
  async function handleAsteroidSelect(e) {
    const asteroidId = e.target.value;
    const selectedObj = asteroidList.find((a) => String(a.id) === String(asteroidId));
setSelectedAsteroidName(selectedObj ? selectedObj.name : "");
    setSelectedAsteroid(asteroidId);
    setResult(null);

    if (!asteroidId) return;

    try {
      // This endpoint will be created in backend later
      const detailsEndpoint =
  source === "nasa" ? "nasa-asteroid" : "asteroid";

const res = await fetch(`${BACKEND_URL}/${detailsEndpoint}/${asteroidId}`);

      const data = await res.json();

      setFormData({
        est_diameter_min: data.est_diameter_min ?? "",
        est_diameter_max: data.est_diameter_max ?? "",
        relative_velocity: data.relative_velocity ?? "",
        miss_distance: data.miss_distance ?? "",
        absolute_magnitude: data.absolute_magnitude ?? "",
      });
    } catch (err) {
      console.log("Error loading asteroid details:", err);
    }
  }

  // 3) Allow manual editing also
  function handleChange(e) {
  const { name, value } = e.target;

  // allow empty (user is typing), but block invalid characters
  if (value === "") {
    setFormData((prev) => ({ ...prev, [name]: "" }));
    return;
  }

  // allow only numbers + decimal
  const numRegex = /^[0-9]*\.?[0-9]*$/;

  if (!numRegex.test(value)) return; // block characters like abc, @, etc.

  setFormData((prev) => ({ ...prev, [name]: value }));
}


  // 4) Predict button
  async function handlePredict() {
    try {
      setLoadingPredict(true);
      setResult(null);

      const payload = {
        est_diameter_min: Number(formData.est_diameter_min),
        est_diameter_max: Number(formData.est_diameter_max),
        relative_velocity: Number(formData.relative_velocity),
        miss_distance: Number(formData.miss_distance),
        absolute_magnitude: Number(formData.absolute_magnitude),
      };
          // 1) Predict
      // This endpoint will be created in backend later
      const res = await fetch(`${BACKEND_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setResult(data);
          
      // 2) SHAP explanation (only if prediction is OK)
    const shapRes = await fetch(`${BACKEND_URL}/shap`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const shapJson = await shapRes.json();
    setShapData(shapJson.top_features || []);

    } catch (err) {
      console.log("Prediction error:", err);
      setResult({ error: "Backend not connected yet!" });
    } finally {
      setLoadingPredict(false);
    }
  }
  const filteredAsteroids = asteroidList.filter((a) =>
  a.name.toLowerCase().includes(search.toLowerCase())
);
function handleReset() {
  setSelectedAsteroid("");
  setSelectedAsteroidName("");
  setResult(null);
  setShapData([]);

  setFormData({
    est_diameter_min: "",
    est_diameter_max: "",
    relative_velocity: "",
    miss_distance: "",
    absolute_magnitude: "",
  });
}
function getRiskColor(score) {
  if (score < 0.3) return "#22c55e"; // green
  if (score < 0.6) return "#facc15"; // yellow
  return "#ef4444"; // red
}
function getRiskLabel(score) {
  if (score < 0.3) return "LOW RISK ✅";
  if (score < 0.6) return "MEDIUM RISK ⚠️";
  return "HIGH RISK 🚨";
}

const isFormValid =
  formData.est_diameter_min !== "" &&
  formData.est_diameter_max !== "" &&
  formData.relative_velocity !== "" &&
  formData.miss_distance !== "" &&
  formData.absolute_magnitude !== "" &&
  Number(formData.est_diameter_min) > 0 &&
  Number(formData.est_diameter_max) > 0 &&
  Number(formData.relative_velocity) > 0 &&
  Number(formData.miss_distance) > 0 &&
  Number(formData.absolute_magnitude) > 0;

 return (
  <div style={styles.page}>
    <div style={styles.card}>
      <div style={styles.container}>

        {/* HEADER */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>AstroGuard</h1>
            <p style={styles.subtitle}>
             Asteroid Hazard Prediction
            </p>
          </div>

          <div style={styles.badge}>
    
          </div>
        </div>

        <div style={styles.twoCol}>
          {/* LEFT SIDE */}
          <div style={styles.leftPanel}>

            {/* Source */}
            <div style={styles.section}>
              <label style={styles.label}>Select Source</label>
              <select
                style={styles.select}
                value={source}
                onChange={(e) => {
                  setSource(e.target.value);
                  setSelectedAsteroid("");
                  setSelectedAsteroidName("");
                  setResult(null);
                  setShapData([]);
                }}
              >
                <option value="kaggle">Kaggle Dataset (Training Data)</option>
                <option value="nasa">NASA Live Asteroids (This Week)</option>
              </select>
            </div>

            {/* Asteroid Dropdown */}
            <div style={styles.section}>
              <label style={styles.label}>Select Asteroid</label>
              <select
                style={styles.select}
                value={selectedAsteroid}
                onChange={handleAsteroidSelect}
              >
                <option value="">
                  {loadingAsteroids ? "Loading asteroids..." : "Choose asteroid"}
                </option>

                {asteroidList.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} (ID: {a.id})
                  </option>
                ))}
              </select>

              {loadingAsteroids && (
                <p style={{ marginTop: "8px", opacity: 0.8, fontSize: "13px" }}>
                  Loading asteroid list...
                </p>
              )}
            </div>

            {/* Form */}
            <div style={styles.grid}>
              {featureKeys.map((key) => (
                <div key={key} style={styles.inputBox}>
                  <label style={styles.label}>{key}</label>
                  <input
                    style={styles.input}
                    type="number"
                    name={key}
                    value={formData[key]}
                    onChange={handleChange}
                    placeholder={`Enter ${key}`}
                  />
                </div>
              ))}
            </div>

            {/* Buttons */}
            <div style={styles.btnRow}>
              <button
                style={{
                  ...styles.button,
                  opacity: (loadingPredict || !isFormValid) ? 0.6 : 1,
cursor: (loadingPredict || !isFormValid) ? "not-allowed" : "pointer",
                }}
                onClick={handlePredict}
                disabled={loadingPredict || !isFormValid}

              >
                {loadingPredict ? "Predicting..." : "Predict Hazard"}
              </button>

              <button style={styles.resetBtn} onClick={handleReset}>
                Reset
              </button>
            </div>
            {!isFormValid && (
  <p style={{ marginTop: "10px", fontSize: "13px", opacity: 0.8 }}>
    ⚠️ Please fill all inputs with valid numbers (greater than 0).
  </p>
)}

          </div>

          {/* RIGHT SIDE */}
          <div style={styles.rightPanel}>

            {/* Selected Asteroid Card */}
            <div style={styles.infoBox}>
              <h3 style={{ marginTop: 0 }}>Selected Asteroid</h3>
              <p style={{ margin: "6px 0" }}>
                <b>Name:</b> {selectedAsteroidName || "Not selected"}
              </p>
              <p style={{ margin: "6px 0" }}>
                <b>ID:</b> {selectedAsteroid || "—"}
              </p>
            </div>

            {/* Result Card */}
            <div style={styles.resultBox}>
              <h3 style={{ marginTop: 0 }}>Result</h3>

              {!result ? (
                <p style={{ margin: 0, opacity: 0.8 }}>
                  Select an asteroid and click <b>Predict</b>.
                </p>
              ) : result.error ? (
                <div style={styles.errorBox}>
                  ❌ {result.error}
                </div>
              ) : (
                <>
                  <p style={{ margin: "6px 0" }}>
                    <b>Asteroid:</b> {selectedAsteroidName || "Selected Asteroid"}
                  </p>

                  <p
                    style={{
                      margin: "6px 0",
                      fontWeight: "800",
                      color: result.hazardous === 1 ? "#ff4d4d" : "#22c55e",
                    }}
                  >
                    <b>Prediction:</b>{" "}
                    {result.hazardous === 1 ? "🚨 Hazardous" : "✅ Not Hazardous"}
                  </p>

                  <p style={{ margin: "6px 0" }}>
                    <b>Score:</b> {Number(result.score).toFixed(6)}
                  </p>

                  {/* Hazard Probability Bar */}
                  <div style={{ marginTop: "12px" }}>
                    <p style={{ margin: "6px 0", fontWeight: "700" }}>
                      Hazard Probability
                    </p>

                    <div style={styles.barOuter}>
                      <div
                        style={{
                          ...styles.barInner,
                          width: `${Math.min(100, Math.max(0, Number(result.score) * 100))}%`,
                          background: getRiskColor(Number(result.score)),
                        }}
                      />
                    </div>

                    <p style={{ marginTop: "6px", opacity: 0.85, fontSize: "13px" }}>
                      {Math.round(Number(result.score) * 100)}% —{" "}
                      <span style={{ fontWeight: "800", color: getRiskColor(Number(result.score)) }}>
                        {getRiskLabel(Number(result.score))}
                      </span>
                    </p>
                  </div>

                  <p style={{ margin: "6px 0", opacity: 0.85 }}>
                    <b>Threshold:</b> {result.threshold_used}
                  </p>
                </>
              )}
            </div>

            {/* ✅ SHAP Card (Separate, below Result) */}
            {shapData.length > 0 && (
              <div style={styles.infoBox}>
                <h3 style={{ marginTop: 0 }}>🔍 SHAP Explanation (Top 5)</h3>

                {shapData.map((item) => (
                  <div key={item.feature} style={{ marginBottom: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <p style={{ margin: 0, fontSize: "13px", fontWeight: "800" }}>
                        {item.feature}
                      </p>
                      <p style={{ margin: 0, fontSize: "12px", opacity: 0.85 }}>
                        {item.shap_value.toFixed(6)}
                      </p>
                    </div>

                    <div style={styles.barOuter}>
                      <div
                        style={{
                          ...styles.barInner,
                          width: `${Math.min(100, Math.abs(item.shap_value) * 200)}%`,
                          background: item.shap_value >= 0 ? "#ef4444" : "#22c55e",
                        }}
                      />
                    </div>

                    <p style={{ marginTop: "6px", fontSize: "12px", opacity: 0.85 }}>
                      Value: {item.value}
                    </p>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  </div>
);


}

const styles = {
page: {
  minHeight: "100vh",
  width: "100vw",
  background: "linear-gradient(135deg, #0f172a, #1e293b)",
  padding: "0px",
  margin: "0px",
  fontFamily: "Arial, sans-serif",
  display: "flex",
},

card: {
  width: "100%",
  height: "100vh",
  background: "rgba(255,255,255,0.06)",
  border: "none",
  borderRadius: "0px",
  padding: "30px",
  color: "white",
  boxShadow: "none",
  overflowY: "auto",

  display: "flex",
  flexDirection: "column",
  alignItems: "center",
},
container: {
  width: "100%",
  maxWidth: "1200px",
},

  title: {
  margin: 0,
  fontSize: "30px",
  fontWeight: "800",
  letterSpacing: "0.3px",
},

  subtitle: {
    marginTop: "8px",
    opacity: 0.8,
  },
  section: {
    marginTop: "18px",
  },
 label: {
  display: "block",
  fontSize: "13px",
  marginBottom: "2px",
  opacity: 0.9,
  fontWeight: "600",
},

  select: {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.18)",
  outline: "none",
  background: "rgba(0,0,0,0.22)",
  color: "white",
  fontSize: "14px",
  boxSizing: "border-box",
},

  grid: {
  marginTop: "18px",
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: "18px",            // 🔥 increased gap
},

 input: {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.18)",
  outline: "none",
  background: "rgba(0,0,0,0.22)",
  color: "white",
  fontSize: "14px",
  boxSizing: "border-box",     // 🔥 important
},


button: {
  width: "100%",
  padding: "14px",
  borderRadius: "14px",
  border: "none",
  cursor: "pointer",
  fontSize: "16px",
  fontWeight: "800",
  background: "linear-gradient(90deg, #ec4899, #8b5cf6, #3b82f6)",
  color: "white",
  boxShadow: "0 12px 28px rgba(0,0,0,0.40)",
  transition: "transform 0.15s ease, opacity 0.15s ease",
},


  resultBox: {
    marginTop: "18px",
    padding: "14px",
    borderRadius: "12px",
    background: "rgba(0,0,0,0.25)",
    border: "1px solid rgba(255,255,255,0.12)",
  },


leftPanel: {
  padding: "14px",
  borderRadius: "16px",
  background: "rgba(0,0,0,0.18)",
  border: "1px solid rgba(255,255,255,0.10)",
},

rightPanel: {
  display: "flex",
  flexDirection: "column",
  gap: "16px",
},

infoBox: {
  padding: "14px",
  borderRadius: "16px",
  background: "rgba(0,0,0,0.18)",
  border: "1px solid rgba(255,255,255,0.10)",
},
twoCol: {
  marginTop: "18px",
  width: "100%",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
  gap: "18px",
  alignItems: "start",
},

btnRow: {
  marginTop: "20px",
  display: "grid",
  gridTemplateColumns: "1fr 140px",
  gap: "12px",
},

resetBtn: {
  padding: "14px",
  borderRadius: "14px",
  border: "1px solid rgba(255,255,255,0.15)",
  background: "rgba(0,0,0,0.25)",
  color: "white",
  fontWeight: "800",
  cursor: "pointer",
},
errorBox: {
  padding: "12px",
  borderRadius: "12px",
  background: "rgba(255, 0, 0, 0.12)",
  border: "1px solid rgba(255, 0, 0, 0.35)",
  color: "white",
  fontWeight: "700",
},
 barOuter: {
  width: "100%",
  height: "12px",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.12)",
  overflow: "hidden",
  border: "1px solid rgba(255,255,255,0.12)",
},

barInner: {
  height: "100%",
  borderRadius: "999px",
  transition: "width 0.4s ease",
},


};
