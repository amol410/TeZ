import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/client';

const AddCard = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    token: '', // In a real app, this comes from Stripe/Airpay element, we just simulate it here
    last4: '',
    network: 'Visa'
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      await apiClient.post('/cards', formData);
      navigate('/'); // Go back to dashboard on success
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add card');
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <Link to="/">Back to Dashboard</Link>
      <h1>Add New Card</h1>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', maxWidth: '300px', gap: '1rem' }}>
        <input 
          type="text" 
          name="token" 
          placeholder="Card Token (Simulated)" 
          value={formData.token} 
          onChange={handleChange} 
          required 
        />
        <input 
          type="text" 
          name="last4" 
          placeholder="Last 4 Digits" 
          maxLength="4"
          value={formData.last4} 
          onChange={handleChange} 
          required 
        />
        <select name="network" value={formData.network} onChange={handleChange}>
          <option value="Visa">Visa</option>
          <option value="Mastercard">Mastercard</option>
          <option value="RuPay">RuPay</option>
        </select>

        <button type="submit">Securely Add Card</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default AddCard;
