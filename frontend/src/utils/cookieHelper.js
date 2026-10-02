/**
 * Cookie Helper Utility with JSON support and fallback
 */

export function setCookie(name, value, days = 30) {
  try {
    const stringVal = typeof value === 'object' ? JSON.stringify(value) : String(value);
    const maxAge = days * 24 * 60 * 60;
    const encoded = encodeURIComponent(stringVal);
    document.cookie = `${name}=${encoded}; max-age=${maxAge}; path=/; SameSite=Lax`;
    
    // Backup to localStorage for high reliability
    try {
      localStorage.setItem(`cookie_bak_${name}`, stringVal);
    } catch {
      // ignore localStorage quota errors
    }
  } catch (err) {
    console.error(`Failed to set cookie ${name}:`, err);
  }
}

export function getCookie(name) {
  try {
    const cookies = document.cookie ? document.cookie.split('; ') : [];
    for (const c of cookies) {
      const [key, ...parts] = c.split('=');
      if (key === name) {
        const raw = decodeURIComponent(parts.join('='));
        try {
          return JSON.parse(raw);
        } catch {
          return raw;
        }
      }
    }
    
    // Fallback to localStorage backup if cookie not found
    try {
      const bak = localStorage.getItem(`cookie_bak_${name}`);
      if (bak !== null) {
        try {
          return JSON.parse(bak);
        } catch {
          return bak;
        }
      }
    } catch {
      // ignore
    }
  } catch (err) {
    console.error(`Failed to get cookie ${name}:`, err);
  }
  return null;
}

export function removeCookie(name) {
  try {
    document.cookie = `${name}=; max-age=0; path=/; SameSite=Lax`;
    try {
      localStorage.removeItem(`cookie_bak_${name}`);
    } catch {
      // ignore
    }
  } catch (err) {
    console.error(`Failed to remove cookie ${name}:`, err);
  }
}
