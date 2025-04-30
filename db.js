const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

let messagesCollection;

async function connect() {
    try {
        await client.connect();
        const db = client.db('chatdb');
        messagesCollection = db.collection('messages');
        console.log('✅ MongoDB Connected');
    } catch (err) {
        console.error('❌ MongoDB Connection Error:', err);
    }
}

async function insertMessage(sender, receiver, content, type = 'text', replyTo = null) {
    try {
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
        console.log('✅ Message inserted:', result.insertedId.toString());
        return result.insertedId.toString();
    } catch (err) {
        console.error('❌ Insert Message Error:', err);
    }
}

async function fetchConversation(sender, receiver, callback) {
    try {
        const messages = await messagesCollection.find({
            $or: [
                { sender: sender, receiver: receiver },
                { sender: receiver, receiver: sender }
            ]
        }).sort({ _id: 1 }).toArray();
        callback(messages);
    } catch (err) {
        console.error('❌ Fetch Conversation Error:', err);
        callback([]);
    }
}

async function markMessagesAsSeen(sender, receiver) {
    try {
        await messagesCollection.updateMany(
            { sender, receiver, seen: false },
            { $set: { seen: true } }
        );
    } catch (err) {
        console.error('❌ Mark Messages As Seen Error:', err);
    }
}

async function deleteMessageById(messageId) {
    try {
        if (!messageId || messageId.length !== 24) {
            console.log('❌ Invalid messageId:', messageId);
            return;
        }
        await messagesCollection.deleteOne({ _id: new ObjectId(messageId) });
    } catch (err) {
        console.error('❌ Delete Message Error:', err);
    }
}

async function updateMessageById(messageId, newContent) {
    try {
        if (!messageId || messageId.length !== 24) {
            console.log('❌ Invalid messageId for edit:', messageId);
            return;
        }
        await messagesCollection.updateOne(
            { _id: new ObjectId(messageId) },
            { $set: { content: newContent + " (edited)" } }
        );
    } catch (err) {
        console.error('❌ Edit Message Error:', err);
    }
}

module.exports = {
    connect,
    insertMessage,
    fetchConversation,
    markMessagesAsSeen,
    deleteMessageById,
    updateMessageById
};
