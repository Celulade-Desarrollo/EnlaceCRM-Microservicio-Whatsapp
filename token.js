import { tokenVerifierService } from "./TokenVerifierService.js";

export async function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token no proporcionado o mal formado' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = await tokenVerifierService.verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
  req.user = decoded;
  next();
}
