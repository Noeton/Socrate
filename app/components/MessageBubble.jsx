'use client';

import ReactMarkdown from 'react-markdown';
import FeedbackMastermind from './FeedbackMastermind';

export default function MessageBubble({ message, isLast }) {
  const isUser = message.role === 'user';
  
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`message-wrapper ${isUser ? 'user' : 'assistant'}`}>
      {!isUser && (
        <div className="avatar">
          <span className="avatar-icon">🎓</span>
        </div>
      )}
      
      <div className="message-content">
        {!isUser && <div className="message-name">Socrate</div>}
        
        <div className={`message-bubble ${isUser ? 'user' : 'assistant'} ${message.isError ? 'error' : ''}`}>
          {isUser ? (
            <p>{message.content}</p>
          ) : (
            <ReactMarkdown
              components={{
                p: ({node, ...props}) => <p style={{ margin: '0.5rem 0' }} {...props} />,
                ul: ({node, ...props}) => <ul style={{ marginLeft: '1.25rem', marginTop: '0.5rem' }} {...props} />,
                ol: ({node, ...props}) => <ol style={{ marginLeft: '1.25rem', marginTop: '0.5rem' }} {...props} />,
                code: ({node, inline, ...props}) => 
                  inline ? 
                    <code style={{ 
                      background: '#f3f4f6', 
                      padding: '0.2rem 0.4rem', 
                      borderRadius: '4px',
                      fontSize: '0.9em',
                      fontFamily: 'monospace'
                    }} {...props} /> :
                    <code style={{ 
                      display: 'block',
                      background: '#f3f4f6', 
                      padding: '0.75rem', 
                      borderRadius: '8px',
                      fontSize: '0.9em',
                      fontFamily: 'monospace',
                      overflowX: 'auto',
                      margin: '0.75rem 0'
                    }} {...props} />
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
          
          {message.detailedFeedback && (
            <FeedbackMastermind detailedFeedback={message.detailedFeedback} />
          )}
        </div>
        
        {message.timestamp && (
          <div className="message-time">{formatTime(message.timestamp)}</div>
        )}
      </div>

      {isUser && (
        <div className="avatar user">
          <span className="avatar-icon">👤</span>
        </div>
      )}

      <style jsx>{`
        .message-wrapper {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 1.5rem;
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .message-wrapper.user {
          flex-direction: row-reverse;
        }

        .avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #3b82f6;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .avatar.user {
          background: #6b7280;
        }

        .avatar-icon {
          font-size: 1.25rem;
        }

        .message-content {
          max-width: 70%;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .message-wrapper.user .message-content {
          align-items: flex-end;
        }

        .message-name {
          font-size: 0.75rem;
          font-weight: 600;
          color: #6b7280;
          margin-bottom: 0.25rem;
          padding: 0 0.75rem;
        }

        .message-bubble {
          padding: 0.875rem 1.125rem;
          border-radius: 16px;
          line-height: 1.5;
          word-wrap: break-word;
        }

        .message-bubble.user {
          background: #3b82f6;
          color: white;
          border-bottom-right-radius: 4px;
        }

        .message-bubble.assistant {
          background: white;
          color: #111827;
          border: 1px solid #e5e7eb;
          border-bottom-left-radius: 4px;
        }

        .message-bubble.error {
          background: #fee2e2;
          border-color: #fca5a5;
          color: #991b1b;
        }

        .message-bubble p {
          margin: 0;
        }

        .message-bubble p:not(:last-child) {
          margin-bottom: 0.5rem;
        }

        .message-time {
          font-size: 0.7rem;
          color: #9ca3af;
          padding: 0 0.75rem;
        }

        @media (max-width: 768px) {
          .message-content {
            max-width: 85%;
          }

          .avatar {
            width: 32px;
            height: 32px;
          }

          .avatar-icon {
            font-size: 1.1rem;
          }
        }
      `}</style>
    </div>
  );
}
