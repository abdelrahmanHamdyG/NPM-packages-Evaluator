import React from 'react';
import ReactDOM from 'react-dom';
import FileUpload from './app'; // Ensure the path is correct

const rootElement = document.getElementById('root');

ReactDOM.render(
  <React.StrictMode>
    <FileUpload />
  </React.StrictMode>,
  rootElement
);
