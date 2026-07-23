// Forma del payload que Meta envía en el webhook de Lead Ads (leadgen change),
// simplificado a lo que el sistema necesita. Referencia real:
// https://developers.facebook.com/docs/graph-api/webhooks/reference/page/#leadgen
export interface MetaLeadFieldData {
  name: string;
  values: string[];
}

export interface MetaLeadWebhookPayload {
  leadgen_id: string;
  campaign_id?: string;
  campaign_name?: string;
  adset_id?: string;
  adset_name?: string;
  ad_id?: string;
  ad_name?: string;
  platform?: 'fb' | 'ig';
  field_data: MetaLeadFieldData[];
}
