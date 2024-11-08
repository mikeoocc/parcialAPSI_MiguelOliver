import type { ObjectId } from "mongodb";

export type PersonaModel = {
    _id?: ObjectId,
    nombre: string,
    email: string,
    telefono: string,
    amigos: ObjectId[]
}

export type Persona = {
    id: string,
    nombre: string,
    email: string,
    telefono: string,
    amigos: string[]
}