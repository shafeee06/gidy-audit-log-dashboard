import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error('Dashboard render error:', error, info); }
  render() {
    if (this.state.error) {
      return <div style={{padding:32,color:'#fff',fontFamily:'Arial',background:'#07101e',minHeight:'100vh'}}>
        <h1>Dashboard could not render</h1>
        <p>{this.state.error.message}</p>
        <p>Open the browser console for details.</p>
      </div>;
    }
    return this.props.children;
  }
}

const root = document.getElementById('root');
if (!root) throw new Error('Root element was not found.');
createRoot(root).render(<ErrorBoundary><App /></ErrorBoundary>);
