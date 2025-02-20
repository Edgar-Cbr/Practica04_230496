import mongoose from "mongoose";
import crypto from "crypto";

// Función para encriptar
const encrypt = (text) => {
    const algorithm = 'aes-256-ctr';
    const secretKey = 'TanCab0515'; // Cambia esto por una clave segura
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
};

// Función para desencriptar
const decrypt = (text) => {
    const algorithm = 'aes-256-ctr';
    const secretKey = 'TanCab0515'; // La misma clave secreta que para encriptar
    const textParts = text.split(':');
    const iv = Buffer.from(textParts[0], 'hex');
    const encryptedText = Buffer.from(textParts[1], 'hex');
    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
};

const sessionSchema = new mongoose.Schema({
    sessionId: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    nickname: { type: String, required: true },
    macAddress: { 
        type: String, 
        required: true, 
        set: (v) => encrypt(v) // Encriptar macAddress antes de guardarlo
    },
    createdAt: { type: String, required: false },
    lastAccesed: { type: String, required: false },
    serverIp: { 
        type: String, 
        required: true, 
        set: (v) => encrypt(v) // Encriptar serverIp antes de guardarlo
    },
    serverMac: { 
        type: String, 
        required: true, 
        set: (v) => encrypt(v) // Encriptar serverMac antes de guardarlo
    },
    clientIp: { 
        type: String, 
        required: true, 
        set: (v) => encrypt(v) // Encriptar clientIp antes de guardarlo
    },
    status: { 
        type: String, 
        enum: ["Activa", "Inactiva", "Finalizada por el Usuario", "Finalizada por Falla de Sistema"], 
        default: "Activa" 
    },
    duration: { 
        type: Number,  // Almacena la duración en segundos (puedes modificar esto si necesitas otro tipo de unidad)
        required: false 
    }
}, { versionKey: false });

// Método para desencriptar los datos
sessionSchema.methods.decryptData = function() {
    this.clientIp = decrypt(this.clientIp);
    this.macAddress = decrypt(this.macAddress);
    this.serverIp = decrypt(this.serverIp);
    this.serverMac = decrypt(this.serverMac);
};

export default mongoose.model('Session', sessionSchema);
