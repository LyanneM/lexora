// src/pages/MathNotebook.jsx
import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { notesService } from "../services/firebaseService";
import "../styles/math-notebook.css";

const API_BASE_URL = "http://localhost:8000";

function GeometryNotebook() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [title, setTitle] = useState("Geometry Notebook");
  const [activeTool, setActiveTool] = useState("graphing");
  const [isSaving, setIsSaving] = useState(false);
  
  // Graphing state
  const [functionInput, setFunctionInput] = useState("x**2");
  const [graphResult, setGraphResult] = useState(null);
  const [isPlotting, setIsPlotting] = useState(false);
  
  // Geometry state
  const [shapes, setShapes] = useState([]);
  const [selectedShape, setSelectedShape] = useState(null);
  const [measurements, setMeasurements] = useState({});
  
  const canvasRef = useRef(null);
  const graphCanvasRef = useRef(null);

  // Backend integration for advanced graphing
  const plotFunction = async () => {
    if (!functionInput.trim()) return;
    
    setIsPlotting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/plot-function`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          function: functionInput,
          x_range: [-10, 10],
          y_range: [-10, 10]
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setGraphResult(result);
        renderGraph(result.plot_data);
      } else {
        setGraphResult({ error: result.error });
      }
    } catch (error) {
      setGraphResult({ error: `Connection error: ${error.message}` });
      // Fallback to frontend graphing
      renderGraphFrontend();
    }
    setIsPlotting(false);
  };

  const renderGraph = (plotData) => {
    const canvas = graphCanvasRef.current;
    if (!canvas || !plotData) return;

    const img = new Image();
    img.onload = () => {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = `data:image/png;base64,${plotData}`;
  };

  const renderGraphFrontend = () => {
    const canvas = graphCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = '#3e3e42';
    ctx.lineWidth = 1;

    // Vertical lines
    for (let x = 0; x <= width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y <= height; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw axes
    ctx.strokeStyle = '#007acc';
    ctx.lineWidth = 2;
    
    // X-axis
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Y-axis
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
      ctx.lineTo(width / 2, height);
    ctx.stroke();

    // Plot function
    if (functionInput) {
      ctx.strokeStyle = '#ff6b6b';
      ctx.lineWidth = 3;
      ctx.beginPath();

      for (let x = -10; x <= 10; x += 0.1) {
        try {
          const y = eval(functionInput.replace(/x/g, `(${x})`).replace(/\^/g, '**'));
          const pixelX = (x + 10) * (width / 20);
          const pixelY = height - ((y + 10) * (height / 20));
          
          if (x === -10) {
            ctx.moveTo(pixelX, pixelY);
          } else {
            ctx.lineTo(pixelX, pixelY);
          }
        } catch (e) {
          // Skip invalid points
        }
      }
      ctx.stroke();
    }
  };

  // Geometry functions
  const calculateShapeProperties = (shape) => {
    switch (shape.type) {
      case 'rectangle':
        const width = Math.abs(shape.points[1].x - shape.points[0].x);
        const height = Math.abs(shape.points[1].y - shape.points[0].y);
        return {
          area: width * height,
          perimeter: 2 * (width + height),
          width,
          height
        };
      
      case 'circle':
        const radius = Math.sqrt(
          Math.pow(shape.points[1].x - shape.points[0].x, 2) +
          Math.pow(shape.points[1].y - shape.points[0].y, 2)
        );
        return {
          area: Math.PI * radius * radius,
          circumference: 2 * Math.PI * radius,
          radius
        };
      
      case 'triangle':
        const side1 = Math.sqrt(
          Math.pow(shape.points[1].x - shape.points[0].x, 2) +
          Math.pow(shape.points[1].y - shape.points[0].y, 2)
        );
        const side2 = Math.sqrt(
          Math.pow(shape.points[2].x - shape.points[1].x, 2) +
          Math.pow(shape.points[2].y - shape.points[1].y, 2)
        );
        const side3 = Math.sqrt(
          Math.pow(shape.points[0].x - shape.points[2].x, 2) +
          Math.pow(shape.points[0].y - shape.points[2].y, 2)
        );
        const s = (side1 + side2 + side3) / 2;
        return {
          area: Math.sqrt(s * (s - side1) * (s - side2) * (s - side3)),
          perimeter: side1 + side2 + side3,
          sides: [side1, side2, side3]
        };
      
      default:
        return {};
    }
  };

  const addShape = (type) => {
    const newShape = {
      id: Date.now(),
      type,
      points: [],
      color: `hsl(${Math.random() * 360}, 70%, 60%)`
    };
    setShapes([...shapes, newShape]);
    setSelectedShape(newShape);
  };

  const handleCanvasClick = (e) => {
    if (!selectedShape || selectedShape.points.length >= 
        (selectedShape.type === 'triangle' ? 3 : 2)) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const point = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };

    const updatedShape = {
      ...selectedShape,
      points: [...selectedShape.points, point]
    };

    setShapes(shapes.map(shape => 
      shape.id === selectedShape.id ? updatedShape : shape
    ));

    // Calculate properties when shape is complete
    if ((selectedShape.type === 'triangle' && updatedShape.points.length === 3) ||
        (selectedShape.type !== 'triangle' && updatedShape.points.length === 2)) {
      const properties = calculateShapeProperties(updatedShape);
      setMeasurements(prev => ({
        ...prev,
        [updatedShape.id]: properties
      }));
    }
  };

  const renderShapes = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#3e3e42';
    ctx.lineWidth = 1;
    
    for (let x = 0; x <= canvas.width; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    
    for (let y = 0; y <= canvas.height; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw shapes
    shapes.forEach(shape => {
      ctx.strokeStyle = shape.color;
      ctx.lineWidth = 2;
      ctx.fillStyle = shape.color + '40';

      switch (shape.type) {
        case 'rectangle':
          if (shape.points.length === 2) {
            const [p1, p2] = shape.points;
            const width = p2.x - p1.x;
            const height = p2.y - p1.y;
            ctx.fillRect(p1.x, p1.y, width, height);
            ctx.strokeRect(p1.x, p1.y, width, height);
          }
          break;
        
        case 'circle':
          if (shape.points.length === 2) {
            const [center, edge] = shape.points;
            const radius = Math.sqrt(
              Math.pow(edge.x - center.x, 2) + Math.pow(edge.y - center.y, 2)
            );
            ctx.beginPath();
            ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
            ctx.fill();
            ctx.stroke();
          }
          break;
        
        case 'triangle':
          if (shape.points.length === 3) {
            ctx.beginPath();
            ctx.moveTo(shape.points[0].x, shape.points[0].y);
            ctx.lineTo(shape.points[1].x, shape.points[1].y);
            ctx.lineTo(shape.points[2].x, shape.points[2].y);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          }
          break;
      }

      // Draw points
      shape.points.forEach(point => {
        ctx.fillStyle = '#ff6b6b';
        ctx.beginPath();
        ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
        ctx.fill();
      });
    });
  };

  useEffect(() => {
    renderShapes();
  }, [shapes]);

  useEffect(() => {
    if (activeTool === 'graphing') {
      renderGraphFrontend();
    }
  }, [functionInput, activeTool]);

  const saveNotebook = async () => {
    setIsSaving(true);
    try {
      const notebookData = {
        title,
        type: "geometry",
        content: JSON.stringify({
          functionInput,
          shapes,
          measurements
        }),
        updatedAt: new Date(),
        owner: currentUser.uid,
        createdAt: id && id !== "create" ? undefined : new Date()
      };

      if (id && id !== "create") {
        await notesService.updateNote(id, notebookData);
      } else {
        const newId = await notesService.createNote(notebookData);
        navigate(`/notebook/geometry/${newId}`);
      }
    } catch (error) {
      console.error("Error saving notebook:", error);
    }
    setIsSaving(false);
  };

  return (
    <div className="geometry-notebook">
      {/* Header */}
      <div className="geometry-header">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="geometry-title"
          placeholder="Geometry Notebook"
        />
        
        <div className="header-actions">
          <button onClick={saveNotebook} disabled={isSaving} className="save-btn">
            {isSaving ? "💾 Saving..." : "💾 Save"}
          </button>
          <button onClick={() => navigate("/notebook/complex-math/create")} className="advanced-btn">
            🧮 Advanced Math
          </button>
          <button onClick={() => navigate("/dashboard")} className="back-btn">
            ← Dashboard
          </button>
        </div>
      </div>

      {/* Tool Navigation */}
      <div className="geometry-tool-nav">
        <button 
          className={activeTool === "graphing" ? "active" : ""}
          onClick={() => setActiveTool("graphing")}
        >
          📈 Graphing
        </button>
        <button 
          className={activeTool === "shapes" ? "active" : ""}
          onClick={() => setActiveTool("shapes")}
        >
          📐 Geometry Tools
        </button>
      </div>

      {/* Main Content */}
      <div className="geometry-content">
        {/* Graphing Panel */}
        {activeTool === "graphing" && (
          <div className="tool-panel">
            <h3>Function Graphing</h3>
            <div className="graphing-controls">
              <div className="function-input-group">
                <label>Function f(x):</label>
                <input
                  type="text"
                  value={functionInput}
                  onChange={(e) => setFunctionInput(e.target.value)}
                  placeholder="x**2, sin(x), exp(x), etc."
                  className="function-input"
                />
                <button 
                  onClick={plotFunction} 
                  disabled={isPlotting}
                  className="plot-btn"
                >
                  {isPlotting ? "⏳ Plotting..." : "📊 Plot Function"}
                </button>
              </div>
              
              {graphResult && (
                <div className="graph-result">
                  {graphResult.error ? (
                    <div className="error">Error: {graphResult.error}</div>
                  ) : (
                    <div className="success">Function plotted successfully!</div>
                  )}
                </div>
              )}
            </div>
            
            <div className="graph-container">
              <canvas 
                ref={graphCanvasRef}
                width={800}
                height={500}
                className="graph-canvas"
              />
            </div>
          </div>
        )}

        {/* Geometry Tools Panel */}
        {activeTool === "shapes" && (
          <div className="tool-panel">
            <h3>Geometry Tools</h3>
            <div className="geometry-workspace">
              <div className="shape-tools">
                <h4>Add Shapes</h4>
                <button onClick={() => addShape('rectangle')}>⬜ Rectangle</button>
                <button onClick={() => addShape('circle')}>⭕ Circle</button>
                <button onClick={() => addShape('triangle')}>△ Triangle</button>
                
                <div className="instructions">
                  <p><strong>Instructions:</strong></p>
                  <p>• Click a shape tool to select it</p>
                  <p>• Click on canvas to place points</p>
                  <p>• Measurements calculate automatically</p>
                </div>
              </div>
              
              <div className="drawing-area">
                <canvas 
                  ref={canvasRef}
                  width={600}
                  height={500}
                  className="geometry-canvas"
                  onClick={handleCanvasClick}
                />
              </div>
              
              <div className="measurements-panel">
                <h4>Measurements</h4>
                {Object.keys(measurements).length === 0 ? (
                  <p>Complete a shape to see measurements</p>
                ) : (
                  Object.entries(measurements).map(([shapeId, props]) => {
                    const shape = shapes.find(s => s.id.toString() === shapeId);
                    return (
                      <div key={shapeId} className="shape-measurements">
                        <h5>{shape?.type} Properties:</h5>
                        {Object.entries(props).map(([key, value]) => (
                          <div key={key} className="measurement">
                            <span className="prop-name">{key}:</span>
                            <span className="prop-value">{typeof value === 'number' ? value.toFixed(2) : value}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default GeometryNotebook;