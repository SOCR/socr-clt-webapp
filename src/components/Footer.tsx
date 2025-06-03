
import React, { useEffect } from 'react';

// Add window interface augmentation to declare the global variables
declare global {
  interface Window {
    _uacct: string;
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

const Footer = () => {
  useEffect(() => {
    // Only run in browser environment
    if (typeof window === 'undefined') {
      return;
    }

    // Wait for DOM to be fully loaded
    const initializeScripts = () => {
      // Triple check if document.body exists
      if (!document || !document.body) {
        console.warn('Document body not available for script injection');
        return;
      }

      try {
        // Initialize GA dataLayer first
        window.dataLayer = window.dataLayer || [];
        function gtag(...args: any[]) {
          window.dataLayer.push(args);
        }
        window.gtag = gtag;

        // Add StatCounter script
        const scScript = document.createElement('script');
        scScript.type = 'text/javascript';
        scScript.innerHTML = `
          var sc_project = 5714596;
          var sc_invisible = 1;
          var sc_security = "038e9ac4";
          var scJsHost = "https://secure.";
          document.write("<sc"+"ript type='text/javascript' src='" +
          scJsHost+"statcounter.com/counter/counter.js'></"+"script>");
        `;
        document.body.appendChild(scScript);

        // Add Google Analytics scripts
        const gaScript = document.createElement('script');
        gaScript.src = 'https://www.google-analytics.com/urchin.js';
        gaScript.async = true;
        document.body.appendChild(gaScript);

        const gtagScript = document.createElement('script');
        gtagScript.src = 'https://www.googletagmanager.com/gtag/js?id=UA-69710121-1';
        gtagScript.async = true;
        document.body.appendChild(gtagScript);

        // Initialize GA
        window._uacct = "UA-676559-1";
        gtag('js', new Date());
        gtag('config', 'UA-69710121-1');
      } catch (error) {
        console.warn('Error adding analytics scripts:', error);
      }
    };

    // Check if document is already ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeScripts);
    } else {
      // DOM is already ready
      setTimeout(initializeScripts, 0);
    }

    return () => {
      // Clean up event listener
      document.removeEventListener('DOMContentLoaded', initializeScripts);
      
      // Clean up scripts
      try {
        if (typeof document !== 'undefined' && document.body) {
          const scripts = document.body.querySelectorAll('script[src*="statcounter"], script[src*="google-analytics"], script[src*="googletagmanager"]');
          scripts.forEach(script => {
            if (document.body.contains(script)) {
              document.body.removeChild(script);
            }
          });
        }
      } catch (error) {
        console.warn('Error cleaning up scripts:', error);
      }
    };
  }, []);

  return (
    <footer className="w-full py-4 mt-8 text-center border-t">
      <div className="flex items-center justify-center gap-2">
        <a href="https://www.socr.umich.edu/" className="text-blue-600 hover:underline">SOCR Resource</a>
        <span>Visitor number</span>
        <img 
          className="statcounter inline-block" 
          src="https://c.statcounter.com/5714596/0/038e9ac4/0/" 
          alt="Web Analytics" 
          style={{ border: 0 }}
        />
        <span>{new Date().getFullYear()}</span>
        <a href="/img/SOCR_Email.png">
          <img 
            alt="SOCR Email" 
            title="SOCR Email" 
            src="/img/SOCR_Email.png" 
            style={{ border: 0, height: 20 }}
          />
        </a>
      </div>
      <noscript>
        <div className="statcounter">
          <a title="web analytics" href="https://statcounter.com/" target="_blank" rel="noopener noreferrer">
            <img 
              className="statcounter" 
              src="//c.statcounter.com/5714596/0/038e9ac4/1/" 
              alt="web analytics"
            />
          </a>
        </div>
      </noscript>
    </footer>
  );
};

export default Footer;
