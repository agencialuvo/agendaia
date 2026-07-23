// Reemplaza {variable} en los textos del guión (config/guiones/*.json) por sus valores reales.
export function renderPlantilla(texto: string, variables: Record<string, string>): string {
  return texto.replace(/\{(\w+)\}/g, (coincidencia, clave) =>
    Object.prototype.hasOwnProperty.call(variables, clave) ? variables[clave] : coincidencia,
  );
}
