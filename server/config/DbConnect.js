import mongoose from 'mongoose';
import dns from 'dns';
dns.setServers(['1.1.1.1', '8.8.8.8']);

const dbConnect = async () => {
    console.log("Connecting to MongoDB...")
    try {
        await mongoose.connect(process.env.DB_URL);
        console.log('✅ MongoDB Connected Successfully for CampusRoots');
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error.message);
        process.exit(1);
    }
}

export default dbConnect;