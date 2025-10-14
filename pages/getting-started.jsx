import React from 'react'

export default function GettingStarted() {
  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Getting Started</h1>
      
      <p>This guide will help you get started with Data Collection quickly.</p>
      
      <h2>Prerequisites</h2>
      
      <p>Before you begin, make sure you have:</p>
      
      <ul>
        <li>Node.js 16+ installed</li>
        <li>npm or yarn package manager</li>
        <li>A valid API key from your Data Collection dashboard</li>
      </ul>
      
      <h2>Installation</h2>
      
      <p>Install the Data Collection package:</p>
      
      <pre style={{ backgroundColor: '#f5f5f5', padding: '1rem', borderRadius: '4px' }}>
        <code>npm install data-collection</code>
      </pre>
      
      <h2>Basic Setup</h2>
      
      <h3>1. Import the library</h3>
      
      <pre style={{ backgroundColor: '#f5f5f5', padding: '1rem', borderRadius: '4px' }}>
        <code>import { DataCollector } from 'data-collection';</code>
      </pre>
      
      <h3>2. Initialize the collector</h3>
      
      <pre style={{ backgroundColor: '#f5f5f5', padding: '1rem', borderRadius: '4px' }}>
        <code>{`const collector = new DataCollector({
  endpoint: 'https://api.example.com/collect',
  apiKey: 'your-api-key-here'
});`}</code>
      </pre>
      
      <h3>3. Start collecting data</h3>
      
      <pre style={{ backgroundColor: '#f5f5f5', padding: '1rem', borderRadius: '4px' }}>
        <code>collector.start();</code>
      </pre>
      
      <h2>Your First Data Collection</h2>
      
      <p>Here's a simple example of collecting user interaction data:</p>
      
      <pre style={{ backgroundColor: '#f5f5f5', padding: '1rem', borderRadius: '4px' }}>
        <code>{`// Track page views
collector.track('page_view', {
  page: '/home',
  timestamp: Date.now(),
  userId: 'user123'
});

// Track custom events
collector.track('button_click', {
  buttonId: 'signup-button',
  location: 'header'
});`}</code>
      </pre>
      
      <h2>Next Steps</h2>
      
      <ul>
        <li>Learn about <a href="/configuration">Configuration Options</a></li>
        <li>Explore the <a href="/api-reference">API Reference</a></li>
        <li>Check out <a href="/best-practices">Best Practices</a></li>
      </ul>
      
      <p><a href="/">← Back to Home</a></p>
    </div>
  )
}
