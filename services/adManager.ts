

export const AD_CONFIG = {
  // The Smartlink URL provided
  SMARTLINK_URL: 'https://fugitivedepart.com/s9g8tfyf?key=804ad5f08560b4ce46f5332a0f0b90d7',
  // Time in milliseconds before showing another ad action (e.g., 30 minutes)
  ACTION_INTERVAL: 30 * 60 * 1000, 
  // LocalStorage keys
  STORAGE_KEY_LAST_AD: 'cineflix_last_ad_action_timestamp',
  STORAGE_KEY_ADBLOCK: 'cineflix_adblock_status',
};

class AdManager {
  private isAdBlockActive: boolean = false;

  constructor() {
    this.detectAdBlock();
  }

  /**
   * Simple AdBlock detection by trying to fetch a known ad-related URL pattern.
   * If the request fails (blocked), we assume AdBlock is active.
   */
  async detectAdBlock() {
    try {
      const testRequest = new Request('https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js', {
        method: 'HEAD',
        mode: 'no-cors'
      });
      await fetch(testRequest).catch(() => {
        this.isAdBlockActive = true;
      });
    } catch (e) {
      this.isAdBlockActive = true;
    }
  }

  isAdBlockDetected(): boolean {
    return this.isAdBlockActive;
  }

  /**
   * Checks if enough time has passed since the last ad interaction.
   */
  shouldTriggerAd(): boolean {
    const lastAdTime = localStorage.getItem(AD_CONFIG.STORAGE_KEY_LAST_AD);
    if (!lastAdTime) return true;

    const now = Date.now();
    const timeDiff = now - parseInt(lastAdTime, 10);

    return timeDiff > AD_CONFIG.ACTION_INTERVAL;
  }

  /**
   * Call this on high-intent clicks (Watch, Download).
   * Opens the Smartlink in a new tab if the frequency cap allows.
   */
  triggerSmartLink() {
    if (this.shouldTriggerAd()) {
      // Open Smartlink in new tab (background-like behavior where possible)
      const w = window.open(AD_CONFIG.SMARTLINK_URL, '_blank');
      
      // Attempt to refocus the current window to keep user on content
      if (w) {
        try {
            window.focus(); 
        } catch(e) {
            // Browser prevented focus, ignore
        }
      }

      // Update timestamp
      localStorage.setItem(AD_CONFIG.STORAGE_KEY_LAST_AD, Date.now().toString());
    }
  }
}

export const adManager = new AdManager();