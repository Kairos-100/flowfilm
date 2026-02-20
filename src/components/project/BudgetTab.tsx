import { useState } from 'react';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { BudgetItem } from '../../types';
import './ProjectTabs.css';

interface BudgetTabProps {
  budgetItems: BudgetItem[];
  onAddItem: (item: Omit<BudgetItem, 'id'>) => Promise<void> | void;
  onUpdateItem: (itemId: string, updates: Partial<BudgetItem>) => Promise<void> | void;
  onRemoveItem: (itemId: string) => Promise<void> | void;
}

const statusColors = {
  aprobado: '#0f7b0f',
  pendiente: '#d97706',
  rechazado: '#dc2626',
};

const budgetCategories = [
  'Pre-Production',
  'Production',
  'Post-Production',
  'Cast',
  'Crew',
  'Equipment',
  'Location',
  'Music',
  'Marketing',
  'Other',
];

export default function BudgetTab({ budgetItems, onAddItem, onUpdateItem, onRemoveItem }: BudgetTabProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);
  const [formData, setFormData] = useState({
    category: '',
    description: '',
    amount: '',
    status: 'pendiente' as BudgetItem['status'],
  });

  const total = budgetItems.reduce((sum, item) => sum + item.amount, 0);
  const approved = budgetItems
    .filter((item) => item.status === 'aprobado')
    .reduce((sum, item) => sum + item.amount, 0);
  const pending = budgetItems
    .filter((item) => item.status === 'pendiente')
    .reduce((sum, item) => sum + item.amount, 0);
  const rejected = budgetItems
    .filter((item) => item.status === 'rechazado')
    .reduce((sum, item) => sum + item.amount, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingItem) {
        await onUpdateItem(editingItem.id, {
          category: formData.category,
          description: formData.description,
          amount: parseFloat(formData.amount),
          status: formData.status,
        });
        setEditingItem(null);
      } else {
        await onAddItem({
          category: formData.category,
          description: formData.description,
          amount: parseFloat(formData.amount),
          status: formData.status,
        });
      }

      setFormData({ category: '', description: '', amount: '', status: 'pendiente' });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error saving budget item:', error);
      alert('Error al guardar el item de presupuesto. Por favor, intenta de nuevo.');
    }
  };

  const handleEdit = (item: BudgetItem) => {
    setEditingItem(item);
    setFormData({
      category: item.category,
      description: item.description,
      amount: item.amount.toString(),
      status: item.status,
    });
    setShowAddForm(true);
  };

  const handleCancel = () => {
    setShowAddForm(false);
    setEditingItem(null);
    setFormData({ category: '', description: '', amount: '', status: 'pendiente' });
  };

  const handleStatusChange = async (itemId: string, newStatus: BudgetItem['status']) => {
    try {
      await onUpdateItem(itemId, { status: newStatus });
    } catch (error) {
      console.error('Error updating budget item status:', error);
      alert('Error al actualizar el estado del item. Por favor, intenta de nuevo.');
    }
  };

  return (
    <div className="tab-content">
      {/* Budget Summary in Header */}
      {budgetItems.length > 0 && (
        <div className="project-budget-summary-inline">
          <div className="budget-summary-item">
            <span className="budget-label">Total Budget</span>
            <span className="budget-value">€{total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="budget-summary-item">
            <span className="budget-label">Approved</span>
            <span className="budget-value approved">€{approved.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="budget-summary-item">
            <span className="budget-label">Pending</span>
            <span className="budget-value pending">€{pending.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          {rejected > 0 && (
            <div className="budget-summary-item">
              <span className="budget-label">Rejected</span>
              <span className="budget-value rejected">€{rejected.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          )}
        </div>
      )}

      <div className="tab-header">
        <h2>Budget</h2>
        <button 
          className="btn-secondary" 
          onClick={() => {
            if (showAddForm && !editingItem) {
              handleCancel();
            } else {
              setShowAddForm(!showAddForm);
              setEditingItem(null);
              setFormData({ category: '', description: '', amount: '', status: 'pendiente' });
            }
          }}
        >
          <Plus size={18} />
          <span>{showAddForm && !editingItem ? 'Cancel' : 'Add Item'}</span>
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="budget-form">
          <div className="form-row">
            <div className="form-field">
              <label>Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              >
                <option value="">Select category</option>
                {budgetCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Amount (€) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>
            <div className="form-field">
              <label>Initial Status *</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as BudgetItem['status'] })}
              >
                <option value="pendiente">Pending</option>
                <option value="aprobado">Approved</option>
                <option value="rechazado">Rejected</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-field full-width">
              <label>Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Budget item description..."
                rows={3}
                required
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={handleCancel}>
              <X size={16} />
              <span>Cancel</span>
            </button>
            <button type="submit" className="btn-primary">
              <Plus size={16} />
              <span>{editingItem ? 'Update Item' : 'Add Item'}</span>
            </button>
          </div>
        </form>
      )}

      <div className="budget-summary">
        <div className="summary-card">
          <div className="summary-label">Total Budget</div>
          <div className="summary-value">€{total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Approved</div>
          <div className="summary-value approved">€{approved.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Pending</div>
          <div className="summary-value pending">€{pending.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>
        {rejected > 0 && (
          <div className="summary-card">
            <div className="summary-label">Rejected</div>
            <div className="summary-value rejected">€{rejected.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
        )}
      </div>

      {budgetItems.length === 0 ? (
        <div className="empty-state">
          <p>No budget items added yet.</p>
          <p style={{ fontSize: '14px', marginTop: '8px', color: 'var(--text-secondary)' }}>
            Click "Add Item" to start tracking your project budget.
          </p>
        </div>
      ) : (
        <div className="budget-table">
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {budgetItems.map((item) => {
                return (
                  <tr key={item.id}>
                    <td className="budget-category">{item.category}</td>
                    <td>{item.description}</td>
                    <td className="budget-amount">€{item.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td>
                      <select
                        className="budget-status-select"
                        value={item.status}
                        onChange={(e) => handleStatusChange(item.id, e.target.value as BudgetItem['status'])}
                        style={{ 
                          color: statusColors[item.status],
                          borderColor: statusColors[item.status],
                        }}
                      >
                        <option value="pendiente">Pending</option>
                        <option value="aprobado">Approved</option>
                        <option value="rechazado">Rejected</option>
                      </select>
                    </td>
                    <td>
                      <div className="budget-actions">
                        <button
                          className="icon-btn"
                          onClick={() => handleEdit(item)}
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="icon-btn delete"
                          onClick={async () => {
                            if (confirm('¿Estás seguro de que quieres eliminar este item de presupuesto?')) {
                              try {
                                await onRemoveItem(item.id);
                              } catch (error) {
                                console.error('Error removing budget item:', error);
                                alert('Error al eliminar el item. Por favor, intenta de nuevo.');
                              }
                            }
                          }}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
