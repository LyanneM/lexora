// src/pages/CodeNotebook.jsx
import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { collection, doc, getDoc, setDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import "../styles/code-notebook.css";

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

  const codeEditorRef = useRef(null);

  // Starter code templates
  const starterTemplates = {
    python: `# Python Starter Code
def hello_world():
    print("Hello, World!")

def factorial(n):
    if n == 0:
        return 1
    else:
        return n * factorial(n-1)

# Test your code here
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
    
    <script>
        // JavaScript code here
        console.log("Page loaded!");
    </script>
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

  const runCode = async () => {
    setIsRunning(true);
    setOutput("Running code...");

    // Simulate code execution (you'll replace this with actual backend integration)
    setTimeout(() => {
      let result = "";
      
      switch(language) {
        case 'python':
          result = "Hello, World!\n120";
          break;
        case 'javascript':
          result = "Hello, World!\n120";
          break;
        case 'html':
          result = "HTML rendered successfully";
          break;
        case 'cpp':
          result = "Hello, World!";
          break;
        case 'java':
          result = "Hello, World!";
          break;
        default:
          result = "Code executed successfully";
      }
      
      setOutput(result);
      setIsRunning(false);
    }, 2000);
  };

  const saveCode = async () => {
    setIsSaving(true);
    try {
      const noteData = {
        title,
        type: "code",
        language,
        code,
        output,
        updatedAt: new Date(),
        owner: currentUser.uid,
        createdAt: note ? note.createdAt : new Date()
      };

      if (id && id !== "create") {
        await updateDoc(doc(db, "notes", id), noteData);
        alert("Code saved successfully!");
      } else {
        const docRef = doc(collection(db, "notes"));
        await setDoc(docRef, noteData);
        
        await updateDoc(doc(db, "users", currentUser.uid), {
          notes: arrayUnion(docRef.id)
        });
        
        alert("Code notebook created successfully!");
        navigate(`/notebook/${docRef.id}`);
      }
    } catch (error) {
      console.error("Error saving code:", error);
      alert("Error saving code");
    }
    setIsSaving(false);
  };

  const clearCode = () => {
    setCode("");
    setOutput("");
  };

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
            <option value="css">CSS</option>
            <option value="cpp">C++</option>
            <option value="java">Java</option>
          </select>

          <select 
            value={theme} 
            onChange={(e) => setTheme(e.target.value)}
          >
            <option value="dark">Dark Theme</option>
            <option value="light">Light Theme</option>
          </select>

          <button 
            onClick={runCode} 
            disabled={isRunning}
            className="run-button"
          >
            {isRunning ? "⏳ Running..." : "▶ Run Code"}
          </button>

          <button onClick={clearCode} className="clear-button">
            🗑️ Clear
          </button>

          <button onClick={saveCode} disabled={isSaving}>
            {isSaving ? "Saving..." : "💾 Save"}
          </button>
        </div>

        <div className="code-actions">
          <button onClick={() => navigate("/dashboard")}>
            ← Dashboard
          </button>
        </div>
      </div>

      <div className="code-content">
        <div className="editor-panel">
          <div className="editor-header">
            <span>Editor ({language})</span>
            <div className="editor-actions">
              <button onClick={() => setCode(starterTemplates[language])}>
                📋 Template
              </button>
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
            <button onClick={() => setOutput("")}>Clear Output</button>
          </div>
          
          <pre className="output-content">
            {output || "Output will appear here after running your code..."}
          </pre>
        </div>
      </div>

      {/* Terminal Panel */}
      <div className="terminal-panel">
        <div className="terminal-header">
          <span>Terminal</span>
        </div>
        <div className="terminal-content">
          <div className="terminal-line">
            <span className="prompt">$</span>
            <span> Ready to execute commands...</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CodeNotebook;