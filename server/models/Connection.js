import mongoose from 'mongoose';

const connectionSchema = new mongoose.Schema({
   // The user who sent the request
   requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
   },
   // The user who received the request
   recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
   },
   // Connection status
   status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'blocked'],
      default: 'pending'
   },
   // Optional message with connection request
   message: {
      type: String,
      maxlength: 200,
      default: ''
   }
}, {
   timestamps: true
});

// Compound index to ensure unique connections between users
connectionSchema.index({ requester: 1, recipient: 1 }, { unique: true });

// Index for faster queries
connectionSchema.index({ status: 1 });
connectionSchema.index({ requester: 1, status: 1 });
connectionSchema.index({ recipient: 1, status: 1 });

// Static method to check if two users are connected
connectionSchema.statics.areConnected = async function(userId1, userId2) {
   const connection = await this.findOne({
      $or: [
         { requester: userId1, recipient: userId2, status: 'accepted' },
         { requester: userId2, recipient: userId1, status: 'accepted' }
      ]
   });
   return !!connection;
};

// Static method to get connection status between two users
connectionSchema.statics.getConnectionStatus = async function(userId1, userId2) {
   const connection = await this.findOne({
      $or: [
         { requester: userId1, recipient: userId2 },
         { requester: userId2, recipient: userId1 }
      ]
   });
   
   if (!connection) return 'none';
   
   if (connection.status === 'accepted') return 'connected';
   if (connection.status === 'pending') {
      if (connection.requester.toString() === userId1.toString()) {
         return 'pending_sent';
      }
      return 'pending_received';
   }
   return connection.status;
};

// Static method to get mutual connections
connectionSchema.statics.getMutualConnections = async function(userId1, userId2) {
   // Get all connections of user1
   const user1Connections = await this.find({
      $or: [
         { requester: userId1, status: 'accepted' },
         { recipient: userId1, status: 'accepted' }
      ]
   }).select('requester recipient');

   // Get user1's connected user IDs
   const user1ConnectedIds = user1Connections.map(conn => 
      conn.requester.toString() === userId1.toString() 
         ? conn.recipient.toString() 
         : conn.requester.toString()
   );

   // Get all connections of user2
   const user2Connections = await this.find({
      $or: [
         { requester: userId2, status: 'accepted' },
         { recipient: userId2, status: 'accepted' }
      ]
   }).select('requester recipient');

   // Get user2's connected user IDs
   const user2ConnectedIds = user2Connections.map(conn => 
      conn.requester.toString() === userId2.toString() 
         ? conn.recipient.toString() 
         : conn.requester.toString()
   );

   // Find intersection (mutual connections)
   const mutualIds = user1ConnectedIds.filter(id => user2ConnectedIds.includes(id));
   
   return mutualIds;
};

const Connection = mongoose.model('Connection', connectionSchema);

export default Connection;
