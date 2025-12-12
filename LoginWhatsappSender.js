
  export async function loginWhatsappSender() {
    const url = `${process.env.SERVIDOR}/api/admin/login`;
  
    const data = {
      Cedula: `${process.env.WHATSAPP_SENDER_CEDULA}`,
      Password: process.env.WHATSAPP_SENDER_PASSWORD
    };
  
    console.log(url, data)
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data )
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
      }
  
      const result = await response.json();
  
      if (!result?.token) {
        throw new Error("No se recibió un token válido desde el login de Alpina");
      }
  
      return result.token;
  
    } catch (error) {
      console.error('Error al hacer el POST a /auth:', error);
      throw error;
    }
  }