import express from 'express';
import session from 'express-session';
import bodyParser from 'body-parser';
import moment from 'moment-timezone';
import { v4 as uuidv4 } from 'uuid';
import macaddress from 'macaddress';
import os from 'os';
import mongoose from 'mongoose';
import crypto from 'crypto';
import Session from './models.js';

const app = express();
const PORT = 3500;

// Conexión a la base de datos MongoDB
mongoose.connect('mongodb+srv://ed-cr:Osn1pb5a9dglT@clusteredgar.oeljo.mongodb.net/AWI?retryWrites=true&w=majority&appName=ClusterEdgar')
  .then((db) => console.log("Mongo connect"))
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1); // Detener la ejecución si no hay conexión a la base de datos
  });

app.listen(PORT, () => {
    console.log(`Servidor iniciado en http://localhost:${PORT}`);
});

app.use(express.json()); // Habilita la comunicación por medio del body y entienda el estándar
app.use(express.urlencoded({ extended: true }));

// Sesiones almacenadas en memoria RAM
app.use(
    session({
        secret: "P4-ECV#tanis-SesionesHTTP-VariableDeSesion",
        resave: false,
        saveUninitialized: true,
        cookie: { maxAge: 5 * 60 * 1000 }
    })
);


// Función de utilidad que nos permite acceder a la información de la interfaz de red
// Función de utilidad que nos permite acceder a la información de la interfaz de red
const getLocal = () => {
  const networkInterfaces = os.networkInterfaces();
  for (const interfaceName in networkInterfaces) {
      const interfaces = networkInterfaces[interfaceName];
      for (const iface of interfaces) {
          // IPv4 y no interna (no localhost)
          if (iface.family === "IPv4" && !iface.internal) {
              return iface.address;
          }
      }
  }
  return null; // Retorna null si no encuentra una IP válida
};

const getMac = () => {
    return new Promise((resolve, reject) => {
        macaddress.one((err, mac) => {
            if (err) {
                console.error("Error al obtener la dirección MAC:", err);
                reject(err);
            } else {
                resolve(mac);
            }
        });
    });
  };
  

const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded ? forwarded.split(',')[0] : req.connection.remoteAddress;
  return ip;
};

app.get('/', (req, res) => {
return res.status(200).json({
  message: 'Bienvendi@ a la API de Control de Sesiones',
  author: 'Edgar Cabrera Velazquez'
});
});

// Endpoint de logueo
app.post('/login', async (req, res) => {
    try {
        const { email, nickname, macAddress } = req.body;

        if (!email || !nickname || !macAddress) {
            return res.status(400).json({ message: 'Se esperan campos requeridos' });
        }

        const sessionId = uuidv4();
        const createdAt_CDMX = moment().tz('America/Mexico_City').format('YYYY-MM-DD HH:mm:ss');

        // Obtener datos del servidor
        const serverIpValue = getLocal() || '';  // IP del servidor
        const serverMacValue = await getMac();  // MAC del servidor
        const clientIpValue = getClientIp(req); // IP del cliente

        // Verificar que se obtuvieron todos los datos
        console.log("Server IP:", serverIpValue);
        console.log("Server MAC:", serverMacValue);
        console.log("Client IP:", clientIpValue);

        if (!serverIpValue || !serverMacValue || !clientIpValue || !macAddress) {
            return res.status(500).json({ message: 'Error al obtener datos del servidor' });
        }

        const sessionData = new Session({
            sessionId,
            email,
            nickname,
            clientData: {
                macAddress, // Asegúrate de pasar el macAddress recibido en la solicitud
                clientIp: clientIpValue, // IP del cliente
            },
            serverData: {
                serverIp: serverIpValue, // IP del servidor
                serverMac: serverMacValue, // MAC del servidor
            },
            createdAt: createdAt_CDMX,
            lastAccesed: createdAt_CDMX,
            status: "Activa"
        });

        await sessionData.save();
        req.session.sessionId = sessionId;

        res.status(200).json({ message: 'Se ha logueado de manera exitosa', sessionId });
    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
    console.log("Session ID generado:", sessionId);
    console.log("Sesión guardada:", req.session);

});


// Endpoint para actualizar la sesión
app.post('/update', async (req, res) => {
const { email, nickname } = req.body;

if (!req.session.sessionId) {
    return res.status(400).json({ message: "No existe una sesión activa" });
}

const session = await Session.findOne({ sessionId: req.session.sessionId });

if (!session) {
    return res.status(404).json({ message: "Sesión no encontrada" });
}

if (email) session.email = email;
if (nickname) session.nickname = nickname;
session.lastAccesed = moment().tz('America/Mexico_City').format('YYYY-MM-DD HH:mm:ss');

await session.save();
res.status(200).json({ message: 'Actualización correcta', session });
});

// Endpoint para ver el estado de la sesión
app.post("/status", async (req, res) => {
const { sessionId } = req.body;

if (!sessionId) {
    return res.status(404).json({
        message: 'No existe una sesión activa'
    });
}

const session = await Session.findOne({ sessionId });
if (!session) {
    return res.status(404).json({ message: 'Sesión no encontrada' });
}

// Desencriptar datos antes de enviarlos
session.decryptData();

const now = moment().tz('America/Mexico_City');
const lastAccessedMoment = moment(session.lastAccesed).tz('America/Mexico_City');
const createdAtMoment = moment(session.createdAt).tz('America/Mexico_City');

// Cálculo de inactividad y duración
const inactividadSegundos = now.diff(lastAccessedMoment, 'seconds');
const inactividadMinutos = Math.floor(inactividadSegundos / 60);
const inactividadRestantes = inactividadSegundos % 60;

const duracionSegundos = now.diff(createdAtMoment, 'seconds');
const duracionMinutos = Math.floor(duracionSegundos / 60);
const duracionRestantes = duracionSegundos % 60;

res.status(200).json({
    message: 'Sesión activa',
    session,
    inactividad: `${inactividadMinutos} minutos ${inactividadRestantes} segundos`,
    duracion: `${duracionMinutos} minutos ${duracionRestantes} segundos`
});
console.log("Session ID recibido:", sessionId);
const session = await Session.findOne({ sessionId });
console.log("Sesión encontrada:", session);

});




// Obtener todas las sesiones activas
app.get('/sessionAll', async (req, res) => {
  const sessions = await Session.find({});

  if (sessions.length === 0) {
      return res.status(404).json({
          message: 'No hay sesiones activas'
      });
  }

  // Formatear las sesiones para la respuesta
  const now = moment().tz('America/Mexico_City');
  const formattedSessions = sessions.map(session => {
      const inactividad = now.diff(moment(session.lastAccesed).tz('America/Mexico_City'), 'seconds');
      return {
          ...session._doc,
          createdAt: moment(session.createdAt).tz('America/Mexico_City').format('YYYY-MM-DD HH:mm:ss'),
          lastAccesed: moment(session.lastAccesed).tz('America/Mexico_City').format('YYYY-MM-DD HH:mm:ss'),
          inactividad: `${inactividad} segundos`
      };
  });

  res.status(200).json({
      message: 'Sesiones activas',
      sessions: formattedSessions
  });
});

// Cerrar sesión
app.post('/logout', async (req, res) => {
  const { sessionId } = req.session;

  if (!sessionId) {
      return res.status(404).json({
          message: 'No existe una sesión activa'
      });
  }

  await Session.updateOne({ sessionId }, { status: "Finalizada por el Usuario" });
  req.session.destroy();

  res.status(200).json({
      message: 'Logout exitoso'
  });
});

// Obtener sesiones activas
app.get('/currentSession', async (req, res) => {
  try {
      const activeSessions = await Session.find({ status: "Activa" });

      if (activeSessions.length === 0) {
          return res.status(404).json({ message: 'No hay sesiones activas' });
      }

      const formattedSessions = activeSessions.map(session => ({
          ...session._doc,
          createdAt: moment(session.createdAt).tz('America/Mexico_City').format('YYYY-MM-DD HH:mm:ss'),
          lastAccesed: moment(session.lastAccesed).tz('America/Mexico_City').format('YYYY-MM-DD HH:mm:ss'),
      }));

      res.status(200).json({ message: 'Sesiones activas', sessions: formattedSessions });
  } catch (error) {
      res.status(500).json({ message: 'Error al obtener sesiones activas', error });
  }
});

// Eliminar todas las sesiones
app.delete('/deleteAll', async (req, res) => {
  try {
      await Session.deleteMany({});
      res.status(200).json({ message: 'Se ha eliminado los registros de la base.' });
  } catch (error) {
      res.status(500).json({ message: 'Error', error });
  }
});

// Verificar inactividad y cambiar estado
setInterval(async () => {
  const now = moment();
  const sessions = await Session.find();

  for (const session of sessions) {
      const lastAccessedMoment = moment(session.lastAccesed);
      const inactividad = now.diff(lastAccessedMoment, 'seconds');

      if (inactividad > 300) {  // 5 minutos en segundos
          await Session.updateOne({ sessionId: session.sessionId }, {
              status: `Inactiva por ${inactividad} segundos`
          });
      }
  }
}, 60000);  // Esta función sigue verificando cada minuto

