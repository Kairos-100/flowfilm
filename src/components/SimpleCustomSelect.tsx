import { useState, useRef, useEffect } from 'react';
import { Plus, X as XIcon, Check, ChevronDown } from 'lucide-react';
import './SimpleCustomSelect.css';

interface Option {
  value: string;
  label: string;
  isDefault?: boolean;
}

interface SimpleCustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  label: string;
  onAddOption?: (value: string, label: string) => void;
  onDeleteOption?: (value: string) => void;
  allowCustom?: boolean;
  placeholder?: string;
}

// Function to convert a name to a value (slug)
const nameToValue = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-') // Replace spaces and special characters with hyphens
    .replace(/^-+|-+$/g, ''); // Remove hyphens at start and end
};

export default function SimpleCustomSelect({
  value,
  onChange,
  options,
  label,
  onAddOption,
  onDeleteOption,
  allowCustom = true,
  placeholder = 'Select...',
}: SimpleCustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const addInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsAdding(false);
        setNewName('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isAdding && addInputRef.current) {
      addInputRef.current.focus();
    }
  }, [isAdding]);

  const selectedOption = options.find(opt => opt.value === value);

  const handleSelect = (optionValue: string) => {
    if (!isAdding) {
      onChange(optionValue);
      setIsOpen(false);
    }
  };

  const handleDelete = (e: React.MouseEvent, optionValue: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDeleteOption && window.confirm('Are you sure you want to delete this option?')) {
      onDeleteOption(optionValue);
      if (value === optionValue) {
        const remainingOptions = options.filter(opt => opt.value !== optionValue);
        if (remainingOptions.length > 0) {
          onChange(remainingOptions[0].value);
        }
      }
    }
  };

  const handleAddClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsAdding(true);
    setNewName('');
  };

  const handleCancelAdd = () => {
    setIsAdding(false);
    setNewName('');
  };

  const handleSaveAdd = (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const trimmedName = newName.trim();
    if (trimmedName && onAddOption) {
      const generatedValue = nameToValue(trimmedName);
      // Check that this value doesn't already exist
      if (!options.some(opt => opt.value === generatedValue)) {
        onAddOption(generatedValue, trimmedName);
        onChange(generatedValue);
        handleCancelAdd();
        setIsOpen(false);
      } else {
        alert('This option already exists');
      }
    }
  };

  return (
    <div className="simple-select-wrapper">
      <label className="simple-select-label">{label}</label>
      <div className="simple-select" ref={dropdownRef}>
        <button
          type="button"
          className="simple-select-trigger"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span>{selectedOption ? selectedOption.label : placeholder}</span>
          <ChevronDown size={16} className={isOpen ? 'rotate' : ''} />
        </button>

        {isOpen && (
          <div className="simple-select-dropdown">
            {options.map((option) => (
              <div
                key={option.value}
                className={`simple-select-option-wrapper ${value === option.value ? 'selected' : ''}`}
              >
                <div
                  className="simple-select-option"
                  onClick={() => handleSelect(option.value)}
                >
                  <span className="simple-select-option-label">{option.label}</span>
                  {allowCustom && (
                    <button
                      type="button"
                      className="simple-select-delete-btn"
                      onClick={(e) => handleDelete(e, option.value)}
                      title="Delete"
                    >
                      <XIcon size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
            
            {allowCustom && (
              <>
                {isAdding ? (
                  <div 
                    className="simple-select-add-form" 
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <input
                      ref={addInputRef}
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Option name"
                      className="simple-select-edit-input"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          handleCancelAdd();
                        } else if (e.key === 'Enter') {
                          e.preventDefault();
                          e.stopPropagation();
                          handleSaveAdd(e as any);
                        }
                      }}
                    />
                    <div className="simple-select-edit-actions">
                      <button
                        type="button"
                        className="simple-select-action-btn save"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleSaveAdd(e as any);
                        }}
                        disabled={!newName.trim()}
                      >
                        <Check size={14} />
                      </button>
                      <button
                        type="button"
                        className="simple-select-action-btn cancel"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleCancelAdd();
                        }}
                      >
                        <XIcon size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="simple-select-add-btn"
                    onClick={handleAddClick}
                  >
                    <Plus size={14} />
                    <span>Add</span>
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}