export const DAYS_OF_WEEK = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// Genera slots de 30 min desde 07:30 hasta 22:30
export const GENERATE_TIME_SLOTS = (): string[] => {
  const slots: string[] = [];
  let hour = 7;
  let minute = 30;
  
  // Hasta 22:30 (inclusive el inicio del bloque)
  while (hour < 22 || (hour === 22 && minute <= 30)) {
    const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    slots.push(timeStr);
    
    minute += 30;
    if (minute === 60) {
      minute = 0;
      hour += 1;
    }
  }
  return slots;
};

export const TIME_SLOTS = GENERATE_TIME_SLOTS();