import { useState, useRef, useEffect } from 'react';
import { MoreVertical, Edit, Trash2 } from 'lucide-react';
import './ProjectCardMenu.css';

interface ProjectCardMenuProps {
  onEdit: () => void;
  onDelete: () => void;
}

export default function ProjectCardMenu({ onEdit, onDelete }: ProjectCardMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleEdit = () => {
    setIsOpen(false);
    onEdit();
  };

  const handleDelete = () => {
    setIsOpen(false);
    if (window.confirm('Are you sure you want to delete this project?')) {
      onDelete();
    }
  };

  return (
    <div className="project-card-menu" ref={menuRef}>
      <button
        className="menu-trigger"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        title="Options"
      >
        <MoreVertical size={18} />
      </button>
      {isOpen && (
        <div className="menu-dropdown">
          <button className="menu-item" onClick={handleEdit}>
            <Edit size={16} />
            <span>Edit</span>
          </button>
          <button className="menu-item danger" onClick={handleDelete}>
            <Trash2 size={16} />
            <span>Delete</span>
          </button>
        </div>
      )}
    </div>
  );
}
