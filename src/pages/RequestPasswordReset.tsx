import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useGoogleAuth } from '../contexts/GoogleAuthContext';
import { sendGmailMessage } from '../services/gmail';
import './Login.css';

export default function RequestPasswordReset() {
  const { requestPasswordReset } = useAuth();
  const { isAuthenticated, accessToken } = useGoogleAuth();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLink, setResetLink] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();

  const createResetEmailHTML = (resetLink: string) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #d4af37 0%, #b8941f 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; padding: 12px 30px; background-color: #d4af37; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: 600; }
          .button:hover { background-color: #b8941f; }
          .footer { margin-top: 20px; font-size: 12px; color: #666; text-align: center; }
          .link { word-break: break-all; color: #d4af37; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Flow Film</h1>
            <p>Password Reset Request</p>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>You requested to reset your password for your Flow Film account.</p>
            <p>Click the button below to reset your password:</p>
            <div style="text-align: center;">
              <a href="${resetLink}" class="button">Reset Password</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p><a href="${resetLink}" class="link">${resetLink}</a></p>
            <p><strong>This link will expire in 30 minutes.</strong></p>
            <p>If you didn't request this password reset, please ignore this email.</p>
            <div class="footer">
              <p>This is an automated message, please do not reply.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);
    setResetLink(null);
    setEmailSent(false);
    
    try {
      const res = await requestPasswordReset(email);
      
      if (!res.token) {
        // Si no hay token, el email no existe, pero no lo revelamos por seguridad
        setMessage('If this email exists, a reset link has been sent.');
        setLoading(false);
        return;
      }

      const link = `${window.location.origin}/reset-password?token=${encodeURIComponent(res.token)}`;
      setResetLink(link);

      // Intentar enviar email usando Gmail API si está disponible
      if (isAuthenticated && accessToken) {
        try {
          const emailHTML = createResetEmailHTML(link);
          await sendGmailMessage(
            accessToken,
            email,
            'Flow Film - Password Reset Request',
            emailHTML
          );
          setEmailSent(true);
          setMessage('Password reset link has been sent to your email address.');
        } catch (gmailError) {
          console.error('Error sending email via Gmail:', gmailError);
          // Si falla Gmail, mostrar el enlace como fallback
          setMessage('Email could not be sent automatically. Please use the link below:');
          setResetLink(link);
        }
      } else {
        // Si no hay Gmail conectado, mostrar el enlace para desarrollo
        setMessage('Gmail is not connected. For development, use the link below:');
        setResetLink(link);
      }
    } catch (err) {
      console.error('Error requesting password reset:', err);
      setMessage('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>Reset Password</h1>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              autoComplete="email"
            />
          </div>

          {message && (
            <div className={`info-note ${emailSent ? 'success-message' : ''}`}>
              {message}
            </div>
          )}
          {resetLink && !emailSent && (
            <div className="info-note" style={{ wordBreak: 'break-all', marginTop: '8px', padding: '12px', backgroundColor: 'var(--bg-tertiary)', borderRadius: '6px' }}>
              <strong>Reset Link:</strong><br />
              <a href={resetLink} style={{ color: 'var(--accent)', textDecoration: 'underline' }}>
                {resetLink}
              </a>
            </div>
          )}
          {!isAuthenticated && (
            <div className="info-note" style={{ marginTop: '12px', padding: '12px', backgroundColor: '#fff3cd', borderRadius: '6px', color: '#856404' }}>
              <strong>Tip:</strong> Connect Gmail in the Calendar or Gmail page to receive reset emails automatically.
            </div>
          )}

          <button type="submit" className="login-button" disabled={loading}>
            <span>{loading ? 'Sending...' : 'Send Reset Link'}</span>
          </button>
          <button
            type="button"
            className="register-button-secondary"
            style={{ marginTop: 8 }}
            onClick={() => navigate('/login')}
          >
            Back to Login
          </button>
        </form>
      </div>
    </div>
  );
}

