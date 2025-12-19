import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { fetchAppSettings } from '../store/slices/appSettingsSlice';

const AppBackground: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { appSettings } = useSelector((state: RootState) => state.appSettings);

  useEffect(() => {
    dispatch(fetchAppSettings());
  }, [dispatch]);

  useEffect(() => {
    if (appSettings?.backgroundImage) {
      // Apply background to body
      document.body.style.backgroundImage = `url(${appSettings.backgroundImage})`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center';
      document.body.style.backgroundRepeat = 'no-repeat';
      document.body.style.backgroundAttachment = 'fixed';
      
      // Create overlay for opacity
      let overlay = document.getElementById('app-background-overlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'app-background-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
        overlay.style.zIndex = '-1';
        overlay.style.pointerEvents = 'none';
        document.body.appendChild(overlay);
      }
      
      // Update overlay opacity
      const opacity = 1 - (appSettings.backgroundOpacity || 0.1);
      overlay.style.backgroundColor = `rgba(255, 255, 255, ${opacity})`;
    } else {
      // Remove background
      document.body.style.backgroundImage = '';
      document.body.style.backgroundSize = '';
      document.body.style.backgroundPosition = '';
      document.body.style.backgroundRepeat = '';
      document.body.style.backgroundAttachment = '';
      
      // Remove overlay
      const overlay = document.getElementById('app-background-overlay');
      if (overlay) {
        overlay.remove();
      }
    }

    // Cleanup function
    return () => {
      document.body.style.backgroundImage = '';
      document.body.style.backgroundSize = '';
      document.body.style.backgroundPosition = '';
      document.body.style.backgroundRepeat = '';
      document.body.style.backgroundAttachment = '';
      
      const overlay = document.getElementById('app-background-overlay');
      if (overlay) {
        overlay.remove();
      }
    };
  }, [appSettings?.backgroundImage, appSettings?.backgroundOpacity]);

  return null; // This component doesn't render anything
};

export default AppBackground;
