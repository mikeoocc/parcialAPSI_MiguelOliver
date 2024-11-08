import type { Persona, PersonaModel } from "./types.ts";


export const modelToPersona = (personaDB: PersonaModel):Persona => ({
    id: personaDB._id!.toString(),
    nombre: personaDB.nombre,
    email: personaDB.email,
    telefono: personaDB.telefono,
    amigos: personaDB.amigos.map((a) => a.toString())
})
