// Forma real de la notificación que Meta manda al webhook (evento "leadgen").
// OJO: esta notificación NO trae las respuestas del formulario ni datos de campaña —
// solo avisa que hay un lead nuevo. Los datos reales se obtienen llamando a la Graph API
// con el leadgen_id (ver MetaGraphService.obtenerDatosLeadgen).
// Referencia: https://developers.facebook.com/docs/graph-api/webhooks/reference/page/#leadgen
export interface MetaWebhookChange {
  field: string;
  value: {
    ad_id?: string;
    form_id: string;
    leadgen_id: string;
    created_time: number;
    page_id: string;
  };
}

export interface MetaWebhookEntry {
  id: string;
  time: number;
  changes: MetaWebhookChange[];
}

export interface MetaWebhookNotification {
  object: string;
  entry: MetaWebhookEntry[];
}

// Forma de la respuesta de la Graph API al pedir GET /{leadgen_id} — esto sí trae
// las respuestas del formulario y los datos de campaña/adset/ad ya resueltos.
export interface MetaLeadFieldData {
  name: string;
  values: string[];
}

export interface MetaLeadgenData {
  id: string;
  campaign_id?: string;
  campaign_name?: string;
  adset_id?: string;
  adset_name?: string;
  ad_id?: string;
  ad_name?: string;
  platform?: 'fb' | 'ig';
  field_data: MetaLeadFieldData[];
}
