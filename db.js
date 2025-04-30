const { MongoClient, ObjectId } = require('mongodb');

// ✅ MongoDB URI
const uri = "mongodb+srv://suraj78725:babu321@cluster0.rajqhet.mongodb.net/chatdb?retryWrites=true&w=majority&appName=Cluster0";

const client = new MongoClient(uri);
let messagesCollection;

// ✅ Connect and expose collection
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

// ✅ Insert Message
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

// ✅ Fetch Conversation
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

// ✅ Mark Messages as Seen
async function markMessagesAsSeen(sender, receiver) {
    if (!messagesCollection) return;
    await messagesCollection.updateMany(
        { sender, receiver, seen: false },
        { $set: { seen: true } }
    );
}

// ✅ Delete Message
async function deleteMessageById(messageId) {
    if (!messagesCollection || !messageId || messageId.length !== 24) return;
    await messagesCollection.deleteOne({ _id: new ObjectId(messageId) });
}

// ✅ Edit Message
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
