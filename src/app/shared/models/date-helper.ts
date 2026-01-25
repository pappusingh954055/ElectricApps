export class DateHelper {
  // Payload ke liye (Object -> String)
  static toLocalISOString(date: any): string | null {
    if (!date) return null;
    const d = new Date(date);
    const year = d.getFullYear();
    const month = ('0' + (d.getMonth() + 1)).slice(-2);
    const day = ('0' + d.getDate()).slice(-2);
    return `${year}-${month}-${day}`;
  }

  // Fetch ke liye (String -> Date Object)
  static toDateObject(dateStr: any): Date | null {
    if (!dateStr) return null;
    return new Date(dateStr); // Ye string ko local date object mein convert kar dega
  }
}