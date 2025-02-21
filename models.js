import mongoose from "mongoose";
import crypto from "crypto";

// Función para encriptar
const encrypt = (text) => {
    const algorithm = 'aes-256-ctr';
    const secretKey = 'TanCab0515TanCab0515TanCab051526'; // Cambia esto por una clave segura
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
};

// Función para desencriptar
const decrypt = (text) => {
    const algorithm = 'aes-256-ctr';
    const secretKey = 'TanCab0515TanCab0515TanCab051526'; 
    const textParts = text.split(':');
    const iv = Buffer.from(textParts[0], 'hex');
    const encryptedText = Buffer.from(textParts[1], 'hex');
    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
};

// Esquema para la información del cliente
const clientSchema = new mongoose.Schema({
    macAddress: { 
        type: String, 
        required: true, 
        set: encrypt, 
        get: decrypt 
    },
    clientIp: { 
        type: String, 
        required: true, 
        set: encrypt, 
        get: decrypt 
    }
}, { _id: false });  // No se necesita un _id para documentos embebidos

// Esquema para la información del servidor
const serverSchema = new mongoose.Schema({
    serverIp: { 
        type: String, 
        required: true, 
        set: encrypt, 
        get: decrypt 
    },
    serverMac: { 
        type: String, 
        required: true, 
        set: encrypt, 
        get: decrypt 
    }
}, { _id: false });

// Esquema principal de la sesión
const sessionSchema = new mongoose.Schema({
    sessionId: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    nickname: { type: String, required: true },
    clientData: clientSchema, // Embebe el esquema del cliente
    serverData: serverSchema, // Embebe el esquema del servidor
    createdAt: { type: String, required: false },
    lastAccesed: { type: String, required: false },
    status: { 
        type: String, 
        enum: ["Activa", "Inactiva", "Finalizada por el Usuario", "Finalizada por Falla de Sistema"], 
        default: "Activa" 
    },
    duration: { type: Number, required: false } // Duración en segundos
}, { versionKey: false });

// Método para desencriptar datos
sessionSchema.methods.decryptData = function() {
    this.clientData.macAddress = decrypt(this.clientData.macAddress);
    this.clientData.clientIp = decrypt(this.clientData.clientIp);
    this.serverData.serverIp = decrypt(this.serverData.serverIp);
    this.serverData.serverMac = decrypt(this.serverData.serverMac);
};

export default mongoose.model('Session', sessionSchema);
