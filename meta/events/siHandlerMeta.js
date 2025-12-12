import axios from "axios"
import { loginWhatsappSender } from "../../LoginWhatsappSender.js";


export async function siHandlerMeta(customer_number){
    const servidor = process.env.SERVIDOR;
    const token = await loginWhatsappSender()
    const num = customer_number.startsWith("57") ? customer_number.slice(2) : customer_number;
    const headers = { Authorization: `Bearer ${token}` };
    

    try{
    //Consultar con num
    const customer_info = await axios.get(`${servidor}/api/flujoRegistroEnlace/num/${num}`, { headers });
    if(customer_info){
    const id = customer_info.data[0].Id;;

    await axios.put(`${servidor}/api/flujoRegistroEnlace/estado/pendiente/${id}`, {Estado: "confirmado"}, { headers })

    await axios.put(`${servidor}/api/scoring/estado/update/${id}`, {Estado: "confirmado"}, { headers })

    await axios.put(`${servidor}/api/flujoRegistroEnlace/clienteAcepto/${id}`, {respuestaCliente: "si"}, { headers })
    }

    }catch(err){
        console.error("Error en siHandlerMeta:", err.response?.data || err.message);
    }
}