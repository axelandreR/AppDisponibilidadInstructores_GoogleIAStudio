import { api } from './api';

export const reportService = {
  /**
   * Descarga el reporte consolidado
   */
  downloadConsolidated: async (periodId: string) => {
    return downloadFile(`/reports/consolidated?periodId=${periodId}`, `consolidado_${periodId}.csv`);
  },

  /**
   * Descarga el reporte individual de un instructor
   */
  downloadIndividual: async (instructorId: string, periodId: string) => {
    return downloadFile(
      `/reports/instructor/${instructorId}?periodId=${periodId}`, 
      `reporte_${instructorId}.csv`
    );
  }
};

/**
 * Helper para manejar la descarga de Blobs en el navegador
 */
const downloadFile = async (endpoint: string, defaultFilename: string) => {
  try {
    const response = await api.get(endpoint, {
      responseType: 'blob', // Importante: Indicar a Axios que es un binario
    });

    // Crear URL temporal
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    
    // Intentar sacar nombre del header o usar default
    const contentDisposition = response.headers['content-disposition'];
    let filename = defaultFilename;
    if (contentDisposition) {
      const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/);
      if (fileNameMatch && fileNameMatch.length === 2)
        filename = fileNameMatch[1];
    }

    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    
    // Limpieza
    link.remove();
    window.URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('Error downloading file', error);
    throw error;
  }
};