import React from 'react'

export default function Home() {
  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Data Collection</h1>
      
      <p>Welcome to Data Collection documentation. This is the default project that will be displayed on the homepage.</p>
      
      <h2>Quick Start</h2>
      
      <p>Get started with Data Collection in just a few steps:</p>
      
      <h3>1. Installation</h3>
      
      <pre style={{ backgroundColor: '#f5f5f5', padding: '1rem', borderRadius: '4px' }}>
        <code>npm install data-collection</code>
      </pre>
      
      <h3>2. Basic Usage</h3>
      
      <pre style={{ backgroundColor: '#f5f5f5', padding: '1rem', borderRadius: '4px' }}>
        <code>{`import { DataCollector } from 'data-collection';

const collector = new DataCollector({
  endpoint: 'https://api.example.com/collect',
  apiKey: 'your-api-key'
});

// Start collecting data
collector.start();`}</code>
      </pre>
      
      <h3>3. Configuration</h3>
      
      <p>Configure your data collection settings:</p>
      
      <pre style={{ backgroundColor: '#f5f5f5', padding: '1rem', borderRadius: '4px' }}>
        <code>{`const config = {
  batchSize: 100,
  flushInterval: 5000,
  retryAttempts: 3
};

collector.configure(config);`}</code>
      </pre>
      
      <h2>Features</h2>
      
      <ul>
        <li><strong>Real-time Data Collection</strong>: Collect data in real-time with minimal latency</li>
        <li><strong>Batch Processing</strong>: Efficient batch processing for high-volume data</li>
        <li><strong>Error Handling</strong>: Robust error handling and retry mechanisms</li>
        <li><strong>Multiple Formats</strong>: Support for JSON, CSV, and custom formats</li>
      </ul>
      
      <h2>Next Steps</h2>
      
      <ul>
        <li><a href="/getting-started">Getting Started Guide</a></li>
        <li><a href="/api-reference">API Reference</a></li>
        <li><a href="/configuration">Configuration Options</a></li>
        <li><a href="/best-practices">Best Practices</a></li>
      </ul>
      
      <h2>Other Projects</h2>
      
      <ul>
        <li><a href="/auto-testing">Auto Testing</a></li>
        <li><a href="/web-replay">Web Replay</a></li>
      </ul>
    </div>
  )
}
