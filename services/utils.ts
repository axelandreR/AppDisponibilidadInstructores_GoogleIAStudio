import { AvailabilityVersion, User } from '../types';
import { TIME_SLOTS_STRINGS, DAYS_OF_WEEK } from '../constants';

// Validate Password: Min 8 chars, letters and numbers
export const validatePassword = (password: string): boolean => {
  const regex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
  return regex.test(password);
};

// Validate: Min 2 hours consecutive (4 blocks) per segment
export const validateAvailability = (selectedSlots: string[]): { valid: boolean; error?: string } => {
  if (selectedSlots.length === 0) return { valid: true };

  // Group by day
  const slotsByDay: Record<string, number[]> = {};

  selectedSlots.forEach(slotId => {
    const [day, time] = slotId.split('-');
    if (!slotsByDay[day]) slotsByDay[day] = [];
    
    // Convert time to index in TIME_SLOTS_STRINGS for easy math
    const timeIndex = TIME_SLOTS_STRINGS.indexOf(time);
    if (timeIndex !== -1) {
      slotsByDay[day].push(timeIndex);
    }
  });

  // Check connectivity
  for (const day of Object.keys(slotsByDay)) {
    const indices = slotsByDay[day].sort((a, b) => a - b);
    
    const chains: number[][] = [];
    let currentChain: number[] = [indices[0]];
    
    for (let i = 1; i < indices.length; i++) {
      if (indices[i] === indices[i-1] + 1) {
        currentChain.push(indices[i]);
      } else {
        chains.push(currentChain);
        currentChain = [indices[i]];
      }
    }
    chains.push(currentChain);

    // Rule: Every chain must be at least 4 blocks (2 hours)
    for (const chain of chains) {
      if (chain.length < 4) {
        // Find start time of the problematic chain for better error msg
        const startIdx = chain[0];
        const timeStr = TIME_SLOTS_STRINGS[startIdx];
        return { 
          valid: false, 
          error: `En ${day} a las ${timeStr}, tienes un bloque aislado de menos de 2 horas consecutivas. Mínimo 4 casillas continuas.` 
        };
      }
    }
  }

  return { valid: true };
};

export const downloadCSV = (filename: string, rows: string[][]) => {
  const csvContent = "data:text/csv;charset=utf-8," 
      + rows.map(e => e.join(",")).join("\n");
  
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const generateAvailabilityReport = (users: User[], availabilities: AvailabilityVersion[]) => {
  const header = ["Instructor ID", "Nombre", "Periodo", "Es Final", "Origen Datos", "Día", "Hora Inicio", "Hora Fin", "Comentarios"];
  const rows = [header];

  users.filter(u => u.role === 'INSTRUCTOR').forEach(user => {
    // FUNCTIONAL RULE: 
    // 1. Try to find version marked as isFinal
    // 2. If not found, find the LATEST version created (Fallback)
    // 3. If none, report as N/A

    const userVersions = availabilities.filter(a => a.instructorId === user.id);
    let targetVersion = userVersions.find(a => a.isFinal);
    let originType = "FINAL_MARCADA";

    if (!targetVersion && userVersions.length > 0) {
        // Sort by timestamp descending and take first
        targetVersion = [...userVersions].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
        originType = "ULTIMA_VERSION (FALLBACK)";
    }
    
    if (targetVersion) {
      const slotsByDay: Record<string, number[]> = {};
      targetVersion.slots.forEach(slot => {
        const [day, time] = slot.split('-');
        const timeIndex = TIME_SLOTS_STRINGS.indexOf(time);
        if (!slotsByDay[day]) slotsByDay[day] = [];
        slotsByDay[day].push(timeIndex);
      });

      Object.keys(slotsByDay).forEach(day => {
        const indices = slotsByDay[day].sort((a, b) => a - b);
        let startIdx = indices[0];
        let prevIdx = indices[0];

        for (let i = 1; i < indices.length; i++) {
          if (indices[i] !== prevIdx + 1) {
             const startStr = TIME_SLOTS_STRINGS[startIdx];
             const endSlotIdx = prevIdx + 1; 
             const endStr = endSlotIdx < TIME_SLOTS_STRINGS.length ? TIME_SLOTS_STRINGS[endSlotIdx] : '23:00';

             rows.push([
               user.id, 
               user.name, 
               targetVersion.periodId,
               targetVersion.isFinal ? 'SI' : 'NO',
               originType,
               day, 
               startStr, 
               endStr, 
               targetVersion.comments.replace(/,/g, ' ') || ''
              ]);

             startIdx = indices[i];
          }
          prevIdx = indices[i];
        }
        const startStr = TIME_SLOTS_STRINGS[startIdx];
        const endSlotIdx = prevIdx + 1;
        const endStr = endSlotIdx < TIME_SLOTS_STRINGS.length ? TIME_SLOTS_STRINGS[endSlotIdx] : '23:00';
        rows.push([
          user.id, 
          user.name, 
          targetVersion.periodId,
          targetVersion.isFinal ? 'SI' : 'NO',
          originType,
          day, 
          startStr, 
          endStr, 
          targetVersion.comments.replace(/,/g, ' ') || ''
        ]);
      });
    } else {
        rows.push([user.id, user.name, "N/A", "NO", "SIN DATOS", "-", "-", "-", "-"]);
    }
  });

  return rows;
};