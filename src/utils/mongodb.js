import mongoose from 'mongoose'

const DEFAULT_MONGODB_URI = 'mongodb+srv://bansalayush8279:Ayush%401234@cluster0.jfltuuy.mongodb.net/invoice-app?retryWrites=true&w=majority'
const MONGODB_URI = process.env.MONGODB_URI || DEFAULT_MONGODB_URI
if (!MONGODB_URI) {
  throw new Error(" MONGODB_URI is not defined")
}

// 🔥 global cache (serverless optimized)
let cached = global.mongoose

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null }
}

export const connectDB = async () => {
  // ✅ if already connected
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn
  }

  // ✅ create connection if not exists
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    }).then((mongoose) => {
      console.log("✅ MongoDB connected")
      return mongoose
    })
  }

  cached.conn = await cached.promise
  return cached.conn
}