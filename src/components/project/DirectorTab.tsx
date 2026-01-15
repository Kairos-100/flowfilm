import { Mail, Phone, User } from 'lucide-react';
import { Director } from '../../types';
import './ProjectTabs.css';

interface DirectorTabProps {
  director?: Director;
}

export default function DirectorTab({ director }: DirectorTabProps) {
  if (!director) {
    return (
      <div className="tab-content">
        <div className="tab-header">
          <h2>Director</h2>
        </div>
        <div className="empty-state">
          <p>No director assigned to this project.</p>
          <button className="btn-secondary" style={{ marginTop: '16px' }}>
            <User size={18} />
            <span>Assign Director</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="tab-content">
      <div className="tab-header">
        <h2>Director</h2>
        <button className="btn-secondary">
          <User size={18} />
          <span>Edit</span>
        </button>
      </div>

      <div className="director-card">
        <div className="director-avatar">
          {director.name.charAt(0).toUpperCase()}
        </div>
        <div className="director-info">
          <h3 className="director-name">{director.name}</h3>
          {director.bio && <p className="director-bio">{director.bio}</p>}
          <div className="director-contact">
            <a href={`mailto:${director.email}`} className="contact-link">
              <Mail size={16} />
              <span>{director.email}</span>
            </a>
            {director.phone && (
              <a href={`tel:${director.phone}`} className="contact-link">
                <Phone size={16} />
                <span>{director.phone}</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
