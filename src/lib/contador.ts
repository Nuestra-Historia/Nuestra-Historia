export interface DesgloseTiempo {
  dias: number;
  horas: number;
  minutos: number;
  segundos: number;
}

export function desglosar(diffMs: number): DesgloseTiempo {
  const safeDiff = Math.max(0, Math.floor(diffMs));

  const dias = Math.floor(safeDiff / 86400000);
  const restoDias = safeDiff % 86400000;

  const horas = Math.floor(restoDias / 3600000);
  const restoHoras = restoDias % 3600000;

  const minutos = Math.floor(restoHoras / 60000);
  const restoMinutos = restoHoras % 60000;

  const segundos = Math.floor(restoMinutos / 1000);

  return { dias, horas, minutos, segundos };
}
