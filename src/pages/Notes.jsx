// src/pages/Notes.jsx
import React, { useState, useRef, useEffect } from 'react';
import { QuizApiService } from '../utils/quizApiService';
import { useAuth } from '../context/AuthContext';
import '../styles/notes.css';

function Notes() {
  const [conversation, setConversation] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [activeNote, setActiveNote] = useState(null);
  const [notes, setNotes] = useState([]);
  const messagesEndRef = useRef(null);
  const { currentUser } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);


  useEffect(() => {
    //
    loadUserNotes();
  }, [currentUser]);

  const loadUserNotes = async () => {
    const userNotes = []; 
    setNotes(userNotes);
  };

  const askAI = async (message) => {
    setIsLoading(true);
    try {
      const response = await QuizApiService.chatWithAI(
        message,
        currentUser?.uid || 'anonymous',
        conversationId
      );

      setConversationId(response.conversation_id);
      
      const aiResponse = {
        id: Date.now(),
        type: 'ai',
        content: response.response || response.answer || "I'm here to help!",
        timestamp: new Date().toLocaleTimeString()
      };

      setConversation(prev => [...prev, aiResponse]);
      return aiResponse;

    } catch (error) {
      console.error('AI chat error:', error);
      const errorResponse = {
        id: Date.now(),
        type: 'ai',
        content: "Sorry, I'm having trouble connecting right now. Please try again later.",
        timestamp: new Date().toLocaleTimeString(),
        isError: true
      };
      setConversation(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: userInput,
      timestamp: new Date().toLocaleTimeString()
    };

    setConversation(prev => [...prev, userMessage]);
    setUserInput('');

    await askAI(userInput);
  };

  const handleQuickAction = (action) => {
    let message = '';
    
    switch(action) {
      case 'summarize':
        message = "Can you summarize the key points from my notes?";
        break;
      case 'explain':
        message = "Can you explain this concept in simpler terms?";
        break;
      case 'quiz':
        message = "Can you create a quiz based on my notes?";
        break;
      case 'examples':
        message = "Can you provide some real-world examples related to this topic?";
        break;
      default:
        message = action;
    }

    setUserInput(message);
  };

  const clearConversation = () => {
    setConversation([]);
    setConversationId(null);
  };

  const suggestedQuestions = [
    "Summarize my notes",
    "Explain this concept",
    "Create a quiz from this",
    "Give me examples",
    "What are the key points?",
    "Help me study this topic"
  ];

  return (
    <div className="notes-container">
      <div className="notes-header">
        <h1>📝 Notes & AI Companion</h1>
        <p>Chat with your AI study companion about your notes</p>
      </div>

      <div className="notes-layout">
        {/* Notes Sidebar */}
        <div className="notes-sidebar">
          <div className="sidebar-header">
            <h3>Your Notes</h3>
            <button className="new-note-btn">+ New Note</button>
          </div>
          
          <div className="notes-list">
            {notes.length > 0 ? (
              notes.map(note => (
                <div 
                  key={note.id}
                  className={`note-item ${activeNote?.id === note.id ? 'active' : ''}`}
                  onClick={() => setActiveNote(note)}
                >
                  <h4>{note.title}</h4>
                  <p>{note.content?.substring(0, 50)}...</p>
                  <span className="note-date">
                    {new Date(note.updatedAt?.toDate()).toLocaleDateString()}
                  </span>
                </div>
              ))
            ) : (
              <div className="empty-notes">
                <p>No notes yet</p>
                <button className="create-first-note">Create your first note</button>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="quick-actions">
            <h4>Quick Actions</h4>
            <button onClick={() => handleQuickAction('summarize')}>
              📋 Summarize
            </button>
            <button onClick={() => handleQuickAction('explain')}>
              💡 Explain
            </button>
            <button onClick={() => handleQuickAction('quiz')}>
              🎯 Create Quiz
            </button>
            <button onClick={() => handleQuickAction('examples')}>
              🌟 Get Examples
            </button>
          </div>
        </div>

        {/* Chat Area */}
        <div className="chat-container">
          <div className="chat-header">
            <h3>AI Study Companion</h3>
            <button onClick={clearConversation} className="clear-chat-btn">
              🗑️ Clear Chat
            </button>
          </div>

          <div className="messages-container">
            {conversation.length === 0 ? (
              <div className="welcome-message">
                <div className="welcome-icon">🤖</div>
                <h3>Hello! I'm your AI Study Companion</h3>
                <p>I can help you with:</p>
                <ul>
                  <li>📚 Summarizing your notes</li>
                  <li>💡 Explaining complex concepts</li>
                  <li>🎯 Creating practice quizzes</li>
                  <li>🌟 Providing real-world examples</li>
                  <li>🔍 Answering study-related questions</li>
                </ul>
                
                <div className="suggested-questions">
                  <p>Try asking me:</p>
                  {suggestedQuestions.map((question, index) => (
                    <button
                      key={index}
                      className="suggestion-chip"
                      onClick={() => handleQuickAction(question)}
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              conversation.map((message) => (
                <div
                  key={message.id}
                  className={`message ${message.type} ${message.isError ? 'error' : ''}`}
                >
                  <div className="message-avatar">
                    {message.type === 'user' ? '👤' : '🤖'}
                  </div>
                  <div className="message-content">
                    <div className="message-text">
                      {message.content}
                    </div>
                    <div className="message-timestamp">
                      {message.timestamp}
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {isLoading && (
              <div className="message ai loading">
                <div className="message-avatar">🤖</div>
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="input-container">
            <div className="input-wrapper">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Ask me anything about your notes..."
                disabled={isLoading}
                className="message-input"
              />
              <button 
                type="submit" 
                disabled={!userInput.trim() || isLoading}
                className="send-button"
              >
                {isLoading ? '⏳' : '📤'}
              </button>
            </div>
            
            <div className="input-actions">
              <span className="char-count">
                {userInput.length}/500
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Notes;