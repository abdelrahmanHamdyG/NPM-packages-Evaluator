import React from 'react';
import ReactDOM from 'react-dom/client'; // Note the updated import for React 18
import FileUpload from './app'; // Ensure the path is correct

const rootElement = document.getElementById('root');

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement); // Create a root
  root.render(
    <React.StrictMode>
      <FileUpload />
    </React.StrictMode>
  );
}
