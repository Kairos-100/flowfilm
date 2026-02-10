import { useState } from 'react';
import { Mail, Plus, LogIn, Send, X } from 'lucide-react';
import { useProjects } from '../contexts/ProjectsContext';
// Removed unused useAuth import
import { useGoogleAuth } from '../contexts/GoogleAuthContext';
import { sendGmailMessage } from '../services/gmail';
import { Project } from '../types';
import './Gmail.css';

export default function Gmail() {
  const { projects } = useProjects();
  const { isAuthenticated, accessToken, login, loading } = useGoogleAuth();
  const [isComposing, setIsComposing] = useState(false);

  const handleSendEmail = async (to: string, subject: string, body: string) => {
    if (isAuthenticated && accessToken) {
      try {
        await sendGmailMessage(accessToken, to, subject, body);
        alert('Email sent successfully!');
        setIsComposing(false);
      } catch (error) {
        console.error('Error sending email:', error);
        alert(`Failed to send email: ${error instanceof Error ? error.message : 'Please try again.'}`);
      }
    } else {
      alert('Please connect your Gmail account first.');
    }
  };

  if (loading) {
    return (
      <div className="gmail-container">
        <div className="gmail-header">
          <div className="gmail-header-left">
            <Mail size={24} />
            <h1>Gmail</h1>
          </div>
        </div>
        <div className="gmail-empty-state">
          <div className="loading-spinner"></div>
          <p className="empty-state-description">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="gmail-container">
        <div className="gmail-header">
          <div className="gmail-header-left">
            <Mail size={24} />
            <h1>Gmail</h1>
          </div>
        </div>
        <div className="gmail-empty-state">
          <div className="empty-state-icon-wrapper">
            <Mail size={64} strokeWidth={1.5} />
          </div>
          <h2 className="empty-state-title">Connect your Gmail account</h2>
          <p className="empty-state-description">
            Connect your Gmail account to start sending emails directly from the platform
          </p>
          <button className="btn-primary connect-btn" onClick={login}>
            <LogIn size={18} />
            <span>Connect Gmail</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="gmail-container">
      <div className="gmail-header">
        <div className="gmail-header-left">
          <Mail size={24} />
          <h1>Gmail</h1>
        </div>
        <div className="gmail-header-right">
          <button className="btn-compose" onClick={() => setIsComposing(true)}>
            <Plus size={18} />
            <span>Compose</span>
          </button>
        </div>
      </div>

      <div className="gmail-content">
        {isComposing ? (
          <ComposeEmail
            projects={projects}
            onSend={handleSendEmail}
            onCancel={() => setIsComposing(false)}
          />
        ) : (
          <div className="gmail-empty-state">
            <div className="empty-state-icon-wrapper">
              <Mail size={64} strokeWidth={1.5} />
            </div>
            <h2 className="empty-state-title">Ready to send emails</h2>
            <p className="empty-state-description">
              Click the "Compose" button to start writing and sending emails to your collaborators
            </p>
            <div className="empty-state-features">
              <div className="feature-item">
                <div className="feature-icon">✉️</div>
                <span>Send emails directly from the platform</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon">👥</div>
                <span>Communicate with your team</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon">📋</div>
                <span>Link emails to projects</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface ComposeEmailProps {
  projects: Project[];
  onSend: (to: string, subject: string, body: string, projectId?: string) => void;
  onCancel: () => void;
}

function ComposeEmail({ projects, onSend, onCancel }: ComposeEmailProps) {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [projectId, setProjectId] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (to && subject && body) {
      onSend(to, subject, body, projectId || undefined);
      setTo('');
      setSubject('');
      setBody('');
      setProjectId('');
    }
  };

  return (
    <div className="compose-email-wrapper">
      <div className="compose-email">
        <div className="compose-header">
          <div className="compose-header-content">
            <h2>New Message</h2>
            <button 
              type="button" 
              className="compose-close-btn" 
              onClick={onCancel}
              title="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="compose-form">
        <div className="form-group">
          <label>To:</label>
          <input
            type="email"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="email@example.com"
            required
          />
        </div>
        <div className="form-group">
          <label>Subject:</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Email subject"
            required
          />
        </div>
        <div className="form-group">
          <label>Project (optional):</label>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
          >
            <option value="">No project</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.title}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Message:</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write your message here..."
            rows={12}
            required
          />
        </div>
          <div className="compose-actions">
            <button type="button" className="btn-secondary" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn-primary send-btn">
              <Send size={18} />
              <span>Send</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
