import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

export class TokenVerifierService {
  constructor() {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET no está definido en las variables de entorno.");
    }
    this.secret = process.env.JWT_SECRET;
  }

  /**
   * Verifica y decodifica un token JWT.
   * @param {string} token - El token JWT a verificar.
   * @returns {Promise<object | null>} El payload decodificado si es válido, o null si no lo es.
   */
  async verifyToken(token) {
    return new Promise((resolve) => { // Usamos resolve(null) en lugar de reject para manejar errores de JWT
      jwt.verify(token, this.secret, (err, decoded) => {
        if (err) {
          // Si hay un error (token expirado, firma inválida), devolvemos null.
          // Para depuración, puedes loggear el error: console.error("Error al verificar token:", err.message);
          return resolve(null);
        }
        resolve(decoded);
      });
    });
  }
}

// Exportamos una instancia para que otros módulos puedan usarla directamente.
export const tokenVerifierService = new TokenVerifierService();