// Date utility functions for timezone-aware operations
export class DateUtils {
  /**
   * Get the current date in the user's local timezone as YYYY-MM-DD string
   */
  static getCurrentLocalDate(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Convert a date to local timezone YYYY-MM-DD string
   */
  static toLocalDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Parse a YYYY-MM-DD string to a Date object in local timezone
   */
  static parseLocalDate(dateString: string): Date {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  /**
   * Get the start of week for a given date in local timezone
   */
  static getStartOfWeek(date: Date = new Date()): Date {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day;
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);
    return startOfWeek;
  }

  /**
   * Get the start of month for a given date in local timezone
   */
  static getStartOfMonth(date: Date = new Date()): Date {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);
    return startOfMonth;
  }

  /**
   * Check if two dates are the same day in local timezone
   */
  static isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  /**
   * Get date string for a specific number of days ago
   */
  static getDaysAgo(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return this.toLocalDateString(date);
  }

  /**
   * Format date for display (e.g., "Dec 13, 2024")
   */
  static formatDisplayDate(dateString: string): string {
    const date = this.parseLocalDate(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  /**
   * Format date for display without year if current year
   */
  static formatShortDisplayDate(dateString: string): string {
    const date = this.parseLocalDate(dateString);
    const currentYear = new Date().getFullYear();
    
    if (date.getFullYear() === currentYear) {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    }
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  /**
   * Get relative date string (e.g., "Today", "Yesterday", "2 days ago")
   */
  static getRelativeDateString(dateString: string): string {
    const date = this.parseLocalDate(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (this.isSameDay(date, today)) {
      return 'Today';
    } else if (this.isSameDay(date, yesterday)) {
      return 'Yesterday';
    } else {
      const diffTime = today.getTime() - date.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 0 && diffDays <= 7) {
        return `${diffDays} days ago`;
      } else if (diffDays < 0 && diffDays >= -7) {
        return `In ${Math.abs(diffDays)} days`;
      } else {
        return this.formatShortDisplayDate(dateString);
      }
    }
  }

  /**
   * Check if a date string represents today
   */
  static isToday(dateString: string): boolean {
    return dateString === this.getCurrentLocalDate();
  }

  /**
   * Check if a date string is within the current week
   */
  static isThisWeek(dateString: string): boolean {
    const date = this.parseLocalDate(dateString);
    const startOfWeek = this.getStartOfWeek();
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return date >= startOfWeek && date <= endOfWeek;
  }

  /**
   * Check if a date string is within the current month
   */
  static isThisMonth(dateString: string): boolean {
    const date = this.parseLocalDate(dateString);
    const startOfMonth = this.getStartOfMonth();
    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);
    endOfMonth.setHours(23, 59, 59, 999);

    return date >= startOfMonth && date <= endOfMonth;
  }
}