import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import axios from 'axios';
import { MetaLeadgenData } from './dto/meta-lead-webhook.dto';

const GRAPH_API_VERSION = 'v21.0';
const CAMPOS_LEADGEN =
  'field_data,campaign_id,campaign_name,adset_id,adset_name,ad_id,ad_name,platform';

// La notificación del webhook de Meta solo trae el leadgen_id — hay que pedirle
// los datos reales (respuestas del formulario + campaña/adset/ad) a la Graph API.
@Injectable()
export class MetaGraphService {
  private readonly logger = new Logger(MetaGraphService.name);

  async obtenerDatosLeadgen(leadgenId: string): Promise<MetaLeadgenData> {
    const accessToken = process.env.META_PAGE_ACCESS_TOKEN;
    if (!accessToken) {
      throw new Error('META_PAGE_ACCESS_TOKEN no está configurado.');
    }

    try {
      const { data } = await axios.get<MetaLeadgenData>(
        `https://graph.facebook.com/${GRAPH_API_VERSION}/${leadgenId}`,
        { params: { fields: CAMPOS_LEADGEN, access_token: accessToken } },
      );
      return data;
    } catch (error) {
      this.logger.error(`Error consultando leadgen ${leadgenId} en Graph API: ${error}`);
      throw new ServiceUnavailableException('No se pudo obtener el detalle del lead desde Meta');
    }
  }
}
