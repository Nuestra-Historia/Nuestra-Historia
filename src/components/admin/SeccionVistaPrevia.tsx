'use client';

interface SeccionVistaPreviaProps {
  ownerPath: string;
}

export function SeccionVistaPrevia({ ownerPath }: SeccionVistaPreviaProps) {
  return (
    <div className="p-4 border border-neutral-200 rounded bg-white shadow-sm flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-neutral-800">Vista previa</h3>
      <p className="text-xs text-neutral-500">
        Visualizá las páginas con datos reales sin cambiar el estado público del sitio.
      </p>

      <div className="flex flex-wrap gap-2 pt-1">
        <a
          href={`/${ownerPath}/ver/1`}
          target="_blank"
          rel="noopener noreferrer"
          className="py-1.5 px-3 bg-neutral-800 text-white rounded text-xs hover:bg-neutral-900 transition-colors inline-flex items-center gap-1.5"
        >
          Ver Página 1 ↗
        </a>
        <a
          href={`/${ownerPath}/ver/2`}
          target="_blank"
          rel="noopener noreferrer"
          className="py-1.5 px-3 bg-neutral-800 text-white rounded text-xs hover:bg-neutral-900 transition-colors inline-flex items-center gap-1.5"
        >
          Ver Página 2 ↗
        </a>
      </div>
    </div>
  );
}
