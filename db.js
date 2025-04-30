require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

const uri = process.env.MONGO_URI; // ✔️ Railway variable use karo
const client = new MongoClient(uri);
let messagesCollection;

// ✅ Connect to MongoDB
async function connect() {
    try {
        await client.connect();
        const db = client.db('chatdb');
        messagesCollection = db.collection('messages');
        console.log('✅ MongoDB Connected');
    } catch (err) {
        console.error('❌ MongoDB Connection Error:', err);
        throw err;
    }
}

// ✅ Insert new message
async function insertMessage(sender, receiver, content, type = 'text', replyTo = null) {
    if (!messagesCollection) return;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const result = await messagesCollection.insertOne({
        sender,
        receiver,
        content,
        type,
        time,
        seen: false,
        replyTo
    });
    return result.insertedId.toString();
}

// ✅ Get all messages in conversation
async function fetchConversation(sender, receiver, callback) {
    if (!messagesCollection) return callback([]);
    const messages = await messagesCollection.find({
        $or: [
            { sender, receiver },
            { sender: receiver, receiver: sender }
        ]
    }).sort({ _id: 1 }).toArray();
    callback(messages);
}

// ✅ Mark messages as seen
async function markMessagesAsSeen(sender, receiver) {
    if (!messagesCollection) return;
    await messagesCollection.updateMany(
        { sender, receiver, seen: false },
        { $set: { seen: true } }
    );
}

// ✅ Delete a message
async function deleteMessageById(messageId) {
    if (!messagesCollection || !messageId || messageId.length !== 24) return;
    await messagesCollection.deleteOne({ _id: new ObjectId(messageId) });
}

// ✅ Edit a message
async function updateMessageById(messageId, newContent) {
    if (!messagesCollection || !messageId || messageId.length !== 24) return;
    await messagesCollection.updateOne(
        { _id: new ObjectId(messageId) },
        { $set: { content: newContent + " (edited)" } }
    );
}

module.exports = {
    connect,
    insertMessage,
    fetchConversation,
    markMessagesAsSeen,
    deleteMessageById,
    updateMessageById
};
