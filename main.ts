import { MongoClient, ObjectId, type WithId } from 'mongodb'
import { PersonaModel, type Persona } from "./types.ts";
import { modelToPersona } from "./utils.ts";

// Connection URL
const url = Deno.env.get("MONGO_URL")
if(!url){
  console.error("Bad mongo url. . .")
  Deno.exit(1)
}
const client = new MongoClient(url);

// Database Name
const dbName = 'nebrijaDB';

// Use connect method to connect to the server
await client.connect();
console.log('Connected successfully to server');
const db = client.db(dbName);

const personasCollection = db.collection<PersonaModel>('personas');

const handler = async (req:Request):Promise<Response> => {

  const method = req.method
  const url = new URL(req.url)
  const path = url.pathname

  if(method === "POST"){

    if(path === "/personas"){

      const persona = await req.json()
      if(!persona.nombre || !persona.email || !persona.telefono || !persona.amigos){
        return new Response("Bad request. . .")
      }
      const emailFound = await personasCollection.findOne({email: persona.email})
      const telefFound = await personasCollection.findOne({telefono: persona.telefono})

      if(emailFound && telefFound){
        return new Response("Correo y telefono ya existe")
      } else if (emailFound) {
        return new Response("Correo ya existe")
      } else if(telefFound){
        return new Response("Telefono ya existe")
      }

      const { insertedId } = await personasCollection.insertOne({
        nombre: persona.nombre,
        email: persona.email,
        telefono: persona.telefono,
        amigos: persona.amigos.map((a: string) => new ObjectId(a))
      })

      return new Response(JSON.stringify({
        _id: insertedId,
        nombre: persona.nombre,
        email: persona.email,
        telefono: persona.telefono,
        amigos: persona.amigos
      }))

    }
  } else if (method === "GET"){

    if(path === "/personas"){

      const nombre = url.searchParams.get("nombre")

      if(!nombre){
        const usersDB = await personasCollection.find().toArray()
        const users = usersDB.map((u) => modelToPersona(u))
        return new Response(JSON.stringify(users))
      }

      const usersDB = await personasCollection.find({nombre}).toArray()
      const users = usersDB.map((u) => modelToPersona(u))
      return new Response(JSON.stringify(users))

    }

    if(path === "/persona"){

      const email = url.searchParams.get("email")
      if(!email){
        return new Response ("Bad request. . .")
      }
      const userDB = await personasCollection.findOne({email})
      if(!userDB){
        return new Response("User not found. . .")
      }
      const user = modelToPersona(userDB)
      return new Response(JSON.stringify(user))
    }

  } else if (method === "PUT"){

    if(path === "/persona"){

      const user = await req.json()

      if(!user.nombre || !user.email || !user.telefono || !user.amigos){
        return new Response ("Faltan datos. . .")
      }

      const userDB = await personasCollection.findOne({email: user.email})
      if(!userDB){
        return new Response ("User not found. . .")
      }
      await personasCollection.updateOne(
        {email: user.email},
        {$set: {nombre: user.nombre, telefono: user.telefono, amigos: user.amigos.map((a: string) => new ObjectId(a))}}
      )

      return new Response ("OK")

    } else if (path === "/persona/amigo"){

      /**
       * Esto no funciona, no se el metodo para actualizar el objeto en la BD sin modificar los demas
       */

      const info = await req.json()
      if(!info.email || !info.id){
        return new Response("Faltan datos. . .")
      }
      const persona = await personasCollection.findOne({email: info.email})
      const amigo = await personasCollection.findOne({_id: new Object(info.id)})
      if(!persona || !amigo){
        return new Response("Persona o amigo no encontrado. . .")
      }

      await personasCollection.updateOne( 
        {email: info.email},
        {$set: {amigos: new ObjectId(info.id)}}
      )

    }

  } else if (method === "DELETE") {

    if(path === "/persona"){

      const user = await req.json()
      if(!user.email){
        return new Response("Falta email. . .")
      }
      const userDB = await personasCollection.findOne({email: user.email})
      if(!userDB){
        return new Response("User not found. . .")
      }
      await personasCollection.deleteOne({email: user.email})

      /**
       * Aqui no he conseguido eliminar el id del usuario deliminado de aquellas personas que lo tienen en amigos
       */

      await personasCollection.updateMany(
        {amigos: new ObjectId(user.id)},
        {$pull: {amigos: new ObjectId(user.id)}}
      )

      return new Response("Persona eliminada exitosamente. . .")
    }

  }

  return new Response ("Bad endpoint. . .")

}

Deno.serve({port:3000}, handler)

