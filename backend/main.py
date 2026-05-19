# backend/main.py
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from flask import request, jsonify
from flask_cors import CORS
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import socket
import os
import subprocess
import tempfile
import sympy as sp
import numpy as np
import json
import random
import firebase_admin
from firebase_admin import credentials, firestore
from services.code_executor import CodeExecutor
from services.math_notebook import MathNotebookEngine
import uuid
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import google.generativeai as genai
import io
import base64
from services.graphing_service import graphing_service
from services.advanced_code_executor import advanced_code_executor


ENHANCED_AI_AVAILABLE = False

try:
    
    # I got this from Firebase Console > Project Settings > Service Accounts - for later reference in case I lose it
    if os.path.exists("service-account-key.json"):
        cred = credentials.Certificate("service-account-key.json")
        firebase_admin.initialize_app(cred)
    else:

        firebase_admin.initialize_app()
    db = firestore.client()
    print("✅ Firebase initialized successfully")
except Exception as e:
    print(f"⚠️ Firebase initialization failed: {e}")
    db = None

try:
    from ai_services.ai_companion import HybridAICompanion
    from ai_services.quiz_generator import QuizGenerator
    ENHANCED_AI_AVAILABLE = True  
    print("✅ Enhanced AI services available")
except ImportError as e:
    print(f"⚠️ Enhanced AI services are not available: {e}")
    print("⚠️ Falling back to basic AI services")
    from ai_services.ai_companion import AICompanion
    from ai_services.quiz_generator import QuizGenerator

from ai_services.content_moderator import ContentModerator
from ai_services.content_analyzer import ContentAnalyzer

def find_available_port(start_port=8000, max_port=8010):
    """Find an available port starting from start_port"""
    for port in range(start_port, max_port + 1):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('localhost', port))
                return port
        except OSError:
            continue
    raise Exception(f"No available ports found between {start_port} and {max_port}")

app = FastAPI(title="Lexora Quiz API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print("✅ Starting Lexora Quiz API...")

if ENHANCED_AI_AVAILABLE:
    quiz_generator = QuizGenerator()
    ai_companion = HybridAICompanion()
    print("✅ Enhanced AI services initialized")
else:
    quiz_generator = QuizGenerator()
    ai_companion = AICompanion()
    print("✅ Basic AI services initialized")

content_moderator = ContentModerator()
content_analyzer = ContentAnalyzer()

print("✓ All services initialized successfully")

class CodeExecutionRequest(BaseModel):
    code: str
    language: str

class MathCalculationRequest(BaseModel):
    expression: str
    operation: str

class GraphPlotRequest(BaseModel):
    equation: str
    graph_type: str = "function"
    x_range: List[float] = [-10, 10]

math_engine = MathNotebookEngine()

class MathNotebookCell(BaseModel):
    code: str
    cell_id: str = None

class MathNotebookSession(BaseModel):
    session_id: str = None
    cells: List[MathNotebookCell] = []

math_sessions = {}

# Helper functions for Firebase queries
def get_date_range(time_range: str):
    """Calculate date range based on time filter"""
    now = datetime.now()
    if time_range == "24h":
        start_date = now - timedelta(hours=24)
    elif time_range == "7d":
        start_date = now - timedelta(days=7)
    elif time_range == "30d":
        start_date = now - timedelta(days=30)
    else:  # 90d
        start_date = now - timedelta(days=90)
    return start_date, now

# backend/main.py (update the fast endpoint)
@app.route('/execute-code-fast', methods=['POST'])
def execute_code_fast():
    try:
        data = request.json
        if not data:
            return jsonify({
                "success": False,
                "error": "No JSON data provided"
            })
            
        code = data.get('code', '')
        language = data.get('language', 'python')
        
        if not code:
            return jsonify({
                "success": False,
                "error": "No code provided"
            })
        
        print(f"⚡ FAST MODE: Executing {language} code ({len(code)} chars)")

        result = advanced_code_executor.execute_code_fast(code, language)
        
        if not result["success"] and "timeout" in result["error"].lower():
            print("⚠ Fast mode failed, trying standard execution...")

            result = advanced_code_executor.execute_code_standard(code, language)
        
        return jsonify(result)
        
    except Exception as e:
        print(f"❌ Fast execution error: {e}")
        return jsonify({
            "success": False,
            "error": f"Server error: {str(e)}"
        })

@app.get("/api/admin/analytics")
async def get_analytics(range: str = "7d"):
    """Get real platform analytics data from Firebase"""
    try:
        if not db:
            return generate_analytics_data(range)
            
        start_date, end_date = get_date_range(range)
        
        # Get total users
        users_ref = db.collection('users')
        users_snapshot = list(users_ref.stream())
        total_users = len(users_snapshot)
        
        # Get active users (users with recent activity - last 30 days)
        active_users = 0
        for user in users_snapshot:
            user_data = user.to_dict()
            last_active = user_data.get('lastLogin', user_data.get('createdAt'))
            if last_active:
                if isinstance(last_active, str):
                    last_active = datetime.fromisoformat(last_active.replace('Z', '+00:00'))
                elif hasattr(last_active, 'isoformat'):
                    last_active = last_active
                else:
                    continue
                    
                if last_active >= (datetime.now() - timedelta(days=30)):
                    active_users += 1
        
        # Get total quizzes
        quizzes_ref = db.collection('quizzes')
        quizzes_snapshot = list(quizzes_ref.stream())
        total_quizzes = len(quizzes_snapshot)
        
        # Get recent quizzes for growth calculation
        recent_quizzes = 0
        for quiz in quizzes_snapshot:
            quiz_data = quiz.to_dict()
            created_at = quiz_data.get('createdAt')
            if created_at:
                if isinstance(created_at, str):
                    created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                elif hasattr(created_at, 'isoformat'):
                    created_at = created_at
                
                if created_at >= start_date:
                    recent_quizzes += 1
        
        # Calculate growth percentages (simplified)
        previous_period_quizzes = total_quizzes - recent_quizzes
        quiz_growth = ((recent_quizzes / previous_period_quizzes) * 100) if previous_period_quizzes > 0 else 0
        
        # Get user growth
        recent_users = 0
        for user in users_snapshot:
            user_data = user.to_dict()
            created_at = user_data.get('createdAt')
            if created_at:
                if isinstance(created_at, str):
                    created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                elif hasattr(created_at, 'isoformat'):
                    created_at = created_at
                
                if created_at >= start_date:
                    recent_users += 1
        
        previous_period_users = total_users - recent_users
        user_growth = ((recent_users / previous_period_users) * 100) if previous_period_users > 0 else 0
        
        # Get popular subjects from quizzes
        subject_count = {}
        for quiz in quizzes_snapshot:
            quiz_data = quiz.to_dict()
            subject = quiz_data.get('subject', 'General')
            subject_count[subject] = subject_count.get(subject, 0) + 1
        
        popular_subjects = [
            {"name": subject, "count": count}
            for subject, count in sorted(subject_count.items(), key=lambda x: x[1], reverse=True)[:5]
        ]
        
        return {
            "totalUsers": total_users,
            "activeUsers": active_users,
            "userGrowth": round(user_growth, 1),
            "totalQuizzes": total_quizzes,
            "quizGrowth": round(quiz_growth, 1),
            "apiSuccessRate": 98.5,
            "failedRequests": 12,
            "apiUsage": {
                "successful": total_quizzes * 3,
                "failed": max(1, int(total_quizzes * 0.02)),
                "rateLimited": max(1, int(total_quizzes * 0.01))
            },
            "popularSubjects": popular_subjects
        }
        
    except Exception as e:
        # Fallback to mock data if Firebase fails
        return generate_analytics_data(range)

# Mock data generators (fallback when Firebase is not available)
def generate_analytics_data(time_range: str):
    """Generate analytics data based on time range"""
    base_users = 1500
    base_quizzes = 4500
    
    if time_range == "24h":
        user_growth = random.randint(1, 5)
        quiz_growth = random.randint(2, 8)
        active_users = random.randint(300, 500)
    elif time_range == "7d":
        user_growth = random.randint(5, 15)
        quiz_growth = random.randint(10, 25)
        active_users = random.randint(800, 1200)
    elif time_range == "30d":
        user_growth = random.randint(20, 40)
        quiz_growth = random.randint(30, 60)
        active_users = random.randint(1000, 1400)
    else:  # 90d
        user_growth = random.randint(50, 100)
        quiz_growth = random.randint(80, 150)
        active_users = random.randint(1200, 1500)
    
    return {
        "totalUsers": base_users + user_growth * 10,
        "activeUsers": active_users,
        "userGrowth": user_growth,
        "totalQuizzes": base_quizzes + quiz_growth * 20,
        "quizGrowth": quiz_growth,
        "apiSuccessRate": random.randint(95, 99),
        "failedRequests": random.randint(5, 20),
        "apiUsage": {
            "successful": random.randint(5000, 10000),
            "failed": random.randint(50, 200),
            "rateLimited": random.randint(10, 50)
        },
        "popularSubjects": [
            {"name": "Algebra", "count": random.randint(800, 1200)},
            {"name": "Calculus", "count": random.randint(600, 900)},
            {"name": "Geometry", "count": random.randint(500, 800)},
            {"name": "Statistics", "count": random.randint(300, 600)},
            {"name": "Trigonometry", "count": random.randint(200, 500)}
        ]
    }

# Real User Data for AdminUserManager
@app.get("/api/admin/users")
async def get_users():
    """Get all users for admin management"""
    try:
        if not db:
            return []
            
        users_ref = db.collection('users')
        users_snapshot = users_ref.stream()
        
        users_list = []
        for user in users_snapshot:
            user_data = user.to_dict()
            user_data['id'] = user.id
            
            # Get user's quiz count
            user_quizzes = db.collection('quizzes').where('userId', '==', user.id).stream()
            quiz_count = len(list(user_quizzes))
            user_data['quizzesCreated'] = quiz_count
            
            users_list.append(user_data)
        
        return users_list
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching users: {str(e)}")

# Real Content Moderation Data
@app.get("/api/admin/content")
async def get_content(status: str = "pending"):
    """Get content for moderation - using suggestions and uploads collections"""
    try:
        if not db:
            return generate_content_data()
            
        content_items = []
        
        # Get suggestions for moderation
        suggestions_ref = db.collection('suggestions')
        suggestions_snapshot = suggestions_ref.stream()
        
        for suggestion in suggestions_snapshot:
            suggestion_data = suggestion.to_dict()
            content_items.append({
                "id": f"suggestion_{suggestion.id}",
                "type": "suggestion",
                "status": suggestion_data.get('status', 'pending'),
                "title": f"Suggestion: {suggestion_data.get('title', 'No title')}",
                "authorName": suggestion_data.get('userName', 'Anonymous'),
                "authorEmail": suggestion_data.get('userEmail', ''),
                "content": suggestion_data.get('description', 'No description'),
                "flags": suggestion_data.get('flags', 0),
                "reason": suggestion_data.get('reason', 'User suggestion'),
                "createdAt": suggestion_data.get('createdAt', datetime.now().isoformat()),
                "reviewedBy": suggestion_data.get('reviewedBy'),
                "reviewedAt": suggestion_data.get('reviewedAt'),
                "reviewNotes": suggestion_data.get('reviewNotes')
            })
        
        # Get uploads for moderation
        uploads_ref = db.collection('uploads')
        uploads_snapshot = uploads_ref.stream()
        
        for upload in uploads_snapshot:
            upload_data = upload.to_dict()
            content_items.append({
                "id": f"upload_{upload.id}",
                "type": "upload",
                "status": upload_data.get('status', 'pending'),
                "title": f"Upload: {upload_data.get('fileName', 'Unnamed file')}",
                "authorName": upload_data.get('userName', 'Anonymous'),
                "authorEmail": upload_data.get('userEmail', ''),
                "content": upload_data.get('description', 'No description'),
                "flags": upload_data.get('flags', 0),
                "reason": upload_data.get('reason', 'User upload'),
                "createdAt": upload_data.get('uploadedAt', datetime.now().isoformat()),
                "reviewedBy": upload_data.get('reviewedBy'),
                "reviewedAt": upload_data.get('reviewedAt'),
                "reviewNotes": upload_data.get('reviewNotes')
            })
        
        # Filter by status if needed
        if status != "all":
            content_items = [item for item in content_items if item["status"] == status]
            
        return content_items
        
    except Exception as e:
        # Fallback to mock data
        return generate_content_data()

def generate_content_data():
    """Generate mock content moderation data"""
    content_types = ["quiz", "notebook", "question"]
    statuses = ["pending", "approved", "rejected"]
    
    content_items = []
    for i in range(50):
        content_type = random.choice(content_types)
        status = random.choice(statuses)
        content_items.append({
            "id": f"content_{i}",
            "type": content_type,
            "status": status,
            "title": f"Sample {content_type.title()} {i}",
            "authorName": f"User {random.randint(1, 100)}",
            "authorEmail": f"user{random.randint(1, 100)}@example.com",
            "content": f"This is the content of {content_type} {i}. It contains sample data for testing purposes.",
            "flags": random.randint(0, 3),
            "reason": "Inappropriate content" if random.random() > 0.7 else None,
            "createdAt": (datetime.now() - timedelta(days=random.randint(0, 30))).isoformat(),
            "reviewedBy": f"admin{random.randint(1, 5)}" if status != "pending" else None,
            "reviewedAt": (datetime.now() - timedelta(days=random.randint(0, 7))).isoformat() if status != "pending" else None,
            "reviewNotes": "Reviewed and approved" if status == "approved" else "Content violates guidelines" if status == "rejected" else None
        })
    
    return content_items

@app.put("/api/admin/content/{content_id}")
async def update_content_status(content_id: str, update_data: dict):
    """Update content status in Firebase"""
    try:
        if not db:
            return {"message": "Content status updated successfully (mock)"}
            
        status = update_data.get('status')
        notes = update_data.get('notes', '')
        
        # Determine which collection to update based on content_id prefix
        if content_id.startswith('suggestion_'):
            doc_id = content_id.replace('suggestion_', '')
            collection_ref = db.collection('suggestions').document(doc_id)
            update_data = {
                'status': status,
                'reviewedBy': 'admin',
                'reviewedAt': datetime.now().isoformat(),
                'reviewNotes': notes
            }
        elif content_id.startswith('upload_'):
            doc_id = content_id.replace('upload_', '')
            collection_ref = db.collection('uploads').document(doc_id)
            update_data = {
                'status': status,
                'reviewedBy': 'admin',
                'reviewedAt': datetime.now().isoformat(),
                'reviewNotes': notes
            }
        else:
            raise HTTPException(status_code=400, detail="Invalid content ID")
        
        collection_ref.update(update_data)
        return {"message": "Content status updated successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating content: {str(e)}")

# Real Feedback Data
@app.get("/api/admin/feedback")
async def get_feedback(status: str = "all"):
    """Get user feedback from suggestions collection"""
    try:
        if not db:
            return generate_feedback_data()
            
        suggestions_ref = db.collection('suggestions')
        suggestions_snapshot = suggestions_ref.stream()
        
        feedback_list = []
        for suggestion in suggestions_snapshot:
            suggestion_data = suggestion.to_dict()
            feedback_list.append({
                "id": suggestion.id,
                "userName": suggestion_data.get('userName', 'Anonymous'),
                "userEmail": suggestion_data.get('userEmail', ''),
                "type": suggestion_data.get('type', 'general'),
                "status": suggestion_data.get('status', 'new'),
                "rating": suggestion_data.get('rating'),
                "message": suggestion_data.get('description', ''),
                "createdAt": suggestion_data.get('createdAt', datetime.now().isoformat())
            })
        
        # Filter by status if needed
        if status != "all":
            feedback_list = [item for item in feedback_list if item["status"] == status]
            
        return feedback_list
        
    except Exception as e:
        # Fallback to mock data
        return generate_feedback_data()

def generate_feedback_data():
    """Generate mock feedback data"""
    feedback_types = ["feature", "bug", "api", "general"]
    statuses = ["new", "read", "addressed"]
    
    feedbacks = []
    for i in range(30):
        feedback_type = random.choice(feedback_types)
        status = random.choice(statuses)
        feedbacks.append({
            "id": f"feedback_{i}",
            "userName": f"User {random.randint(1, 100)}",
            "userEmail": f"user{random.randint(1, 100)}@example.com",
            "type": feedback_type,
            "status": status,
            "rating": random.randint(1, 5) if random.random() > 0.3 else None,
            "message": f"This is a sample {feedback_type} feedback message. User is reporting their experience with the platform.",
            "createdAt": (datetime.now() - timedelta(days=random.randint(0, 60))).isoformat()
        })
    
    return feedbacks

@app.put("/api/admin/feedback/{feedback_id}")
async def update_feedback_status(feedback_id: str, update_data: dict):
    """Update feedback status"""
    try:
        if not db:
            return {"message": "Feedback status updated successfully (mock)"}
            
        status = update_data.get('status')
        
        suggestion_ref = db.collection('suggestions').document(feedback_id)
        suggestion_ref.update({
            'status': status,
            'reviewedAt': datetime.now().isoformat()
        })
        
        return {"message": "Feedback status updated successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating feedback: {str(e)}")

@app.post("/api/admin/feedback/{feedback_id}/reply")
async def send_feedback_reply(feedback_id: str, reply_data: dict):
    """Send reply to feedback"""
    try:
        if not db:
            return {"message": "Reply sent successfully (mock)"}
            
        message = reply_data.get('message', '')
        
        # Store the reply in the suggestion document
        suggestion_ref = db.collection('suggestions').document(feedback_id)
        suggestion_ref.update({
            'adminReply': message,
            'repliedAt': datetime.now().isoformat(),
            'status': 'addressed'
        })
        
        return {"message": "Reply sent successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error sending reply: {str(e)}")

# Real Notifications Data
@app.get("/api/admin/notifications")
async def get_notifications(filter: str = "all"):
    """Get admin notifications from reports and system events"""
    try:
        if not db:
            return generate_notifications_data()
            
        notifications = []
        
        # Get reports as notifications
        reports_ref = db.collection('reports')
        reports_snapshot = reports_ref.stream()
        
        for report in reports_snapshot:
            report_data = report.to_dict()
            notifications.append({
                "id": f"report_{report.id}",
                "title": f"New Report: {report_data.get('type', 'Issue')}",
                "message": report_data.get('description', 'No description'),
                "type": "warning",
                "category": "content",
                "priority": "medium",
                "read": report_data.get('reviewed', False),
                "timestamp": report_data.get('createdAt', datetime.now().isoformat())
            })
        
        # Filter notifications
        if filter != "all":
            if filter == "unread":
                notifications = [n for n in notifications if not n['read']]
            else:
                notifications = [n for n in notifications if n['category'] == filter]
                
        return notifications
        
    except Exception as e:
        # Fallback to mock data
        return generate_notifications_data()

def generate_notifications_data():
    """Generate mock notifications data"""
    categories = ["system", "api", "user", "content"]
    priorities = ["low", "medium", "high"]
    types = ["info", "warning", "error", "success"]
    
    notifications = []
    for i in range(25):
        category = random.choice(categories)
        priority = random.choice(priorities)
        notification_type = random.choice(types)
        notifications.append({
            "id": f"notif_{i}",
            "title": f"{priority.title()} {category.title()} Alert",
            "message": f"This is a {priority} priority notification about {category}.",
            "type": notification_type,
            "category": category,
            "priority": priority,
            "read": random.random() > 0.5,
            "timestamp": (datetime.now() - timedelta(hours=random.randint(0, 72))).isoformat()
        })
    
    return notifications

@app.put("/api/admin/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str):
    """Mark notification as read"""
    try:
        if not db:
            return {"message": "Notification marked as read (mock)"}
            
        if notification_id.startswith('report_'):
            doc_id = notification_id.replace('report_', '')
            report_ref = db.collection('reports').document(doc_id)
            report_ref.update({'reviewed': True})
        
        return {"message": "Notification marked as read"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error marking notification as read: {str(e)}")

@app.put("/api/admin/notifications/mark-all-read")
async def mark_all_notifications_read():
    """Mark all notifications as read"""
    try:
        if not db:
            return {"message": "All notifications marked as read (mock)"}
            
        # Mark all reports as reviewed
        reports_ref = db.collection('reports')
        reports_snapshot = reports_ref.where('reviewed', '==', False).stream()
        
        for report in reports_snapshot:
            report.reference.update({'reviewed': True})
        
        return {"message": "All notifications marked as read"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error marking all as read: {str(e)}")

@app.delete("/api/admin/notifications/{notification_id}")
async def delete_notification(notification_id: str):
    """Delete notification"""
    try:
        if not db:
            return {"message": "Notification deleted (mock)"}
            
        if notification_id.startswith('report_'):
            doc_id = notification_id.replace('report_', '')
            report_ref = db.collection('reports').document(doc_id)
            report_ref.delete()
        
        return {"message": "Notification deleted"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting notification: {str(e)}")

@app.delete("/api/admin/notifications/clear-all")
async def clear_all_notifications():
    """Clear all notifications"""
    try:
        if not db:
            return {"message": "All notifications cleared (mock)"}
            
        # Delete all reports (or you might want to archive them instead)
        reports_ref = db.collection('reports')
        reports_snapshot = reports_ref.stream()
        
        for report in reports_snapshot:
            report.reference.delete()
        
        return {"message": "All notifications cleared"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error clearing notifications: {str(e)}")

# ===== EXISTING API ROUTES =====

@app.post("/math-notebook/execute")
async def execute_math_cell(cell: MathNotebookCell):
    """Execute a math notebook cell"""
    try:
        result = math_engine.execute_cell(cell.code)
        return {
            "success": True,
            "cell_id": cell.cell_id,
            "result": result
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "cell_id": cell.cell_id
        }

@app.post("/math-notebook/create-session")
async def create_math_session():
    """Create a new math notebook session"""
    session_id = str(uuid.uuid4())
    math_sessions[session_id] = MathNotebookEngine()
    return {
        "success": True,
        "session_id": session_id
    }

@app.get("/math-notebook/session/{session_id}/variables")
async def get_session_variables(session_id: str):
    """Get variables from a math session"""
    if session_id in math_sessions:
        variables = math_sessions[session_id].get_variables()
        return {
            "success": True,
            "variables": variables
        }
    else:
        return {
            "success": False,
            "error": "Session not found"
        }

@app.post("/math-notebook/session/{session_id}/clear")
async def clear_math_session(session_id: str):
    """Clear a math notebook session"""
    if session_id in math_sessions:
        math_sessions[session_id].clear_session()
        return {"success": True}
    else:
        return {"success": False, "error": "Session not found"}

@app.post("/math-notebook/calculate-advanced")
async def calculate_advanced(request: Dict[str, Any]):
    """Advanced mathematical calculations"""
    try:
        expression = request.get("expression", "")
        operation = request.get("operation", "evaluate")
        
        if operation == "integrate":
            x = sp.Symbol('x')
            result = sp.integrate(sp.sympify(expression), x)
        elif operation == "differentiate":
            x = sp.Symbol('x')
            result = sp.diff(sp.sympify(expression), x)
        elif operation == "taylor_series":
            x = sp.Symbol('x')
            expr = sp.sympify(expression)
            result = sp.series(expr, x, 0, 6)  # 6 terms
        elif operation == "limit":
            x = sp.Symbol('x')
            expr = sp.sympify(expression)
            result = sp.limit(expr, x, 0)
        else:
            result = sp.sympify(expression)
        
        return {
            "success": True,
            "result": str(result),
            "latex_result": sp.latex(result),
            "evaluated": str(result.evalf()) if hasattr(result, 'evalf') else str(result)
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@app.get("/")
async def root():
    return {
        "message": "Lexora Quiz API", 
        "status": "running",
        "ai_capabilities": "basic"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy", 
        "timestamp": datetime.now().isoformat(),
        "ai_enhancements": False
    }

@app.get("/server-info")
async def get_server_info():
    return {
        "server": "Lexora AI Quiz Generator",
        "version": "1.0.0", 
        "using_intelligent_generator": True,
        "mode": "BASIC",
        "features": ["content_analysis", "quiz_generation", "export", "ai_companion"]
    }

@app.post("/generate-quiz")
async def generate_quiz(request: Dict[str, Any]):
    """Generate quiz from text content"""
    try:
        content = request.get("content", "")
        num_questions = request.get("num_questions", 10)
        quiz_type = request.get("quiz_type", "mixed")
        
        print(f"🎯 Generating {num_questions} {quiz_type} questions...")
        print(f"📝 Content preview: {content[:100]}...")
        
        # Content moderation
        is_appropriate, score = content_moderator.moderate_content(content)
        if not is_appropriate:
            raise HTTPException(status_code=400, detail="Content violates community guidelines")
        
        # Content analysis
        content_analysis = content_analyzer.analyze_content(content)
        print(f"📊 Content analysis: {content_analysis['subject']}, {content_analysis['complexity_level']}")
        
        # Generate quiz using basic generator
        quiz_data = quiz_generator.generate_from_text(
            content, 
            {
                "num_questions": num_questions,
                "quiz_type": quiz_type
            }
        )
        
        print(f"✅ Generated {len(quiz_data.get('questions', []))} questions")
        
        # Return the data in the expected format
        return {
            "success": True,
            "quiz_data": quiz_data,
            "content_analysis": content_analysis,
            "enhanced_generation": False,
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        print(f"❌ Quiz generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat")
async def chat_with_ai(request: Dict[str, Any]):
    """Chat with AI companion"""
    try:
        message = request.get("message", "")
        user_id = request.get("user_id", "anonymous")
        conversation_id = request.get("conversation_id")
        user_content = request.get("content", "")  
        
        print(f"💬 AI Chat - User: {user_id}, Message: {message}")
        
        if not message:
            raise HTTPException(status_code=400, detail="Message is required")
        
        # If content is provided, analyze it for better responses
        context = ""
        if user_content:
            analysis = content_analyzer.analyze_content(user_content)
            context = f"User is studying {analysis['subject']}. Key concepts: {', '.join(analysis['key_concepts'][:3])}"
            print(f"📚 Context provided: {context}")
        
        # Generate response
        response = ai_companion.generate_response(message, user_id, conversation_id)
        
        # If it's a quiz request and content is available, include quiz data
        final_response = {
            "success": True,
            "response": response["response"],
            "conversation_id": response["conversation_id"],
            "timestamp": response["timestamp"],
            "enhanced_ai": False
        }
        
        # Auto-generate quiz if user asks for it and content is available
        if (any(word in message.lower() for word in ['quiz', 'test', 'questions', 'practice']) 
            and user_content and len(user_content) > 50):
            try:
                quiz_data = quiz_generator.generate_from_text(user_content, {"num_questions": 5})
                final_response["auto_generated_quiz"] = quiz_data
                print("🎯 Auto-generated quiz included in response")
            except Exception as quiz_error:
                print(f"⚠ Auto-quiz generation failed: {quiz_error}")
        
        return final_response
        
    except Exception as e:
        print(f"❌ AI chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Advanced quiz generation endpoint (basic fallback)
@app.post("/generate-advanced-quiz")
async def generate_advanced_quiz(request: Dict[str, Any]):
    """Advanced quiz generation fallback to basic"""
    try:
        content = request.get("content", "")
        num_questions = request.get("num_questions", 10)
        difficulty = request.get("difficulty", "auto")
        question_types = request.get("question_types", ["multiple_choice", "true_false"])
        
        print(f"🚀 Generating quiz with {num_questions} questions...")
        
        # Content analysis
        analysis = content_analyzer.analyze_content(content)
        
        # Basic quiz generation
        quiz_data = quiz_generator.generate_from_text(
            content,
            {
                "num_questions": num_questions,
                "quiz_type": "mixed",
                "difficulty": difficulty
            }
        )
        
        return {
            "success": True,
            "quiz_data": quiz_data,
            "content_analysis": analysis,
            "generation_method": "basic",
            "enhanced_features_used": False,
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        print(f"❌ Quiz generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/debug-quiz")
async def debug_quiz():
    """Debug endpoint to test quiz generator"""
    try:
        test_content = """
        Artificial Intelligence (AI) refers to the simulation of human intelligence in machines. 
        Machine learning is a subset of AI that allows computers to learn without explicit programming. 
        Deep learning uses neural networks with multiple layers to analyze various factors of data.
        """
        
        quiz_data = quiz_generator.generate_from_text(test_content, {"num_questions": 3})
        
        return {
            "success": True,
            "quiz_data": quiz_data,
            "uses_gemini": quiz_data.get("enhanced_features", False),
            "method": quiz_data.get("method", "unknown"),
            "questions_count": len(quiz_data.get("questions", []))
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.get("/debug-quiz-structure")
async def debug_quiz_structure():
    """Debug endpoint to check quiz data structure"""
    test_content = "Artificial Intelligence (AI) refers to the simulation of human intelligence in machines. Machine learning is a subset of AI that allows computers to learn without explicit programming."
    
    quiz_data = quiz_generator.generate_from_text(test_content, {"num_questions": 3})
    
    return {
        "debug_info": {
            "quiz_data_structure": str(quiz_data),
            "quiz_data_keys": list(quiz_data.keys()),
            "questions_count": len(quiz_data.get('questions', [])),
            "enhanced_ai_available": False,
            "questions_sample": quiz_data.get('questions', [])[:2] if quiz_data.get('questions') else "No questions"
        },
        "raw_quiz_data": quiz_data
    }

@app.post("/generate-quiz-from-upload")
async def generate_quiz_from_upload(
    file: UploadFile = File(...), 
    num_questions: int = 10
):
    """Generate quiz from file upload"""
    try:
        print(f"📁 Processing file: {file.filename}")
        
        # Read file content
        content = await file.read()
        text_content = content.decode('utf-8', errors='ignore')
        
        # Content moderation
        is_appropriate, score = content_moderator.moderate_content(text_content)
        if not is_appropriate:
            raise HTTPException(status_code=400, detail="Content violates community guidelines")
        
        # Generate quiz
        quiz_data = quiz_generator.generate_from_text(
            text_content, 
            {
                "num_questions": num_questions
            }
        )
        
        return {
            "success": True,
            "quiz_data": quiz_data,
            "filename": file.filename,
            "enhanced_generation": False,
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        print(f"❌ File quiz generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/test-generator")
async def test_generator():
    """Test endpoint for quiz generator"""
    try:
        test_content = "Artificial Intelligence (AI) refers to the simulation of human intelligence in machines."
        quiz_data = quiz_generator.generate_from_text(test_content, {"num_questions": 2})
        return {
            "success": True,
            "generated_questions": len(quiz_data.get("questions", [])),
            "enhanced_ai": False,
            "quiz_data": quiz_data
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.get("/chat/history/{conversation_id}")
async def get_chat_history(conversation_id: str):
    """Get chat history for a conversation"""
    try:
        history = ai_companion.get_conversation_history(conversation_id)
        return {
            "success": True,
            "conversation_id": conversation_id,
            "history": history
        }
    except Exception as e:
        print(f"❌ Chat history error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/chat/{conversation_id}")
async def clear_chat_history(conversation_id: str):
    """Clear chat history"""
    try:
        success = ai_companion.clear_conversation(conversation_id)
        return {
            "success": success,
            "message": "Conversation cleared" if success else "Conversation not found"
        }
    except Exception as e:
        print(f"❌ Clear chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

code_executor = CodeExecutor()

@app.post("/execute-code")
async def execute_code(request: CodeExecutionRequest):
    """Execute code and return result"""
    try:
        result = code_executor.execute_code(request.code, request.language)
        return result
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@app.post("/calculate-math")
async def calculate_math(request: MathCalculationRequest):
    """Perform mathematical calculations using sympy"""
    try:
        expression = request.expression
        operation = request.operation
        
        # Parse the expression
        parsed_expr = sp.sympify(expression)
        
        if operation == "simplify":
            result = sp.simplify(parsed_expr)
        elif operation == "solve":
            # For solving equations, handle both expressions and equations
            if '=' in expression:
                # It's an equation
                lhs, rhs = expression.split('=', 1)
                expr = sp.sympify(lhs) - sp.sympify(rhs)
            else:
                expr = parsed_expr
            result = sp.solve(expr)
        elif operation == "differentiate":
            x = sp.Symbol('x')
            result = sp.diff(parsed_expr, x)
        elif operation == "integrate":
            x = sp.Symbol('x')
            result = sp.integrate(parsed_expr, x)
        elif operation == "evaluate":
            result = parsed_expr.evalf()
        elif operation == "factor":
            result = sp.factor(parsed_expr)
        elif operation == "expand":
            result = sp.expand(parsed_expr)
        else:
            return {
                "success": False,
                "error": f"Unsupported operation: {operation}"
            }
        
        return {
            "success": True,
            "result": str(result),
            "latex_result": sp.latex(result),
            "evaluated_result": str(result.evalf()) if hasattr(result, 'evalf') else str(result)
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@app.post("/plot-graph")
async def plot_graph(request: GraphPlotRequest):
    """Generate graph data for plotting"""
    try:
        equation = request.equation
        graph_type = request.graph_type
        x_min, x_max = request.x_range
        
        # Generate x values
        x_values = np.linspace(x_min, x_max, 100)
        
        if graph_type == "function":
            # Parse and evaluate the function
            x = sp.Symbol('x')
            expr = sp.sympify(equation)
            func = sp.lambdify(x, expr, 'numpy')
            y_values = func(x_values)
            
            # Convert to list for JSON serialization
            points = [{"x": float(x), "y": float(y)} for x, y in zip(x_values, y_values)]
            
            return {
                "success": True,
                "graph_type": "function",
                "points": points,
                "equation": equation
            }
        else:
            return {
                "success": False,
                "error": f"Unsupported graph type: {graph_type}"
            }
            
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@app.get("/test-ai-connection")
async def test_ai_connection():
    """Test if AI companion is using enhanced features"""
    try:
      #this checks if enhanced AI is working
        test_message = "Can you explain machine learning in simple terms?"
        
        response = ai_companion.generate_response(test_message, "test_user")
        
        return {
            "success": True,
            "enhanced_ai": ENHANCED_AI_AVAILABLE,
            "response_preview": response["response"][:200] + "...",
            "uses_llm": "unavailable" not in response["response"].lower() and "set up" not in response["response"].lower()
        }
    except Exception as e:
        return {"success": False, "error": str(e)}
    
@app.get("/debug-env")
async def debug_environment():
    """Debug environment variables"""
    import os
    from dotenv import load_dotenv
    
    load_dotenv()
    
    return {
        "current_working_directory": os.getcwd(),
        "env_file_exists": os.path.exists('.env'),
        "google_api_key_set": bool(os.getenv('GOOGLE_API_KEY')),
        "google_api_key_preview": os.getenv('GOOGLE_API_KEY', '')[:10] + '...' if os.getenv('GOOGLE_API_KEY') else 'NOT SET',
        "python_path": os.environ.get('PYTHONPATH', 'Not set'),
        "all_env_vars": dict(os.environ)  # Be careful with this in production
    }

# New enhanced endpoints

@app.post("/math-notebook/plot-function")
async def plot_function(request: Dict[str, Any]):
    """Enhanced function plotting with multiple types"""
    try:
        function = request.get("function", "x")
        plot_type = request.get("type", "function")
        x_range = request.get("x_range", [-10, 10])
        y_range = request.get("y_range", [-10, 10])
        
        x = np.linspace(x_range[0], x_range[1], 1000)
        
        plt.figure(figsize=(10, 6), facecolor='#1e1e1e')
        ax = plt.gca()
        ax.set_facecolor('#1e1e1e')
        
        # Plot grid and axes
        ax.grid(True, alpha=0.3, color='#3e3e42')
        ax.axhline(y=0, color='#007acc', linewidth=2)
        ax.axvline(x=0, color='#007acc', linewidth=2)
        
        if plot_type == "function":
            # Function plotting
            y_values = []
            for x_val in x:
                try:
                    safe_func = function.replace('^', '**')
                    y_val = eval(safe_func, {"x": x_val, "__builtins__": None}, 
                               {"sin": np.sin, "cos": np.cos, "tan": np.tan,
                                "exp": np.exp, "log": np.log, "sqrt": np.sqrt,
                                "pi": np.pi, "e": np.e})
                    y_values.append(y_val)
                except:
                    y_values.append(np.nan)
            
            ax.plot(x, y_values, color='#ff6b6b', linewidth=3, label=f'$y = {function}$')
        
        elif plot_type == "parametric":
            # Parametric plotting
            t = np.linspace(0, 2*np.pi, 1000)
            try:
                x_func = request.get("x_function", "cos(t)")
                y_func = request.get("y_function", "sin(t)")
                
                x_vals = eval(x_func.replace('^', '**'), {"t": t, "__builtins__": None},
                            {"sin": np.sin, "cos": np.cos, "tan": np.tan, "pi": np.pi})
                y_vals = eval(y_func.replace('^', '**'), {"t": t, "__builtins__": None},
                            {"sin": np.sin, "cos": np.cos, "tan": np.tan, "pi": np.pi})
                
                ax.plot(x_vals, y_vals, color='#4ecdc4', linewidth=3, 
                       label=f'$x = {x_func}$, $y = {y_func}$')
            except Exception as e:
                return {"success": False, "error": f"Parametric plot error: {str(e)}"}
        
        elif plot_type == "polar":
            # Polar plotting
            theta = np.linspace(0, 2*np.pi, 1000)
            try:
                r_func = request.get("r_function", "1")
                r_vals = eval(r_func.replace('^', '**'), {"theta": theta, "__builtins__": None},
                            {"sin": np.sin, "cos": np.cos, "tan": np.tan, "pi": np.pi})
                
                x_vals = r_vals * np.cos(theta)
                y_vals = r_vals * np.sin(theta)
                
                ax.plot(x_vals, y_vals, color='#ffd166', linewidth=3, 
                       label=f'$r = {r_func}$')
            except Exception as e:
                return {"success": False, "error": f"Polar plot error: {str(e)}"}
        
        # Style the plot
        ax.legend(facecolor='#2d2d30', edgecolor='none', labelcolor='white')
        ax.tick_params(colors='white')
        ax.spines['bottom'].set_color('#007acc')
        ax.spines['left'].set_color('#007acc')
        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
        
        # Set limits
        ax.set_xlim(x_range)
        ax.set_ylim(y_range)
        
        # Save to buffer
        buffer = io.BytesIO()
        plt.savefig(buffer, format='png', bbox_inches='tight', 
                   facecolor='#1e1e1e', edgecolor='none')
        buffer.seek(0)
        
        image_base64 = base64.b64encode(buffer.getvalue()).decode()
        plt.close()
        
        return {
            "success": True,
            "plot_data": image_base64,
            "format": "png"
        }
        
    except Exception as e:
        return {"success": False, "error": f"Plotting error: {str(e)}"}

@app.post("/math-notebook/matrix-operations")
async def matrix_operations(request: Dict[str, Any]):
    """Enhanced matrix operations"""
    try:
        operation = request.get("operation", "")
        matrix_a = request.get("matrix_a", [])
        matrix_b = request.get("matrix_b", [])
        
        if not matrix_a:
            return {"success": False, "error": "No matrix provided"}
        
        # Convert to numpy arrays
        try:
            A = np.array(matrix_a, dtype=float)
            if matrix_b:
                B = np.array(matrix_b, dtype=float)
        except:
            return {"success": False, "error": "Invalid matrix format"}
        
        if operation == "determinant":
            if A.shape[0] != A.shape[1]:
                return {"success": False, "error": "Matrix must be square"}
            det = np.linalg.det(A)
            return {
                "success": True, 
                "result": det, 
                "latex": f"\\det(A) = {det:.4f}",
                "evaluated": f"{det:.6f}"
            }
        
        elif operation == "inverse":
            if A.shape[0] != A.shape[1]:
                return {"success": False, "error": "Matrix must be square"}
            try:
                inv = np.linalg.inv(A)
                return {
                    "success": True, 
                    "result": inv.tolist(), 
                    "latex": sp.latex(sp.Matrix(inv)),
                    "shape": inv.shape
                }
            except:
                return {"success": False, "error": "Matrix is singular (no inverse)"}
        
        elif operation == "multiply":
            if not matrix_b:
                return {"success": False, "error": "Second matrix required for multiplication"}
            if A.shape[1] != B.shape[0]:
                return {"success": False, "error": f"Matrix dimensions incompatible: {A.shape} vs {B.shape}"}
            result = np.dot(A, B)
            return {
                "success": True, 
                "result": result.tolist(), 
                "latex": sp.latex(sp.Matrix(result)),
                "shape": result.shape
            }
        
        elif operation == "transpose":
            result = A.T
            return {
                "success": True, 
                "result": result.tolist(), 
                "latex": sp.latex(sp.Matrix(result)),
                "shape": result.shape
            }
        
        elif operation == "eigenvalues":
            if A.shape[0] != A.shape[1]:
                return {"success": False, "error": "Matrix must be square"}
            eigenvalues = np.linalg.eigvals(A)
            return {
                "success": True,
                "eigenvalues": eigenvalues.tolist(),
                "latex": "\\lambda = " + ", ".join(f"{val:.4f}" for val in eigenvalues)
            }
        
        elif operation == "rank":
            rank = np.linalg.matrix_rank(A)
            return {
                "success": True,
                "rank": rank,
                "latex": f"\\text{{rank}} = {rank}"
            }
        
        else:
            return {"success": False, "error": f"Unknown operation: {operation}"}
            
    except Exception as e:
        return {"success": False, "error": f"Matrix operation error: {str(e)}"}

@app.post("/math-notebook/solve-system")
async def solve_system(request: Dict[str, Any]):
    """Solve system of equations"""
    try:
        equations = request.get("equations", [])
        variables = request.get("variables", ["x", "y"])
        
        if not equations:
            return {"success": False, "error": "No equations provided"}
        
        # Create symbols
        syms = sp.symbols(' '.join(variables))
        
        # Parse equations
        eq_list = []
        for eq in equations:
            if '=' in eq:
                lhs, rhs = eq.split('=', 1)
                eq_list.append(sp.Eq(sp.sympify(lhs), sp.sympify(rhs)))
            else:
                eq_list.append(sp.sympify(eq))
        
        # Solve system
        solutions = sp.solve(eq_list, syms)
        
        return {
            "success": True,
            "solutions": {str(k): str(v) for k, v in solutions.items()},
            "latex_solutions": {str(k): sp.latex(v) for k, v in solutions.items()}
        }
        
    except Exception as e:
        return {"success": False, "error": f"System solving error: {str(e)}"}

@app.post("/execute-code-advanced")
async def execute_code_advanced(request: Dict[str, Any]):
    """Enhanced code execution with support for more languages"""
    try:
        code = request.get("code", "")
        language = request.get("language", "python")
        inputs = request.get("inputs", "")
        
        # Use the code executor service
        result = code_executor.execute_code(code, language)
        
        # Add additional info
        result["language"] = language
        result["timestamp"] = datetime.now().isoformat()
        
        return result
        
    except Exception as e:
        return {
            "success": False,
            "error": f"Code execution error: {str(e)}"
        }

@app.post("/graph/function")
async def graph_function(request: Dict[str, Any]):
    """Graph a single function with clear input format"""
    try:
        function = request.get("function", "")
        x_range = request.get("x_range", [-10, 10])
        y_range = request.get("y_range", [-10, 10])
        color = request.get("color", "#ff6b6b")
        
        if not function:
            return {"success": False, "error": "Function is required"}
        
        result = graphing_service.plot_function(function, x_range, y_range, color)
        return result
        
    except Exception as e:
        return {"success": False, "error": f"Graphing error: {str(e)}"}

@app.post("/graph/multiple")
async def graph_multiple_functions(request: Dict[str, Any]):
    """Graph multiple functions"""
    try:
        functions = request.get("functions", [])
        x_range = request.get("x_range", [-10, 10])
        
        if not functions:
            return {"success": False, "error": "At least one function is required"}
        
        result = graphing_service.plot_multiple_functions(functions, x_range)
        return result
        
    except Exception as e:
        return {"success": False, "error": f"Multiple graphing error: {str(e)}"}

@app.get("/graph/examples")
async def get_graph_examples():
    """Get examples of valid function inputs"""
    examples = [
        {
            "function": "x**2",
            "description": "Quadratic function - parabola",
            "latex": "x^2"
        },
        {
            "function": "sin(x)",
            "description": "Sine wave",
            "latex": "\\sin(x)"
        },
        {
            "function": "2*x + 3",
            "description": "Linear function",
            "latex": "2x + 3"
        },
        {
            "function": "sqrt(x)",
            "description": "Square root (only for x >= 0)",
            "latex": "\\sqrt{x}"
        },
        {
            "function": "exp(x)",
            "description": "Exponential function",
            "latex": "e^x"
        },
        {
            "function": "log(x)",
            "description": "Natural logarithm (only for x > 0)",
            "latex": "\\ln(x)"
        },
        {
            "function": "1/x",
            "description": "Reciprocal function",
            "latex": "\\frac{1}{x}"
        },
        {
            "function": "x*sin(x)",
            "description": "Oscillating function",
            "latex": "x\\sin(x)"
        }
    ]
    
    return {
        "success": True,
        "examples": examples,
        "tips": [
            "Use 'x' as the variable",
            "Use ** for exponents: x**2 instead of x^2",
            "Supported functions: sin, cos, tan, exp, log, sqrt, abs",
            "Use parentheses for complex expressions: sin(2*x + 1)"
        ]
    }

@app.post("/execute-code-advanced")
async def execute_code_advanced(request: Dict[str, Any]):
    """Execute code with support for multiple languages"""
    try:
        code = request.get("code", "")
        language = request.get("language", "python")
        use_online = request.get("use_online", True)
        
        if not code.strip():
            return {"success": False, "error": "Empty code"}
        
        result = advanced_code_executor.execute_code(code, language, use_online)
        result["language"] = language
        result["timestamp"] = datetime.now().isoformat()
        
        return result
        
    except Exception as e:
        return {
            "success": False,
            "error": f"Code execution error: {str(e)}"
        }
def fix_gemini_models():
    try:
        genai.configure(api_key=os.getenv('GOOGLE_API_KEY'))
        
        # Test with correct model
        model = genai.GenerativeModel('models/gemini-2.5-flash')
        response = model.generate_content("Hello")
        print("✅ Gemini 1.5 Flash is working!")
        return True
    except Exception as e:
        print(f"❌ Gemini fix failed: {e}")
        return False


fix_gemini_models()

@app.get("/supported-languages")
async def get_supported_languages():
    """Get list of all supported programming languages"""
    try:
        languages = [
            {"name": "python", "display_name": "Python", "extension": "py", "online_support": True},
            {"name": "javascript", "display_name": "JavaScript", "extension": "js", "online_support": True},
            {"name": "typescript", "display_name": "TypeScript", "extension": "ts", "online_support": True},
            {"name": "java", "display_name": "Java", "extension": "java", "online_support": True},
            {"name": "cpp", "display_name": "C++", "extension": "cpp", "online_support": True},
            {"name": "c", "display_name": "C", "extension": "c", "online_support": True},
            {"name": "csharp", "display_name": "C#", "extension": "cs", "online_support": True},
            {"name": "go", "display_name": "Go", "extension": "go", "online_support": True},
            {"name": "rust", "display_name": "Rust", "extension": "rs", "online_support": True},
            {"name": "ruby", "display_name": "Ruby", "extension": "rb", "online_support": True},
            {"name": "php", "display_name": "PHP", "extension": "php", "online_support": True},
            {"name": "swift", "display_name": "Swift", "extension": "swift", "online_support": True},
            {"name": "r", "display_name": "R", "extension": "r", "online_support": True},
            {"name": "html", "display_name": "HTML", "extension": "html", "online_support": False},
            {"name": "css", "display_name": "CSS", "extension": "css", "online_support": False},
        ]
        
        return {
            "success": True,
            "languages": languages,
            "total": len(languages)
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": f"Error getting languages: {str(e)}"
        }




if __name__ == "__main__":
    port = find_available_port(8000, 8010)
    print(f"🌐 Starting server on http://localhost:{port}")
    print(f"🤖 AI Capabilities: {'ENHANCED' if ENHANCED_AI_AVAILABLE else 'BASIC'}")
    print(f"🔥 Firebase: {'CONNECTED' if db else 'DISCONNECTED'}")
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")