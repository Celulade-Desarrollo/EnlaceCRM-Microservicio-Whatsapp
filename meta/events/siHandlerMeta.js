import axios from "axios";
import { loginWhatsappSender } from "../../LoginWhatsappSender.js";
import { notifyMetaEvent } from "../../services/notificationService.js";

export async function siHandlerMeta(customer_number){
    const servidor = process.env.SERVIDOR;
    const token = await loginWhatsappSender();
    const num = customer_number.startsWith("57") ? customer_number.slice(2) : customer_number;
    const headers = { Authorization: `Bearer ${token}` };
    
    try {
        const customer_info = await axios.get(`${servidor}/api/flujoRegistroEnlace/num/${num}`, { headers });
        
        let customer_name = 'Desconocido';
        if (customer_info && customer_info.data && customer_info.data[0]) {
            const clientData = customer_info.data[0];
            customer_name = clientData.Nombres || 'Desconocido';
            const id = clientData.Id;

            await axios.put(`${servidor}/api/flujoRegistroEnlace/estado/pendiente/${id}`, {Estado: "confirmado"}, { headers });
            await axios.put(`${servidor}/api/scoring/estado/update/${id}`, {Estado: "confirmado"}, { headers });
            await axios.put(`${servidor}/api/flujoRegistroEnlace/clienteAcepto/${id}`, {respuestaCliente: "si"}, { headers });
        }

        notifyMetaEvent({
            eventType: 'Respuesta Botón "SI"',
            recipientNumber: customer_number,
            recipientName: customer_name,
            success: true,
        }).catch((e) => console.error('[NOTIFIER] Error en siHandlerMeta:', e.message));

        return customer_name;

    } catch (err) {
        console.error("Error en siHandlerMeta:", err.response?.data || err.message);

        notifyMetaEvent({
            eventType: 'Respuesta Botón "SI"',
            recipientNumber: customer_number,
            recipientName: 'Desconocido',
            success: false,
            details: { error: err.response?.data?.message || err.message }
        }).catch((e) => console.error('[NOTIFIER] Error:', e.message));

        throw err;
    }
}