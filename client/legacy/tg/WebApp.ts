declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        backgroundColor: string;
        textColor: string;
        buttonColor: string;
        buttonTextColor: string;
      };
    };
  }
}

export const initWebApp = () => {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    window.Telegram.WebApp.ready();
    return window.Telegram.WebApp;
  }
  return null;
};

export const getWebAppColors = () => {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    return {
      backgroundColor: window.Telegram.WebApp.backgroundColor,
      textColor: window.Telegram.WebApp.textColor,
      buttonColor: window.Telegram.WebApp.buttonColor,
      buttonTextColor: window.Telegram.WebApp.buttonTextColor,
    };
  }
  return {
    backgroundColor: '#ffffff',
    textColor: '#000000',
    buttonColor: '#3390ec',
    buttonTextColor: '#ffffff',
  };
};