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
          <svg className="avatar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
          </svg>
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
                      background: 'var(--slate-100)', 
                      padding: '0.2rem 0.4rem', 
                      borderRadius: '4px',
                      fontSize: '0.9em',
                      fontFamily: 'monospace',
                      color: 'var(--slate-800)'
                    }} {...props} /> :
                    <code style={{ 
                      display: 'block',
                      background: 'var(--slate-100)', 
                      padding: '0.75rem', 
                      borderRadius: '8px',
                      fontSize: '0.9em',
                      fontFamily: 'monospace',
                      overflowX: 'auto',
                      margin: '0.75rem 0',
                      color: 'var(--slate-800)'
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
          <svg className="avatar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
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
          background: var(--accent-base);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .avatar.user {
          background: var(--slate-600);
        }

        .avatar-icon {
          width: 20px;
          height: 20px;
          color: white;
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
          font-weight: 500;
          color: var(--slate-500);
          margin-bottom: 0.25rem;
          padding: 0 0.5rem;
        }

        .message-bubble {
          padding: 0.75rem 1rem;
          border-radius: 12px;
          line-height: 1.6;
          word-wrap: break-word;
        }

        .message-bubble.user {
          background: rgba(90, 124, 101, 0.12);
          color: var(--slate-800);
          border-bottom-right-radius: 4px;
        }

        .message-bubble.assistant {
          background: white;
          color: var(--slate-800);
          border: 1px solid var(--slate-200);
          border-bottom-left-radius: 4px;
        }

        .message-bubble.error {
          background: var(--error);
          background: color-mix(in srgb, var(--error) 10%, white);
          border-color: color-mix(in srgb, var(--error) 30%, white);
          color: var(--error);
        }

        .message-bubble p {
          margin: 0;
        }

        .message-bubble p:not(:last-child) {
          margin-bottom: 0.5rem;
        }

        .message-time {
          font-size: 0.7rem;
          color: var(--slate-400);
          padding: 0 0.5rem;
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
            width: 18px;
            height: 18px;
          }
        }
      `}</style>
    </div>
  );
}