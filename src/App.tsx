import React from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './init';
import { store } from './store';
import LoginForm from './routes/LoginForm';
import Loading from './routes/Loading';
import ConvolutionsViewer from './routes/ConvolutionsViewer';
import NotFound from './components/views/NotFound';
import ErrorModal from './components/modals/Error';
import ViewerUiShortcuts from './components/navbar/ViewerUiShortcuts';
import ViewerStatusBar from './components/navbar/ViewerStatusBar';

const appGlobalCSS = new URL('./styles/appGlobal.css', import.meta.url).href;
const courseGlobalCSS = new URL('./styles/courseGlobal.css', import.meta.url).href;

function loadCSS(href: string): void {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
}

loadCSS(appGlobalCSS);
loadCSS(courseGlobalCSS);

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter basename={process.env.PUBLIC_URL || ''}>
        <ViewerUiShortcuts />
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/" element={<Loading />} />
          <Route path="/convolution/*" element={<ConvolutionsViewer />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <ViewerStatusBar />
        <ErrorModal />
      </BrowserRouter>
    </Provider>
  );
}

export default App;
