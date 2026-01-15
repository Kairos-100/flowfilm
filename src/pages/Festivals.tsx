import { useState, useMemo } from 'react';
import { Filter, Calendar, Mail, Phone, Globe, MapPin } from 'lucide-react';
import { FestivalRegion } from '../types';
import { useFestivals } from '../contexts/FestivalsContext';
import './Festivals.css';

const regionLabels: Record<FestivalRegion, string> = {
  'europe': 'Europe',
  'north-america': 'North America',
  'south-america': 'South America',
  'asia': 'Asia',
  'africa': 'Africa',
  'oceania': 'Oceania',
  'middle-east': 'Middle East',
};

const currentYear = new Date().getFullYear();

export default function Festivals() {
  const { festivals, getFestivalsByYear } = useFestivals();
  const [selectedRegion, setSelectedRegion] = useState<FestivalRegion | 'all'>('all');
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  const filteredFestivals = useMemo(() => {
    let filtered = getFestivalsByYear(selectedYear);
    
    // Filter by region
    if (selectedRegion !== 'all') {
      filtered = filtered.filter(festival => festival.region === selectedRegion);
    }
    
    return filtered;
  }, [selectedRegion, selectedYear, getFestivalsByYear]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getDaysUntil = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadline = new Date(date);
    deadline.setHours(0, 0, 0, 0);
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDeadlineStatus = (date: Date) => {
    const days = getDaysUntil(date);
    if (days < 0) return { text: 'Expired', class: 'expired' };
    if (days <= 7) return { text: `${days} days left`, class: 'urgent' };
    if (days <= 30) return { text: `${days} days left`, class: 'warning' };
    return { text: `${days} days left`, class: 'normal' };
  };

  const availableYears = useMemo(() => {
    const years = Array.from(new Set(festivals.map(f => f.year))).sort((a, b) => b - a);
    return years;
  }, [festivals]);

  return (
    <div className="festivals-page">
      <div className="festivals-header">
        <h1>FESTIVALS</h1>
        <div className="festivals-filters">
          <div className="filter-group">
            <Filter size={16} />
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value as FestivalRegion | 'all')}
              className="filter-select"
            >
              <option value="all">All Regions</option>
              {Object.entries(regionLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <Calendar size={16} />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="filter-select"
            >
              {availableYears.map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {filteredFestivals.length === 0 ? (
        <div className="empty-state">
          <p>No festivals available for the selected filters.</p>
        </div>
      ) : (
        <div className="festivals-list">
          {filteredFestivals.map((festival) => {
            const filmSubmissionStatus = getDeadlineStatus(festival.filmSubmissionDeadline);
            const producersHubStatus = getDeadlineStatus(festival.producersHubDeadline);

            return (
              <div key={festival.id} className="festival-card">
                <div className="festival-header">
                  <div>
                    <h2 className="festival-name">{festival.name}</h2>
                    <div className="festival-meta">
                      {festival.location && (
                        <span className="festival-location">
                          <MapPin size={14} />
                          {festival.location}
                        </span>
                      )}
                      <span className="festival-region">
                        {regionLabels[festival.region]}
                      </span>
                      <span className="festival-year">{festival.year}</span>
                    </div>
                  </div>
                  {festival.website && (
                    <a
                      href={festival.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="festival-website"
                    >
                      <Globe size={18} />
                    </a>
                  )}
                </div>

                <div className="festival-dates">
                  <div className="date-section">
                    <h3 className="date-section-title">Festival Dates</h3>
                    <div className="date-info">
                      <Calendar size={16} />
                      <span>
                        {formatDate(festival.festivalStartDate)} - {formatDate(festival.festivalEndDate)}
                      </span>
                      <span className="festival-days">({festival.numberOfDays} days)</span>
                    </div>
                  </div>

                  <div className="deadlines-section">
                    <div className="deadline-item">
                      <h4 className="deadline-title">Film Submissions</h4>
                      <div className="deadline-info">
                        <span className="deadline-date">
                          {formatDate(festival.filmSubmissionDeadline)}
                        </span>
                        <span className={`deadline-status ${filmSubmissionStatus.class}`}>
                          {filmSubmissionStatus.text}
                        </span>
                      </div>
                    </div>

                    <div className="deadline-item">
                      <h4 className="deadline-title">Producers Hub Participation</h4>
                      <div className="deadline-info">
                        <span className="deadline-date">
                          {formatDate(festival.producersHubDeadline)}
                        </span>
                        <span className={`deadline-status ${producersHubStatus.class}`}>
                          {producersHubStatus.text}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {festival.contacts.length > 0 && (
                  <div className="festival-contacts">
                    <h3 className="contacts-title">Contacts</h3>
                    <div className="contacts-list">
                      {festival.contacts.map((contact, index) => (
                        <div key={index} className="contact-item">
                          {contact.name && (
                            <div className="contact-name">{contact.name}</div>
                          )}
                          {contact.role && (
                            <div className="contact-role">{contact.role}</div>
                          )}
                          <div className="contact-info">
                            {contact.email && (
                              <a href={`mailto:${contact.email}`} className="contact-link">
                                <Mail size={14} />
                                {contact.email}
                              </a>
                            )}
                            {contact.phone && (
                              <a href={`tel:${contact.phone}`} className="contact-link">
                                <Phone size={14} />
                                {contact.phone}
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
