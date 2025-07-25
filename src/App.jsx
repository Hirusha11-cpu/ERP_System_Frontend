import React from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from './route/router'
import 'react-quill/dist/quill.snow.css';
import 'react-circular-progressbar/dist/styles.css';
import "react-perfect-scrollbar/dist/css/styles.css";
import "react-datepicker/dist/react-datepicker.css";
import "react-datetime/css/react-datetime.css";
import NavigationProvider from './contentApi/navigationProvider';
import SideBarToggleProvider from './contentApi/sideBarToggleProvider';
import ThemeCustomizer from './components/shared/ThemeCustomizer';
import { CompanyProvider } from './contentApi/CompanyProvider';

const App = () => {
  return (
    <CompanyProvider>
      <NavigationProvider>
        <SideBarToggleProvider>
          <RouterProvider router={router} />
          <ThemeCustomizer />
        </SideBarToggleProvider>
      </NavigationProvider>
    </CompanyProvider>
  );
};

export default App;
