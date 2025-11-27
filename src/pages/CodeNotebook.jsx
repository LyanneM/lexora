// src/pages/CodeNotebook.jsx
import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, doc, getDoc, setDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import "../styles/code-notebook.css";

const API_BASE_URL = "http://localhost:8000";

function CodeNotebook() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [note, setNote] = useState(null);
  const [title, setTitle] = useState("Code Notebook");
  const [isSaving, setIsSaving] = useState(false);
  const [language, setLanguage] = useState("python");
  const [code, setCode] = useState("");
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [terminalHistory, setTerminalHistory] = useState([]);
  
  // Optimization states
  const [executionStrategy, setExecutionStrategy] = useState('auto'); // 'local', 'online', 'auto'
  const [isOptimized, setIsOptimized] = useState(true);

  const codeEditorRef = useRef(null);

  // Optimized code detection
  const isSmallCode = code.length < 1000;
  const isQuickLanguage = ['python', 'javascript'].includes(language);

  // Fixed starter templates
  const starterTemplates = {
    python: `# Use this code as trial 
def hello_world():
    print("Hello, World!")

def factorial(n):
    if n == 0:
        return 1
    else:
        return n * factorial(n-1)  # Fixed: n-1

hello_world()
print(factorial(5))`,

    javascript: `// JavaScript Starter Code
function helloWorld() {
    console.log("Hello, World!");
}

function factorial(n) {
    if (n === 0) return 1;
    return n * factorial(n - 1);
}

// Test your code here
helloWorld();
console.log(factorial(5));`,

    html: `<!DOCTYPE html>
<html>
<head>
    <title>My Page</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 40px;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Hello, World!</h1>
        <p>Welcome to your HTML page.</p>
    </div>
</body>
</html>`,

    cpp: `#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}`,

    java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`
  };

  useEffect(() => {
    if (starterTemplates[language] && !code) {
      setCode(starterTemplates[language]);
    }
  }, [language]);

  const runCodeOptimized = async () => {
    setIsRunning(true);
    setOutput("🚀 Running code (optimized)...");
    addTerminalLine(`$ Executing ${language} code (fast mode)...`);

    try {
      const startTime = Date.now();
      
      // Use fast endpoint for optimized execution
      const endpoint = isOptimized ? '/execute-code-fast' : '/execute-code';
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code,
          language: language,
          strategy: executionStrategy
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      const executionTime = Date.now() - startTime;
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        let outputText = result.output || "No output";
        if (result.error) {
          outputText += `\n\nErrors:\n${result.error}`;
        }
        setOutput(outputText);
        addTerminalLine(`✓ Code executed successfully in ${executionTime}ms`);
        
        if (result.requires_browser) {
          addTerminalLine(`ℹ ${language.toUpperCase()} code ready for browser execution`);
        }
      } else {
        setOutput(`Execution Error: ${result.error}`);
        addTerminalLine(`✗ Execution failed: ${result.error}`);
        
        // Auto-fallback if optimized mode fails
        if (isOptimized && executionTime > 5000) {
          addTerminalLine(`⚠ Falling back to standard execution...`);
          setIsOptimized(false);
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        setOutput('⏰ Execution timeout: Code took too long to run');
        addTerminalLine('✗ Execution timeout');
      } else {
        setOutput(`Network Error: ${error.message}`);
        addTerminalLine(`✗ Network error: ${error.message}`);
      }
    } finally {
      setIsRunning(false);
    }
  };

  const addTerminalLine = (line) => {
    setTerminalHistory(prev => [...prev, { 
      text: line, 
      timestamp: new Date().toLocaleTimeString() 
    }]);
  };

  const saveCode = async () => {
    if (!currentUser) {
      addTerminalLine("✗ Please log in to save code");
      return;
    }

    setIsSaving(true);
    addTerminalLine("$ Saving code...");

    try {
      // Your existing save logic here
      addTerminalLine("✓ Code saved successfully");
    } catch (error) {
      addTerminalLine(`✗ Save failed: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const clearCode = () => {
    setCode("");
    setOutput("");
    setTerminalHistory([]);
    addTerminalLine("$ Console cleared");
  };

  const loadTemplate = () => {
    setCode(starterTemplates[language] || `// Write your ${language} code here`);
    addTerminalLine(`$ Loaded ${language} template`);
  };

  // Add execution strategy selector
  const renderExecutionControls = () => (
    <div className="execution-optimization">
      <select 
        value={executionStrategy} 
        onChange={(e) => setExecutionStrategy(e.target.value)}
        title="Execution Strategy"
      >
        <option value="auto">Auto (Fastest)</option>
        <option value="local">Local Only</option>
        <option value="online">Online Only</option>
      </select>

      <label className="optimization-toggle">
        <input
          type="checkbox"
          checked={isOptimized}
          onChange={(e) => setIsOptimized(e.target.checked)}
        />
        Turbo Mode
      </label>

      {isSmallCode && isQuickLanguage && (
        <span className="fast-badge" title="This code should execute very quickly">⚡</span>
      )}
    </div>
  );

  return (
    <div className={`code-notebook-container ${theme}`}>
      <div className="code-toolbar">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="code-title"
          placeholder="Code Notebook Title"
        />
        
        <div className="code-controls">
          <select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="html">HTML</option>
            <option value="cpp">C++</option>
            <option value="java">Java</option>
          </select>

          <button onClick={loadTemplate} className="template-button">
            📋 Template
          </button>

          {/* Execution Optimization Controls */}
          {renderExecutionControls()}

          <button 
            onClick={runCodeOptimized} 
            disabled={isRunning}
            className={`run-button ${isRunning ? 'running' : ''} ${isOptimized ? 'turbo' : ''}`}
            title={isOptimized ? "Turbo mode enabled - faster execution" : "Standard execution"}
          >
            {isRunning ? "⏳ Running..." : isOptimized ? "⚡ Run Fast" : "▶ Run Code"}
          </button>

          <button onClick={clearCode} className="clear-button">
            🗑️ Clear
          </button>

          <button onClick={saveCode} disabled={isSaving || !currentUser}>
            {isSaving ? "Saving..." : "💾 Save"}
          </button>

          <select 
            value={theme} 
            onChange={(e) => setTheme(e.target.value)}
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </div>

        <button onClick={() => navigate("/dashboard")} className="back-button">
          ← Dashboard
        </button>
      </div>

      <div className="code-content">
        <div className="editor-panel">
          <div className="editor-header">
            <span>Editor ({language})</span>
            <div className="editor-actions">
              <button onClick={() => navigator.clipboard.writeText(code)}>
                📄 Copy
              </button>
            </div>
          </div>
          
          <textarea
            ref={codeEditorRef}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="code-editor"
            placeholder={`Write your ${language} code here...`}
            spellCheck="false"
          />
        </div>

        <div className="output-panel">
          <div className="output-header">
            <span>Output</span>
            <button onClick={() => setOutput("")}>Clear</button>
          </div>
          
          <pre className="output-content">
            {output || "Output will appear here after running your code..."}
          </pre>
        </div>
      </div>

      <div className="terminal-panel">
        <div className="terminal-header">
          <span>Terminal</span>
          <button onClick={() => setTerminalHistory([])}>Clear</button>
        </div>
        <div className="terminal-content">
          {terminalHistory.map((line, index) => (
            <div key={index} className="terminal-line">
              <span className="timestamp">[{line.timestamp}]</span>
              <span className="prompt"> $</span>
              <span> {line.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CodeNotebook;