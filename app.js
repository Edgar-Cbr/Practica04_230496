import session from "express-session";
import bodyParser from "body-parser";
import {v4 as uuid}from 'uuid';
import { request, response } from "express";
import res from "express/lib/response";


const app= express;
const port = 3000;

app.listen(port,()=>{
    console.log('servidor iniciado en http://localhost:${port}')
})

app.use(express.json())
app.use(express.urlencoded({extended:true}));
//Sesiones almacenadas en Memoria(ram)

app.get(`/`,(request,response)=>{
    return response.status(200).json({
        message:`Bienvenidos a la API de control de sesiones`,
        author:`Edgar Cabrera Velazquez`
    })
})
const getLocalIP=()=>{
    const networkInterface= os.networkInterface();
    for(const interfaceName in networkInterface){
        const interfaces =networkInterface[interfaceName];
        for(const iface of interfaces){
            //IP´v4 y no interna
            if(iface.famil== "IPv4"&& !iface.internal){

            }
        }
    }
    return null;
};
app.post(`/login`,(request,res)=>{
    const{email,nickname,macAddress}=request.body
    if(!email|| !macAddress){
        return response.status(400).json({
            message:`faltan parametros`
        })
    }
    const sessionID =uuidV4();
    const now = new Date();

    session[sessionID]={
        sessionID,
        email,
        nickname,
        macAddress,
        ip:getLocalIP(request),
        createAt:now,
        lastAccessedAt:now,

    };
    res.status(200).json{
        message:'sesion iniciada'
        sessionID
    }});

    app.post("/logout",(request,res)=>{
        const{sessionID}request.body;

        if(!sessionID || !session [sessionID]){
            return response.status(400).json({
                message:'no se encontraron una sesion activa'
            });
    }
    delete session[sessionID];
    request.session.destroy((err)=>{
        if(err){
            return response.status(500).send(message:'Error al cerrar la sesion')
        }
    })
    response.status(200).json({message:"logout succeful"})
})
app.post("/update",(request,res)=>{
    const{sessionID,email,nickname}=request.body;
    if(!sessionID || !session[sessionID]){
        return response.status(404).json({message:"no existe una sesion activa"})
    }
})
app.get("/status",(request,res)=>{
    const sessionID=request.query.sessionID;
    if(sessionID || !session[sessionID]){
        response.status(404).json({message: "No hay sesiones activas"

    })}

    response.status(200).json({
        message: "Sesion Activa",
        session: session[sessionID]
    })
})
    