import {React,useEffect,useContext} from 'react'
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
import { CompanyProvider, CompanyContext } from './contentApi/CompanyProvider';
import axios from 'axios';

const SetFavicon = () => {
  const { selectedCompany } = useContext(CompanyContext);

  useEffect(() => {
    const faviconMap = {
      aahaas: '/images/logo/aahaas_small.jpg',
      appleholidays: '/images/logo/appleholidays_small.jpg',
      shirmila: '/images/logo/shirmila_travels.jpg',
    };

    const faviconURL = faviconMap[selectedCompany] || '/images/logo/aahaas_small.jpg';

    const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
    link.type = 'image/x-icon';
    link.rel = 'icon';
    link.href = faviconURL;
    document.getElementsByTagName('head')[0].appendChild(link);
  }, [selectedCompany]);

  return null;
};

axios.defaults.baseURL = 'http://localhost:8000';

const App = () => {
  return (
    <CompanyProvider>
      <SetFavicon />
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
