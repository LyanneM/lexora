# backend/services/graphing_service.py
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import io
import base64
import re
from typing import Dict, List, Any

class GraphingService:
    def __init__(self):
        self.supported_functions = {
            'sin', 'cos', 'tan', 'sinh', 'cosh', 'tanh',
            'arcsin', 'arccos', 'arctan', 
            'exp', 'log', 'log10', 'sqrt', 'abs'
        }
    
    def parse_function(self, function_str: str) -> Dict[str, Any]:
        """Parse function string and validate"""
        # Clean the function string
        function_str = function_str.strip().replace('^', '**').replace(' ', '')
        
        # Basic validation
        if not function_str:
            return {"valid": False, "error": "Empty function"}
        
        # Check for dangerous code
        dangerous_patterns = ['import', 'exec', 'eval', '__', 'open']
        if any(pattern in function_str for pattern in dangerous_patterns):
            return {"valid": False, "error": "Function contains unsafe code"}
        
        return {
            "valid": True,
            "cleaned_function": function_str,
            "variables": self._extract_variables(function_str)
        }
    
    def _extract_variables(self, function_str: str) -> List[str]:
        """Extract variables from function string"""
        # Remove function names and numbers
        cleaned = re.sub(r'[a-z]+\(', '', function_str)  # Remove function calls
        cleaned = re.sub(r'\d+', '', cleaned)  # Remove numbers
        variables = set(re.findall(r'[a-zA-Z]', cleaned))
        return list(variables)
    
    def evaluate_function(self, function_str: str, x_values: np.ndarray) -> np.ndarray:
        """Safely evaluate function over x values"""
        y_values = []
        
        for x in x_values:
            try:
                # Safe evaluation with limited context
                safe_dict = {
                    'x': x,
                    'sin': np.sin, 'cos': np.cos, 'tan': np.tan,
                    'sinh': np.sinh, 'cosh': np.cosh, 'tanh': np.tanh,
                    'arcsin': np.arcsin, 'arccos': np.arccos, 'arctan': np.arctan,
                    'exp': np.exp, 'log': np.log, 'log10': np.log10,
                    'sqrt': np.sqrt, 'abs': np.abs,
                    'pi': np.pi, 'e': np.e
                }
                
                # Evaluate the function
                y = eval(function_str, {"__builtins__": {}}, safe_dict)
                y_values.append(float(y))
            except:
                y_values.append(np.nan)
        
        return np.array(y_values)
    
    def plot_function(self, function_str: str, x_range: List[float] = [-10, 10], 
                     y_range: List[float] = [-10, 10], color: str = '#ff6b6b') -> Dict[str, Any]:
        """Plot a mathematical function"""
        try:
            # Parse and validate function
            parsed = self.parse_function(function_str)
            if not parsed["valid"]:
                return {"success": False, "error": parsed["error"]}
            
            # Generate x values
            x_min, x_max = x_range
            x_values = np.linspace(x_min, x_max, 1000)
            
            # Evaluate function
            y_values = self.evaluate_function(parsed["cleaned_function"], x_values)
            
            # Create plot
            plt.figure(figsize=(12, 8), facecolor='#1e1e1e')
            ax = plt.gca()
            ax.set_facecolor('#1e1e1e')
            
            # Plot grid
            ax.grid(True, alpha=0.3, color='#3e3e42', linestyle='-')
            ax.axhline(y=0, color='white', linewidth=1, alpha=0.5)
            ax.axvline(x=0, color='white', linewidth=1, alpha=0.5)
            
            # Plot function
            ax.plot(x_values, y_values, color=color, linewidth=3, label=f'$y = {function_str}$')
            
            # Style the plot
            ax.legend(facecolor='#2d2d30', edgecolor='none', labelcolor='white', fontsize=12)
            ax.tick_params(colors='white', labelsize=10)
            
            # Set limits
            ax.set_xlim(x_range)
            ax.set_ylim(y_range)
            
            # Remove spines
            for spine in ax.spines.values():
                spine.set_visible(False)
            
            # Add labels
            ax.set_xlabel('x', color='white', fontsize=12)
            ax.set_ylabel('y', color='white', fontsize=12)
            ax.set_title(f'$y = {function_str}$', color='white', fontsize=14)
            
            # Save to buffer
            buffer = io.BytesIO()
            plt.savefig(buffer, format='png', bbox_inches='tight', 
                       facecolor='#1e1e1e', edgecolor='none', dpi=100)
            buffer.seek(0)
            
            image_base64 = base64.b64encode(buffer.getvalue()).decode()
            plt.close()
            
            return {
                "success": True,
                "plot_data": image_base64,
                "function": function_str,
                "x_range": x_range,
                "y_range": y_range
            }
            
        except Exception as e:
            return {"success": False, "error": f"Plotting error: {str(e)}"}
    
    def plot_multiple_functions(self, functions: List[Dict[str, Any]], 
                               x_range: List[float] = [-10, 10]) -> Dict[str, Any]:
        """Plot multiple functions on the same graph"""
        try:
            plt.figure(figsize=(12, 8), facecolor='#1e1e1e')
            ax = plt.gca()
            ax.set_facecolor('#1e1e1e')
            
            # Colors for different functions
            colors = ['#ff6b6b', '#4ecdc4', '#ffd166', '#6a0572', '#118ab2']
            
            # Plot grid
            ax.grid(True, alpha=0.3, color='#3e3e42')
            ax.axhline(y=0, color='white', linewidth=1, alpha=0.5)
            ax.axvline(x=0, color='white', linewidth=1, alpha=0.5)
            
            x_values = np.linspace(x_range[0], x_range[1], 1000)
            
            for i, func_data in enumerate(functions):
                function_str = func_data.get('function', '')
                color = func_data.get('color', colors[i % len(colors)])
                
                if function_str:
                    parsed = self.parse_function(function_str)
                    if parsed["valid"]:
                        y_values = self.evaluate_function(parsed["cleaned_function"], x_values)
                        ax.plot(x_values, y_values, color=color, linewidth=2.5, 
                               label=f'$y = {function_str}$')
            
            ax.legend(facecolor='#2d2d30', edgecolor='none', labelcolor='white')
            ax.tick_params(colors='white')
            
            for spine in ax.spines.values():
                spine.set_visible(False)
            
            buffer = io.BytesIO()
            plt.savefig(buffer, format='png', bbox_inches='tight', 
                       facecolor='#1e1e1e', edgecolor='none')
            buffer.seek(0)
            
            image_base64 = base64.b64encode(buffer.getvalue()).decode()
            plt.close()
            
            return {
                "success": True,
                "plot_data": image_base64,
                "functions": [f.get('function', '') for f in functions]
            }
            
        except Exception as e:
            return {"success": False, "error": f"Multiple plot error: {str(e)}"}

# Global instance
graphing_service = GraphingService()