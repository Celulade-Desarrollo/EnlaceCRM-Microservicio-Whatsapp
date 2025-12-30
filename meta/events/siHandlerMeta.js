import axios from "axios"
import { loginWhatsappSender } from "../../LoginWhatsappSender.js";


export async function siHandlerMeta(customer_number){
    const servidor = process.env.SERVIDOR;
    const token = await loginWhatsappSender()
    const num = customer_number.startsWith("57") ? customer_number.slice(2) : customer_number;
    const headers = { Authorization: `Bearer ${token}` };
    
    //Consultar con num
    try{
    const customer_info = await axios.get(`${servidor}/api/flujoRegistroEnlace/num/${num}`, { headers });
        console.log(customer_info)
    if(customer_info){
    const id = customer_info.data[0].Id;;

    await axios.put(`${servidor}/api/flujoRegistroEnlace/estado/pendiente/${id}`, {Estado: "confirmado"}, { headers })

    await axios.put(`${servidor}/api/scoring/estado/update/${id}`, {Estado: "confirmado"}, { headers })

    await axios.put(`${servidor}/api/flujoRegistroEnlace/clienteAcepto/${id}`, {respuestaCliente: "si"}, { headers })}

    const customer_name = customer_info.data[0]?.Nombres;
    return customer_name; // Esto es para usarlo en el controlador del botón si 

    }catch(err){
        console.error("Error en siHandlerMeta:", err.response?.data || err.message);
    }
}